import { Component } from '@angular/core';
import { AppMarketDataService } from 'src/app/services/market-data.service';
import { AtuoCompleteService } from 'src/app/services/auto-complete.service';
import { HadlingCommonDialogsService } from 'src/app/services/hadling-common-dialogs.service';
import { AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import { PortfolioPerformnceData } from 'src/app/models/intefaces.model';
@Component({
  selector: 'app-performance-twroi-chart',
  templateUrl: './performance-twroi-chart.componentt.html',
  styleUrls: ['./performance-twroi-chart.componentt.scss']
})
export class AppPerformanceTWROiEchartComponentt  {
  portfolios: string[];
  countryCasesChartOptions: any;
  dispatchAction: any;
  performanceData: PortfolioPerformnceData[] = [];
  seriesCandle :number [][] = []
  constructor(
    private InvestmentDataService:AppInvestmentDataServiceService, 
    private MarketDataService: AppMarketDataService,
    private CommonDialogsService:HadlingCommonDialogsService,
    ) {
      this.portfolios=['ACM002','ICM011']
      this.InvestmentDataService.recievePerformnceData().subscribe(performanceData=>{
        this.performanceData=performanceData;
        this.portfolios = [...new Set(performanceData.map(el=>(el.portfolioname)))]
      })
    }
  onChangeCountry(portfolioname:string) {
    this.seriesCandle=[]
    this.setOptions(portfolioname);
  }
  setOptions(portfolioname:string) {
    const colors = ['#5470C6', '#91CC75', '#EE6666'];
    const upColor = colors[1];
    const downColor = '#ec0000';
    let seriesMarketPrice :number [] = []
    let seriesLow :number [] = []
    let seriesVolumes :number [][] = []
    let seriesCashInOut :number [][] = []
    let seriesHigh :number [] = []
    let seriesDate :string [] = []
    this.performanceData.forEach((el,i)=>{
      if (el.portfolioname===portfolioname) {
        this.seriesCandle.push([el.time_wighted_roi-1,el.time_wighted_roi+1,el.time_wighted_roi-1.5,el.time_wighted_roi+1.5])
        seriesMarketPrice.push(el.time_wighted_roi)
        seriesLow.push(el.time_wighted_roi)
        seriesHigh.push(el.time_wighted_roi)
        seriesVolumes.push([seriesVolumes.length, el.npv,el.cash_flow, -1 ]);
        // seriesCashInOut.push([seriesCashInOut.length, el.cash_flow, 1 ]);
        // seriesVolumes.push([seriesVolumes.length, el.npv, el.close < el.open ? 1 : -1]);
        seriesDate.push(new Date(el.report_date).toLocaleDateString())
      }
    })
    if (seriesDate.length !== new Set (seriesDate).size) {
      this.CommonDialogsService.snackResultHandler({name:'error', detail:'There are multipule quotes for one date. Try to filter data by board or exchange'},'Chart','top')
      this.seriesCandle=[]
      return;
    }
    let minLow:number = Math.min(...seriesLow)*0.992
    let maxHigh:number = Math.max(...seriesHigh)*1.008

    this.countryCasesChartOptions = {
      title: {
        text: portfolioname + ' TWR CHART',
      },
      legend: {
        bottom: 10,
        left: 'center',
        data: [portfolioname + ' candles','TWR',  'MA10', ]
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
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
          saveAsImage: { show: true },
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
          splitNumber: 1,
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
        { name: portfolioname + ' candles',
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
        { name: 'TWR',
          type:'line',
          color:colors[2],
          data:seriesMarketPrice
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
        name: 'NVP',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: seriesVolumes,
        itemStyle: {
          color: upColor,
          color0: downColor,
          borderColor: undefined,
          borderColor0: undefined,
          opacity: 0.8
        }
      }
      ]
    };
  }
}

