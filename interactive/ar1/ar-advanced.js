(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const math=(tex,id)=>window.katex.render(tex,$(id),{throwOnError:false,output:'htmlAndMathml'});
  const f=x=>Number(x.toFixed(5)).toString();
  math(String.raw`\begin{aligned}\rho(1)&=\frac{0.5}{1-0.2}=0.625\\\rho(2)&=0.5(0.625)+0.2=0.5125\\\rho(3)&=0.5(0.5125)+0.2(0.625)=0.38125\\\gamma(0)&=\frac{1}{1-0.5(0.625)-0.2(0.5125)}\\&=\frac{200}{117}\approx1.70940\end{aligned}`,'yw-example-forward');
  math(String.raw`\begin{aligned}\phi_2&=\frac{0.5125-0.625^2}{1-0.625^2}=\frac{0.121875}{0.609375}=0.2\\\phi_1&=0.625(1-0.2)=0.5\end{aligned}`,'yw-example-inverse');
  math(String.raw`\begin{aligned}\widehat\phi_2&=\frac{0.45-0.6^2}{1-0.6^2}=0.140625\\\widehat\phi_1&=0.6(1-0.140625)=0.515625\end{aligned}`,'yw-example-sample');
  math(String.raw`\operatorname{PACF}(1)=\phi_{1,1}=0.625`,'pacf-example-first');
  math(String.raw`\begin{aligned}\operatorname{PACF}(2)&=\frac{0.5125-0.625^2}{1-0.625^2}\\&=\frac{0.121875}{0.609375}=0.2\end{aligned}`,'pacf-example-second');
  math(String.raw`\begin{aligned}\operatorname{PACF}(1)&=0.625\\\operatorname{PACF}(2)&=0.2\\\operatorname{PACF}(k)&=0,\quad k\ge3\end{aligned}`,'pacf-example-cutoff');
  math(String.raw`\phi_{k,k}=\frac{\rho(k)-\sum_{j=1}^{k-1}\phi_{k-1,j}\rho(k-j)}{1-\sum_{j=1}^{k-1}\phi_{k-1,j}\rho(j)},\quad k\ge2`,'pacf-algorithm-last');
  math(String.raw`\phi_{k,j}=\phi_{k-1,j}-\phi_{k,k}\phi_{k-1,k-j},\quad1\le j<k`,'pacf-algorithm-update');
  function update(s){
    $('yw-classroom').hidden=s.lesson!==4;$('pacf-classroom').hidden=s.lesson!==5;
    $('advanced-scene-note').hidden=s.lesson<4;
    if(s.lesson<4)return;
    const m=s.moments,valid=m.stable&&s.sigma>0;
    $('advanced-scene-note').textContent=s.lesson===4?'先看一次 AR(2) 递推：过去两期各贡献一部分。下方矩阵用当前参数的总体相关反解，不是样本估计；完整方程推导在参数区下方。':'这里画总体 PACF：每个方块对应一个滞后阶数，不是时刻。高度是绝对值，酒红表示负值；下方用 ACF 对照和残差推导解释为什么二阶之后为零。';
    if(s.lesson===4){
      $('yw-live-reading').textContent=valid?`当前可调模型：φ₁ = ${f(s.phi)}、φ₂ = ${f(s.phi2)}。总体 ρ(1) = ${f(m.rho[1])}、ρ(2) = ${f(m.rho[2])}。矩阵的对角线为 1，两个非对角元素均为 ${f(m.rho[1])}；解回 φ₁ = ${f(m.yw[0])}、φ₂ = ${f(m.yw[1])}。`:'当前参数不满足非退化因果平稳条件，不能将本模型的总体相关代入 Yule–Walker。下方固定例题仍满足条件，可独立阅读。';
    }else{
      $('pacf-live-reading').textContent=valid?`当前模型 φ₁ = ${f(s.phi)}、φ₂ = ${f(s.phi2)}。第一阶 PACF = ρ(1) = ${f(m.pacf[1])}；第二阶 PACF = φ₂ = ${f(m.pacf[2])}。表中列总体值，不包含抽样误差；显示经过舍入，接近零不等于理论上精确为零。`:'当前参数下总体 PACF 未定义。表中不显示数值，避免把未定义误写为零；下方固定例题可独立阅读。';
      const table=$('pacf-comparison');table.replaceChildren();
      [['间隔 k',k=>k],['总体 ACF ρ(k)',k=>valid?f(m.rho[k]):'未定义'],['总体 PACF φₖ,ₖ',k=>valid?f(m.pacf[k]):'未定义']].forEach(([title,value])=>{
        const row=document.createElement('tr'),head=document.createElement('th');head.scope='row';head.textContent=title;row.append(head);
        for(let k=1;k<=5;k++){const td=document.createElement('td');td.textContent=value(k);row.append(td);}table.append(row);
      });
    }
    $('scene-explanation').textContent=s.lesson===4?'先从总体相关求参数，再看反向求相关。模拟初值固定为零，但总体公式对应平稳解；两者分别标注，不混用。':'PACF 的“排除影响”是两端分别对中间滞后做线性预测后，计算残差相关；不是删掉中间数据，也不是因果识别。';
  }
  window.ARAdvanced=Object.freeze({update});
})();
