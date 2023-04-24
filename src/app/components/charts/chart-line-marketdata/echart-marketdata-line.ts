import { Component, OnInit, ViewChild } from '@angular/core';
import { marketData } from 'src/app/models/accounts-table-model';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { AtuoCompSecidService } from 'src/app/services/atuo-comp-secid.service';
import { AppTableMarketDataComponent } from '../../tables/app-table-market-data/app-table-market-data';
@Component({
  selector: 'app-echart-marketdata-line',
  templateUrl: './echart-marketdata-line.html',
  styleUrls: ['./echart-marketdata-line.scss']
})
export class NgEchartMarketDataLineComponent implements OnInit {
  secIds: string[];
  countryCasesChartOptions: any;
  marketData: marketData[] = [];
 

  constructor(
    private MarketDataService: AppMarketDataService,
    private AtuoCompService:AtuoCompSecidService
    ) {
    this.AtuoCompService.recieveSecIdList().subscribe(secIDsList=>this.secIds=secIDsList)
    this.MarketDataService.getMarketDataForChart().subscribe(marketData=>{
      this.marketData=marketData;
      this.secIds = [...new Set(marketData.map(el=>(el.secid)))]
      console.log('secIds',this.secIds);

    })
  }
  ngOnInit(): void {
/*     this.MarketDataService.getMarketData('GOOG').subscribe(mData => {
      this.marketData = mData;
      this.setOptions();
    }) */
  }
  onChangeCountry(target:any) {
    console.log('event',target.value);
    let secid= target.value;
    this.setOptions(secid);
    console.log('mdata',this.marketData.length);
  }
  setOptions(secid:string) {
    let seriesHigh :number [] = []
    let seriesLow :number [] = []
    let seriesMarketPrice :number [] = []
    let seriesDate :string [] = []
    this.marketData.forEach(el=>{
      if (el.secid===secid) {
       seriesHigh.push(el.high)
       seriesLow.push(el.low)
       seriesMarketPrice.push(el.admittedquote)
       seriesDate.push(new Date(el.tradedate).toLocaleDateString())
      }
    })
    let minLow:number = Math.min(...seriesLow)*0.98
    let maxHigh:number = Math.max(...seriesHigh)*1.02

    this.countryCasesChartOptions = {
      title: {
        text: secid + ' Prices CHART',
      },
      legend: {
        data: ['admittedquote', 'high', 'low']
      },
      tooltip: {
      },
      xAxis: {
        data: seriesDate
      },
      yAxis: {
        type: 'value',
        min:minLow,
        max:maxHigh,
      },
      series: [{
        name: 'admittedquote',
        type: 'line',
        data: seriesMarketPrice,
      },
      {
        name: 'high',
        type: 'line',
        data: seriesHigh
      },
      {
        name: 'low',
        type: 'line',
        data: seriesLow,
      },
      ]
    };
    console.log('fin setopt',this.countryCasesChartOptions);
  }
}
