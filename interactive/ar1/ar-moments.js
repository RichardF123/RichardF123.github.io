(() => {
  'use strict';
  const $=id=>document.getElementById(id),M=window.ARModel;
  let current=null,exact=null,phase=0,selected=0,raf=null;
  const f=v=>String(Number((Math.abs(v)<1e-10?0:v).toFixed(5)));
  const math=(tex,target)=>window.katex.render(tex,target,{throwOnError:false,output:'htmlAndMathml'});
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=null;draw();});}
  function parameters(detail){window.dispatchEvent(new CustomEvent('ar1:moment-parameters',{detail}));}
  function setPhase(value){phase=Math.max(0,Math.min(2,value));update(current);}
  function update(s){
    const entering=current?.lesson!==2;current=s;
    $('variance-classroom').hidden=s.lesson!==2;if(s.lesson!==2)return;
    if(entering){phase=0;selected=0;}
    exact=M.discreteAR1({phi:s.phi,c:s.c,sigma:1},s.n);selected=Math.min(selected,exact.paths.length-1);
    const count=exact.paths.length,probability=count===1?'1':`1/${count}`;
    $('moment-phi').value=s.phi;$('moment-phi-value').textContent=f(s.phi);$('moment-c').value=s.c;$('moment-c-value').textContent=f(s.c);
    math(String.raw`X_0=0,\qquad X_i=${f(s.c)}+${s.phi<0?'('+f(s.phi)+')':f(s.phi)}X_{i-1}+Z_i`,$('moment-model'));
    $('moment-time-explanation').textContent=`现在固定看 t = ${s.n}：X${s.n} 是第 ${s.n} 步的随机变量。每一步有两种噪声选择，共有 2^${s.n} = ${count} 种等可能噪声组合；每一行的概率是 ${probability}。`+(s.n===1?'第一步中 φX₀ = 0，所以改变 φ 暂时不会改变结果；到第二步才会看出它的作用。':'不同噪声组合可能得到相同的结果；图中会把这些结果的概率合并。');
    document.querySelectorAll('[data-moment-time]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.momentTime)===s.n)));
    document.querySelectorAll('[data-moment-phase]').forEach(b=>Number(b.dataset.momentPhase)===phase?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'));
    $('moment-step-title').textContent=['第一步：列出全部可能结果及其概率','第二步：把这些结果按概率加权，得到均值','第三步：离均值的距离平方，再按概率加权'][phase];
    $('moment-step-explanation').textContent=[`每行是一种完整的噪声组合，不是随意抽出来的一次实验。按递推算出对应的 X${s.n}，下面已经列全，没有遗漏。`,`每行概率都是 ${probability}。把各行结果乘概率后相加；在这个等概率例子中，也等于把结果相加后除以 ${count}。`,`先从每个结果减去同一个均值 m${s.n} = ${f(exact.mean)}。如果直接加带正负号的距离，它们会抵消；所以先平方，再乘各自概率。`][phase];
    const table=$('moment-outcomes');table.replaceChildren();const header=document.createElement('tr');
    const titles=['噪声组合','可能结果','概率',...(phase===2?['距均值','距离平方']:[])];
    titles.forEach(text=>{const th=document.createElement('th');th.scope='col';th.textContent=text;header.append(th);});table.append(header);
    exact.paths.forEach((p,i)=>{const row=document.createElement('tr');if(i===selected)row.className='selected';const noise=document.createElement('td'),button=document.createElement('button');button.type='button';button.textContent=p.noise.map(e=>e>0?'+1':'−1').join('，')||'无噪声';button.setAttribute('aria-label',`观察第 ${i+1} 种噪声组合`);button.setAttribute('aria-pressed',String(i===selected));button.addEventListener('click',()=>{selected=i;update(current);});noise.append(button);row.append(noise);[f(p.value),probability,...(phase===2?[f(p.deviation),f(p.squaredDeviation)]:[])].forEach(text=>{const td=document.createElement('td');td.textContent=text;row.append(td);});table.append(row);});
    $('moment-path-calculation').replaceChildren();const p=exact.paths[selected];p.noise.forEach((epsilon,i)=>{const eq=document.createElement('div');eq.className='intuition-equation';math(String.raw`X_{${i+1}}=${f(s.c)}+(${f(s.phi)})\times(${f(p.values[i])})+(${f(epsilon)})=${f(p.values[i+1])}`,eq);$('moment-path-calculation').append(eq);});
    $('moment-distribution-title').textContent=`X${s.n} 的全部可能取值与概率${phase>=1?'；虚线标出均值':''}${phase===2?'，横线标出选中结果离均值的距离':''}`;
    $('moment-mean-panel').hidden=phase<1;$('moment-variance-panel').hidden=phase<2;
    const sum=exact.paths.reduce((a,p)=>a+p.value,0),squares=exact.paths.reduce((a,p)=>a+p.squaredDeviation,0);
    const meanTerms=count<=4?exact.paths.map(p=>`(${f(p.value)})`).join('+'):f(sum);
    math(String.raw`m_{${s.n}}=\frac{${meanTerms}}{${count}}=${f(exact.mean)}`,$('moment-mean-worked'));
    $('moment-mean-explanation').textContent=`表中全部 ${count} 个结果之和为 ${f(sum)}，每行概率为 ${probability}，所以均值是 ${f(exact.mean)}。`+(!exact.distribution.some(d=>Math.abs(d.value-exact.mean)<1e-9)?'注意：均值本身不一定是一个可能发生的结果。':'');
    const squareTerms=count<=4?exact.paths.map(p=>`(${f(p.value)}-(${f(exact.mean)}))^2`).join('+'):f(squares);
    math(String.raw`v_{${s.n}}=\frac{${squareTerms}}{${count}}=${f(exact.variance)}`,$('moment-variance-worked'));
    $('moment-variance-explanation').textContent=`表中“距离平方”一列相加是 ${f(squares)}，再乘每行概率 ${probability}，得到方差 ${f(exact.variance)}。这是列举全部可能结果后按概率加权的精确方差，不是对某批实验结果做样本估计。`;
    $('moment-next-phase').disabled=phase===2;$('moment-next-phase').textContent=phase===0?'接下来：求均值':phase===1?'接下来：求方差':'三个步骤已看完';
    $('scene-explanation').textContent='解题顺序：确定初值或平稳条件 → 写均值、方差递推 → 代入有限步公式或解平稳方程。下方例题同时展示两种问法；折叠区里的枚举仅用于理解定义。';
    schedule();
  }
  function draw(){
    if(!current||current.lesson!==2||!exact)return;
    const canvas=$('moment-distribution'),r=canvas.getBoundingClientRect();if(!r.width)return;
    const d=Math.min(devicePixelRatio,2);canvas.width=r.width*d;canvas.height=r.height*d;const ctx=canvas.getContext('2d');ctx.scale(d,d);ctx.font='11px "Microsoft YaHei",sans-serif';
    const w=r.width,h=r.height,left=40,right=w-16,top=30,bottom=h-48;
    const lo=exact.distribution[0].value,hi=exact.distribution.at(-1).value,padding=Math.max(.5,(hi-lo)*.16),xmin=lo-padding,xmax=hi+padding;
    const x=v=>left+(v-xmin)/(xmax-xmin)*(right-left),y=p=>bottom-p*(bottom-top);
    ctx.fillStyle='#765335';ctx.textAlign='left';ctx.fillText('概率',left,13);
    [0,.5,1].forEach(p=>{ctx.strokeStyle='#d8c29d';ctx.beginPath();ctx.moveTo(left,y(p));ctx.lineTo(right,y(p));ctx.stroke();ctx.textAlign='right';ctx.fillText(String(p),left-7,y(p)+4);});
    const gaps=exact.distribution.slice(1).map((p,i)=>x(p.value)-x(exact.distribution[i].value));const bw=Math.max(2,Math.min(28,(gaps.length?Math.min(...gaps):60)*.65));
    const chosen=exact.paths[selected];exact.distribution.forEach((p,i)=>{ctx.fillStyle=Math.abs(p.value-chosen.value)<1e-9?'#8b493d':'#b5965d';ctx.fillRect(x(p.value)-bw/2,y(p.probability),bw,bottom-y(p.probability));ctx.fillStyle='#715235';ctx.textAlign='center';if(exact.distribution.length<=4||i%2===0){ctx.fillText(f(p.value),x(p.value),bottom+32);ctx.fillText(`${Math.round(p.probability*1000)/10}%`,x(p.value),y(p.probability)-7);}});
    if(phase>=1){ctx.strokeStyle='#6d362d';ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x(exact.mean),top);ctx.lineTo(x(exact.mean),bottom);ctx.stroke();ctx.setLineDash([]);ctx.textAlign='right';ctx.fillStyle='#743d32';ctx.fillText(`均值 m${current.n} = ${f(exact.mean)}`,right,13);}
    if(phase===2){ctx.strokeStyle='#6d362d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x(exact.mean),bottom+13);ctx.lineTo(x(chosen.value),bottom+13);ctx.stroke();}
    ctx.textAlign='center';ctx.fillText(`X${current.n} 的可能取值`,(left+right)/2,h-2);
    canvas.setAttribute('aria-label',`第 ${current.n} 个时刻的精确概率分布：`+exact.distribution.map(p=>`值 ${f(p.value)}，概率 ${p.probability}`).join('；'));
  }
  ['phi','c'].forEach(key=>$('moment-'+key).addEventListener('input',()=>parameters({[key]:Number($('moment-'+key).value)})));
  document.querySelectorAll('[data-moment-time]').forEach(b=>b.addEventListener('click',()=>parameters({t:Number(b.dataset.momentTime)})));
  document.querySelectorAll('[data-moment-phase]').forEach(b=>b.addEventListener('click',()=>setPhase(Number(b.dataset.momentPhase))));
  $('moment-next-phase').addEventListener('click',()=>setPhase(phase+1));
  $('variance-example').addEventListener('click',()=>{phase=0;selected=0;parameters({phi:.5,c:0,t:1});});
  new ResizeObserver(schedule).observe($('variance-classroom'));
  $('moment-enumeration').addEventListener('toggle',schedule);
  math(String.raw`m_4=0.5^4\times0+\frac{2(1-0.5^4)}{1-0.5}=\frac{15}{4}=3.75`,$('moment-exam-finite-mean'));
  math(String.raw`v_4=\frac{3(1-0.5^8)}{1-0.5^2}=\frac{255}{64}=3.984375`,$('moment-exam-finite-variance'));
  math(String.raw`\mu=\frac{2}{1-0.5}=4,\qquad\gamma(0)=\frac{3}{1-0.5^2}=4`,$('moment-exam-stationary'));
  math(String.raw`m_t=\phi^t m_0+c\sum_{j=0}^{t-1}\phi^j,\qquad v_t=\phi^{2t}v_0+\sigma^2\sum_{j=0}^{t-1}\phi^{2j}`,$('moment-exam-random-initial'));
  window.ARMoments=Object.freeze({update,snapshot:()=>({phase,selected,exact})});
})();
