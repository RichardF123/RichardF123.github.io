(() => {
  'use strict';
  const $=id=>document.getElementById(id),f=v=>Number(v.toFixed(5)).toString();
  const math=(tex,el)=>window.katex.render(tex,el,{throwOnError:false,output:'htmlAndMathml'});
  const context=document.createElement('section');context.className='ma-context';
  const title=document.createElement('h3'),explanation=document.createElement('p'),equation=document.createElement('div');equation.className='math-line';context.append(title,explanation,equation);$('module-controls').before(context);
  const bridge=document.createElement('p');bridge.className='ma-bridge';bridge.id='ma-bridge';$('module-blocks').before(bridge);
  const tableHome=document.createComment('coefficient table home');$('module-table').before(tableHome);
  const alignment=document.createElement('section');alignment.id='ma-alignment';alignment.hidden=true;
  const alignmentTitle=document.createElement('h3'),alignmentNote=document.createElement('p');alignmentTitle.textContent='同一列，就是同一个时刻的创新';alignment.append(alignmentTitle,alignmentNote);bridge.before(alignment);
  const recovery=document.createElement('div');recovery.id='ma-recovery';recovery.hidden=true;
  const label=document.createElement('label'),input=document.createElement('input'),output=document.createElement('output'),coefficient=document.createElement('div');coefficient.className='math-line';label.htmlFor='ma-recovery-lag';label.textContent='考察的过去间隔 j';input.type='range';input.id='ma-recovery-lag';input.min=0;input.max=8;input.step=1;input.value=0;recovery.append(label,input,output,coefficient);$('module-blocks').after(recovery);
  let latest=null,j=0;
  input.addEventListener('input',()=>{j=Number(input.value);if(latest){update(latest);window.TimeCourse.redraw();}});
  function update(data){
    latest=data;const{id,state:s,model:m,plot}=data,isACF=id==='ma-acf',isInverse=id==='ma-invertibility';
    alignment.hidden=!isACF;recovery.hidden=!isInverse;
    if($('control-theta2'))$('control-theta2').closest('.module-range').hidden=s.q===1;
    if(isACF){
      title.textContent='这次不代入创新的实际值，只比较两个随机变量';
      explanation.textContent=(s.lag===0?'k = 0 时两行是同一个随机变量，这时协方差就是过程方差 γ(0)，所以 ρ(0) = 1。':`k = ${s.lag} 表示两端相距 ${s.lag} 步，不是第 ${s.lag} 次观测。`)+'令 Yₜ = Xₜ − μ，固定均值已经减去；每一行写这个时刻由哪些创新组成。';
      const terms=k=>m.theta.map((w,i)=>String.raw`${i===0?'':`(${f(w)})`}Z_{${k+i===0?'t':`t-${k+i}`}}`).join('+');
      math(String.raw`\begin{aligned}Y_t&=${terms(0)}\\Y_{t-${s.lag}}&=${terms(s.lag)}\end{aligned}`,equation);
      alignment.append($('module-table'));
      const shared=new Set(m.pairs.map(p=>p.i+1));
      $('module-table').querySelectorAll('tr').forEach(row=>Array.from(row.children).forEach((cell,i)=>{cell.classList.toggle('ma-shared',shared.has(i));if(shared.has(i))cell.title='两行共同使用这个时刻的创新';}));
      alignmentNote.textContent='着色列是两行共有的创新。单元格中的数是该创新前的系数，不是创新实际值。没有着色的列不会留下协方差贡献。';
      bridge.textContent=m.pairs.length?`下面每个方块对应一个共享列，数值是两行系数的乘积；再乘创新方差 ${f(s.sigma**2)}，相加得到 γ(${s.lag}) = ${f(m.gamma)}。最后除以过程方差 ${f(m.moments.gamma[0])}，才是 ρ(${s.lag}) = ${f(m.rho)}。${Math.abs(m.gamma)<1e-10?'本例的正负贡献恰好抵消，因此即使共享创新，协方差仍是零。':''}`:`两行没有共享创新，所以 γ(${s.lag}) = 0，ρ(${s.lag}) = 0。这里说的是总体公式，不要求样本图精确归零。`;
      $('proof-title').textContent='从一对 MA(1) 开始，逐项找出留下的协方差';
    }else{
      tableHome.after($('module-table'));
      if(isInverse){
        title.textContent='前两节从创新生成观测；现在把方向反过来';
        explanation.textContent='现实中通常只看得到 X，不直接知道每期创新 Z。可逆性问的是：能否用当前及过去观测，稳定地恢复创新？下面的柱子不是创新样本或 ACF，而是恢复式中各期观测前的系数。';
        math(String.raw`Y_t=X_t-\mu=Z_t+(${f(s.theta)})Z_{t-1}`,equation);
        output.textContent=`j = ${j}`;plot.selected=j;
        math(String.raw`\pi_{${j}}=(-\theta)^{${j}}=(${f(-s.theta)})^{${j}}=${f(m.weights[j])}`,coefficient);
        bridge.textContent=`例如当前的恢复式先写成 Zₜ = Yₜ − (${f(s.theta)})Zₜ₋₁，再继续替换 Zₜ₋₁。恢复系数的绝对值${m.invertible?'随间隔衰减，初始误差会消退':'不衰减，无法靠向过去展开消除初始误差'}。有限 MA 是否平稳与此不同：即使不可逆，它仍可弱平稳。`;
        $('proof-title').textContent='由移项开始，解释恢复系数为何必须衰减';
      }else{
        title.textContent='先分清模型与一次实现';
        explanation.textContent=`这里选择 MA(${s.q})：当前创新系数固定为 1，再加最近 ${s.q} 期创新的加权贡献。Z 是均值为 0 的新随机扰动；μ 是所有可能结果的平均位置，不是每一次都会取到的值。`;
        math(String.raw`X_t=${f(s.mu)}+${m.theta.map((w,i)=>String.raw`${i===0?'':`(${f(w)})`}Z_{${i===0?'t':`t-${i}`}}`).join('+')}`,equation);
        bridge.textContent=`下面仅展示一次指定的创新取值。每个方块先把“创新实际值 × 系数”算出来，再把所有贡献加上 μ = ${f(s.mu)}，得到这一次的 xₜ = ${f(m.value)}。这和求总体方差 ${f(m.moments.gamma[0])} 是两件不同的事。`;
        $('proof-title').textContent='从 MA(1) 的两项和，推到均值与方差';
      }
    }
  }
  window.MAGuide=Object.freeze({update});
})();
