import { Component } from '@angular/core';
import { marketData } from 'src/app/models/accounts-table-model';
import { AppMarketDataService } from 'src/app/services/app-market-data.service';
import { AtuoCompSecidService } from 'src/app/services/atuo-comp-secid.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
@Component({
  selector: 'app-echart-marketdata-candle',
  templateUrl: './echart-marketdata-candle.html',
  styleUrls: ['./echart-marketdata-candle.scss']
})
export class NgEchartMarketDataCandleComponent  {
  secIds: string[];
  countryCasesChartOptions: any;
  dispatchAction: any;
  marketData: marketData[] = [];
  seriesCandle :number [][] = []


  constructor(
    private MarketDataService: AppMarketDataService,
    private AtuoCompService:AtuoCompSecidService,
    private CommonDialogsService:HadlingCommonDialogsService,

    ) {
    this.AtuoCompService.recieveSecIdList().subscribe(secIDsList=>this.secIds=secIDsList)
    this.MarketDataService.getMarketDataForChart().subscribe(marketData=>{
      console.log('Chart getMarketDataForChart', Date.now());

      this.marketData=marketData;
      this.secIds = [...new Set(marketData.map(el=>(el.secid)))]
      console.log('secIds',this.secIds);

    })
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
    let seriesVolumes :number [][] = []
    let seriesHigh :number [] = []
    let seriesDate :string [] = []
    this.marketData.forEach((el,i)=>{
      if (el.secid===secid) {
        this.seriesCandle.push([el.open,el.close,el.low,el.high])
        seriesMarketPrice.push(el.marketprice2)
        seriesLow.push(el.low)
        seriesHigh.push(el.high)
        seriesVolumes.push([seriesVolumes.length, el.volume, el.close < el.open ? 1 : -1]);
        // seriesVolumes.push(el.volume)
        seriesDate.push(new Date(el.tradedate).toLocaleDateString())
      }
    })
    if (seriesDate.length !== new Set (seriesDate).size) {
      this.CommonDialogsService.snackResultHandler({name:'error', detail:'There are multipule quotes for one date. Try to filter data by board or exchange'},'Chart','top')
      // this.CommonDialogsService.snackResultHandler({name:'success', detail:'Try to filter data by board or exchange'},'Chart','top')
      this.seriesCandle=[]
      return;
    }
    let minLow:number = Math.min(...seriesLow)*0.992
    let maxHigh:number = Math.max(...seriesHigh)*1.008

    this.countryCasesChartOptions = {
      title: {
        text: secid + ' Prices CHART',
      },
      legend: {
        bottom: 10,
        left: 'center',
        data: [secid + ' candles','MarketPrice', 'MA5', 'MA10', 'MA20']
      },
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
        { name: secid + ' candles',
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
          name: 'MA5',
          type: 'line',
          data: this.MarketDataService.calculateMA(5, seriesMarketPrice),
          smooth: true,
          lineStyle: {
            opacity: 0.5
          }
        },
        {
          name: 'MA10',
          type: 'line',
          data:  this.MarketDataService.calculateMA(10, seriesMarketPrice),
          smooth: true,
          lineStyle: {
            opacity: 0.5
        }
      },
      {
        name: 'MA20',
        type: 'line',
        data: this.MarketDataService.calculateMA(20, seriesMarketPrice),
        smooth: true,
        lineStyle: {
          opacity: 0.5
        }
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
  }
}

