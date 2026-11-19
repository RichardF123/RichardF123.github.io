const $=id=>document.getElementById(id);
document.querySelectorAll('article code').forEach(el=>katex.render(el.textContent,el,{throwOnError:true}));
function identify(){const k=Number($('lag').value);$('lag-result').textContent=['','一阶：ACF 和 PACF 都是 0.841；还没有中间期需要扣除。','二阶：ACF = 0.683；PACF = (0.683 − 0.841²)/(1 − 0.841²) ≈ −0.083。加入昨天以后，前天只剩很弱的额外解释力。','三阶：课件报告 ACF = 0.584，PACF = 0.111。后者仍在参考带内，与优先尝试 AR(1) 相容。'][k];}
function estimate(){const phi=Number($('phi').value),x=[0,2,1,2],e=x.slice(1).map((v,i)=>v-phi*x[i]),s=e.reduce((a,v)=>a+v*v,0);$('fit').textContent='三期残差依次为 '+e.map(v=>v.toFixed(1)).join('、')+'；平方和为 '+s.toFixed(2)+'。'+(phi===0.8?'此处达到最小值，创新方差估计为 '+(s/3).toFixed(2)+'。':'试着与 φ = 0.8 的平方和比较。');}
function diagnose(){const terms=[Number($('res').value),.08,-.04].map((v,i)=>10200*v*v/(99-i)),q=terms.reduce((a,v)=>a+v,0);$('lb').textContent='三阶分别贡献 '+terms.map(v=>v.toFixed(3)).join('、')+'；Q = '+q.toFixed(3)+(q>5.991?' > 5.991，拒绝原假设，回头检查模型。':' < 5.991，不拒绝原假设。');}
for(const [id,fn] of [['lag',identify],['phi',estimate],['res',diagnose]]){$(id).addEventListener('change',fn);fn();}

const chapterButtons = [...document.querySelectorAll('.chapters [data-section]')];
function showChapter() {
  const selected = chapterButtons.find(b => '#' + b.dataset.section === location.hash) || chapterButtons[0];
  document.querySelectorAll('[data-guide]').forEach(el => { el.hidden = el.dataset.guide !== selected.dataset.section; });
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
