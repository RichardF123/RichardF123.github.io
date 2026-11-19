(()=>{
const $=id=>document.getElementById(id),arma=document.body.dataset.unit==='arma',end=8,f=x=>String(+x.toFixed(3));
let step=1;
const notation=document.createElement('p');notation.textContent=arma?'Dₖ 表示两条观测路径的差，uₖ 表示创新之差。第 0 期创新差为 1，随后为零；并非原始过程没有新的创新。':'固定起点 t：Xₜ = 32，Yₜ = 3，Zₜ = 2。Ŷₜ(h) 表示增量预测，X̂ₜ(h) 表示水平预测。未知未来创新的条件均值取零。';document.querySelector('.rec-params').before(notation);
const math=window.LabMath;
math.panel(document.querySelector('.rec-params'),'模型公式 · MA 项使用加号',arma?[
  String.raw`X_t=\alpha X_{t-1}+Z_t+\beta Z_{t-1}`,
  String.raw`D_k=\alpha D_{k-1}+u_k+\beta u_{k-1}`,
  String.raw`D_0=u_0=1,\quad u_k=0\ (k\ge1)`
]:[
  String.raw`Y_t=(1-B)X_t=X_t-X_{t-1}`,
  String.raw`Y_t=\alpha Y_{t-1}+Z_t+\beta Z_{t-1}`,
  String.raw`\widehat X_t(h)=\widehat X_t(h-1)+\widehat Y_t(h)`
]);
const numeric=document.createElement('div');numeric.className='lab-formulas';numeric.id='rec-equations';$('rec-chart').before(numeric);
function model(a,b){
  const diff=[arma?1:3],level=[32],ar=[0],ma=[0];
  for(let k=1;k<=end;k++){ar[k]=a*diff[k-1];ma[k]=k===1?b*(arma?1:2):0;diff[k]=ar[k]+ma[k];level[k]=level[k-1]+diff[k];}
  return {diff,level,ar,ma};
}
function graph(title,values,color,zero){
  const lo=Math.min(...values,...(zero?[0]:[])),hi=Math.max(...values,...(zero?[0]:[])),pad=Math.max((hi-lo)*.14,.1);
  const x=k=>44+36*k,y=v=>98-69*(v-lo+pad)/(hi-lo+2*pad);
  const xy=values.map((v,k)=>x(k)+','+y(v));
  const ticks=[...new Set([lo,...(lo<0&&hi>0?[0]:[]),hi])];
  return '<svg viewBox="0 0 360 124" role="img" aria-label="'+title+'"><text x="6" y="15">'+title+'</text>'+ticks.map(v=>'<path d="M40 '+y(v)+'h297" stroke="#d8c8ae"/><text x="36" text-anchor="end" y="'+(y(v)+4)+'">'+f(v)+'</text>').join('')+'<polyline points="'+xy.join(' ')+'" fill="none" stroke="#aa9c86" stroke-dasharray="4 4"/><polyline points="'+xy.slice(0,step+1).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="2.4"/><circle cx="'+x(step)+'" cy="'+y(values[step])+'" r="4.5" fill="'+color+'"/>'+values.map((_,k)=>'<text x="'+x(k)+'" y="119" text-anchor="middle">'+k+'</text>').join('')+'</svg>';
}
function draw(){
  const a=+$('ra').value,b=+$('rb').value,{diff,level,ar,ma}=model(a,b);
  for(const [id,v] of [['ra',a],['rb',b]])document.querySelector('output[for="'+id+'"]').value=f(v);
  $('period').textContent='第 '+step+' 期';$('prev-step').disabled=step===1;$('next-step').disabled=step===end;
  const product=(m,v)=>f(m)+' × ('+f(v)+') = '+f(m*v);
  const z=step===1?(arma?1:2):0;
  numeric.replaceChildren(...(arma?[
    String.raw`D_{${step}}=(${f(a)})(${f(diff[step-1])})+0+(${f(b)})(${f(z)})`,
    String.raw`D_{${step}}=${f(diff[step])}`
  ]:[
    String.raw`\widehat Y_t(${step})=(${f(a)})(${f(diff[step-1])})+(${f(b)})(${f(z)})`,
    String.raw`\widehat Y_t(${step})=${f(diff[step])}`,
    String.raw`\widehat X_t(${step})=${f(level[step-1])}+(${f(diff[step])})=${f(level[step])}`
  ]).map(tex=>math.row(tex)));
  const cards=[['① '+(arma?'上期观测差 × AR 系数':'上期增量 × AR 系数'),product(a,diff[step-1])],['② 上期创新 × MA 系数',product(b,step===1?(arma?1:2):0)],['① + ② · '+(arma?'本期观测差':'本期增量预测'),f(diff[step])]];
  if(!arma)cards.push(['上期水平 + 本期增量',f(level[step-1])+' + ('+f(diff[step])+') = '+f(level[step])]);
  math.terms($('rec-blocks'),cards.map(([label,value])=>[label,value.replaceAll('×',String.raw`\times`)]));
  $('rec-chart').innerHTML=graph(arma?'相对基准的观测差':'每期增量（单）',diff,'#84483d',true)+(arma?'':graph('累计水平（单）',level,'#466858',false))+'<figcaption>横轴：期数。圆点标出当前步，虚线是按同一规则继续递推的结果。'+(arma?'':'两图纵轴各自标度，请比较数值而非线条高度。')+'</figcaption>';
  $('rec-note').textContent=arma?(step===1?'第 0 期的 1 单意外同时进入两条路。试把 β 调到 −α：两项恰好抵消。':'两条路径没有新的创新差，MA 直接贡献变为 0。现在只把上一期留下的差乘 α。'):(step===1?'第一步用已知创新 2。预测增量和预测水平不是同一个量：要从最后实测水平 32 加起。':'预测起点没有向前移动。未来创新取条件均值 0，上一期增量预测乘 α，而水平保留之前累加的变化。');
}
$('prev-step').onclick=()=>{if(step>1)step--;draw()};$('next-step').onclick=()=>{if(step<end)step++;draw()};
$('ra').oninput=draw;$('rb').oninput=draw;$('reset-lab').onclick=()=>{step=1;$('ra').value=.5;$('rb').value=.25;draw()};draw();
})();
