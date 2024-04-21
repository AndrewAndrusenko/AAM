import { Component, ElementRef, ViewChild } from '@angular/core';
import { AppInvestmentDataServiceService } from 'src/app/services/investment-data.service.service';
import { RevenueFactorData } from 'src/app/models/interfaces.model';
import { MatSelect } from '@angular/material/select';
import { filter, tap } from 'rxjs';
type EChartsOption = echarts.EChartsOption;
type EChartsOptionSeries = echarts.LineSeriesOption
@Component({
  selector: 'app-performance-revenue-factor-chart',
  templateUrl: './performance-revenue-factor-chart.component.html',
  styleUrls: ['./performance-revenue-factor-chart.component.scss']
})
export class AppPerformanceRevenueFactorChartComponentt  {
  portfolios: string[];
  revenueFactorOptions: EChartsOption;
  series :number [] = []
  @ViewChild('fontlarge') fontLarge : ElementRef;
  @ViewChild('selectPortfolio') selectPortfolio: MatSelect;
  RevenueFactorData: RevenueFactorData[] = [];
  currencySymbol:string;
  instrumentsList: string[]=[];

  constructor(
  private InvestmentDataService:AppInvestmentDataServiceService, 
  ) {
    this.InvestmentDataService.recieveRevenueFactorData().pipe(
      tap(data=>data.data.length===0? this.instrumentsList=[]:null),
      filter(data=>data.data.length>0)
      ).subscribe(data=>{
      this.RevenueFactorData=data.data;
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
    this.series=[]
    let seriesSet :EChartsOptionSeries[]=[];
    let seriesDate :string [] = []
    let sizeLarge = parseFloat(window.getComputedStyle(this.fontLarge.nativeElement, null).getPropertyValue('font-size'));
    let currencySymbol = this.currencySymbol;
    let dataSet = this.RevenueFactorData.filter(el=>el.portfolioname === portfolio);
    this.instrumentsList = [... new Set(dataSet.map(el=>el.secid))]
    seriesDate = [... new Set(dataSet.map(el=>new Date(el.report_date).toLocaleDateString()))]
    let tempDataSet:number[] = []
    let legendSet : {name:string, data: number[]}[] = []
    this.instrumentsList.forEach(el=>{
      tempDataSet = dataSet.filter(pl=>pl.secid===el).map(pl=>Math.round(pl.total_pl*100)/100);
      legendSet.push({name:el,data:[seriesDate.length - tempDataSet.length,tempDataSet[0],tempDataSet[tempDataSet.length-1]]})
      tempDataSet = [...Array(seriesDate.length - tempDataSet.length).fill(0), ...tempDataSet]
        seriesSet.push({
          name:el,
          markLine:{},
          type:'line',
          stack:'Total',
          areaStyle:{},
          label: {
            show: false
          },
          smooth: false,
          data:tempDataSet
        });
    this.series.push(seriesSet.length)
    })
    let profitLegend = legendSet.filter(el=>el.data[2]>0).sort((lg,lg1)=>lg.data[0]-lg1.data[0]).map(el=>el.name).reverse();
    let lossLegend = legendSet.filter(el=>el.data[2]<0).map(el=>el.name).sort()
     
    this.revenueFactorOptions = {
      title: {
        text: "PnL: "+legendSet.map(el=>el.data[2]).reduce((acc,cur)=>acc+cur).toLocaleString(undefined,{maximumFractionDigits:2})+currencySymbol,
        right: "15%",
        top:'6%',
        textStyle: {
          fontSize: 22,
          color:legendSet.map(el=>el.data[2]).reduce((acc,cur)=>acc+cur)>0?'green':'brown'
        }
      },
      backgroundColor: '#2c343c',
      legend: {
        icon: "roundRect",
        itemGap: 30,
        textStyle: {
          fontSize: 22,
          color:'white'
        },
        top:'25%',
        left: '90%',
        data: [...profitLegend,...lossLegend],
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'none',
        },
        backgroundColor:'#f4f2f2',
        padding: [5, 30, 5, 10],
        formatter: 
        function (params) {
          let totalRow:string
          if (params.componentType==='markPoint') {
            params.seriesName = chartOptions.series[params.seriesIndex].name
            params.name = chartOptions.xAxis[0].data[params.name]
          }
          params.sort((s1,s2)=>s1.value-s2.value).reverse();
          let total:number = 0;
          let plDetails:string = '';
          params.forEach(el=>total+=el.value)
          totalRow =`
          <tr style="border:1px solid black; "> 
            <th> TOTAL PnL </th> 
            <th style="color:black;">
              ${currencySymbol}
              ${(Math.round(total*100)/100).toLocaleString(undefined,{maximumFractionDigits:2})}
            </th>
          </tr>`
          params.forEach(el=>{
            let colorValue =  el.value<0? 'red':'green'
            plDetails+=`
            <tr style="border:1px solid black"> 
              <th style="border:1px solid black;"> ${el.marker}${el.seriesName}</th> 
              <th> 
                <span style="margin-left: 3%; color:${colorValue}"> 
                  ${el.value.toLocaleString(undefined,{maximumFractionDigits:2})}
                </span>
              </th>
            <tr>`
          })
          return   `
          ${params[0].axisValueLabel}
          <table style="border:1px solid black; width:110%">  
            <span style="font-weight:bold;">
              ${totalRow} 
            </span> 
            ${plDetails} 
          </table>`;

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
          fontSize:sizeLarge,
          fontWeight: "bold",
          backgroundColor: 'blue',
          show:false
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
      grid: [
        {
          left: '2%',
          right: '12%',
          height: '73%',
          top: '10%',
          containLabel: true
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
          offset:30,
          axisLine: { onZero: false },
          splitLine: { show: false },
          axisPointer: {
            z: 100
          },

          axisLabel: {
            fontSize:16,
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
          name: 'PnL',
          nameTextStyle: {
            color:'white',
            fontSize: sizeLarge,
            fontWeight: "bold",
            align: "left",
            padding: [0, 0, 3, 10]

          },
          position: 'right',
          offset:30,
          alignTicks: true,
          axisLine: {
            show: true,
            lineStyle: {
            color:'white',
            }
          },
          scale: true,
          axisLabel: {
            formatter: function (value) {
              return Math.round(value/1000000)<1? currencySymbol+ Math.round(value/1000) + ' k' : currencySymbol+Math.round(value/100000)/10 +' mln'
            },
            fontSize:20,
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
      series: [...seriesSet

      ]
    };
    let chartOptions = this.revenueFactorOptions
  }
  
}

