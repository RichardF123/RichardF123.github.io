(() => {
  'use strict';
  const $=id=>document.getElementById(id),M=window.ARModel,C=window.ARCourse;
  const state={phi:.65,phi2:.2,sigma:1,c:0,n:32,seed:4650,lesson:0};
  let noise=M.innovations(state.seed),values=[],timer=null,frame=null,ar1Phi=.65;
  let completed=[];try{const saved=JSON.parse(localStorage.getItem('ama4650-ar-progress-v1'));if(Array.isArray(saved))completed=saved.filter(id=>C.lessons.some(l=>l.id===id));}catch(_){}
  const advanced=()=>state.lesson>=4;
  const horizon=()=>state.lesson===1?6:state.lesson===5?7:100;
  const params=()=>({...state,phi2:advanced()?state.phi2:0});
  const fmt=v=>v===null?'不适用':Math.abs(v)>=10000?v.toExponential(2):(Math.abs(v)<.0005?0:v).toFixed(3);
  const moments=()=>M.moments(state.phi,params().phi2,state.sigma,state.c);
  const variances=()=>M.finiteVariances(state.phi,params().phi2,state.sigma);
  function typeset(tex,target){window.katex.render(tex,target,{throwOnError:false,output:'htmlAndMathml'});}
  function prose(text,target){target.replaceChildren();text.split(/(σ²ε|σ ε)/).forEach(part=>{if(part==='σ²ε'||part==='σ ε'){const span=document.createElement('span');typeset(part==='σ²ε'?String.raw`\sigma_\varepsilon^2`:String.raw`\sigma_\varepsilon`,span);target.append(span);}else target.append(document.createTextNode(part));});}
  function snapshot(){return{...params(),order:advanced()?2:1,values:[...values],innovations:[...noise],sampleACF:M.acf(values.slice(0,state.n+1)),finiteVariances:variances(),moments:moments()};}
  window.AR1Demo=Object.freeze({snapshot});

  function progress(){
    const count=C.groups.filter(g=>g[2].every(i=>completed.includes(C.lessons[i].id))).length;
    $('unit-progress').textContent=`已完成 ${count} / 4 课`;$('course-progress').value=count;
    document.querySelectorAll('[data-lesson]').forEach(b=>b.classList.toggle('is-complete',completed.includes(C.lessons[Number(b.dataset.lesson)].id)));
  }
  function code(){
    const name=advanced()?'phi1':'phi';
    $('code-example').textContent=`import numpy as np\n\n${name} = ${state.phi}\nphi2 = ${params().phi2}\nsigma_epsilon = ${state.sigma}\nc = ${state.c}\nrng = np.random.default_rng(${state.seed})\ninnovations = rng.normal(0, sigma_epsilon, size=100)\nx = np.zeros(101)  # x[0] = X_0\nfor t in range(1, 101):\n    lag2 = x[t - 2] if t >= 2 else 0.0\n    x[t] = c + ${name} * x[t - 1] + phi2 * lag2 + innovations[t - 1]\n\n# 本节核心计算\n`+C.lessons[state.lesson].code;
  }
  function update(){
    values=M.simulate(params(),noise);const m=moments(),l=C.lessons[state.lesson];
    ['phi','sigma'].forEach(id=>{$(id).value=state[id];$(id+'-value').textContent=state[id].toFixed(id==='phi'?2:1);});
    $('phi2').value=state.phi2;$('phi2-value').textContent=state.phi2.toFixed(2);$('constant').value=state.c;$('constant-value').textContent=state.c.toFixed(1);
    $('time').max=horizon();$('time').value=state.n;$('time-value').textContent=`${state.lesson===1?'h':state.lesson===5?'k':'t'} = ${state.n}`;
    $('stability').classList.toggle('unstable',!m.stable);$('stability').textContent=advanced()?(m.stable?'AR(2) · 因果平稳参数':'AR(2) · 不满足根条件'):(m.stable?'|φ| < 1 · 初始影响消退':Math.abs(state.phi)===1?'|φ| = 1 · 单位根边界':'|φ| > 1 · 递推放大');
    $('mean').textContent=fmt(m.mean);$('variance').textContent=fmt(m.variance);$('current').textContent=fmt(values[state.n]);$('metric-label').textContent=`当前观测 X（t = ${state.n}）`;
    $('step').disabled=state.n>=horizon();$('phi-symbol').innerHTML=advanced()?'φ<sub>1</sub>':'φ';
    $('ar2-controls').hidden=!advanced();
    $('parameter-hint').textContent=advanced()?`AR(2)：φ₁ = ${state.phi.toFixed(2)}，φ₂ = ${state.phi2.toFixed(2)}；须联合检查根条件。`:state.phi===0?'过去的影响在下一步归零。':`每一步${Math.abs(state.phi)>1?'放大到':'保留'} ${Math.round(Math.abs(state.phi)*100)}%${state.phi<0?'，并反向':''}。`;
    document.querySelectorAll('[data-phi]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.phi)===state.phi)));
    const p=state.n?values[state.n-1]:0,p2=state.n>1?values[state.n-2]:0,eps=state.n?state.sigma*noise[state.n-1]:0;
    $('calculation-label').textContent=state.n?'当前一步':'初始状态';
    $('calculation').innerHTML=state.n?`X<sub>${state.n}</sub> = ${fmt(state.c)} + <em>${fmt(state.phi)} × (${fmt(p)})${advanced()?` + ${fmt(state.phi2)} × (${fmt(p2)})`:''}</em> + <b>(${fmt(eps)})</b> = ${fmt(values[state.n])}`:'固定初始状态为零，尚未加入冲击。';
    // Accessible 2D fallback if WebGL is unavailable.
    $('previous-value').textContent=state.n?fmt(p):'—';$('memory-caption').textContent=`× ${state.phi.toFixed(2)}`;$('memory-value').textContent=fmt(state.phi*p);$('shock-value').textContent=fmt(eps);$('result-value').textContent=fmt(values[state.n]);
    $('previous-symbol').innerHTML=`X<sub>${Math.max(0,state.n-1)}</sub>`;$('result-symbol').innerHTML=`X<sub>${state.n}</sub>`;$('drift-value').textContent=`c = ${state.c.toFixed(2)}`;$('shock-time').textContent=state.n;
    const summaries=[
      `上一刻留下 ${fmt(state.phi*p)}，新冲击为 ${fmt(eps)}，加上 c = ${fmt(state.c)}，得到 ${fmt(values[state.n])}。`,
      `固定 s，经过 h = ${state.n} 步，Δₛ₊ₕ = ${fmt(state.phi**state.n)}。方块高度是影响的绝对值，酒红色表示负号。`,
      `t = ${state.n} 时，固定初始化的理论方差为 ${fmt(variances()[state.n])}；平稳解方差 γ(0) ${m.stable?'为 '+fmt(m.variance):'在当前因果设定下不适用'}。`,
      m.stable&&state.sigma>0?`理论 ρ(1) = ${fmt(m.rho[1])}，ρ(2) = ${fmt(m.rho[2])}。暗金色样本估计会有波动。`:'当前参数不绘制因果平稳理论 ACF。',
      m.stable&&state.sigma>0?`由总体 ρ(1) = ${fmt(m.rho[1])}、ρ(2) = ${fmt(m.rho[2])}，解得 φ₁ = ${fmt(m.yw[0])}、φ₂ = ${fmt(m.yw[1])}。`:'当前参数不显示总体 Yule–Walker 数值解；递推路径仍可观察。',
      m.stable&&state.sigma>0?`总体 PACF(1) = ${fmt(m.pacf[1])}，PACF(2) = ${fmt(m.pacf[2])}；从 k = 3 开始为零。`:'当前参数的总体 PACF 未定义，不显示理论截尾图。'
    ];
    $('scene-explanation').textContent=summaries[state.lesson];
    $('yw-worked').hidden=state.lesson!==4;
    if(state.lesson===4){if(m.stable&&state.sigma>0)typeset(String.raw`\begin{pmatrix}1&${m.rho[1].toFixed(3)}\\${m.rho[1].toFixed(3)}&1\end{pmatrix}\begin{pmatrix}\phi_1\\\phi_2\end{pmatrix}=\begin{pmatrix}${m.rho[1].toFixed(3)}\\${m.rho[2].toFixed(3)}\end{pmatrix}\ \Rightarrow\ \begin{pmatrix}${m.yw[0].toFixed(3)}\\${m.yw[1].toFixed(3)}\end{pmatrix}`,$('yw-numbers'));else $('yw-numbers').textContent='当前参数下总体相关未定义，不能代入此方程。';}
    document.querySelector('.formula-strip').classList.toggle('is-invalid',[3,4,5].includes(state.lesson)&&(!m.stable||state.sigma===0));
    code();$('code-example').prepend('# 依赖 numpy；样本 PACF 示例额外依赖 statsmodels。\n# NumPy 与页面使用不同随机数发生器，样本不逐点对齐。\n');schedule();window.dispatchEvent(new Event('ar1:change'));
  }
  function surface(id){const canvas=$(id),r=canvas.getBoundingClientRect();if(r.width<1||r.height<1)return null;const d=Math.min(devicePixelRatio,2);canvas.width=r.width*d;canvas.height=r.height*d;const ctx=canvas.getContext('2d');ctx.scale(d,d);ctx.font='11px "Microsoft YaHei",sans-serif';return{ctx,w:r.width,h:r.height};}
  function axes(s,min,max,maxX,label){const{ctx,w,h}=s,b={left:Math.abs(max)>=10000?58:40,right:w-12,top:20,bottom:h-27};const x=t=>b.left+t/maxX*(b.right-b.left),y=v=>b.bottom-(v-min)/(max-min)*(b.bottom-b.top);ctx.textAlign='right';for(let i=0;i<=4;i++){const v=min+(max-min)*i/4;ctx.strokeStyle='#dfceb0';ctx.beginPath();ctx.moveTo(b.left,y(v));ctx.lineTo(b.right,y(v));ctx.stroke();ctx.fillStyle='#765e42';ctx.fillText(Math.abs(v)>=10000?v.toExponential(0):v.toFixed(max-min>20?0:1),b.left-7,y(v)+3);}ctx.textAlign='center';for(let i=0;i<=4;i++)ctx.fillText(Math.round(maxX*i/4),x(maxX*i/4),h-7);ctx.textAlign='left';ctx.fillText(label,b.left,11);return{x,y,b};}
  function line(s,data,a,color){s.ctx.strokeStyle=color;s.ctx.lineWidth=2;s.ctx.beginPath();data.forEach((v,k)=>k?s.ctx.lineTo(a.x(k),a.y(v)):s.ctx.moveTo(a.x(k),a.y(v)));s.ctx.stroke();}
  function draw(){const seen=values.slice(0,state.n+1),s=surface('series'),m=moments();if(s){const bound=Math.max(4,...seen.map(Math.abs))*1.15,a=axes(s,-bound,bound,Math.max(20,state.n),'X');line(s,seen,a,'#806238');s.ctx.fillStyle='#7f3f43';s.ctx.beginPath();s.ctx.arc(a.x(state.n),a.y(seen.at(-1)),3.5,0,2*Math.PI);s.ctx.fill();}
    const r=surface('secondary');$('secondary-title').textContent=state.lesson===1?'单位冲击响应 φʰ':'自相关 ACF';
    const valid=m.stable&&state.sigma>0,sample=M.acf(seen);$('secondary-note').textContent=!valid?'当前参数下，因果平稳理论 ACF 未定义。'+(!sample.length?'样本方差为 0，样本 ACF 也未定义。':'暗金色仅描述有限样本。'):!sample.length?'样本方差为 0，样本 ACF 未定义。':'酒红色为总体 ρ(k)，暗金色为样本 ρ̂(k)。';
    if(r){const a=axes(r,-1.12,1.12,12,'ρ(k)');if(valid)line(r,m.rho,a,'#7f3f43');sample.forEach((v,k)=>{r.ctx.strokeStyle='#806238';r.ctx.beginPath();r.ctx.moveTo(a.x(k),a.y(0));r.ctx.lineTo(a.x(k),a.y(v));r.ctx.stroke();});}
  }
  function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=null;draw();});}
  function stop(){if(timer)clearInterval(timer);timer=null;$('play').setAttribute('aria-pressed','false');$('play').setAttribute('aria-label','播放');$('play').querySelector('img').src='./icons/play.svg';$('play-label').textContent='播放递推';}
  function lesson(index,write=true){
    stop();const wasAdvanced=advanced();if(index>=4&&!wasAdvanced){ar1Phi=state.phi;state.phi=.5;state.phi2=.2;}if(index<4&&wasAdvanced)state.phi=ar1Phi;
    state.lesson=index;state.n=index===1?0:index===5?7:32;
    const l=C.lessons[index];$('lesson-index').textContent=`06.${l.group+1} / 场景 ${index+1} · 共 6 个`;$('lesson-title').textContent=l.title;$('guide-title').textContent=l.short;$('scene-title').textContent=l.scene;$('lesson-body').textContent=l.body;$('takeaway').textContent=l.takeaway;
    $('lesson-progress').textContent=`${index+1} / 6`;$('previous').disabled=index===0;$('next').disabled=index===5;
    document.querySelectorAll('[data-lesson]').forEach(b=>Number(b.dataset.lesson)===index?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'));
    typeset(l.core,$('core-formula'));$('formula-limit').hidden=!l.limit;if(l.limit)typeset(l.limit,$('formula-limit'));$('formula-condition').textContent=l.condition;
    $('derivation-title').textContent=l.derivationTitle;$('derivation-body').replaceChildren();l.steps.forEach(([text,tex])=>{const p=document.createElement('p');p.textContent=text;const eq=document.createElement('div');eq.className='math-line';typeset(tex,eq);$('derivation-body').append(p,eq);});$('lesson-detail').textContent=l.boundary;
    $('process-diagram').hidden=index!==0;document.querySelector('.calculation').hidden=![0,4].includes(index);
    $('question').textContent=l.question;$('feedback').textContent='';$('feedback').className='';$('choices').replaceChildren();l.choices.forEach((text,i)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{Array.from($('choices').children).forEach(item=>item.setAttribute('aria-pressed',String(item===b)));$('feedback').textContent=(i===l.correct?'答对了。':'再想一下。')+l.feedback;$('feedback').className=i===l.correct?'correct':'incorrect';if(i===l.correct){if(!completed.includes(l.id))completed.push(l.id);try{localStorage.setItem('ama4650-ar-progress-v1',JSON.stringify(completed));}catch(_){}progress();}});$('choices').append(b);});
    [['lesson-body',l.body],['takeaway',l.takeaway],['formula-condition',l.condition],['lesson-detail',l.boundary],['question',l.question]].forEach(([id,text])=>prose(text,$(id)));
    Array.from($('choices').children).forEach((b,i)=>prose(l.choices[i],b));
    if(write){const url=new URL(location.href);url.hash=l.id;history.pushState(null,'',url.href);}progress();update();
  }
  const outline=$('course-outline');C.units.forEach(([id,title,count])=>{const row=document.createElement('div');row.className='outline-row';const label=document.createElement('span');label.textContent=`${id} ${title} · ${count} 课`;const status=document.createElement('small');status.textContent=id==='06'?'本单元':'待制作';row.append(label,status);outline.append(row);});
  $('choices').addEventListener('click',()=>prose($('feedback').textContent,$('feedback')));
  ['phi','sigma','constant','phi2'].forEach(id=>$(id).addEventListener('input',()=>{stop();state[id==='constant'?'c':id]=Number($(id).value);update();}));
  document.querySelectorAll('[data-phi]').forEach(b=>b.addEventListener('click',()=>{stop();state.phi=Number(b.dataset.phi);update();}));
  document.querySelectorAll('[data-lesson]').forEach(b=>b.addEventListener('click',()=>lesson(Number(b.dataset.lesson))));
  $('previous').addEventListener('click',()=>lesson(Math.max(0,state.lesson-1)));$('next').addEventListener('click',()=>lesson(Math.min(5,state.lesson+1)));
  $('step').addEventListener('click',()=>{stop();state.n=Math.min(horizon(),state.n+1);update();});$('reset').addEventListener('click',()=>{stop();state.n=0;update();});$('time').addEventListener('input',()=>{stop();state.n=Number($('time').value);update();});$('resample').addEventListener('click',()=>{stop();noise=M.innovations(++state.seed);update();});
  $('play').addEventListener('click',()=>{if(timer){stop();return;}if(state.n>=horizon())state.n=0;$('play').setAttribute('aria-pressed','true');$('play').setAttribute('aria-label','暂停');$('play').querySelector('img').src='./icons/pause.svg';$('play-label').textContent='暂停';timer=setInterval(()=>{state.n=Math.min(horizon(),state.n+1);update();if(state.n===horizon())stop();},950);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();}).observe(document.querySelector('.experiment'));new ResizeObserver(schedule).observe(document.querySelector('.lesson-page'));
  function fromHash(){const index=C.lessons.findIndex(l=>l.id===location.hash.slice(1));lesson(index<0?0:index,false);}
  window.addEventListener('popstate',fromHash);fromHash();
})();
