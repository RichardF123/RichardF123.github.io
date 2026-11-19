window.ARCourse = {
  units:[['01-03','随机过程、平稳性与趋势',1],['04','指数平滑',4],['05','MA 模型',3],['06','AR 模型',4],['07','ARMA 与 ARIMA',2],['08','识别、估计与诊断',3],['09','预测与不确定性',3],['10','ARCH 与 GARCH',3]],
  groups:[['06.1','AR(1) 与白噪声表示',[0,1]],['06.2','矩与自相关',[2,3]],['06.3','AR(p) 与 Yule–Walker',[4]],['06.4','PACF 与截尾',[5]]],
  lessons:[
    {id:'recursion',group:0,title:'下一刻，是怎样发生的？',short:'一次递推',scene:'过去留下的部分，与新的冲击相加',
      body:'AR(1) 只直接使用上一时刻。φXₜ₋₁ 是过去留下的部分，Zₜ 是这一步的新冲击，再加常数项 c，得到 Xₜ。',
      takeaway:'c 是递推的常数项，不是过程均值 μ。平稳时 c = (1 − φ)μ。',
      core:String.raw`X_t=c+\color{#82612e}{\phi X_{t-1}}+\color{#8a3e3c}{Z_t}`,
      condition:'公式与方块统一使用 Xₜ、Xₜ₋₁、φXₜ₋₁、Zₜ、c。图中数字是当前模拟的取值；Zₜ 与 c 分开，不再合成一个名字。Zₜ 独立同分布，均值 0、方差 σ²；本页使用正态噪声，X₀ = 0。',
      derivationTitle:'递归替换，直到初始时刻',
      steps:[['把上一时刻再展开一次。',String.raw`X_t=c(1+\phi)+\phi^2X_{t-2}+Z_t+\phiZ_{t-1}`],['一直替换到 X₀。两部分分别来自确定性的初始值与随机冲击。',String.raw`X_t=\phi^tX_0+c\sum_{j=0}^{t-1}\phi^j+\sum_{j=0}^{t-1}\phi^jZ_{t-j}`]],
      boundary:'φ = 0 时不再保留过去。在独立冲击假设下，各期观测也独立。固定初始化生成的路径，不等于从平稳分布初始化的路径。',
      question:'c = 2、φ = 0.5，若因果平稳解存在，均值 μ 是多少？',choices:['2','4','1'],correct:1,feedback:'对递推式取期望：μ = 2 + 0.5μ，因此 μ = 4，而不是 c = 2。',
      code:'x = [0.0]\nfor eps in innovations:\n    x.append(c + phi * x[-1] + eps)'
    },
    {id:'impulse',group:0,title:'今天的值，怎样由过去的白噪声组成？',short:'白噪声表示',scene:'每个方块是一项白噪声的系数，不是一次随机观测',
      body:'讲义把 AR(1) 递推展开成 MA(∞)。今天的白噪声系数是 1，昨天的是 φ，前天的是 φ²。这里的 j 表示“距今天有几步”，每个方块对应一项 Zₜ₋ⱼ。',
      takeaway:'先区分系数 φʲ 和随机项 φʲZₜ₋ⱼ。图中画系数，不把它当作白噪声实际取值。',
      core:String.raw`Y_t=X_t-\mu=\sum_{j=0}^{\infty}\phi^jZ_{t-j}`,
      condition:'因果平稳表示要求 |φ| < 1。讲义以 μ = 0 推导；这里先中心化 Yₜ = Xₜ − μ。讲义 Zₜ / ϵₜ 在本教程统一记为 Zₜ。',
      derivationTitle:'对应讲义的 MA(∞) 展开',steps:[['去掉均值后，先替换一次 Yₜ₋₁。',String.raw`Y_t=Z_t+\phiZ_{t-1}+\phi^2Y_{t-2}`],['替换 m + 1 次，先保留余项，不能直接凭空写无穷和。',String.raw`Y_t=\sum_{j=0}^{m}\phi^jZ_{t-j}+\phi^{m+1}Y_{t-m-1}`],['在平稳、有限方差且 |φ| < 1 时，余项在均方意义下趋于零。',String.raw`\mathbb E[(\phi^{m+1}Y_{t-m-1})^2]=\phi^{2m+2}\gamma(0)\longrightarrow0`]],
      boundary:'“多加一次单位扰动，再比较两条路径”是对白噪声系数的补充解释，不是这份讲义中的独立冲击响应章节。|φ| ≥ 1 时仍可算有限项系数，但不能沿用这个因果平稳无穷表示。',
      sources:[['Chapter 4B · PDF 第 4 页（讲义 29/59）','chapter-04b-arima.pdf',4],['Chapter 4B · PDF 第 6 页（讲义 31/59）','chapter-04b-arima.pdf',6]],sourceNote:'对应指数衰减与白噪声表示。“冲击响应”是此前补充解释的名称，不作为讲义独立章节。',
      question:'φ = −0.5 时，今天的表示中 Zₜ₋₂ 的系数是多少？',choices:['−0.25','0.25','−0.5'],correct:1,feedback:'j = 2 时系数是 φ² = 0.25。只有系数已知，随机项还要乘上实际的 Zₜ₋₂。',code:'weights = np.array([phi**j for j in range(7)])\n# X_t - mu = sum_j weights[j] * epsilon_(t-j)\n# Above is a causal stationary infinite representation only for abs(phi) < 1.'
    },
    {id:'moments',group:1,title:'均值与方差：从递推到解题公式',short:'均值与方差',scene:'先判断初始化条件，再取期望与方差',
      body:'记 mₜ = E[Xₜ]、vₜ = Var(Xₜ)。做题先看题干：是给定固定初值 X₀，还是已声明过程平稳？前者求随 t 变化的矩，后者求不随时间变化的 μ、γ(0)。不需要列出所有噪声组合，也不要求噪声服从正态分布。',takeaway:'固定初值题：写出 m₀、v₀，再递推或代入有限几何级数。平稳题：先检查因果平稳条件，再令前后两期均值、方差相等。不能只看 |φ| < 1 就把固定初始化的过程当作已经平稳。',
      core:String.raw`m_t=c+\phi m_{t-1}`,
      limit:String.raw`v_t=\phi^2v_{t-1}+\sigma^2`,
      condition:'模型 Xₜ = c + φXₜ₋₁ + Zₜ。创新均值为 0、方差为 σ²，且与过去不相关。mₜ、vₜ 分别记第 t 时刻的均值、方差。枚举仅在下方作为可选的直觉辅助。',
      derivationTitle:'考试怎样写：条件、推导、代入',steps:[
        ['1 · 先定初值。若 X₀ = x₀ 是已知常数，则 m₀ = x₀、v₀ = 0；它本身没有随机性。以下假设创新与初值及过去不相关。',String.raw`m_t=\mathbb E[X_t],\quad v_t=\operatorname{Var}(X_t),\qquad m_0=x_0,\ v_0=0`],
        ['2 · 对递推式取期望。常数保持原值，φ 可提出期望，创新的期望为零；均值递推不需要枚举。',String.raw`\mathbb E[X_t]=c+\phi\mathbb E[X_{t-1}]+\mathbb E[Z_t]=c+\phi m_{t-1}`],
        ['3 · 对递推式取方差。常数 c 消失；随机变量乘 φ，离均值的距离也乘 φ，平方后就是 φ²。先写交叉项，再由创新与过去不相关将它消去。',String.raw`v_t=\phi^2v_{t-1}+\sigma^2+2\phi\underbrace{\operatorname{Cov}(X_{t-1},Z_t)}_{0}=\phi^2v_{t-1}+\sigma^2`],
        ['4 · 求第 t 步：将递推展开为有限和。均值保留初值的 φᵗx₀；方差因为 v₀ = 0，不含初值方差。',String.raw`m_t=\phi^t x_0+c\sum_{j=0}^{t-1}\phi^j,\qquad v_t=\sigma^2\sum_{j=0}^{t-1}\phi^{2j}`],
        ['有限几何级数给出可直接代入的形式；下式要求 φ ≠ ±1。若 φ = 1，直接用前面的有限和得 mₜ = x₀ + tc、vₜ = tσ²；若 φ = −1，均值交替，方差仍为 tσ²。有限步递推不要求 |φ| < 1。',String.raw`m_t=\phi^t x_0+\frac{c(1-\phi^t)}{1-\phi},\qquad v_t=\frac{\sigma^2(1-\phi^{2t})}{1-\phi^2}`],
        ['5 · 若题干给定因果平稳过程，则 |φ| < 1，前后时刻的均值和方差相同。直接解下面两条方程；不把固定初值题的有限 t 结果换成平稳值。',String.raw`\mu=c+\phi\mu\ \Rightarrow\ \mu=\frac{c}{1-\phi},\qquad\gamma(0)=\phi^2\gamma(0)+\sigma^2\ \Rightarrow\ \gamma(0)=\frac{\sigma^2}{1-\phi^2}`]
      ],
      sources:[['Chapter 2 · PDF 第 3 页：均值、方差与弱平稳','chapter-02-stationarity-trend-seasonality.pdf',3],['Chapter 4B · PDF 第 6 页：白噪声展开','chapter-04b-arima.pdf',6]],sourceNote:'下方的 ±1 噪声例子是为解释定义补充的教学模型，符合白噪声条件；不是讲义原图，也不是上一节的正态模拟样本。',
      boundary:'φ = 1、c = 0 时 E[Xₜ] = 0，但 Var(Xₜ) = tσ²；均值不变仍然不平稳。这里讨论过去冲击驱动的因果解，不包含依赖未来冲击的非因果表示。',
      question:'Xₜ = 2 + 0.5Xₜ₋₁ + Zₜ，创新方差为 3，X₀ = 0 为固定值。Var(X₁) 是多少？',choices:['4','3','1.5'],correct:1,feedback:'v₀ = 0，所以 v₁ = 0.5² × 0 + 3 = 3。4 是因果平稳解的方差 3 / (1 − 0.5²)，不能直接用于这个固定初始化的第一步。',code:''
    },
    {id:'acf',group:1,title:'ACF：相隔 k 步，还剩多少线性相关？',short:'自相关 ACF',scene:'先读懂滞后 k，再区分总体相关与样本估计',
      body:'ACF 是一个函数：每给定一个间隔 k，就得到一个相关系数 ρ(k)。k = 1 比较相邻两期，k = 2 比较隔一期的两期。它衡量偏离均值是否倾向于同向，而不是两期数值是否相等，也不是因果效应。',takeaway:'总体 ACF 用 ρ(k)，一条有限样本算出的估计用 ρ̂(k)。对因果平稳、方差非零的 AR(1)，ρ(k) = φᵏ（k ≥ 0）。φ 为负时正负交替；|φ| 越接近 1，相关衰减越慢。',
      core:String.raw`\rho(k)=\operatorname{Corr}(X_t,X_{t-k})=\frac{\gamma(k)}{\gamma(0)}`,
      limit:String.raw`\operatorname{AR}(1):\quad\rho(k)=\phi^k\quad(k\ge0)`,condition:'总体公式适用于因果平稳 AR(1)：|φ| < 1、σ² > 0。γ(k) 是滞后 k 的自协方差，γ(0) 是过程方差。固定 X₀ = 0 的短样本不是从平稳分布初始化的；它的样本估计不必等于 φᵏ。',
      sources:[['Chapter 2 · PDF 第 4 页：ACF 定义','chapter-02-stationarity-trend-seasonality.pdf',4],['Chapter 2 · PDF 第 10 页：样本 ACF','chapter-02-stationarity-trend-seasonality.pdf',10],['Chapter 4B · PDF 第 8 页（讲义 33/59）','chapter-04b-arima.pdf',8]],sourceNote:'定义、样本估计和 AR(1) 总体公式分开标注，配对图是对样本公式的教学展开。',
      derivationTitle:'考试推导：为什么 AR(1) 的 ACF 是 φᵏ？',steps:[
        ['1 · 先中心化。平稳均值 μ = c / (1 − φ)，减去均值后常数项消失；中心化不改变协方差。',String.raw`Y_t=X_t-\mu,\qquad Y_t=\phi Y_{t-1}+Z_t`],
        ['2 · 定义自协方差。平稳保证它只依赖间隔 k，而不依赖选择哪一天 t。因为两期方差都为 γ(0)，相关系数的分母才可写成 γ(0)。',String.raw`\begin{aligned}\gamma(k)&=\operatorname{Cov}(Y_t,Y_{t-k})\\\rho(k)&=\frac{\gamma(k)}{\sqrt{\gamma(0)\gamma(0)}}=\frac{\gamma(k)}{\gamma(0)}\end{aligned}`],
        ['3 · 将递推代入第一个变量。对 k ≥ 1，Yₜ₋ₖ 属于过去，当前创新 Zₜ 与它不相关。另一个协方差的两期相距 k − 1，因此等于 γ(k − 1)。',String.raw`\begin{aligned}\gamma(k)&=\phi\operatorname{Cov}(Y_{t-1},Y_{t-k})\\&\quad+\underbrace{\operatorname{Cov}(Z_t,Y_{t-k})}_{0}\\&=\phi\gamma(k-1)\end{aligned}`],
        ['4 · 先写前两阶，再推广。除以非零的 γ(0)，得到 ACF；如果题目求自协方差，还需乘回过程方差。',String.raw`\begin{aligned}\gamma(1)&=\phi\gamma(0),\quad\gamma(2)=\phi^2\gamma(0)\\\rho(k)&=\phi^k\\\gamma(k)&=\rho(k)\gamma(0)=\frac{\sigma^2\phi^k}{1-\phi^2}\end{aligned}`],
        ['5 · k = 0 是变量与自身的相关，恒为 1。负滞后由对称性得到，不是把负 k 直接代入 φᵏ。',String.raw`\rho(0)=1,\qquad\rho(-k)=\rho(k),\qquad\rho(k)=\phi^{|k|}\quad(k\in\mathbb Z)`]
      ],
      boundary:'σ = 0 时平稳解方差为零，理论相关系数未定义；常数样本的样本 ACF 也未定义。不把短样本的偶然拖尾当成总体定律。',
      question:'因果平稳 AR(1) 的 φ = −0.5，ρ(2) 和 ρ(3) 分别是多少？',choices:['0.25、−0.125','−0.25、−0.125','0.25、0.125'],correct:0,feedback:'ρ(2) = (−0.5)² = 0.25，ρ(3) = (−0.5)³ = −0.125。间隔两步倾向同向，间隔三步倾向反向；这里是总体规律，不要求每一对实际观测都遵循它。',code:'k = 1\n# 因果平稳 AR(1) 的总体 ACF；不是从样本算出来的。\nrho = phi**k if abs(phi) < 1 and sigma_epsilon > 0 else None\n# 下式是样本估计，各阶统一使用全样本平方和作分母。\ncentered = x - x.mean()\ndenominator = centered @ centered\nrho_hat = (centered[k:] @ centered[:-k]) / denominator if denominator > 0 else None'
    },
    {id:'yule-walker',group:2,title:'从相关性，反推出 AR 系数',short:'AR(p) 与 Yule–Walker',scene:'用 AR(2) 算出两份记忆，再解两条方程',
      body:'Yule–Walker 把 AR 模型参数与自相关联系起来。知道 φ₁、φ₂，可以求各阶 ρ(k)；反过来，知道总体 ρ(1)、ρ(2)，也可以解出参数。矩阵不是额外的规则，只是把两条协方差方程排在一起。',takeaway:'先中心化，再对过去取协方差；用 γ(−k) = γ(k) 处理负滞后。总体 ACF 反解出真实参数；代入样本 ACF 时，得到的只能是参数估计。',
      core:String.raw`X_t=c+\sum_{i=1}^p\phi_iX_{t-i}+Z_t`,limit:String.raw`\begin{pmatrix}1&\rho(1)\\\rho(1)&1\end{pmatrix}\begin{pmatrix}\phi_1\\\phi_2\end{pmatrix}=\begin{pmatrix}\rho(1)\\\rho(2)\end{pmatrix}`,
      condition:'可操作例子为 AR(2)，固定 X₋₁ = X₀ = 0。总体相关与矩只在因果平稳且非退化的参数下显示。',
      derivationTitle:'Yule–Walker：从两条方程到矩阵',steps:[
        ['1 · 因果平稳且创新方差非零。先取期望求 μ，再令 Yₜ = Xₜ − μ 去掉常数。以下推导的是平稳总体关系，不是固定初值模拟路径的经验关系。',String.raw`\begin{aligned}\mu&=c+\phi_1\mu+\phi_2\mu=\frac{c}{1-\phi_1-\phi_2}\\Y_t&=\phi_1Y_{t-1}+\phi_2Y_{t-2}+Z_t\end{aligned}`],
        ['2 · 对 Yₜ₋ₖ 取协方差，k ≥ 1。第一项的间隔为 k − 1，第二项为 k − 2；当前创新与过去不相关。',String.raw`\begin{aligned}\gamma(k)&=\phi_1\gamma(k-1)+\phi_2\gamma(k-2)\\\gamma(-k)&=\gamma(k)\end{aligned}`],
        ['3 · 先取 k = 1。第二项出现 γ(−1)，用对称性换成 γ(1)，不是换成 0。再除以 γ(0)。',String.raw`\begin{aligned}\gamma(1)&=\phi_1\gamma(0)+\phi_2\gamma(-1)\\\rho(1)&=\phi_1+\phi_2\rho(1)\\\rho(1)&=\frac{\phi_1}{1-\phi_2}\end{aligned}`],
        ['4 · 再取 k = 2。第二项是 γ(0)，所以标准化后乘 φ₂ 的数是 1。后续各阶沿同一递推计算。',String.raw`\begin{aligned}\rho(2)&=\phi_1\rho(1)+\phi_2\\\rho(k)&=\phi_1\rho(k-1)+\phi_2\rho(k-2),\quad k\ge3\end{aligned}`],
        ['5 · 把上面 k = 1、2 的两式按未知数 φ₁、φ₂ 排列。对角线的 1 来自 ρ(0)；非对角线 ρ(1) 是两个预测变量 Yₜ₋₁、Yₜ₋₂ 的相关。右侧是当前值与这两个变量的相关。',String.raw`\begin{pmatrix}1&\rho(1)\\\rho(1)&1\end{pmatrix}\begin{pmatrix}\phi_1\\\phi_2\end{pmatrix}=\begin{pmatrix}\rho(1)\\\rho(2)\end{pmatrix}`],
        ['6 · 消元反解：第一式给出 φ₁ = ρ(1)(1 − φ₂)，代入第二式。非退化时 |ρ(1)| < 1，分母非零。',String.raw`\begin{aligned}\phi_2&=\frac{\rho(2)-\rho(1)^2}{1-\rho(1)^2}\\\phi_1&=\rho(1)(1-\phi_2)\end{aligned}`],
        ['7 · 求方差时不能直接把“创新与过去不相关”套在当前值 Yₜ 上，因为 Yₜ 本身包含 Zₜ，所以 Cov(Zₜ, Yₜ) = σ²。对模型两边与 Yₜ 取协方差，得到单独的 k = 0 方程。',String.raw`\begin{aligned}\gamma(0)&=\phi_1\gamma(1)+\phi_2\gamma(2)+\sigma^2\\\gamma(0)&=\frac{\sigma^2}{1-\phi_1\rho(1)-\phi_2\rho(2)}\end{aligned}`],
        ['8 · 推广到 AR(p)：矩阵元素由两个预测变量的间隔决定，同一条对角线上的间隔相同，这就是 Toeplitz 结构。实际估计把总体 ρ 换成样本 ρ̂，解出 φ̂。',String.raw`R_{ij}=\rho(|i-j|),\quad r_i=\rho(i),\qquad R_p\boldsymbol\phi=\boldsymbol r_p`]
      ],
      sources:[['Chapter 4B · PDF 第 9–11 页：Yule–Walker','chapter-04b-arima.pdf',9],['Chapter 5 · PDF 第 24 页：样本参数估计','chapter-05-model-analysis.pdf',24]],sourceNote:'讲义的 αᵢ 统一记为 φᵢ。AR(2) 的逐步消元与下方数值例题是教学展开。',
      boundary:'AR(p) 因果平稳要求 Φ(y) = 1 − Σφᵢyⁱ 的所有根在单位圆外。AR(2) 等价条件是 |φ₂| < 1、φ₁ + φ₂ < 1、φ₂ − φ₁ < 1。不要对每个系数单独套 |φᵢ| < 1。',
      question:'φ₁ = 0.5、φ₂ = 0.2 时，总体 ρ(1) 是多少？',choices:['0.5','0.625','0.7'],correct:1,feedback:'ρ(1) = φ₁ / (1 − φ₂) = 0.5 / 0.8 = 0.625。它并不等于 φ₁。',code:'rho1 = phi1 / (1 - phi2)\nrho2 = phi1 * rho1 + phi2\nR = np.array([[1, rho1], [rho1, 1]])\nrecovered_phi = np.linalg.solve(R, np.array([rho1, rho2]))'
    },
    {id:'pacf',group:3,title:'排除中间环节，还剩多少直接关系？',short:'PACF 与截尾',scene:'AR(2) 的总体 PACF：第二阶之后为零',
      body:'ACF 比较两端的全部线性相关。PACF 先用中间滞后分别线性预测两端，再比较两端剩下的残差。这里“排除影响”是具体的线性回归运算，不是删掉中间观测，也不是证明因果关系。',takeaway:'φₖ,ⱼ 表示“用 k 个滞后预测时，第 j 个滞后的系数”；PACF(k) 取最后一个 φₖ,ₖ。一般 φ₁,₁ ≠ 模型参数 φ₁；真正的 AR(p) 只在 p 阶以后总体 PACF 为零。',
      core:String.raw`\operatorname{PACF}(k)=\phi_{k,k}`,limit:String.raw`\operatorname{AR}(2):\quad\phi_{1,1}=\rho(1),\quad\phi_{2,2}=\phi_2,\quad\phi_{k,k}=0\ (k>2)`,
      condition:'本图是因果平稳 AR(2) 的总体 PACF，不是样本估计。σ = 0 时相关系数未定义，不绘制总体 PACF。',
      derivationTitle:'先算二阶残差相关，再理解截尾',steps:[
        ['1 · k = 1 时两端之间没有中间变量，因此不需要控制任何东西。第一阶 PACF 就是第一阶 ACF，不一定等于 AR(2) 模型的 φ₁。',String.raw`\operatorname{PACF}(1)=\phi_{1,1}=\rho(1)`],
        ['2 · k = 2 时，中间只有 Yₜ₋₁。先用它分别预测 Yₜ 和 Yₜ₋₂。平稳性保证两次单变量回归的系数都等于 ρ(1)。U、V 是预测后的剩余部分。',String.raw`\begin{aligned}U&=Y_t-\rho(1)Y_{t-1}\\V&=Y_{t-2}-\rho(1)Y_{t-1}\end{aligned}`],
        ['3 · 展开残差的协方差。两个减去的交叉项各为 ρ(1)γ(1)，最后加回 ρ(1)²γ(0)，整理后只剩一个扣除项。',String.raw`\begin{aligned}\operatorname{Cov}(U,V)&=\gamma(2)-2\rho(1)\gamma(1)+\rho(1)^2\gamma(0)\\&=\gamma(0)[\rho(2)-\rho(1)^2]\\\operatorname{Var}(U)&=\operatorname{Var}(V)=\gamma(0)[1-\rho(1)^2]\end{aligned}`],
        ['4 · 把残差协方差除以残差标准差乘积，γ(0) 抵消。这与上一节二阶 Yule–Walker 消元所得的末项系数相同。注意不是简单地拿 ρ(2) − ρ(1)，也不能只减去 ρ(1)² 而不标准化。',String.raw`\operatorname{PACF}(2)=\operatorname{Corr}(U,V)=\frac{\rho(2)-\rho(1)^2}{1-\rho(1)^2}=\phi_{2,2}`],
        ['5 · 一般的 k 阶定义：用过去 k 个变量做最佳线性预测。第一下标 k 是拟合阶数，第二下标 j 是该系数对应的滞后；只取最后一个系数作为这一阶 PACF。',String.raw`\widehat Y_t^{(k)}=\sum_{j=1}^k\phi_{k,j}Y_{t-j},\qquad\operatorname{PACF}(k)=\phi_{k,k}`],
        ['6 · 为什么 AR(2) 在二阶后截尾？使用两期过去后，预测残差已经是 Zₜ，它与所有更早变量都不相关。再加入第三期或更早变量，不能改善最佳线性预测；非退化条件保证新增系数为零。',String.raw`\begin{aligned}\widehat Y_t^{(k)}&=\phi_1Y_{t-1}+\phi_2Y_{t-2},\quad k\ge2\\\phi_{k,1}&=\phi_1,\quad\phi_{k,2}=\phi_2,\quad\phi_{k,j}=0\ (j>2)\\\operatorname{PACF}(k)&=0\quad(k>2)\end{aligned}`]
      ],
      sources:[['Chapter 5 · PDF 第 1 页：PACF 的方程定义','chapter-05-model-analysis.pdf',1],['Chapter 5 · PDF 第 8–9 页：样本 PACF 与递推','chapter-05-model-analysis.pdf',8]],sourceNote:'讲义给出线性预测方程与 Durbin–Levinson 算法。二阶残差的逐项计算是为解释“控制中间滞后”补充的推导。',
      boundary:'只有模型真为 AR(p)、且满足相应非退化平稳条件时才有总体截尾性质。φ₂ = 0 会降为 AR(1)，此时第二阶也为零。样本图上的少数越界点不能直接证明阶数。',
      question:'对本节 AR(2)，ACF 拖尾而总体 PACF 从第几阶开始为零？',choices:['第 2 阶','第 3 阶','永远不为零'],correct:1,feedback:'在第 2 阶之后截尾，即第 3 阶起为零。如果 φ₂ = 0，模型会进一步退化为 AR(1)。',code:'from statsmodels.tsa.stattools import pacf\n# This is a sample estimate, not the population PACF shown above.\nsample_pacf = pacf(x, nlags=7, method="ywm")'
    }
  ]
};
