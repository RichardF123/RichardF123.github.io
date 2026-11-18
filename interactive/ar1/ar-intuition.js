(() => {
  'use strict';
  const $=id=>document.getElementById(id),M=window.ARModel;
  let current=null,lag=1,selected=0,theory=false,raf=null,pairData=null,experiment=null,terms=[];
  const f=v=>Math.abs(v)>=10000?v.toExponential(2):(Math.abs(v)<1e-9?0:v).toFixed(4);
  const math=(tex,target)=>window.katex.render(tex,target,{throwOnError:false,output:'htmlAndMathml'});
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=null;draw();});}
  function update(s){
    const previous=current?.lesson;current=s;
    $('variance-classroom').hidden=s.lesson!==2;$('acf-classroom').hidden=s.lesson!==3;
    if(s.lesson===2){
      experiment=M.ensemble({phi:s.phi,phi2:0,sigma:s.sigma,c:s.c},s.seed,s.n,80);terms=M.varianceTerms(s.phi,s.sigma,s.n);
      $('variance-experiment').textContent=`每次都从 X₀ = 0 重新开始，用不同噪声运行到 t = ${s.n}。下图每个点是一次实验在这个时刻的结果。`;
      $('ensemble-mean').textContent=f(experiment.mean);$('ensemble-var').textContent=f(experiment.sampleVariance);$('ensemble-theory').textContent=f(s.finiteVariances[s.n]);
      const expansion=s.n===0?'0':s.n<=5?Array.from({length:s.n},(_,j)=>`(${(s.phi**j).toFixed(3)})^2`).join('+'):String.raw`1+\phi^2+\cdots+\phi^{${2*(s.n-1)}}`;
      math(String.raw`\operatorname{Var}(X_{${s.n}})=\underbrace{(${expansion})}_{\text{权重先平方}}\times ${s.sigma.toFixed(2)}^2=${f(s.finiteVariances[s.n])}`,$('variance-worked'));
      $('variance-contributions').textContent=s.n===0?'尚未加入任何随机冲击，方差是 0。':terms.map(item=>`${item.tail?'更早各项合计':`j = ${item.j}：权重 ${f(item.weight)}，平方后`}${item.tail?'':'乘冲击方差'}贡献 ${f(item.contribution)}`).join('；')+'。这些贡献之和等于模型理论方差；80 次实验的样本方差只是估计，不必与它完全相等。';
    }
    if(s.lesson===3){
      if(previous!==3){lag=1;selected=0;theory=false;$('acf-theory').checked=false;}
      const seen=s.values.slice(0,s.n+1);lag=Math.min(lag,Math.max(1,seen.length-1));pairData=M.pairs(seen,lag);selected=Math.min(selected,Math.max(0,pairData.items.length-1));
      $('acf-lag').max=Math.max(1,Math.min(12,seen.length-1));$('acf-lag').value=lag;$('acf-lag').disabled=seen.length<2;$('acf-lag-value').textContent=lag;
      $('acf-pair-description').textContent=`k = ${lag}：把 xₜ 和 xₜ₋${lag} 配对。全样本均值 x̄ = ${f(pairData.mean)}；先从每个数减去同一个均值，再看偏离方向。`;
      const visible=pairData.items.slice(0,8),table=$('lag-pairs');table.replaceChildren();
      [['时刻 t',p=>p.t],['当前 xₜ',p=>f(p.current)],['过去 xₜ₋ₖ',p=>f(p.past)],['偏离的乘积',p=>f(p.product)]].forEach(([title,value],rowIndex)=>{
        const row=document.createElement('tr'),head=document.createElement('th');head.scope='row';head.textContent=title;row.append(head);
        visible.forEach((p,i)=>{const cell=document.createElement('td');if(i===selected)cell.classList.add('selected');if(rowIndex===3&&p.product<0)cell.classList.add('negative');const b=document.createElement('button');b.type='button';b.textContent=value(p);b.setAttribute('aria-label',`观察第 ${i+1} 对：t = ${p.t}`);b.setAttribute('aria-pressed',String(i===selected));b.addEventListener('click',()=>{selected=i;update(current);});cell.append(b);row.append(cell);});table.append(row);
      });
      $('acf-pair-count').textContent=`这里显示前 ${visible.length} 对，共 ${pairData.items.length} 对；下面分子使用全部配对，分母使用全部 ${seen.length} 个观测。`;
      const p=pairData.items[selected];$('acf-selected-pair').textContent=p?`选中 t = ${p.t}：(${f(p.current)} − ${f(pairData.mean)}) × (${f(p.past)} − ${f(pairData.mean)}) = ${f(p.product)}，${p.product>0?'两者同向偏离均值，贡献为正。':p.product<0?'两者反向偏离均值，贡献为负。':'这一对乘积为零。'}`:'当前还没有能配对的观测。';
      if(pairData.acf===null){$('acf-worked').textContent='分母为零或没有配对，当前样本 ACF 未定义。';$('acf-result').textContent='常数样本不能用相关系数描述。';}
      else{math(String.raw`\widehat\rho(${lag})=\frac{${f(pairData.numerator)}}{${f(pairData.denominator)}}=${f(pairData.acf)}`,$('acf-worked'));$('acf-result').textContent=`这就是下图 k = ${lag} 那根暗金柱的高度：${f(pairData.acf)}。${seen.length<12?'当前样本很短，不能据此判断总体规律。':''}`;}
      $('formula-limit').hidden=!theory;
    }
    schedule();
  }
  function surface(id){const c=$(id),r=c.getBoundingClientRect();if(!r.width)return null;const d=Math.min(devicePixelRatio,2);c.width=r.width*d;c.height=r.height*d;const ctx=c.getContext('2d');ctx.scale(d,d);ctx.font='11px "Microsoft YaHei",sans-serif';return{ctx,w:r.width,h:r.height};}
  function draw(){
    if(!current)return;
    if(current.lesson===2&&experiment){const s=surface('variance-cloud');if(!s)return;const{ctx,w,h}=s,bound=Math.max(1,...experiment.outcomes.map(v=>Math.abs(v-experiment.mean)))*1.2,left=43,right=w-14,top=25,bottom=h-39;const x=i=>left+i/79*(right-left),y=v=>bottom-(v+bound)/(2*bound)*(bottom-top);
      ctx.strokeStyle='#b9a079';ctx.beginPath();ctx.moveTo(left,y(0));ctx.lineTo(right,y(0));ctx.stroke();ctx.fillStyle='#765536';ctx.textAlign='left';ctx.fillText(`X${current.n} − 样本均值`,left,12);ctx.fillText('0',left-18,y(0)+4);
      experiment.outcomes.forEach((v,i)=>{const d=v-experiment.mean;ctx.strokeStyle='#d4bc96';ctx.beginPath();ctx.moveTo(x(i),y(0));ctx.lineTo(x(i),y(d));ctx.stroke();ctx.fillStyle=d<0?'#8a4b42':'#8e6a35';ctx.beginPath();ctx.arc(x(i),y(d),2.6,0,2*Math.PI);ctx.fill();});ctx.textAlign='center';[0,19,39,59,79].forEach(i=>ctx.fillText(i+1,x(i),h-22));ctx.fillText(`重复实验编号（每次都固定 t = ${current.n}）`,w/2,h-3);
      $('variance-cloud').setAttribute('aria-label',`固定 t = ${current.n} 的 80 次模拟；样本方差 ${f(experiment.sampleVariance)}，理论方差 ${f(current.finiteVariances[current.n])}。`);
    }
    if(current.lesson===3&&pairData){const s=surface('lag-scatter');if(!s)return;const{ctx,w,h}=s,left=43,right=w-18,top=25,bottom=h-40,bound=Math.max(1,...pairData.items.flatMap(p=>[Math.abs(p.a),Math.abs(p.b)]))*1.2;const x=v=>left+(v+bound)/(2*bound)*(right-left),y=v=>bottom-(v+bound)/(2*bound)*(bottom-top);
      ctx.fillStyle='#eee1bf';ctx.fillRect(x(0),top,right-x(0),y(0)-top);ctx.fillRect(left,y(0),x(0)-left,bottom-y(0));ctx.fillStyle='#f1dfd2';ctx.fillRect(left,top,x(0)-left,y(0)-top);ctx.fillRect(x(0),y(0),right-x(0),bottom-y(0));ctx.strokeStyle='#a98b62';ctx.beginPath();ctx.moveTo(x(0),top);ctx.lineTo(x(0),bottom);ctx.moveTo(left,y(0));ctx.lineTo(right,y(0));ctx.stroke();ctx.fillStyle='#765536';ctx.textAlign='left';ctx.fillText('当前值 − 样本均值',left,12);ctx.textAlign='center';ctx.fillText('过去值 − 样本均值',w/2,h-3);
      [-1,0,1].forEach(sign=>{const v=sign*bound*.75;ctx.fillText(v.toFixed(1),x(v),h-23);});
      pairData.items.forEach((p,i)=>{ctx.globalAlpha=i===selected?1:.55;ctx.fillStyle=p.product<0?'#97534a':'#886328';ctx.beginPath();ctx.arc(x(p.b),y(p.a),i===selected?6:3,0,2*Math.PI);ctx.fill();if(i===selected){ctx.strokeStyle='#412e1c';ctx.lineWidth=1.5;ctx.stroke();}});ctx.globalAlpha=1;
      $('lag-scatter').setAttribute('aria-label',`滞后 k = ${lag} 的 ${pairData.items.length} 对中心化观测；右上与左下象限的乘积为正，另两个象限为负。`);
    }
  }
  $('acf-lag').addEventListener('input',()=>{lag=Number($('acf-lag').value);selected=0;update(current);window.dispatchEvent(new Event('ar1:intuition'));});
  $('acf-theory').addEventListener('change',()=>{theory=$('acf-theory').checked;update(current);window.dispatchEvent(new Event('ar1:intuition'));});
  $('variance-example').addEventListener('click',()=>{[['phi',.5],['sigma',1],['time',3]].forEach(([id,value])=>{const el=$(id);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));});});
  new ResizeObserver(schedule).observe($('variance-classroom'));new ResizeObserver(schedule).observe($('acf-classroom'));
  window.ARIntuition=Object.freeze({update,theoryVisible:()=>theory,selectedLag:()=>lag,snapshot:()=>({lag,selected,theory,pairData,experiment,terms})});
})();
