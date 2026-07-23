import { createChart, type Bar } from './chart';
import { CandlestickSeries, LineSeries, createChart as createLightweightChart } from 'lightweight-charts';
import { mountSiteHeader } from './site-header';

const benchmarkTop = document.querySelector<HTMLElement>('.top')!;
document
  .querySelector<HTMLElement>('.shell')!
  .classList.add('site-shell', 'benchmark-shell');
const benchmarkHeader = document.createElement('header');
benchmarkTop.before(benchmarkHeader);
mountSiteHeader(benchmarkHeader, 'Benchmarks', 'Repeatable local performance and bundle-size comparisons.');
const benchmarkDescription = benchmarkTop.querySelector<HTMLElement>('.muted')!;
const benchmarkRun = benchmarkTop.querySelector<HTMLButtonElement>('#run')!;
const benchmarkLead = document.createElement('div');
benchmarkLead.className = 'benchmark-lead';
benchmarkLead.append(benchmarkDescription, benchmarkRun);
benchmarkTop.replaceWith(benchmarkLead);

type Result = { operation:string; openchartsMs:number; lightweightChartsMs:number };
function buildBars(count:number){const next:Bar[]=[];let price=200;for(let i=0;i<count;i++){const open=price;price+=Math.sin(i/23)+(i%7-3)*.2;next.push({time:Date.UTC(2010,0,1)+i*86400000,open,high:Math.max(open,price)+1,low:Math.min(open,price)-1,close:price,volume:100000+i*31})}return next}
const bars=buildBars(5000);
const stressBars=buildBars(100000);
const lwcBars=bars.map(bar=>({...bar,time:Math.floor(bar.time/1000) as never}));
function emaPoints(source:readonly Bar[],period=20){let value=source[0]?.close??0;const alpha=2/(period+1);return source.map((bar,index)=>{value=index?value+(bar.close-value)*alpha:bar.close;return {time:bar.time,value}})}
const frame=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
async function average(run:()=>Promise<void>,runs=6){const values:number[]=[];for(let i=0;i<runs;i++){const start=performance.now();await run();values.push(performance.now()-start)}return values.reduce((a,b)=>a+b,0)/values.length}
function host(){const node=document.createElement('div');node.style.cssText='position:absolute;left:-10000px;top:0;width:720px;height:360px';document.body.append(node);return node}
function addOpenChartsPane(node:HTMLElement,source:Bar[]){const chart=createChart(node);chart.setData(source);chart.addPane({id:'ema',height:.28,title:'EMA 20'});const ema=chart.createSeries({id:'ema',pane:'ema',type:'line',color:'#7dd3fc',lineWidth:2});ema.setData(emaPoints(source));return {chart,ema}}
function addLightweightChartsPane(node:HTMLElement,source:Bar[]){const chart=createLightweightChart(node,{width:node.clientWidth||720,height:node.clientHeight||360,layout:{background:{color:'#0b1020'},textColor:'#aab6d3',attributionLogo:false},grid:{vertLines:{visible:false},horzLines:{visible:false}},rightPriceScale:{borderColor:'#293553'},timeScale:{visible:true,borderVisible:true,borderColor:'#293553'}});const candles=chart.addSeries(CandlestickSeries,{upColor:'#38d39f',downColor:'#ff6b81',borderVisible:false,wickUpColor:'#38d39f',wickDownColor:'#ff6b81',lastValueVisible:false,priceLineVisible:false});candles.setData(source.map(bar=>({...bar,time:Math.floor(bar.time/1000) as never})));const pane=chart.addPane();pane.setHeight(70);const ema=chart.addSeries(LineSeries,{color:'#7dd3fc',lineWidth:2,lastValueVisible:false,priceLineVisible:false},1);ema.setData(emaPoints(source).map(point=>({time:Math.floor(point.time/1000) as never,value:point.value})));return {chart,candles,ema}}

/** Render representative charts in the page; benchmark work remains off-screen. */
function renderComparisonCharts() {
 const sample=bars.slice(-180);
 const openHost=document.querySelector<HTMLElement>('#oc')!;
 const {chart:open}=addOpenChartsPane(openHost,sample);
 open.fitContent();

 const lightweightHost=document.querySelector<HTMLElement>('#lwc')!;
 const {chart:lightweight}=addLightweightChartsPane(lightweightHost,sample);
 lightweight.timeScale().fitContent();
 new ResizeObserver(()=>lightweight.applyOptions({width:lightweightHost.clientWidth,height:lightweightHost.clientHeight})).observe(lightweightHost);
}
async function benchmark(){
 const results:Result[]=[];
 results.push({operation:'cold create + set 5,000 candles + EMA pane',openchartsMs:await average(async()=>{const node=host(),result=addOpenChartsPane(node,bars);await frame();result.chart.destroy();node.remove()}),lightweightChartsMs:await average(async()=>{const node=host(),result=addLightweightChartsPane(node,bars);await frame();result.chart.remove();node.remove()})});
 results.push({operation:'cold create + set 100,000 candles + EMA pane (2 runs)',openchartsMs:await average(async()=>{const node=host(),result=addOpenChartsPane(node,stressBars);await frame();result.chart.destroy();node.remove()},2),lightweightChartsMs:await average(async()=>{const node=host(),result=addLightweightChartsPane(node,stressBars);await frame();result.chart.remove();node.remove()},2)});
 results.push({operation:'replace 5,000 candles + EMA values',openchartsMs:await average(async()=>{const node=host(),result=addOpenChartsPane(node,bars);await frame();result.chart.setData([...bars]);result.ema.setData(emaPoints(bars));await frame();result.chart.destroy();node.remove()}),lightweightChartsMs:await average(async()=>{const node=host(),result=addLightweightChartsPane(node,bars);await frame();result.candles.setData([...lwcBars]);result.ema.setData(emaPoints(bars).map(point=>({time:Math.floor(point.time/1000) as never,value:point.value})));await frame();result.chart.remove();node.remove()})});
 results.push({operation:'50 rendered time-scale updates with EMA pane',openchartsMs:await average(async()=>{const node=host(),result=addOpenChartsPane(node,bars);await frame();const canvas=node.querySelector('canvas')!;for(let i=0;i<50;i++){canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:i%2?100:-100,bubbles:true}));await frame()}result.chart.destroy();node.remove()}),lightweightChartsMs:await average(async()=>{const node=host(),result=addLightweightChartsPane(node,bars);await frame();for(let i=0;i<50;i++){result.chart.timeScale().setVisibleLogicalRange({from:4700-i,to:5000-i});await frame()}result.chart.remove();node.remove()})});
 return {environment:{userAgent:navigator.userAgent,devicePixelRatio:devicePixelRatio},bars:bars.length,iterations:6,results};
}
function render(result:Awaited<ReturnType<typeof benchmark>>){const oc=document.querySelector('#oc-result')!,lwc=document.querySelector('#lwc-result')!,rows=document.querySelector('#results')!;const first=result.results[0];oc.textContent=`${first.openchartsMs.toFixed(1)} ms`;lwc.textContent=`${first.lightweightChartsMs.toFixed(1)} ms`;rows.innerHTML=result.results.map(r=>`<tr><td>${r.operation}</td><td>${r.openchartsMs.toFixed(2)} ms</td><td>${r.lightweightChartsMs.toFixed(2)} ms</td><td>✓</td></tr>`).join('')}
async function run(){const result=await benchmark();render(result);return result}
renderComparisonCharts();
(window as Window & {runBenchmarks?:typeof run}).runBenchmarks=run;document.querySelector<HTMLButtonElement>('#run')!.onclick=()=>void run();void run();
