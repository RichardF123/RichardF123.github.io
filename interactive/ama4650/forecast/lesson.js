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
const levels=[6.63,6.20],psi=[1,1.561];
for(let h=1;h<=3;h++)levels.push(.486+1.561*levels.at(-1)-.656*levels.at(-2));
psi.push(1.561*psi[1]-.656);
function point(h){const a=h,b=h-1;
  const term=k=>(k<=1?'实测':'预测')+' X'+(120+k)+' = '+levels[k].toFixed(4);
  $('point-result').textContent='目标是第 '+(121+h)+' 期。u 取'+term(a)+'；v 取'+term(b)+'。代入 0.486 + 1.561u − 0.656v，得到 '+levels[h+1].toFixed(4)+'。';
}
function interval(h){const w=psi.slice(0,h),v=.1308*w.reduce((s,x)=>s+x*x,0),se=Math.sqrt(v),c=levels[h+1];$('band-result').textContent='权重平方和：'+w.map(x=>Number(x.toFixed(4))+'²').join(' + ')+'。乘 0.1308 得方差 '+v.toFixed(4)+'，开方得标准误 '+se.toFixed(4)+'。以 '+c.toFixed(4)+' 为中心，95% 预测区间为 ['+(c-1.96*se).toFixed(3)+', '+(c+1.96*se).toFixed(3)+']。';}
function integrated(h){const shock=Number($('shock').value);let x=4,y=.2-.5*shock;const path=[x];for(let j=1;j<=h;j++){x+=y;path.push(x);if(j<h)y*=.2;}
  $('shock-value').value=shock;$('delta-result').textContent='当前水平 4，上期 3。第一步增量 = 0.2 × (4 − 3) − 0.5 × ('+shock+')。目标期的增量为 '+y.toFixed(3)+'；加到上一步水平 '+path[h-1].toFixed(3)+'，得到 '+x.toFixed(3)+'。滑块取 1 对应例 6.7。';return path;}
function chart(id,h,path){
  const target=$(id+'-plot'),ink='#88453c',muted='#8e806c';
  const domain=id==='delta'?[2.8,5.2]:id==='band'?[3,7.5]:[5,7];
  const ticks=id==='delta'?[3,4,5]:id==='band'?[3,4,5,6,7]:[5,6,7];
  const xs=id==='lead'?[46,122,198,274,350]:id==='band'?[76,202,328]:[44,146,248,350];
  const y=v=>125-(v-domain[0])/(domain[1]-domain[0])*104;
  const line=(x,a,z,b,color,extra='')=>'<line x1="'+x+'" y1="'+a+'" x2="'+z+'" y2="'+b+'" stroke="'+color+'" '+extra+'/>';
  const label=(x,a,s)=>'<text x="'+x+'" y="'+a+'" text-anchor="middle">'+s+'</text>';
  const dot=(x,a,color)=>'<circle cx="'+x+'" cy="'+a+'" r="4" fill="'+color+'"/>';
  let g=ticks.map(v=>line(30,y(v),360,y(v),'#ddceb8')+label(14,y(v)+4,v)).join('');
  xs.forEach((x,j)=>g+=label(x,147,id==='lead'?120+j:id==='band'?(j+1)+'步':j?'t+'+j:'t'));
  if(id==='band'){let sum=0;psi.forEach((w,j)=>{sum+=w*w;const x=xs[j],c=levels[j+2],d=1.96*Math.sqrt(.1308*sum),color=j+1===h?ink:muted;
    g+=line(x,y(c-d),x,y(c+d),color,'stroke-width="'+(j+1===h?4:2)+'"')+line(x-7,y(c-d),x+7,y(c-d),color)+line(x-7,y(c+d),x+7,y(c+d),color)+dot(x,y(c),color);});}
  else{const values=id==='lead'?levels.slice(0,h+2):path;values.forEach((v,j)=>{const x=xs[j],py=y(v),color=id==='lead'&&j<2?muted:ink;
    if(j){const prev=y(values[j-1]);g+=id==='delta'?line(xs[j-1],prev,x,prev,muted)+line(x,prev,x,py,ink,'stroke-width="3"'):line(xs[j-1],prev,x,py,color,j>1?'stroke-dasharray="5 3"':'');}
    g+=dot(x,py,color);if(j===values.length-1)g+=label(x,py-8,v.toFixed(2));});}
  target.innerHTML=g;
}
for(const [id,fn] of [['lead',point],['band',interval],['delta',integrated]]){
  const buttons=[...$(id).querySelectorAll('button')];let h=id==='band'?2:1;
  function update(){buttons.forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.h===h)));chart(id,h,fn(h));}
  buttons.forEach(b=>b.onclick=()=>{h=+b.dataset.h;update()});if(id==='delta')$('shock').addEventListener('input',update);update();
}

