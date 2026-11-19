const $=id=>document.getElementById(id);
document.querySelectorAll('article code').forEach(el=>katex.render(el.textContent,el,{throwOnError:true}));
let mode=0, noise=[-2,2,-2,-2,2,2,-2,2,-2,2,2,-2];
const buttons=[...$('modes').children];
function draw(){
  const diff=mode===2, raw=noise.map((e,i)=>20+(mode?i+1:0)+e);
  const values=diff?raw.slice(1).map((v,i)=>v-raw[i]):raw;
  const means=values.map((_,i)=>diff?1:20+(mode?i+1:0));
  const low=diff?-5:16,high=diff?7:36;
  const x=i=>36+448*(i+(diff?1:0))/11,y=v=>154-133*(v-low)/(high-low);
  const points=a=>a.map((v,i)=>x(i)+','+y(v)).join(' ');
  const ticks=diff?[-3,1,5]:[16,20,24,28,32,36];
  $('plot').innerHTML=ticks.map(v=>'<path stroke="#d8c7ac" d="M36 '+y(v)+'h448"/><text x="3" y="'+(y(v)+4)+'">'+v+'</text>').join('')+
    [0,3,7,11].filter(i=>!diff||i>0).map(i=>'<text x="'+(36+448*i/11-10)+'" y="183">'+(i+1)+'日</text>').join('')+
    '<polyline fill="none" stroke="#754e34" stroke-dasharray="6 4" stroke-width="2" points="'+points(means)+'"/><polyline fill="none" stroke="#903e4d" stroke-width="2.6" points="'+points(values)+'"/>'+values.map((v,i)=>'<circle fill="#903e4d" cx="'+x(i)+'" cy="'+y(v)+'" r="3"/>').join('');
  $('legend').textContent=diff?'每日增量（单） · 实线：这次的增量；虚线：理论均值 1':'每日订单（单） · 实线：这次的记录；虚线：每天的理论均值';
  $('reading').textContent=diff?'第 2 天减第 1 天：'+raw[1]+' − '+raw[0]+' = '+values[0]+' 单。虚线是长期重复这个实验时的期望增量 1，不是每次必增 1 单。第 1 天没有前一天可减，所以只有 11 个点。':mode?'第 2 天的基准是 20 + 2 = 22 单，加上同一次抛币的偏差（'+noise[1]+'），得到 '+raw[1]+' 单。和无趋势相比，改变的是虚线的斜率。':'第 2 天实际有 '+raw[1]+' 单；再开一次店，这一天也可能取另一个值。虚线上的 20 是两种结果的平均，不是某天必须出现的订单数。';
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===mode)));
}
buttons.forEach((b,i)=>b.onclick=()=>{mode=i;draw()});
$('sample').onclick=()=>{noise=noise.map(()=>Math.random()<.5?-2:2);draw()};
draw();
