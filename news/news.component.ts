import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { VersusService } from '../../../services/versus.service';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { NgForm } from '@angular/forms';
import { NgProgressComponent } from '@ngx-progressbar/core';
import { clone, timeout } from '../../../globals';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { newsPayload } from '../../../models';

declare const $, feather;

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styles: []
})
export class NewsComponent implements OnInit, AfterViewInit {
  @ViewChild(NgProgressComponent) progressBar: NgProgressComponent;
  newsMentions = [];
  newsCount = 0;
  other = 0;
  importantMentions = [];
  responseEmails = [];
  docRef = [];
  when = [];
  showDropDownSentiment: boolean = false;
  showDropDownSource: boolean = false;
  showDropDownSort: boolean = false;
  allSentimentOverTimeData = [];
  allSentimentOverTimeDataCopy = [];
  showSentimentOverTimeDetails = false;
  positive;
  newsMentionsData = {
    mentions: 0,
    data: []
  };
  otherMentionsData = {
    mentions: 0,
    data: []
  };

  socialMentionsData = {
    mentions: 0,
    data: []
  };

  selectedDate = '';

  public show: boolean = false;

  limit = 10;
  page = 1;

  showRespondModal = false;
  showMentionsModal = false;
  selectedMention = {
    content: '',
    title: '',
    url: '',
    platform: '',
    sentiment: 0,
    outlet: '',
    views: '',
    sentiment_score: ''
  };
  filters = {
    all: true,
    socialMedia: false,
    news: false,
    other: false,
    positive: false,
    negative: false,
    neutral: false
  };

  private newsMentionsCopy = [];
  private newsMentions_ = [];

  constructor(
    private versusService: VersusService,
    private authService: AuthService,
    private toastr: ToastrService,
    private httpclient: HttpClient
  ) {}

  ngOnInit(): void {
    this.versusService.getAllDashboardNewsMentions(`data`).subscribe(data => {
      console.log(data);
    });
    feather.replace();
    const client = this.authService.getVersusClient();
    this.responseEmails = client.responseEmails.split(',');
  }

  ngAfterViewInit() {
    this.getAllNewsMentions();
    // this.getNews(this.when, this.docRef);
  }

  getAllNewsMentions() {
    this.progressBar.start();
    const docRef = this.authService.getDocRef();
    this.versusService.getAllNewsMentions(docRef).subscribe(
      (res: any) => {
        this.progressBar.complete();
        console.log(res);
        if (res.error) {
          this.toastr.error(res.text);
          return false;
        } else {
          this.newsCount = res.mentions;
          this.newsMentions = res.data;
          this.newsMentions_ = clone(res.data);
          this.newsMentionsCopy = res.data.slice();
          this.importantMentions = [
            ...this.newsMentionsCopy.splice(0, 3),
            ...this.newsMentionsCopy.splice(-3)
          ];
        }
      },
      err => {
        this.progressBar.complete();
        console.log(err);
      }
    );
  }

  hideMentionModal() {
    this.showMentionsModal = false;
    this.showRespondModal = false;
  }

  showRespondStep() {
    this.showRespondModal = true;
  }

  selectMention(mention) {
    this.selectedMention = mention;
    this.showMentionsModal = true;
  }

  respondToMention(form: NgForm) {
    const client = this.authService.getVersusClient();
    const payload = {
      recipient: form.value.respondEmail,
      link: this.selectedMention.url,
      notes: form.value.respondMessage,
      firstName: form.value.name,
      requestFirstName: client.firstName
    };
    this.versusService.respondToArticle(payload).subscribe(
      (res: any) => {
        console.log('Respond to artice');
        console.log(res);
        if (res.error) {
          this.toastr.error(res.text);
          return false;
        }
        this.hideMentionModal();
        form.reset();
        this.toastr.success('Email sent successfully');
      },
      err => {
        console.log(err);
        this.toastr.error('Error occurred');
      }
    );
  }

  async markAsIrrelevant() {
    this.hideMentionModal();
    await timeout(1000);
    this.toastr.success('Successfully marked as irrelevant');
    this.getAllNewsMentions();
  }

  setFilter(e, type) {
    const getKeyByValue = (object, value) => {
      return Object.keys(object).find(key => object[key] === value);
    };

    for (const key in this.filters) {
      this.filters[key] = false;
    }

    this.filters[type] = e;

    // if all are false, set _all_ to true
    const falseCount = Object.values(this.filters).filter(c => !!c);
    if (falseCount.length === 0) {
      this.filters['all'] = true;
    }

    const filterBy = getKeyByValue(this.filters, true);
    console.log(filterBy);

    // console.log(Object.values(this.filters));
    this.filterMentions(filterBy);
  }

  filterMentions(type) {
    switch (type) {
      case 'all':
        this.allSentimentOverTimeData = clone(
          this.allSentimentOverTimeDataCopy
        );
        break;
      case 'socialMedia':
        this.allSentimentOverTimeData = clone(
          this.allSentimentOverTimeDataCopy
        );
        this.allSentimentOverTimeData = this.allSentimentOverTimeData.filter(
          data => data.type === 'socialMedia'
        );
        break;
      case 'news':
        this.allSentimentOverTimeData = clone(
          this.allSentimentOverTimeDataCopy
        );
        this.allSentimentOverTimeData = this.allSentimentOverTimeData.filter(
          data => data.type === 'news'
        );
        break;
      case 'other':
        this.allSentimentOverTimeData = clone(
          this.allSentimentOverTimeDataCopy
        );
        this.allSentimentOverTimeData = this.allSentimentOverTimeData.filter(
          data => data.type === 'others'
        );
        break;
      case 'positive':
        this.allSentimentOverTimeData = clone(
          this.allSentimentOverTimeDataCopy
        );
        this.allSentimentOverTimeData = this.allSentimentOverTimeData.filter(
          data => data.sentiment === 1
        );
        break;
      case 'negative':
        this.allSentimentOverTimeData = clone(
          this.allSentimentOverTimeDataCopy
        );
        this.allSentimentOverTimeData = this.allSentimentOverTimeData.filter(
          data => data.sentiment === 0
        );
        break;
      case 'neutral':
        this.allSentimentOverTimeData = clone(
          this.allSentimentOverTimeDataCopy
        );
        this.allSentimentOverTimeData = this.allSentimentOverTimeData.filter(
          data => data.sentiment === -1
        );
        break;
      default:
        this.allSentimentOverTimeData = clone(
          this.allSentimentOverTimeDataCopy
        );
        break;
    }
  }
  getSentimentText(mention) {
    return mention.sentiment === 1
      ? 'positive'
      : mention.sentiment === 0
      ? 'negative'
      : 'neutral';
  }

  scoreToDecimal(score) {
    return (Number(score) * 100).toFixed(1);
  }

  toggleDropdownSentiment() {
    this.showDropDownSentiment = !this.showDropDownSentiment;
  }
  toggleDropdownSource() {
    this.showDropDownSource = !this.showDropDownSource;
  }
  toggleDropdownSort() {
    this.showDropDownSort = !this.showDropDownSort;
  }

  positiveToNegative() {
    this.newsMentions = clone(this.newsMentions_);
    this.newsMentions = this.newsMentions.sort(this.sortByNegativeOrPositive);
    console.log(this.newsMentions);
  }

  // sortPostive(sort: any) {
  //   if (sort === 'all') {
  //     this.newsMentions = this.newsMentions.sort(this.sortByNegativeOrPositive);
  //     console.log(this.newsMentions);
  //   }
  // }

  getPositive() {
    this.newsMentions = clone(this.newsMentions_);
    this.newsMentions = this.newsMentions.filter(data => data.sentiment === 1);
    console.log(this.newsMentions);
  }
  // getOnlyOthers() {
  //   this.newsMentions = clone(this.newsMentions_);
  //   this.newsMentions = this.newsMentions.filter(
  //     data => data.sentiment === 'news'
  const axios : require('axios');
  const api : 'https://us-central1-versus-dev-212614.cloudfunctions.net/versus_dashboard_all_news_mentions';
  const body : {
    "docRef": "nqaXKB0SzWN6xh7RVyzl"
  }
  async  function fetchDate() {
    try {
      const res = await axios.post(api, body)
      const result = res.data.data;
      result.sort(sortBySent)
      console.log(result)
    } catch (error) {
      log(error.response)
    }
  }
  const sortBySent = function(a, b) {
    const ax = a.sentiment;
    const bx  = b.sentiment;
    if (ax > bx) {
      return -1;
    } if (ax < bx) {
      return 1;
    }
    return 0;
  };
  
  fetchDate()  //   );
  //   console.log(this.newsMentions);
  // }





  getOthers() {
    this.progressBar.start();
    const docRef = this.authService.getDocRef();
    this.versusService.getAllDashboardNewsMentions(docRef).subscribe(
      (res: any) => {
        this.progressBar.complete();
        console.log(res);
        if (res.error) {
          this.toastr.error(res.text);
          return false;
        } else {
          this.newsMentions = clone(this.newsMentions_);
          console.log(this.newsMentions);
        }
      },
      err => {
        this.progressBar.complete();
        console.log(err);
      }
    );
  }

  getNegative() {
    this.newsMentions = clone(this.newsMentions_);
    this.newsMentions = this.newsMentions.filter(data => data.sentiment === 0);

    console.log(this.newsMentions);
  }

  getNews(docRef) {
    const payload: newsPayload = {
      docRef: '68CgvyEYhGlLcAlDFdol'
    };
    this.versusService.getAllDashboardNewsMentions(payload).subscribe(
      (res: any) => {
        if (res.error) {
          this.toastr.error(res.text);
          return false;
        }
        console.log(res);
        this.toastr.success('Email invite sent successfully');
      },
      err => {
        console.log(err);
        this.toastr.error('Please try again');
      }
    );
  }
  getSocialMedia(docRef) {
    const payload: newsPayload = {
      docRef: '68CgvyEYhGlLcAlDFdol'
    };
    this.versusService.getAllDashboardSocialMentions(payload).subscribe(
      (res: any) => {
        if (res.error) {
          this.toastr.error(res.text);
          return false;
        }
        console.log(res);
        this.toastr.success('Email invite sent successfully');
      },
      err => {
        console.log(err);
        this.toastr.error('Please try again');
      }
    );
  }
  // getOthers(docRef) {
  //   const payload: newsPayload = {
  //     docRef: '68CgvyEYhGlLcAlDFdol'
  //   };
  //   this.versusService.getAllDashboardOtherMentions(payload).subscribe(
  //     (res: any) => {
  //       if (res.error) {
  //         this.toastr.error(res.text);
  //         return false;
  //       }
  //       console.log(res);
  //       this.toastr.success('Email invite sent successfully');
  //     },
  //     err => {
  //       console.log(err);
  //       this.toastr.error('Please try again');
  //     }
  //   );
  // }

  sortByNegativeOrPositive(c1: any, c2: any) {
    if (c1.getPositive > c2.getNegative) return 1;
    else if (c1.getPositive === c2.getNegative) return 0;
    else return -1;
  }

  getNewsRef(docRef) {
    const payload: newsPayload = {
      docRef: '68CgvyEYhGlLcAlDFdol'
    };
    this.versusService.getAllDashboardNewsMentions(payload).subscribe(
      (res: any) => {
        if (res.error) {
          this.toastr.error(res.text);
          return false;
        }
        console.log(res);
        this.toastr.success('News Displayed Successfully');
      },
      err => {
        console.log(err);
        this.toastr.error('Please try again');
      }
    );
  }
  getOthersRef(docRef) {
    const payload: newsPayload = {
      docRef: '68CgvyEYhGlLcAlDFdol'
    };
    this.versusService.getAllDashboardOthersMentions(payload).subscribe(
      (res: any) => {
        if (res.error) {
          this.toastr.error(res.text);
          return false;
        }
        console.log(res);
        this.toastr.success('News Displayed Successfully');
      },
      err => {
        console.log(err);
        this.toastr.error('Please try again');
      }
    );
  }
}
