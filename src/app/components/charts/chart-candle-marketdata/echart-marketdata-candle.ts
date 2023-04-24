import { Component, OnInit, ViewChild } from '@angular/core';
import { marketData } from 'src/app/models/accounts-table-model';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { AtuoCompSecidService } from 'src/app/services/atuo-comp-secid.service';
@Component({
  selector: 'app-echart-marketdata-candle',
  templateUrl: './echart-marketdata-candle.html',
  styleUrls: ['./echart-marketdata-candle.scss']
})
export class NgEchartMarketDataCandleComponent implements OnInit {
  secIds: string[];
  countryCasesChartOptions: any;
  dispatchAction: any;
  marketData: marketData[] = [];
  seriesCandle :number [][] = []


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
    this.seriesCandle=[]
    this.setOptions(secid);
    console.log('mdata',this.marketData.length);
  }
  setOptions(secid:string) {
    const upColor = '#00da3c';
    const downColor = '#ec0000';
    let seriesMarketPrice :number [] = []
    let seriesLow :number [] = []
    let seriesVolumes :number [] = []
    let seriesHigh :number [] = []
    let seriesDate :string [] = []
    this.marketData.forEach(el=>{
      if (el.secid===secid) {
        this.seriesCandle.push([el.open,el.close,el.low,el.high])
        seriesMarketPrice.push(el.marketprice2)
        seriesLow.push(el.low)
        seriesHigh.push(el.high)
        seriesVolumes.push(el.volume)
        seriesDate.push(new Date(el.tradedate).toLocaleDateString())
      }
    })
    let minLow:number = Math.min(...seriesLow)*0.992
    let maxHigh:number = Math.max(...seriesHigh)*1.008

    this.countryCasesChartOptions = {
      title: {
        text: secid + ' Prices CHART',
      },
 /*      legend: {
        data: ['admittedquote', 'high', 'low']
      }, */
      tooltip: {
      },
      axisPointer: {
        link: [
          {
            xAxisIndex: 'all'
          }
        ],
        label: {
          backgroundColor: '#777'
        }
      },
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: false
          },
          brush: {
            type: ['lineX', 'clear']
          }
        }
      },
      brush: {
        xAxisIndex: 'all',
        brushLink: 'all',
        outOfBrush: {
          colorAlpha: 0.1
        }
      },
      visualMap: {
        show: false,
        seriesIndex: 5,
        dimension: 2,
        pieces: [
          {
            value: 1,
            color: downColor
          },
          {
            value: -1,
            color: upColor
          }
        ]
      },
      grid: [
        {
          left: '5%',
          right: '8%',
          height: '50%'
        },
        {
          left: '5%',
          right: '8%',
          top: '63%',
          height: '16%'
        }
      ],
      xAxis: [
        {
          type: 'category',
          data: seriesDate,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax',
          axisPointer: {
            z: 100
          }
        },
        {
          type: 'category',
          gridIndex: 1,
          data: seriesDate,
          boundaryGap: false,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          min: 'dataMin',
          max: 'dataMax'
        }
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true
          }
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false }
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 2,
          end: 100
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          top: '85%',
          start: 2,
          end: 100
        }
      ],
      series: [
        { name: 'Candles',
          type: 'candlestick',
          data: this.seriesCandle,
          itemStyle: {
            color: upColor,
            color0: downColor,
            borderColor: undefined,
            borderColor0: undefined,
            opacity: 0.2
          },
        },
        { name: 'MarketPrice',
          type:'line',
          data:seriesMarketPrice
        },
        {
          name: 'Volume',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: seriesVolumes,
          itemStyle: {
            color: upColor,
            color0: downColor,
            borderColor: undefined,
            borderColor0: undefined,
            opacity: 0.2
          }
        }
      ]
    };
    console.log('fin setopt',this.countryCasesChartOptions);
  }
}

