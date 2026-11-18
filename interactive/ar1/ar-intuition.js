(() => {
  'use strict';
  const $=id=>document.getElementById(id),M=window.ARModel;
  let current=null,lag=1,selected=0,theory=false,raf=null,pairData=null,experiment=null,terms=[];
  const f=v=>Math.abs(v)>=10000?v.toExponential(2):(Math.abs(v)<1e-9?0:v).toFixed(4);
  const math=(tex,target)=>window.katex.render(tex,target,{throwOnError:false,output:'htmlAndMathml'});
  const sampleFigure=document.querySelector('.acf-figure'),sampleHome=document.createComment('sample ACF position');
  sampleFigure.before(sampleHome);
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=null;draw();});}
  function update(s){
    const previous=current?.lesson;current=s;
    $('variance-classroom').hidden=s.lesson!==2;$('acf-classroom').hidden=s.lesson!==3;
    if(s.lesson===3)$('acf-sample-plot').append(sampleFigure);else sampleHome.after(sampleFigure);
    if(s.lesson===3){
      if(previous!==3){lag=1;selected=0;theory=false;$('acf-theory').checked=false;}
      const seen=s.values.slice(0,s.n+1);lag=Math.min(lag,Math.max(1,seen.length-1));pairData=M.pairs(seen,lag);selected=Math.min(selected,Math.max(0,pairData.items.length-1));
      $('acf-population-phi').value=s.phi;$('acf-population-phi-value').textContent=s.phi.toFixed(2);
      $('acf-sample-size').value=seen.length;$('acf-sample-size-value').textContent=seen.length;
      document.querySelectorAll('[data-acf-phi]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.acfPhi)===s.phi)));
      const valid=s.moments.stable&&s.sigma>0;
      if(valid){
        math(String.raw`\begin{aligned}\rho(0)&=1,&\rho(1)&=${Number(f(s.phi))}\\\rho(2)&=${Number(f(s.phi**2))},&\rho(3)&=${Number(f(s.phi**3))}\end{aligned}`,$('acf-population-values'));
        $('acf-population-reading').textContent=s.phi===0?'φ = 0：只有 k = 0 的自相关为 1；不同期之间的总体线性相关均为零。':s.phi<0?`φ = ${s.phi.toFixed(2)}：相邻两期倾向反向偏离均值；间隔两步又倾向同向，故柱子正负交替。每多隔一步，相关的绝对值再乘 ${Math.abs(s.phi).toFixed(2)}。`:`φ = ${s.phi.toFixed(2)}：相隔一两步的值倾向同向偏离均值；每多隔一步，相关再乘 ${s.phi.toFixed(2)}。比较 0.5 与 0.9，可以看到后者的相关保留得更久。`;
      }else{$('acf-population-values').textContent='当前参数下总体 ACF 未定义。';$('acf-population-reading').textContent=s.sigma===0?'创新方差为零，因果平稳解为常数，相关系数的分母为零。':'|φ| ≥ 1，不能使用本节的因果平稳 AR(1) 公式。';}
      $('scene-explanation').textContent=valid?'主图的每根柱是一个间隔的总体相关，不是某时刻的观测值。下面先推导 φᵏ，再做数值例题；样本估计在折叠区单独计算。':'当前参数不满足非退化因果平稳条件，主图不显示总体 ACF。';
      $('acf-lag').max=Math.max(1,Math.min(12,seen.length-1));$('acf-lag').value=lag;$('acf-lag').disabled=seen.length<2;$('acf-lag-value').textContent=lag;
      $('acf-pair-description').textContent=`当前有 n = ${seen.length} 个观测 x₀ 到 x${seen.length-1}。k = ${lag}：把 xₜ 和 xₜ₋${lag} 配对，从 t = ${lag} 到 ${seen.length-1}，共有 ${seen.length-lag} 对。全样本均值 x̄ = ${f(pairData.mean)}；每个数都减去这同一个均值。`;
      const visible=pairData.items.slice(0,8),table=$('lag-pairs');table.replaceChildren();
      [['时刻 t',p=>p.t],['当前 xₜ',p=>f(p.current)],['过去 xₜ₋ₖ',p=>f(p.past)],['偏离的乘积',p=>f(p.product)]].forEach(([title,value],rowIndex)=>{
        const row=document.createElement('tr'),head=document.createElement('th');head.scope='row';head.textContent=title;row.append(head);
        visible.forEach((p,i)=>{const cell=document.createElement('td');if(i===selected)cell.classList.add('selected');if(rowIndex===3&&p.product<0)cell.classList.add('negative');const b=document.createElement('button');b.type='button';b.textContent=value(p);b.setAttribute('aria-label',`观察第 ${i+1} 对：t = ${p.t}`);b.setAttribute('aria-pressed',String(i===selected));b.addEventListener('click',()=>{selected=i;update(current);});cell.append(b);row.append(cell);});table.append(row);
      });
      $('acf-pair-count').textContent=`这里显示前 ${visible.length} 对，共 ${pairData.items.length} 对；下面分子使用全部配对，分母使用全部 ${seen.length} 个观测。`;
      const p=pairData.items[selected];$('acf-selected-pair').textContent=p?`选中 t = ${p.t}：(${f(p.current)} − ${f(pairData.mean)}) × (${f(p.past)} − ${f(pairData.mean)}) = ${f(p.product)}，${p.product>0?'两者同向偏离均值，贡献为正。':p.product<0?'两者反向偏离均值，贡献为负。':'这一对乘积为零。'}`:'当前还没有能配对的观测。';
      if(pairData.acf===null){$('acf-worked').textContent='分母为零或没有配对，当前样本 ACF 未定义。';$('acf-result').textContent='常数样本不能用相关系数描述。';}
      else{math(String.raw`\widehat\rho(${lag})=\frac{${f(pairData.numerator)}}{${f(pairData.denominator)}}=${f(pairData.acf)}`,$('acf-worked'));$('acf-result').textContent=`这就是下图 k = ${lag} 那根暗金柱的高度：${f(pairData.acf)}。${seen.length<12?'当前样本很短，不能据此判断总体规律。':''}`;}
      $('formula-limit').hidden=false;
    }
    schedule();
  }
  function surface(id){const c=$(id),r=c.getBoundingClientRect();if(!r.width)return null;const d=Math.min(devicePixelRatio,2);c.width=r.width*d;c.height=r.height*d;const ctx=c.getContext('2d');ctx.scale(d,d);ctx.font='11px "Microsoft YaHei",sans-serif';return{ctx,w:r.width,h:r.height};}
  function draw(){
    if(!current)return;
    if(current.lesson===3){const s=surface('acf-population-plot');if(s){const{ctx,w,h}=s,left=36,right=w-14,top=25,bottom=h-38,x=k=>left+k/6*(right-left),y=v=>top+(1-v)/2*(bottom-top);ctx.fillStyle='#65472d';ctx.textAlign='left';ctx.fillText('总体相关 ρ(k)',left,13);[-1,-.5,0,.5,1].forEach(v=>{ctx.strokeStyle=v===0?'#98754a':'#d8c4a0';ctx.beginPath();ctx.moveTo(left,y(v));ctx.lineTo(right,y(v));ctx.stroke();ctx.fillStyle='#65472d';ctx.textAlign='right';ctx.fillText(String(v),left-6,y(v)+4);});const valid=current.moments.stable&&current.sigma>0;for(let k=0;k<=6;k++){ctx.fillStyle='#65472d';ctx.textAlign='center';ctx.fillText(String(k),x(k),h-22);if(valid){const v=current.phi**k;ctx.strokeStyle=v<0?'#914d43':'#96733c';ctx.lineWidth=Math.min(16,(right-left)/22);ctx.beginPath();ctx.moveTo(x(k),y(0));ctx.lineTo(x(k),y(v));ctx.stroke();ctx.fillStyle='#593921';ctx.beginPath();ctx.arc(x(k),y(v),3,0,Math.PI*2);ctx.fill();}}ctx.textAlign='center';ctx.fillText('间隔步数 k（不是时刻 t）',(left+right)/2,h-3);$('acf-population-plot').setAttribute('aria-label',valid?`总体 ACF，横轴间隔 k 从 0 到 6：${Array.from({length:7},(_,k)=>`rho(${k})=${f(current.phi**k)}`).join('；')}`:'当前参数下总体 ACF 未定义，不绘制理论柱。');}}
    if(current.lesson===3&&pairData){const s=surface('lag-scatter');if(!s)return;const{ctx,w,h}=s,left=43,right=w-18,top=25,bottom=h-40,bound=Math.max(1,...pairData.items.flatMap(p=>[Math.abs(p.a),Math.abs(p.b)]))*1.2;const x=v=>left+(v+bound)/(2*bound)*(right-left),y=v=>bottom-(v+bound)/(2*bound)*(bottom-top);
      ctx.fillStyle='#eee1bf';ctx.fillRect(x(0),top,right-x(0),y(0)-top);ctx.fillRect(left,y(0),x(0)-left,bottom-y(0));ctx.fillStyle='#f1dfd2';ctx.fillRect(left,top,x(0)-left,y(0)-top);ctx.fillRect(x(0),y(0),right-x(0),bottom-y(0));ctx.strokeStyle='#a98b62';ctx.beginPath();ctx.moveTo(x(0),top);ctx.lineTo(x(0),bottom);ctx.moveTo(left,y(0));ctx.lineTo(right,y(0));ctx.stroke();ctx.fillStyle='#765536';ctx.textAlign='left';ctx.fillText('当前值 − 样本均值',left,12);ctx.textAlign='center';ctx.fillText('过去值 − 样本均值',w/2,h-3);
      [-1,0,1].forEach(sign=>{const v=sign*bound*.75;ctx.fillText(v.toFixed(1),x(v),h-23);});
      pairData.items.forEach((p,i)=>{ctx.globalAlpha=i===selected?1:.55;ctx.fillStyle=p.product<0?'#97534a':'#886328';ctx.beginPath();ctx.arc(x(p.b),y(p.a),i===selected?6:3,0,2*Math.PI);ctx.fill();if(i===selected){ctx.strokeStyle='#412e1c';ctx.lineWidth=1.5;ctx.stroke();}});ctx.globalAlpha=1;
      $('lag-scatter').setAttribute('aria-label',`滞后 k = ${lag} 的 ${pairData.items.length} 对中心化观测；右上与左下象限的乘积为正，另两个象限为负。`);
    }
  }
  $('acf-lag').addEventListener('input',()=>{lag=Number($('acf-lag').value);selected=0;update(current);window.dispatchEvent(new Event('ar1:intuition'));});
  $('acf-theory').addEventListener('change',()=>{theory=$('acf-theory').checked;update(current);window.dispatchEvent(new Event('ar1:intuition'));});
  function setParameter(id,value){const input=$(id);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}
  $('acf-population-phi').addEventListener('input',e=>setParameter('phi',e.target.value));
  document.querySelectorAll('[data-acf-phi]').forEach(b=>b.addEventListener('click',()=>setParameter('phi',b.dataset.acfPhi)));
  $('acf-sample-size').addEventListener('input',e=>setParameter('time',Number(e.target.value)-1));
  $('acf-resample').addEventListener('click',()=>$('resample').click());
  $('acf-sample-details').addEventListener('toggle',()=>{schedule();window.dispatchEvent(new Event('ar1:intuition'));});
  math(String.raw`\widehat\rho(k)=\frac{\sum_{t=k}^{n-1}(x_t-\bar x)(x_{t-k}-\bar x)}{\sum_{t=0}^{n-1}(x_t-\bar x)^2}`,$('acf-sample-formula'));
  math(String.raw`\mu=\frac{2}{1-(-0.5)}=\frac43,\qquad\gamma(0)=\frac{3}{1-(-0.5)^2}=4`,$('acf-exam-moments'));
  math(String.raw`\begin{aligned}\rho(2)&=(-0.5)^2=0.25\\\gamma(2)&=\rho(2)\gamma(0)=0.25\times4=1\end{aligned}`,$('acf-exam-correlation'));
  new ResizeObserver(schedule).observe($('variance-classroom'));new ResizeObserver(schedule).observe($('acf-classroom'));
  window.ARIntuition=Object.freeze({update,theoryVisible:()=>theory,selectedLag:()=>lag,snapshot:()=>({lag,selected,theory,pairData,experiment,terms})});
})();
