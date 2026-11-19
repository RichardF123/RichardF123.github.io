(() => {
  'use strict';
  const host=document.querySelector('.formula-strip');if(!host)return;
  const math=(tex,el)=>{el.replaceChildren();(Array.isArray(tex)?tex:[tex]).forEach(row=>{const line=document.createElement('div');line.className='reference-equation-row';window.katex.render(row,line,{throwOnError:false,displayMode:true,fleqn:true,output:'htmlAndMathml'});el.append(line);});};
  const section=document.createElement('section');section.className='process-reference';section.id='process-reference';section.setAttribute('aria-labelledby','process-reference-title');
  const title=document.createElement('h2');title.id='process-reference-title';title.textContent='平稳、因果、可逆：先分清三个概念';section.append(title);
  const definitions=document.createElement('dl');
  [['弱平稳','均值不随时间改变，协方差只依赖两期的间隔。不是要求每条曲线平坦，也不是样本均值恰好不变。'],['因果','可以用当前与过去的创新 Z，稳定地表示当前观测 X：从创新到观测。'],['可逆','可以用当前与过去的观测 X，稳定地恢复当前创新 Z：从观测回到创新。不是计算 1/X。']].forEach(([term,text])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=term;dd.textContent=text;definitions.append(dt,dd);});section.append(definitions);
  const detail=document.createElement('details');detail.id='process-reference-detail';const summary=document.createElement('summary');summary.textContent='定义、根判别与级数求逆的完整计算';detail.append(summary);section.append(detail);
  function heading(id,text){const h=document.createElement('h3');h.id=id;h.textContent=text;detail.append(h);}
  function paragraph(text){const p=document.createElement('p');p.textContent=text;detail.append(p);}
  function eq(id,tex){const div=document.createElement('div');div.id=id;div.className='reference-equation';math(tex,div);detail.append(div);}
  function calculation(id,items){const list=document.createElement('ol');list.className='reference-calculation';list.id=id;items.forEach(([label,tex],i)=>{const li=document.createElement('li'),p=document.createElement('p'),line=document.createElement('div');p.textContent=label;line.className='reference-equation';line.id=id+'-'+i;math(tex,line);li.append(p,line);list.append(li);});detail.append(list);}
  heading('definition-stationary','1 · 平稳究竟要求什么？');
  paragraph('本课程计算均值、方差、ACF 时，通常使用弱平稳（二阶平稳）：二阶矩有限，均值恒定，任意两期的协方差只依赖它们相距多久。方差就是间隔为零的协方差，因此也必须恒定。');
  eq('definition-stationary-math',[String.raw`\mathbb E[X_t^2]<\infty`,String.raw`\mathbb E[X_t]=\mu`,String.raw`\operatorname{Cov}(X_t,X_s)=\gamma(t-s)`,String.raw`\operatorname{Var}(X_t)=\gamma(0)`]);
  paragraph('严格平稳要求更强的“分布不变”：任取若干时刻，把它们整体平移，联合分布都相同。它不自动保证二阶矩存在；有有限二阶矩的严格平稳过程是弱平稳的，反向一般不成立。这里的根判别服务于后面使用的线性、有限方差模型。');
  paragraph('将平移前、后的两组观测分别记为向量 U 和 Vₕ，严格平稳要求它们的联合分布相同。');
  eq('definition-strict-math',[String.raw`\mathbf U=(X_{t_1},\ldots,X_{t_n})`,String.raw`\mathbf V_h=(X_{t_1+h},\ldots,X_{t_n+h})`,String.raw`\mathbf U\overset{d}{=}\mathbf V_h`]);
  paragraph('例如随机游走 Xₜ = Xₜ₋₁ + Zₜ、固定 X₀ = 0，均值虽然一直为零，但方差为 tσ²，不弱平稳。反过来，AR(1) 即使 |φ| < 1，从固定初值零启动的有限时刻分布也不等于平稳分布，只是初始影响逐渐消退。');

  heading('definition-roots','2 · 根判别：先确定要判断的性质');
  paragraph('这里的“根”是多项式方程的解 y，不是系数 θ、φ，也不是观测值 X。MA 检查可逆性，AR 检查因果平稳解；两者不是同一个问题。先中心化 Yₜ = Xₜ − μ，再按模型写出多项式。');
  eq('definition-polynomials',[String.raw`\Theta(y)=1+\theta_1y+\cdots+\theta_qy^q`,String.raw`\Phi(y)=1-\phi_1y-\cdots-\phi_py^p`]);
  paragraph('“所有根在单位圆外”的意思是：每一个根到原点的距离都严格大于 1。实根看绝对值；复根看模。负实根也可以在圆外，不能只比较 y > 1。根恰在圆上，或只要有一个根在圆内，就不满足这个条件。');
  eq('definition-root-modulus',[String.raw`y=a+bi`,String.raw`|y|=\sqrt{a^2+b^2}`,String.raw`|y_i|>1\,(\text{每一个根 }y_i)`]);
  const maTitle=document.createElement('h4');maTitle.textContent='算例 A · MA(1)：判断可逆，不是判断平稳';detail.append(maTitle);
  paragraph('给定 Yₜ = Zₜ + 0.5Zₜ₋₁。当前创新的系数 1 变成常数项，滞后一期的系数 0.5 乘 y；然后令整个多项式为零。');
  calculation('definition-ma1-root',[
    ['写多项式。',String.raw`\Theta(y)=1+0.5y`],
    ['解方程，根不是系数 0.5，而是 −2。',String.raw`1+0.5y=0\,\Rightarrow\, y=-2`],
    ['计算根的模，并与 1 比较。',String.raw`|y|=|-2|=2>1`]
  ]);
  eq('definition-ma1-root-rule',[String.raw`y=-\frac1\theta\,(\theta\ne0)`,String.raw`|y|=\frac1{|\theta|}`,String.raw`|y|>1\iff|\theta|<1`]);
  paragraph('结论：这个 MA(1) 可逆。如果把系数换成 θ = 2，根会变成 y = −0.5，模为 0.5 < 1，因此不可逆；但有限 MA 仍然弱平稳。θ = 1 时根为 −1，恰在单位圆上，也不满足严格可逆条件。θ = 0 时多项式为 1，无根，且 Zₜ = Yₜ，直接可逆。');
  const arTitle=document.createElement('h4');arTitle.textContent='算例 B · AR(1)：先移项，再判断因果平稳解';detail.append(arTitle);
  paragraph('给定 Yₜ = 0.5Yₜ₋₁ + Zₜ。这里必须先把过去的 Y 移到左侧，所以多项式中是减号，不能照抄 MA 的加号。');
  calculation('definition-ar1-root',[
    ['移项，并写出 AR 多项式。',[String.raw`Y_t-0.5Y_{t-1}=Z_t`,String.raw`\Phi(y)=1-0.5y`]],
    ['解根并求模。',String.raw`1-0.5y=0\,\Rightarrow\, y=2,\,|y|=2>1`]
  ]);
  eq('definition-ar1-root-rule',[String.raw`y=\frac1\phi\,(\phi\ne0)`,String.raw`|y|>1\iff|\phi|<1`]);
  paragraph('结论：这个 AR(1) 存在由当前和过去创新驱动的因果平稳解。如果 φ = 1.2，根为 1/1.2 = 5/6，模小于 1，不满足因果平稳条件。不要把这个结论扩大成“任何非因果表示都不可能平稳”；本教程只使用因果解。');
  const ma2Title=document.createElement('h4');ma2Title.textContent='算例 C · MA(2)：求出两个根，一个也不能漏';detail.append(ma2Title);
  paragraph('给定 Yₜ = Zₜ + 0.5Zₜ₋₁ + 0.2Zₜ₋₂。得到二次方程后，用求根公式；判别式为负并不是“没有根”，而是有一对共轭复根。');
  calculation('definition-ma2-root',[
    ['将二次方程按降幂排列。这里 a = 0.2、b = 0.5、c = 1。',String.raw`0.2y^2+0.5y+1=0`],
    ['先算判别式。',String.raw`\Delta=0.5^2-4(0.2)(1)=-0.55`],
    ['用二次方程求根公式，再代入判别式。',[String.raw`y_{1,2}=\frac{-b\pm\sqrt\Delta}{2a}`,String.raw`y_{1,2}=\frac{-0.5\pm i\sqrt{0.55}}{0.4}`,String.raw`y_{1,2}\approx-1.25\pm1.85405i`]],
    ['不要比较实部 −1.25；计算每个根的模。',[String.raw`|y_1|=\sqrt{1.25^2+\frac{0.55}{0.4^2}}`,String.raw`|y_1|=|y_2|=\sqrt5\approx2.236>1`]]
  ]);
  paragraph('结论：两个根的模都大于 1，这个 MA(2) 可逆。反例 Θ(y) = (1 − 2y)(1 − 0.5y) 的根为 0.5 和 2：虽然有一个根在圆外，但另一个在圆内，所以仍不可逆。根判别是“所有根都通过”，不是取根的平均值，也不是逐个检查系数是否小于 1。');
  paragraph('可逆的精确定义是：恢复系数绝对可和，而不只是前几项看起来变小。因果表示相应地要求生成观测的系数绝对可和。');
  eq('definition-inverse-math',[String.raw`Z_t=\sum_{j=0}^{\infty}\pi_jY_{t-j}`,String.raw`\sum_{j=0}^{\infty}|\pi_j|<\infty`,String.raw`Y_t=\sum_{j=0}^{\infty}\psi_jZ_{t-j}`,String.raw`\sum_{j=0}^{\infty}|\psi_j|<\infty`]);

  heading('definition-backshift','3 · 对什么求逆？移位算子 B');
  paragraph('按课件第 15–16 页：B 是移位算子，∇ 是差分算子，y 是多项式求根时的普通变量。B 本身不做减法；用 1 − B 作用在序列上才是做一阶差分。Θ(B) 表示对序列做移位运算，Θ(y) 则用于解代数方程。');
  eq('definition-backshift-math',[String.raw`BY_t=Y_{t-1}`,String.raw`\nabla Y_t=Y_t-Y_{t-1}`,String.raw`\nabla=1-B`,String.raw`\nabla^2Y_t=Y_t-2Y_{t-1}+Y_{t-2}`]);
  paragraph('因此“1 + θB”作用在创新上，就得到当期创新与上一期创新的加权和。求逆是抵消这个线性运算，不是把 B、∇ 和求根变量混成一个记号，也不是对数据取倒数。');
  eq('definition-backshift-inverse',[String.raw`Y_t=(1+\theta B)Z_t`,String.raw`Z_t=(1+\theta B)^{-1}Y_t`]);

  heading('definition-ma1-series','4 · MA(1)：几何级数怎样展开？');
  paragraph('用 1 / (1 + u) = 1 − u + u² − …，将 u 换成 θB。系数中的负号来自分母的加号。先写形式，再检查 |θ| < 1；没有收敛条件，不能只凭形式宣布可逆。');
  eq('definition-ma1-series-math',[String.raw`(1+\theta B)^{-1}=\sum_{j=0}^{\infty}(-\theta)^jB^j`,String.raw`Z_t=Y_t-\theta Y_{t-1}+\theta^2Y_{t-2}+\cdots`]);
  paragraph('为什么收敛？把 Zₜ = Yₜ − θZₜ₋₁ 递归代回去，有限展开始终有余项。|θ| < 1 时，余项的方差趋于零，而且所有系数的绝对值之和有限，才能得到上面的稳定恢复式。');
  eq('definition-ma1-remainder',[String.raw`R_N=(-\theta)^{N+1}Z_{t-N-1}`,String.raw`Z_t=\sum_{j=0}^{N}(-\theta)^jY_{t-j}+R_N`,String.raw`\operatorname{Var}(R_N)=\theta^{2N+2}\sigma^2\to0`,String.raw`\sum_{j=0}^{\infty}|\theta|^j=\frac1{1-|\theta|}<\infty`]);
  paragraph('手算例子：θ = 0.5，μ = 3，已知观测 xₜ = 5、xₜ₋₁ = 4、xₜ₋₂ = 2。必须先减去均值，得到中心化观测 Yₜ、Yₜ₋₁、Yₜ₋₂ 的这次取值 2、1、−1。只取前三项的恢复值为 1.25；它是截断值，不是精确创新，因为还剩余项。');
  eq('definition-ma1-example',[String.raw`P_2=2-0.5(1)+0.25(-1)=1.25`,String.raw`Z_t=P_2-0.125Z_{t-3}`,String.raw`\operatorname{Var}(R_2)=\frac1{64}\,(\sigma^2=1)`]);

  heading('definition-ma2-series','5 · MA(2)：不能套单个几何级数，改用配系数');
  paragraph('以 Yₜ = Zₜ + 0.5Zₜ₋₁ + 0.2Zₜ₋₂ 为例。先检查可逆性：1 + 0.5y + 0.2y² = 0 的根为 (−0.5 ± i√0.55) / 0.4，模均为 √5 > 1，因此逆级数收敛。');
  paragraph('设逆多项式为 π₀ + π₁B + π₂B² + …，与原多项式相乘后必须等于 1。常数项要为 1，其余每一阶 B 的系数都要为零。按阶数依次解，就能手算，不需要跳到矩阵求逆。');
  eq('definition-ma2-product',[String.raw`\Theta(B)=1+0.5B+0.2B^2`,String.raw`\Pi(B)=\pi_0+\pi_1B+\pi_2B^2+\cdots`,String.raw`\Theta(B)\Pi(B)=1`]);
  calculation('definition-ma2-coefficients',[
    ['常数项：乘积的常数项必须为 1。',String.raw`\pi_0=1`],
    ['B 的一次项：系数相加必须为 0。',[String.raw`\pi_1+0.5\pi_0=0`,String.raw`\pi_1=-0.5`]],
    ['B 的二次项：用已经求出的 π₀、π₁。',[String.raw`\pi_2+0.5\pi_1+0.2\pi_0=0`,String.raw`\pi_2=-0.5(-0.5)-0.2(1)=0.05`]],
    ['B 的三次项：继续抵消原多项式的贡献。',[String.raw`\pi_3=-0.5\pi_2-0.2\pi_1`,String.raw`\pi_3=-0.5(0.05)-0.2(-0.5)=0.075`]]
  ]);
  paragraph('所以恢复式的前三个滞后系数依次为 −0.5、0.05、0.075。MA(2) 的逆系数不等于单纯的 (−0.5)ʲ，因为还必须抵消二阶项。一般 q 阶也使用同样的系数匹配递推。');
  eq('definition-ma2-inverse',[String.raw`Z_t=\sum_{j=0}^{\infty}\pi_jY_{t-j}`,String.raw`\pi_0=1,\,\pi_1=-0.5`,String.raw`\pi_2=0.05,\,\pi_3=0.075`,String.raw`\pi_n=-\sum_{i=1}^{\min(q,n)}\theta_i\pi_{n-i}`]);

  heading('definition-ar-series','6 · AR 求逆与 MA 求逆，方向正好相反');
  paragraph('AR(1) 先移项得到 (1 − φB)Yₜ = Zₜ。若要由创新生成观测，就要对 1 − φB 求逆，得到正的几何级数形式。φ 为负时，φʲ 本身仍会正负交替。');
  eq('definition-ar-series-math',[String.raw`(1-\phi B)^{-1}=1+\phi B+\phi^2B^2+\cdots`,String.raw`Y_t=\sum_{j=0}^{\infty}\phi^jZ_{t-j}`,String.raw`|\phi|<1`]);
  paragraph('AR(2) 同样可以配系数：逆掉 1 − φ₁B − φ₂B²，得到 ψ₀ = 1、ψ₁ = φ₁、ψₙ = φ₁ψₙ₋₁ + φ₂ψₙ₋₂。例子 φ₁ = 0.5、φ₂ = 0.2 的前四项为 1、0.5、0.45、0.325。与 MA 求逆的负号递推要分开记。');
  eq('definition-ar2-series',[String.raw`\frac1{1-0.5B-0.2B^2}=\sum_{j=0}^{\infty}\psi_jB^j`,String.raw`\psi_0=1,\,\psi_1=0.5`,String.raw`\psi_2=0.45,\,\psi_3=0.325`]);
  paragraph('做题顺序：先中心化 → 写出带正确正负号的多项式 → 检查根的模 → 用几何级数或逐阶配系数 → 说明收敛条件。若只保留有限项，写明截断余项，不把近似值当作精确值。');
  const sources=document.createElement('p');sources.className='reference-sources';
  [['弱平稳定义','chapter-02-stationarity-trend-seasonality.pdf',3],['MA 可逆定义与根条件','chapter-04a-arima.pdf',17],['MA 根判别定理','chapter-04a-arima.pdf',20],['AR 因果根条件','chapter-04b-arima.pdf',13]].forEach(([label,file,page])=>{const a=document.createElement('a');a.href='/files/ama4650-time-series/'+file+'#page='+page;a.target='_blank';a.rel='noopener';a.textContent=`${label} · PDF 第 ${page} 页`;sources.append(a);});detail.append(sources);
  host.after(section);
})();
