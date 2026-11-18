window.ARCourse = {
  units:[['01','随机过程与观测',2],['02','平稳性',3],['03','趋势、季节性与评价',2],['04','指数平滑',4],['05','MA 模型',3],['06','AR 模型',4],['07','ARMA 与 ARIMA',2],['08','识别、估计与诊断',3],['09','预测与不确定性',3],['10','ARCH 与 GARCH',3]],
  groups:[['06.1','AR(1) 与冲击响应',[0,1]],['06.2','矩与自相关',[2,3]],['06.3','AR(p) 与 Yule–Walker',[4]],['06.4','PACF 与截尾',[5]]],
  lessons:[
    {id:'recursion',group:0,title:'下一刻，是怎样发生的？',short:'一次递推',scene:'过去留下的部分，与新的冲击相加',
      body:'AR(1) 只直接使用上一时刻。φXₜ₋₁ 是过去留下的部分，εₜ 是这一步的新冲击，再加常数项 c，得到 Xₜ。',
      takeaway:'c 是递推的常数项，不是过程均值 μ。平稳时 c = (1 − φ)μ。',
      core:String.raw`X_t=c+\color{#82612e}{\phi X_{t-1}}+\color{#8a3e3c}{\varepsilon_t}`,
      condition:'εₜ 独立同分布，E[εₜ] = 0，Var(εₜ) = σ²ε；本页模拟使用正态冲击、固定 X₀ = 0。',
      derivationTitle:'递归替换，直到初始时刻',
      steps:[['把上一时刻再展开一次。',String.raw`X_t=c(1+\phi)+\phi^2X_{t-2}+\varepsilon_t+\phi\varepsilon_{t-1}`],['一直替换到 X₀。两部分分别来自确定性的初始值与随机冲击。',String.raw`X_t=\phi^tX_0+c\sum_{j=0}^{t-1}\phi^j+\sum_{j=0}^{t-1}\phi^j\varepsilon_{t-j}`]],
      boundary:'φ = 0 时不再保留过去。在独立冲击假设下，各期观测也独立。固定初始化生成的路径，不等于从平稳分布初始化的路径。',
      question:'c = 2、φ = 0.5，若因果平稳解存在，均值 μ 是多少？',choices:['2','4','1'],correct:1,feedback:'对递推式取期望：μ = 2 + 0.5μ，因此 μ = 4，而不是 c = 2。',
      code:'x = [0.0]\nfor eps in innovations:\n    x.append(c + phi * x[-1] + eps)'
    },
    {id:'impulse',group:0,title:'一次冲击，能留下多久？',short:'冲击响应',scene:'一份额外的单位冲击，沿时间留下回声',
      body:'固定冲击时刻 s。让两条路径使用相同初始值和相同后续冲击，只在 s 时刻给其中一条额外加 1。方块显示两条路径的差，而不是一条新的随机样本。',
      takeaway:'h 表示冲击发生后的步数；s 固定不动。Δₛ₊ₕ = φʰΔₛ，而不是在推导中把 s 和 h 互换。',
      core:String.raw`\Delta_{s+h}=\phi^h\Delta_s,\qquad\Delta_s=1`,
      condition:'两条路径的 c、φ 和其他冲击相同，因此相减后常数项和后续随机项抵消。',
      derivationTitle:'先相减，再递推',steps:[['相同的后续冲击不影响两条路径的差。',String.raw`\Delta_{s+1}=\phi\Delta_s`],['继续递推 h 步，每一步再乘一次 φ。',String.raw`\Delta_{s+h}=\underbrace{\phi\cdots\phi}_{h\text{ 次}}\Delta_s=\phi^h\Delta_s`]],
      boundary:'|φ| < 1 时冲击消退；φ < 0 时符号交替；φ = ±1 时幅度不消退；|φ| > 1 时递推放大冲击。',
      question:'φ = −0.5，一次 +1 冲击在两步之后留下多少影响？',choices:['−0.25','0.25','−0.5'],correct:1,feedback:'Δₛ₊₂ = (−0.5)² × 1 = 0.25。符号交替，不代表随机冲击本身也要交替。',code:'delta = 1.0\nresponse = [delta]\nfor h in range(1, 7):\n    delta *= phi\n    response.append(delta)'
    },
    {id:'moments',group:1,title:'平稳的均值与方差，从哪里来？',short:'均值与方差',scene:'新冲击的方差，沿递推不断累积',
      body:'对固定 X₀ = 0 的递推，均值和方差通常还依赖 t。只有在 |φ| < 1 时初始影响消退，对应的因果平稳解才有稳定的均值与有限方差。',takeaway:'平稳性约束整个分布的时间结构，不是“这一条曲线看起来没有趋势”。σ²ε 是冲击方差，γ(0) 是平稳过程的方差。',
      core:String.raw`\operatorname{Var}(X_t)=\sigma_\varepsilon^2\sum_{j=0}^{t-1}\phi^{2j}`,
      limit:String.raw`|\phi|<1:\quad\mu=\frac{c}{1-\phi},\quad\gamma(0)=\frac{\sigma_\varepsilon^2}{1-\phi^2}`,
      condition:'固定初始值的有限时刻方差与平稳解的方差不是同一对象；σ ε = 0 的退化情形单独讨论。',
      derivationTitle:'先算有限时刻，再取极限',steps:[['冲击均值为零，固定初始值为零，所以均值只剩常数项累积。',String.raw`\mathbb E[X_t]=c\sum_{j=0}^{t-1}\phi^j`],['独立冲击之间协方差为零，系数平方后乘冲击方差。',String.raw`\operatorname{Var}(X_t)=\sigma_\varepsilon^2\sum_{j=0}^{t-1}\phi^{2j}`],['|φ| < 1 时几何级数收敛；也可直接对平稳递推取期望和方差。',String.raw`\mu=c+\phi\mu,\quad\gamma(0)=\phi^2\gamma(0)+\sigma_\varepsilon^2`]],
      boundary:'φ = 1、c = 0 时 E[Xₜ] = 0，但 Var(Xₜ) = tσ²ε；均值不变仍然不平稳。这里讨论过去冲击驱动的因果解，不包含依赖未来冲击的非因果表示。',
      question:'φ = 1、c = 0、σ ε > 0、X₀ = 0 时，Var(Xₜ) 等于？',choices:['σ²ε','tσ²ε','0'],correct:1,feedback:'Xₜ 是 t 个独立冲击之和，因此方差为 tσ²ε。',code:'finite_variance = 0.0\nfor t in range(1, 101):\n    finite_variance = phi**2 * finite_variance + sigma_epsilon**2'
    },
    {id:'acf',group:1,title:'把记忆写成自相关',short:'AR(1) 的 ACF',scene:'相隔 k 步的两个观测，还剩多少相关',
      body:'在因果平稳 AR(1) 中，当前冲击与过去不相关。这个条件把自协方差变成简单递推，最后得到 ρ(k) = φᵏ。暗金色样本 ACF 不必逐点等于酒红色理论 ACF。',takeaway:'k 专门表示相关函数的滞后。γ(k) 有量纲，ρ(k) 是除以 γ(0) 后的无量纲相关系数。',
      core:String.raw`\rho(k)=\frac{\gamma(k)}{\gamma(0)}=\phi^k`,condition:'|φ| < 1，σ ε > 0；令 Yₜ = Xₜ − μ。样本 ACF 统一记为 ρ̂(k)。',
      derivationTitle:'先中心化，再利用创新与过去不相关',steps:[['中心化去掉常数项，对过去的 Yₜ₋ₖ 取协方差。',String.raw`\gamma(k)=\operatorname{Cov}(\phi Y_{t-1}+\varepsilon_t,Y_{t-k})=\phi\gamma(k-1)`],['反复递推，再除以 γ(0)。',String.raw`\gamma(k)=\phi^k\gamma(0),\qquad\rho(k)=\phi^k`],['n 个观测的样本估计统一使用同一个分母。',String.raw`\widehat\rho(k)=\frac{\sum_{t=k}^{n-1}(x_t-\bar x)(x_{t-k}-\bar x)}{\sum_{t=0}^{n-1}(x_t-\bar x)^2}`]],
      boundary:'σ ε = 0 时平稳解方差为零，理论相关系数未定义；常数样本的样本 ACF 也未定义。不把短样本的偶然拖尾当成总体定律。',
      question:'样本 ACF 没有准确落在 φᵏ 上，说明模拟一定错了吗？',choices:['不一定，有限样本会有误差','一定，两者应完全重合'],correct:0,feedback:'有限样本有抽样波动，本页固定 X₀ = 0 还有初始化效应。更多样本不保证某次估计单调变好。',code:'k = 1\ncentered = x - x.mean()\nrho_hat = (centered[k:] @ centered[:-k]) / (centered @ centered)  # k >= 1'
    },
    {id:'yule-walker',group:2,title:'从相关性，反推出 AR 系数',short:'AR(p) 与 Yule–Walker',scene:'用 AR(2) 算出两份记忆，再解两条方程',
      body:'AR(p) 使用过去 p 个观测。本节用 AR(2) 做完整的可计算例子：先看 φ₁、φ₂ 如何共同影响当前值，再由 ρ(1)、ρ(2) 反解两个系数。',takeaway:'Yule–Walker 用总体协方差给出理论关系；用样本相关代入才得到估计，二者不能混称为真实参数。',
      core:String.raw`X_t=c+\sum_{i=1}^p\phi_iX_{t-i}+\varepsilon_t`,limit:String.raw`\begin{pmatrix}1&\rho(1)\\\rho(1)&1\end{pmatrix}\begin{pmatrix}\phi_1\\\phi_2\end{pmatrix}=\begin{pmatrix}\rho(1)\\\rho(2)\end{pmatrix}`,
      condition:'可操作例子为 AR(2)，固定 X₋₁ = X₀ = 0。总体相关与矩只在因果平稳且非退化的参数下显示。',
      derivationTitle:'把递推式变成一组协方差方程',steps:[['中心化后，对 Yₜ₋ₖ 取协方差。创新与过去不相关。',String.raw`\gamma(k)=\sum_{i=1}^p\phi_i\gamma(k-i),\quad k\ge1,\quad\gamma(-k)=\gamma(k)`],['AR(2) 的 k = 1、2 两式相除于 γ(0)。',String.raw`\rho(1)=\phi_1+\phi_2\rho(1),\quad\rho(2)=\phi_1\rho(1)+\phi_2`],['解出相关函数，再用 k = 0 的方差方程。',String.raw`\rho(1)=\frac{\phi_1}{1-\phi_2},\quad\gamma(0)=\frac{\sigma_\varepsilon^2}{1-\phi_1\rho(1)-\phi_2\rho(2)}`],['实际估计使用样本 ACF，矩阵是 Toeplitz 结构。',String.raw`\widehat R_p\widehat{\boldsymbol\phi}=\widehat{\boldsymbol r}_p`]],
      boundary:'AR(p) 因果平稳要求 φ(z) = 1 − Σφᵢzⁱ 的所有根在单位圆外。AR(2) 等价条件是 |φ₂| < 1、φ₁ + φ₂ < 1、φ₂ − φ₁ < 1。不要对每个系数单独套 |φᵢ| < 1。',
      question:'φ₁ = 0.5、φ₂ = 0.2 时，总体 ρ(1) 是多少？',choices:['0.5','0.625','0.7'],correct:1,feedback:'ρ(1) = φ₁ / (1 − φ₂) = 0.5 / 0.8 = 0.625。它并不等于 φ₁。',code:'rho1 = phi1 / (1 - phi2)\nrho2 = phi1 * rho1 + phi2\nR = np.array([[1, rho1], [rho1, 1]])\nrecovered_phi = np.linalg.solve(R, np.array([rho1, rho2]))'
    },
    {id:'pacf',group:3,title:'排除中间环节，还剩多少直接关系？',short:'PACF 与截尾',scene:'AR(2) 的总体 PACF：第二阶之后为零',
      body:'ACF 包含经过中间时刻传递的相关。PACF 在控制中间滞后后，测量两端剩下的线性关系，也等于 k 阶最佳线性预测中最后一个系数 φₖ,ₖ。',takeaway:'AR(p) 的总体 PACF 在 p 阶之后截尾；有限样本 PACF 不会整齐地全部归零。φₖ,ₖ 是投影系数，不要与模型参数 φₖ 不加说明地混用。',
      core:String.raw`\operatorname{PACF}(k)=\phi_{k,k}`,limit:String.raw`\operatorname{AR}(2):\quad\phi_{1,1}=\rho(1),\quad\phi_{2,2}=\phi_2,\quad\phi_{k,k}=0\ (k>2)`,
      condition:'本图是因果平稳 AR(2) 的总体 PACF，不是样本估计。σ ε = 0 时相关系数未定义，不绘制总体 PACF。',
      derivationTitle:'从逐阶线性投影理解 PACF',steps:[['k 阶最佳线性预测的系数由该阶 Yule–Walker 方程确定。',String.raw`\widehat Y_t^{(k)}=\sum_{j=1}^k\phi_{k,j}Y_{t-j}`],['Durbin–Levinson 递推计算最后一个系数。',String.raw`\phi_{k,k}=\frac{\rho(k)-\sum_{j=1}^{k-1}\phi_{k-1,j}\rho(k-j)}{1-\sum_{j=1}^{k-1}\phi_{k-1,j}\rho(j)}`],['二阶时得到熟悉的相关系数公式。',String.raw`\phi_{2,2}=\frac{\rho(2)-\rho(1)^2}{1-\rho(1)^2}=\phi_2`],['真正的 AR(2) 已包含所有过去的线性预测信息；增加更远滞后不再改善预测。',String.raw`\phi_{k,k}=0,\quad k>2`]],
      boundary:'只有模型真为 AR(p)、且满足相应非退化平稳条件时才有总体截尾性质。φ₂ = 0 会降为 AR(1)，此时第二阶也为零。样本图上的少数越界点不能直接证明阶数。',
      question:'对本节 AR(2)，ACF 拖尾而总体 PACF 从第几阶开始为零？',choices:['第 2 阶','第 3 阶','永远不为零'],correct:1,feedback:'在第 2 阶之后截尾，即第 3 阶起为零。如果 φ₂ = 0，模型会进一步退化为 AR(1)。',code:'from statsmodels.tsa.stattools import pacf\n# This is a sample estimate, not the population PACF shown above.\nsample_pacf = pacf(x, nlags=7, method="ywm")'
    }
  ]
};
