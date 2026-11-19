const chapterButtons = [...document.querySelectorAll('.chapters [data-section]')];
function showChapter() {
  const selected = chapterButtons.find(b => '#' + b.dataset.section === location.hash) || chapterButtons[0];
  for (const button of chapterButtons) {
    const active = button === selected;
    document.getElementById(button.dataset.section).hidden = !active;
    if (active) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }
}
for (const button of chapterButtons) button.addEventListener('click', () => {
  const hash = '#' + button.dataset.section;
  if (location.hash !== hash) history.pushState(null, '', hash);
  showChapter();
  if (matchMedia('(max-width:760px)').matches) document.querySelector(hash).scrollIntoView();
});
window.addEventListener('hashchange', showChapter);
window.addEventListener('popstate', showChapter);
showChapter();
const $=id=>document.getElementById(id);
document.querySelectorAll('article code').forEach(el=>katex.render(el.textContent,el,{throwOnError:true}));

// All SVG coordinates use the same viewBox so markers remain legible on mobile.
const ink='#854239',grey='#806f5b',line=(x,y,z,w,c=grey,attrs='')=>'<line x1="'+x+'" y1="'+y+'" x2="'+z+'" y2="'+w+'" stroke="'+c+'" '+attrs+'/>',
  txt=(x,y,s)=>'<text x="'+x+'" y="'+y+'" text-anchor="middle">'+s+'</text>',
  dot=(x,y,r=4,open=false)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" stroke="'+ink+'" fill="'+(open?'#fff7e7':ink)+'"/>';
const f=n=>Number(n.toFixed(3));
const math=window.LabMath;let forecastStep=1;
math.panel($('arch').querySelector('.forecast-lab'),'ARCH(1) · 当前模型',[
 String.raw`a_t=\sigma_t\epsilon_t,\quad\epsilon_t\sim NID(0,1)`,
 String.raw`\sigma_t^2=\omega+\alpha_1 a_{t-1}^2`
]);
math.panel($('garch').querySelector('.forecast-lab'),'GARCH(1,1) · 当前模型',[
 String.raw`\sigma_{t+1}^2=\omega+\alpha a_t^2+\beta\sigma_t^2`,
 String.raw`H_{h+1}=\omega+(\alpha+\beta)H_h`
]);
const archTerms=document.createElement('div');archTerms.className='lab-terms';$('spread').closest('figure').before(archTerms);
const epsLabel=document.createElement('label');epsLabel.textContent='当期标准化创新 ε（先取 1，再试 −1）';const eps=document.createElement('input');eps.type='range';eps.min=-2;eps.max=2;eps.step=.25;eps.value=1;eps.setAttribute('aria-label','当期标准化创新');epsLabel.append(eps);archTerms.before(epsLabel);
const gTerms=document.createElement('div');gTerms.className='lab-terms';$('memory').closest('figure').before(gTerms);
const stepper=document.createElement('div');stepper.className='lab-stepper';
const prev=document.createElement('button'),next=document.createElement('button'),position=document.createElement('strong');prev.textContent='←';next.textContent='→';prev.setAttribute('aria-label','上一预测期');next.setAttribute('aria-label','下一预测期');stepper.append(prev,position,next);gTerms.before(stepper);
prev.onclick=()=>{forecastStep=Math.max(1,forecastStep-1);memory(Number($('beta').value))};next.onclick=()=>{forecastStep=Math.min(8,forecastStep+1);memory(Number($('beta').value))};
eps.oninput=()=>arch(Number($('a').value));
function arch(a){
  const v=.5+.5*a*a,sd=Math.sqrt(v),x=z=>190+64*z;
  math.terms(archTerms,[
    ['① 常数',String.raw`\omega=0.5`],
    ['② 昨日冲击平方的贡献',String.raw`\alpha_1 a_{t-1}^2=0.5(${a})^2=${f(.5*a*a)}`],
    ['③ 今天的条件方差',String.raw`\sigma_t^2=0.5+${f(.5*a*a)}=${f(v)}`],
    ['④ 开方，再生成残差',String.raw`a_t=\sqrt{${f(v)}}\,(${eps.value})=${f(sd*Number(eps.value))}`]
  ]);
  $('a-val').value=a;$('spread').innerHTML=line(30,68,350,68)+[-2,-1,0,1,2].map(t=>txt(x(t),102,t)).join('')+line(x(-sd),68,x(sd),68,ink,'stroke-width="7"')+dot(x(-sd),68)+dot(x(sd),68)+txt(190,42,'条件均值 0');
  $('spread-read').textContent='方差 = 0.5 + 0.5 × ('+a+')² = '+f(v)+'；条件标准差 = '+f(sd)+'。改变正负号只改变昨天的方向，不改变今天的尺度。';
}
function moments(a){
  const cutoff=1/Math.sqrt(3),x=z=>83+253*z;
  $('alpha-val').value=a;$('threshold').innerHTML=[[1,44,'二阶矩'],[cutoff,77,'四阶矩']].map(([end,y,label])=>txt(42,y+4,label)+line(x(0),y,x(1),y)+line(x(0),y,x(end),y,ink,'stroke-width="5"')+dot(x(end),y,4,true)).join('')+line(x(a),25,x(a),92,grey,'stroke-dasharray="3 2"')+txt(x(0),114,'0')+txt(x(cutoff),114,'0.577…')+txt(x(1),114,'1');
  $('moment-read').textContent='固定 ω = 0.5。α = '+a+'：'+(a===1?'二阶矩已不有限，不能计算长期方差或峰度。':'长期方差 = '+f(.5/(1-a))+'；'+(a>=cutoff?'四阶矩不有限，没有有限峰度。':'普通峰度 = '+f(3*(1-a*a)/(1-3*a*a))+'，超额峰度 = '+f(6*a*a/(1-3*a*a))+'。'));
}
function memory(b){
 const r=.2+b,H=Array.from({length:8},(_,k)=>1+1.6*r**k),x=k=>44+42*k,y=v=>103-44*(v-1);
 position.textContent='第 '+forecastStep+' 步';prev.disabled=forecastStep===1;next.disabled=forecastStep===8;
 const h=forecastStep,w=f(1-r),last=h===1?1:H[h-2],shock=h===1?9:last;
 math.terms(gTerms,[
  ['① 常数（保持长期方差为 1）',String.raw`\omega=${w}`],
  [h===1?'② 已知今日冲击平方':'② 未来冲击平方用其条件期望',String.raw`0.2(${f(shock)})=${f(.2*shock)}`],
  ['③ 滞后方差',String.raw`\beta(${f(last)})=${b}(${f(last)})=${f(b*last)}`],
  ['本步方差预测',String.raw`H_{${h}}=${w}+${f(.2*shock)}+${f(b*last)}=${f(H[h-1])}`]
 ]);
 $('beta-val').value=b;$('memory').innerHTML=line(40,y(1),352,y(1),grey,'stroke-dasharray="4 3"')+[1,2,3].map(v=>txt(22,y(v)+4,v)).join('')+H.map((v,k)=>(k?line(x(k-1),y(H[k-1]),x(k),y(v),ink,'stroke-width="2"'):'')+dot(x(k),y(v))+txt(x(k),125,k+1)).join('');
 $('memory-read').textContent='ω = '+f(1-r)+'，持续性 α + β = '+f(r)+'。一步：'+f(1-r)+' + 0.2 × 9 + '+b+' × 1 = 2.6。两步：1 + '+f(r)+' × 1.6 = '+f(H[1])+'；八步：'+f(H[7])+'。';
}
for(const [id,fn] of [['a',arch],['alpha',moments],['beta',memory]]){const update=()=>fn(Number($(id).value));$(id).addEventListener('input',update);update();}

