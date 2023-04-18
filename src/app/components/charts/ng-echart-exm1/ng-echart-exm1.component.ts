import { Component, OnInit } from '@angular/core';
import { marketData } from 'src/app/models/accounts-table-model';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { AtuoCompSecidService } from 'src/app/services/atuo-comp-secid.service';
@Component({
  selector: 'app-ng-echart-exm1',
  templateUrl: './ng-echart-exm1.component.html',
  styleUrls: ['./ng-echart-exm1.component.scss']
})
export class NgEchartExm1Component implements OnInit {
  secIds: string[];
  countryCasesChartOptions: any;
  marketData: marketData[] = [];
 

  constructor(
    private MarketDataService: AppMarketDataService,
    private AtuoCompService:AtuoCompSecidService
    ) {
    this.AtuoCompService.recieveSecIdList().subscribe(secIDsList=>this.secIds=secIDsList)
  }
  ngOnInit(): void {
    this.MarketDataService.getMarketData('GOOG').subscribe(mData => {
      // this.secIds = mData[0].secid
      this.marketData = mData;

      this.setOptions();
      console.log('opt',this.countryCasesChartOptions);
    })
  }
  onChangeCountry() {
    this.MarketDataService.getMarketData().subscribe(marketData => {
      this.marketData = marketData;
      this.setOptions();
    });
  }
  setOptions() {
    this.countryCasesChartOptions = {
      title: {
        text: 'GOOG-RM Prices CHART',
      },
      legend: {
        data: ['admittedquote', 'high', 'low']
      },
      tooltip: {
      },
      xAxis: {
        data: this.marketData.map(c => new Date(c.tradedate).toLocaleDateString()),
      },
      yAxis: {
        type: 'value',
        min:2500
      },
      series: [{
        name: 'admittedquote',
        type: 'line',
        data: this.marketData.map(c => c.admittedquote),
      },
      {
        name: 'high',
        type: 'line',
        data: this.marketData.map(c => c.high),
      },
      {
        name: 'low',
        type: 'line',
        data: this.marketData.map(c => c.low),
      },
      ]
    };
    console.log('fin setopt',this.marketData,this.countryCasesChartOptions);
  }
}
