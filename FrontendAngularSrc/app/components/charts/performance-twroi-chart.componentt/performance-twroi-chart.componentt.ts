import { Component, ElementRef, ViewChild } from '@angular/core';
import { AppMarketDataService } from 'FrontendAngularSrc/app/services/market-data.service';
import { AppInvestmentDataServiceService } from 'FrontendAngularSrc/app/services/investment-data.service.service';
import { PortfolioPerformnceData } from 'FrontendAngularSrc/app/models/interfaces.model';
import { MatSelect } from '@angular/material/select';
type EChartsOption = echarts.EChartsOption;
@Component({
  selector: 'app-performance-twroi-chart',
  templateUrl: './performance-twroi-chart.componentt.html',
  styleUrls: ['./performance-twroi-chart.componentt.scss']
})
export class AppPerformanceTWROiEchartComponentt  {
  portfolios: string[];
  performanceROIOptions: EChartsOption;
  seriesMarketPrice :number [] = []
  @ViewChild('fontlarge') fontLarge : ElementRef;
  @ViewChild('selectPortfolio') selectPortfolio: MatSelect;
  performanceData: PortfolioPerformnceData[] = [];
  currencySymbol:string;
  constructor(
  private InvestmentDataService:AppInvestmentDataServiceService, 
  private MarketDataService: AppMarketDataService,
  ) {
    this.InvestmentDataService.recievePerformnceData().subscribe(data=>{
      this.performanceData=data.data;
      this.portfolios = [...new Set(data.data.map(el=>(el.portfolioname)))]
      this.currencySymbol=data.currencySymbol;
      this.setOptions(this.portfolios[0])
      this.selectPortfolio.value=this.portfolios[0];
    })
  }
  onChangePortfolio(portfolio:string) {
    this.setOptions(portfolio);
  }
  setOptions(portfolio:string) {
    const colors = ['#5470C6', '#91CC75', 'black','#EE6666'];
    const upColor = '#00da3c';
    const downColor = '#ec0000';
    this.seriesMarketPrice=[]
    let seriesROI :number [] = []
    let seriesNPV :number [][] = []
    let seriesCashIO :number [][] = []
    let seriesDate :string [] = []
    let sizeLarge = parseFloat(window.getComputedStyle(this.fontLarge.nativeElement, null).getPropertyValue('font-size'));
    let currencySymbol = this.currencySymbol
    this.performanceData.forEach((el,i)=>{
      if (el.portfolioname===portfolio) {
        this.seriesMarketPrice.push(Number(el.time_wighted_roi))
        seriesROI.push(Number(el.roi_current_period))
        seriesNPV.push([seriesNPV.length, Number(el.npv), el.npv > (el.last_npv+el.cash_flow)? 1:-1]);
        seriesCashIO.push([seriesNPV.length, Math.abs(el.cash_flow), Number(el.cash_flow) > 0? 1:-1]);
        seriesDate.push(new Date(el.report_date).toLocaleDateString())
      }
    })
    this.performanceROIOptions = {
        backgroundColor: '#2c343c',
      legend: {
        textStyle: {
          fontSize: sizeLarge,
          color:'white'
        },
        bottom: 2,
        left: 'center',
        data: ['TWR','ROI', 'MA10','NPV','Cash D/W']
      },
      tooltip: {
        formatter: 
        function (params) {
          let displayValue:string
          if (params.componentType==='markPoint') {
            params.seriesName = chartOptions.series[params.seriesIndex].name
            params.name = chartOptions.xAxis[0].data[params.name]
          }
            switch (params.seriesName) {
            case 'TWR':
              displayValue = params.seriesName+': '+params.value + ' %'
            break;
            case 'NPV':
              displayValue = params.seriesName+': '+currencySymbol+ params.value[1].toLocaleString(undefined, { maximumFractionDigits: 2 }) 
            break;
            case 'Cash D/W':
              displayValue = params.value[2] === 1?  'Deposit ' +currencySymbol  :  'Withdrawal '+currencySymbol;
              displayValue += params.value[1].toLocaleString(undefined, { maximumFractionDigits: 2 }) 
            break;
            default:
              displayValue =params.seriesName+': '+ params.value
            break;
          }
          return params.name +'<br />'+displayValue ;
        },
        textStyle: {
          fontSize:sizeLarge
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
          dataZoom: {
            yAxisIndex: false
          },
          brush: {
            type: ['lineX', 'clear']
          },
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
        seriesIndex: 4,
        // dimension: 1,
        pieces: [
          {
            value: -1,
            color: downColor
          },
          {
            value: 1,
            color: upColor
          }
        ]
      },
      grid: [
        {
          left: '2%',
          right: '12%',
          height: '73%',
          top: '10%',
        },
        {
          left: '2%',
          right: '12%',
          top: '70%',
          height: '6%'
        }
      ],
      xAxis: [
        {
          type: 'category',
          data: seriesDate,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          axisPointer: {
            z: 100
          },

          axisLabel: {
            fontSize:sizeLarge,
            fontWeight: "bold",
            color:'white'
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
          axisLabel: { show:false}
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: 'TWR',
          nameTextStyle: {
            color:'white',
            fontSize: sizeLarge,
            fontWeight: "bold",
            align: "left",
            padding: [0, 0, 3, 10]
          },
          position: 'right',
          alignTicks: true,
          offset:40,
          axisLine: {
            show: true,
            lineStyle: {
              color:'white'
            }
          },
          scale: true,
          axisLabel: {
            formatter: '{value} %',
            fontSize:sizeLarge,
            fontWeight: "bold"
          }
        },
        {
          type: 'value',
          name: 'NPV',
          nameTextStyle: {
            color:colors[0],
            fontSize: sizeLarge,
            fontWeight: "bold",
            align: "left",
            padding: [0, 0, 3, 10]

          },
          position: 'right',
          offset:100,
          alignTicks: true,
          axisLine: {
            show: true,
            lineStyle: {
              color: colors[0],
            }
          },
          scale: true,
          axisLabel: {
            formatter: function (value) {
              return Math.round(value/1000000)<1? currencySymbol+ Math.round(value/1000) + ' k' : currencySymbol+Math.round(value/100000)/10 +' mln'
            },
            fontSize:sizeLarge,
            fontWeight: "bold"
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
          xAxisIndex: [0, 1],
          type: 'slider',
          top: '90%',
          start: 2,
          end: 100
        }
      ],
      series: [
        { name: 'TWR',
          type:'line',
          color:colors[2],

          data:this.seriesMarketPrice,
          lineStyle: {
            width: 4.5
          },
          emphasis: {
            focus: 'series'
          },
          markPoint: {
            data: [
              {
                type: "min",
                name:'Min'
              },
              {
                type: "max",
                name:'Max'
              },
              {
                name: 'coordinate',
                coord: [seriesDate.length-1, this.seriesMarketPrice[this.seriesMarketPrice.length-1]]
              },
            ],
            symbol: "pin",
            symbolSize: 90,
            label: {
              fontSize: sizeLarge,
              formatter: function (dataObj) {
                return  dataObj.data['name']==='coordinate'? Math.round(dataObj.data['coord'][1]*10)/10 + ' %' : Math.round(dataObj.data['value']*10)/10 + ' %:\n' +dataObj.data['type']
              },
            },
          },
        },
        { name: 'ROI',
        type:'line',
        data:seriesROI,
      },
        { name: 'MA10',
          type: 'line',
          data:  this.MarketDataService.calculateMA(10, this.seriesMarketPrice),
          smooth: true,
          color:colors[3],
          lineStyle: {
            opacity: 0.9
        },
        },
        { name: 'NPV',
          type: 'bar',
          barGap: 0,
          yAxisIndex: 1,
          data: seriesNPV,
          itemStyle: {
            color: colors[0],
            borderColor: undefined,
            opacity: 0.5
          }
        },
        { name: 'Cash D/W',
          type: 'bar',
          yAxisIndex: 1,
          // barWidth: 15,
          data: seriesCashIO,
          itemStyle: {
              color: upColor,
              borderColor: undefined,
              opacity: 0.35
            } 
        }
      ]
    };
    let chartOptions = this.performanceROIOptions
  }

}

