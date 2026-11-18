(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const state = {phi: .65, sigma: 1, c: 0, n: 32, seed: 4650, lesson: 0};
  const total = 100;
  let innovations = [], values = [], timer = null, frame = null;
  const horizon=()=>state.lesson===1?6:total;
  const lessons = [
    {
      title: '下一刻，是怎样发生的？',
      body: '<p>AR(1) 只记住<strong>上一时刻</strong>。把 X<sub>t−1</sub> 乘以 φ，加上常数 c，再加一次新的随机冲击 ε<sub>t</sub>，就得到 X<sub>t</sub>。</p><p>先看当前一步的数值，再生成下一刻。新冲击既可能放大上一刻的变化，也可能把它抵消。</p><p>这里假设 ε<sub>t</sub> 独立同分布，均值为 0、方差为 σ²；模拟使用正态冲击。</p>',
      takeaway: 'φ 决定过去留下多少；σ 决定每次新冲击有多大。它们不是同一个东西。',
      question: '当 φ = 0 时，Xₜ 还依赖 Xₜ₋₁ 吗？',
      choices: ['不依赖，只剩 c + εₜ', '仍然依赖上一时刻'], correct: 0,
      feedback: 'φ = 0 时，Xₜ = c + εₜ。在这里的独立冲击假设下，不同时刻的观测也独立。',
      derivationTitle: '递推展开：过去藏在哪里',
      derivation: '<p>把 X<sub>t−1</sub> 再替换一次，得到：</p><div class="math-line">X<sub>t</sub> = c(1 + φ) + φ²X<sub>t−2</sub> + ε<sub>t</sub> + φε<sub>t−1</sub></div><p>继续替换，直到固定的初始值 X₀：</p><div class="math-line">X<sub>t</sub> = φ<sup>t</sup>X₀ + c ∑<sub>j=0</sub><sup>t−1</sup> φ<sup>j</sup> + ∑<sub>j=0</sub><sup>t−1</sup> φ<sup>j</sup>ε<sub>t−j</sub></div><p>最后一项解释了“记忆”：j 步以前的冲击，现在仍带着权重 φ<sup>j</sup>。改变参数时，本页保留同一组标准正态随机数，只按 σ 重新缩放。</p>'
    },
    {
      title: '一次冲击，能留下多久？',
      body: '<p>设两条路径拥有相同初始值和后续冲击，只在某一时刻，其中一条<strong>额外增加 1 单位冲击</strong>。</p><p>这一刻的差是 1，下一刻是 φ，再下一刻是 φ²。右图现在展示这次额外冲击留下的回声。</p><p>选择负相关时，回声会正负交替；把 |φ| 调到接近 1，回声就会消退得更慢。</p>',
      takeaway: '冲击 h 步后的影响是 φʰ。符号决定方向，绝对值决定消退速度。',
      question: 'φ = −0.65 时，为什么路径经常上下交替？',
      choices: ['因为冲击必定正负交替', '因为 φ 的幂正负交替'], correct: 1,
      feedback: 'φ < 0 使 φʰ 的符号随 h 交替，但随机冲击本身并不需要交替，实际序列也不会每一步都交替。',
      derivationTitle: '用两条路径的差消去随机项',
      derivation: '<p>设额外冲击发生在时刻 s。之后两条路径使用相同的 ε，因此差值 Δ 满足：</p><div class="math-line">Δ<sub>s</sub> = 1,　Δ<sub>s+1</sub> = φ,　Δ<sub>s+h</sub> = φ<sup>h</sup></div><p>|φ| &lt; 1 时，φ<sup>h</sup> → 0；φ = 1 时，影响永久保留；φ = −1 时，影响不衰减但正负交替；|φ| &gt; 1 时，递推会放大这次冲击。</p><p class="math-note">这里画的是“多一次冲击后两条路径的差”，不是另一条带噪声的样本路径。c 和 σ 不改变单位冲击响应 φʰ。</p>'
    },
    {
      title: '平稳，为什么有一道边界？',
      body: '<p>过去的影响会不会不断累积？答案藏在 <strong>φ² 的几何级数</strong>里。右图画的是每个时刻的理论方差，不是某条样本路径的波动平方。</p><p>选择随机游走 φ = 1：即使 c = 0，均值不随时间变，方差仍会越积越大。均值不变，并不足以说明弱平稳。</p><p>这里模拟从 X₀ = 0 出发。即使 |φ| &lt; 1，它也有过渡期，不能把有限样本直接叫作严格平稳序列。</p>',
      takeaway: '|φ| < 1 使初始影响消退，并保证因果平稳解的方差有限。',
      question: 'φ = 1、c = 0、σ > 0 且 X₀ = 0，Var(Xₜ) 是多少？',
      choices: ['σ²', 'tσ²', '0'], correct: 1,
      feedback: 'Xₜ 是 t 个独立冲击之和，所以 Var(Xₜ) = tσ²。虽然 E[Xₜ] = 0，方差仍依赖 t。',
      derivationTitle: '从有限时刻的方差，到平稳方差',
      derivation: '<p>固定 X₀ = 0，独立冲击使交叉协方差为 0，于是：</p><div class="math-line">E[X<sub>t</sub>] = c ∑<sub>j=0</sub><sup>t−1</sup> φ<sup>j</sup>，　Var(X<sub>t</sub>) = σ² ∑<sub>j=0</sub><sup>t−1</sup> φ<sup>2j</sup></div><p>只有 |φ| &lt; 1 时，几何级数才收敛。对应因果平稳解：</p><div class="math-line">μ = c / (1 − φ)，　γ₀ = σ² / (1 − φ²)</div><p>平稳初始化可取 X₀ ∼ N(μ, γ₀)，并与未来冲击独立；本页为方便比较，始终使用 X₀ = 0。当 σ = 0 时没有随机冲击，退化情形须单独讨论。</p><p class="math-note">这里讨论由过去冲击驱动的因果解。|φ| &gt; 1 可以涉及依赖未来冲击的非因果平稳解，不属于本页从 X₀ 向前递推的设定。</p>'
    },
    {
      title: '把“记忆”读成一张 ACF',
      body: '<p>ACF 问的是：相隔 h 步的两个观测，相关程度有多大？对 |φ| &lt; 1 的<strong>因果平稳 AR(1)</strong>，答案非常简洁：ρ(h) = φʰ。</p><p>酒红色是理论 ACF；暗金色是当前已生成样本算出的 ACF。增加观测后，两者仍不一定完全重合。</p><p>短样本、随机波动和从零开始的过渡期，都会造成差异。一次样本图像不是理论本身。</p>',
      takeaway: '理论 ACF 描述一个过程；样本 ACF 是带有误差的估计。',
      question: '样本 ACF 没有准确落在 φʰ 上，说明模拟一定错了吗？',
      choices: ['不一定，有限样本会有误差', '一定，二者应该完全重合'], correct: 0,
      feedback: '不一定。样本 ACF 有抽样波动，本页还使用固定 X₀ = 0。样本增多有助于估计，但不保证某一条路径单调地接近理论。',
      derivationTitle: '为什么 ρ(h) = φʰ',
      derivation: '<p>在因果平稳解下，令 Y<sub>t</sub> = X<sub>t</sub> − μ，则 Y<sub>t</sub> = φY<sub>t−1</sub> + ε<sub>t</sub>。对 h ≥ 1：</p><div class="math-line">γ(h) = Cov(Y<sub>t</sub>, Y<sub>t−h</sub>) = φγ(h−1)</div><p>这一步用到了当前冲击 ε<sub>t</sub> 与过去 Y<sub>t−h</sub> 不相关。递推得到 γ(h) = φ<sup>h</sup>γ(0)，所以：</p><div class="math-line">ρ(h) = γ(h) / γ(0) = φ<sup>h</sup></div><p>暗金色样本 ACF 使用所有当前观测的样本均值 x̄，并采用以下有偏自协方差比值（分母不随 h 改变）：</p><div class="math-line">r(h) = [∑<sub>i=h</sub><sup>n−1</sup>(x<sub>i</sub>−x̄)(x<sub>i−h</sub>−x̄)] / [∑<sub>i=0</sub><sup>n−1</sup>(x<sub>i</sub>−x̄)²]</div><p class="math-note">|φ| ≥ 1 时不画因果平稳理论 ACF；σ = 0 时平稳解方差为 0，相关系数没有定义。常数样本的样本 ACF 同样没有定义。</p>'
    }
  ];

  const formulae = [
    {
      core: String.raw`X_t=c+\color{#82612e}{\phi X_{t-1}}+\color{#8a3e3c}{\varepsilon_t}`,
      note: 'φ 是记忆系数；c 是常数项；εₜ 独立同分布，均值 0、方差 σ²。本页从固定 X₀ = 0 开始。',
      derivation: [String.raw`X_t=c(1+\phi)+\phi^2X_{t-2}+\varepsilon_t+\phi\varepsilon_{t-1}`,String.raw`X_t=\phi^tX_0+c\sum_{j=0}^{t-1}\phi^j+\sum_{j=0}^{t-1}\phi^j\varepsilon_{t-j}`]
    },
    {
      core: String.raw`\Delta_h=\phi^h\Delta_0,\qquad\Delta_0=1`,
      note: 'Δₕ 是多一次单位冲击后，两条路径在 h 步后的差。常数项和后续相同的冲击在相减时抵消。',
      derivation: [String.raw`\Delta_s=1,\quad\Delta_{s+1}=\phi,\quad\Delta_{s+h}=\phi^h`]
    },
    {
      core: String.raw`\operatorname{Var}(X_t)=\sigma^2\sum_{j=0}^{t-1}\phi^{2j}`,
      limit: String.raw`|\phi|<1\ \Longrightarrow\ \gamma_0=\frac{\sigma^2}{1-\phi^2}`,
      note: '固定 X₀ = 0；独立冲击的方差逐项相加。只有 |φ| < 1 时，上述几何级数才收敛；σ = 0 的退化情形另论。',
      derivation: [String.raw`\mathbb E[X_t]=c\sum_{j=0}^{t-1}\phi^j,\qquad\operatorname{Var}(X_t)=\sigma^2\sum_{j=0}^{t-1}\phi^{2j}`,String.raw`\mu=\frac{c}{1-\phi},\qquad\gamma_0=\frac{\sigma^2}{1-\phi^2}`]
    },
    {
      core: String.raw`\rho(h)=\frac{\gamma(h)}{\gamma(0)}=\phi^h`,
      note: '适用于 |φ| < 1 且 σ > 0 的因果平稳解。暗金色样本 ACF 是有限样本估计，不要求与理论逐点重合。',
      derivation: [String.raw`\gamma(h)=\operatorname{Cov}(Y_t,Y_{t-h})=\phi\gamma(h-1)`,String.raw`\rho(h)=\frac{\gamma(h)}{\gamma(0)}=\phi^h`,String.raw`r(h)=\frac{\sum_{i=h}^{n-1}(x_i-\bar x)(x_{i-h}-\bar x)}{\sum_{i=0}^{n-1}(x_i-\bar x)^2}`]
    }
  ];
  function typeset(tex, target) {
    if(window.katex)window.katex.render(tex,target,{throwOnError:false,output:'htmlAndMathml',strict:'warn'});
    else target.textContent=tex;
  }
  function showFormula(index) {
    const f=formulae[index];typeset(f.core,$('core-formula'));
    $('formula-limit').hidden=!f.limit;if(f.limit)typeset(f.limit,$('formula-limit'));
    $('formula-condition').textContent=f.note;
    document.querySelectorAll('#derivation-body .math-line').forEach((el,i)=>{if(f.derivation[i])typeset(f.derivation[i],el);});
  }

  // Seeded innovations make parameter comparisons use exactly the same shocks.
  function makeInnovations(seed) {
    let a = seed >>> 0;
    const uniform = () => {
      a += 0x6D2B79F5;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    return Array.from({length: total}, () => Math.sqrt(-2 * Math.log(1 - uniform())) * Math.cos(2 * Math.PI * uniform()));
  }
  function simulate() {
    values = [0];
    for (let i = 0; i < total; i++) values.push(state.c + state.phi * values[i] + state.sigma * innovations[i]);
  }
  function format(x) {
    if (Math.abs(x) >= 10000) return x.toExponential(2);
    return (Math.abs(x) < .0005 ? 0 : x).toFixed(3);
  }
  function acf(data, maxLag = 12) {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const centered = data.map(v => v - mean);
    const denominator = centered.reduce((a, b) => a + b * b, 0);
    if (denominator < 1e-14) return [];
    return Array.from({length: Math.min(maxLag + 1, data.length)}, (_, lag) => {
      let sum = 0;
      for (let i = lag; i < data.length; i++) sum += centered[i] * centered[i - lag];
      return sum / denominator;
    });
  }
  function finiteVariances() {
    const result = [0];
    for (let t = 1; t <= total; t++) result.push(state.phi ** 2 * result[t - 1] + state.sigma ** 2);
    return result;
  }
  function surface(id) {
    const canvas = $(id), rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.font = '10px system-ui, sans-serif';
    return {ctx, w: rect.width, h: rect.height};
  }
  function axes(s, minY, maxY, maxX, yLabel, ticks = 4) {
    const {ctx, w, h} = s;
    const left = Math.max(Math.abs(minY), Math.abs(maxY)) >= 10000 ? 55 : 37;
    const box = {left, right:w-12, top:18, bottom:h-26};
    const inset=maxX===6?20:0;
    const x = t => box.left + inset + t / maxX * (box.right-box.left-2*inset);
    const y = v => box.bottom - (v-minY)/(maxY-minY)*(box.bottom-box.top);
    ctx.textAlign='right';
    for(let i=0;i<=ticks;i++) {
      const v=minY+(maxY-minY)*i/ticks, py=y(v);
      ctx.strokeStyle='#e3d4b7';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(box.left,py);ctx.lineTo(box.right,py);ctx.stroke();
      ctx.fillStyle='#796145';ctx.fillText(Math.abs(v)>=10000?v.toExponential(0):Math.abs(v)<.00001?'0':v.toFixed(Math.abs(maxY-minY)>20?0:1),box.left-7,py+3);
    }
    ctx.textAlign='center';
    const xTicks=maxX===6?6:4;
    for(let i=0;i<=xTicks;i++){const t=Math.round(maxX*i/xTicks);ctx.fillStyle='#796145';ctx.fillText(t,x(t),h-8);}
    ctx.textAlign='left';ctx.fillStyle='#796145';ctx.fillText(yLabel,box.left,10);
    if(minY<0&&maxY>0){ctx.strokeStyle='#bdc7be';ctx.beginPath();ctx.moveTo(box.left,y(0));ctx.lineTo(box.right,y(0));ctx.stroke();}
    return {x,y,box};
  }
  function line(s, points, x, y, color, width=2) {
    if(!points.length)return;
    const {ctx}=s;ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;
    points.forEach((v,i)=>i===0?ctx.moveTo(x(i),y(v)):ctx.lineTo(x(i),y(v)));ctx.stroke();
  }
  function draw() {
    const seen=values.slice(0,state.n+1);
    const s=surface('series');
    const bound=Math.max(4,...seen.map(Math.abs))*1.16;
    const {x,y,box}=axes(s,-bound,bound,Math.max(20,state.n),'X');
    if(Math.abs(state.phi)<1){
      const mean=state.c/(1-state.phi);
      if(Math.abs(mean)<bound){s.ctx.setLineDash([4,4]);s.ctx.strokeStyle='#a17728';s.ctx.beginPath();s.ctx.moveTo(box.left,y(mean));s.ctx.lineTo(box.right,y(mean));s.ctx.stroke();s.ctx.setLineDash([]);s.ctx.fillStyle='#8d6826';s.ctx.fillText('μ',box.right-8,y(mean)-5);}
    }
    line(s,seen,x,y,'#806238',2);
    s.ctx.fillStyle='#7f3f43';s.ctx.beginPath();s.ctx.arc(x(state.n),y(seen[seen.length-1]),3.6,0,Math.PI*2);s.ctx.fill();
    $('series').setAttribute('aria-label',`从 X0 = 0 开始的模拟序列，当前 t = ${state.n}，X = ${format(values[state.n])}，纵轴范围 ${format(-bound)} 至 ${format(bound)}`);
    const r=surface('secondary');
    if(state.lesson===1){
      const response=Array.from({length:7},(_,h)=>state.phi**h);
      const top=Math.max(1.1,...response)*1.05,bottom=Math.min(-.2,...response)*1.1;
      const a=axes(r,bottom,top,6,'冲击留下的影响');
      response.forEach((v,i)=>{
        const width=Math.min(34,(a.box.right-a.box.left)/12),px=a.x(i);
        r.ctx.fillStyle=i>state.n?'#e2e8df':v>=0?'#24766e':'#cf603f';
        r.ctx.fillRect(px-width/2,Math.min(a.y(0),a.y(v)),width,Math.max(2,Math.abs(a.y(v)-a.y(0))));
        r.ctx.textAlign='center';r.ctx.font='11px system-ui';
        if(i<=state.n)r.ctx.fillText(v.toFixed(2),px,v>=0?a.y(v)-8:a.y(v)+15);
      });
      $('secondary-title').textContent='单位冲击响应 φʰ';
      document.querySelector('.acf-figure .legend').hidden=true;
      $('secondary-note').textContent='h = 0 时额外冲击为 1；此后不再追加冲击。';
      $('secondary').setAttribute('aria-label',`单位冲击响应，phi = ${state.phi}，h = 6 时的影响为 ${format(response[6])}`);
    }else if(state.lesson===2){
      const variance=finiteVariances();
      const stable=Math.abs(state.phi)<1;
      const limit=stable?state.sigma**2/(1-state.phi**2):0;
      const a=axes(r,0,Math.max(1,variance[total],limit)*1.12,total,'Var');
      if(stable){r.ctx.strokeStyle='#7f3f43';r.ctx.setLineDash([4,4]);r.ctx.beginPath();r.ctx.moveTo(a.box.left,a.y(limit));r.ctx.lineTo(a.box.right,a.y(limit));r.ctx.stroke();r.ctx.setLineDash([]);}
      line(r,variance.slice(0,state.n+1),a.x,a.y,'#806238');
      r.ctx.fillStyle='#806238';r.ctx.beginPath();r.ctx.arc(a.x(state.n),a.y(variance[state.n]),3,0,2*Math.PI);r.ctx.fill();
      $('secondary-title').textContent='从零出发的理论方差';
      const legend=document.querySelector('.acf-figure .legend');legend.hidden=false;legend.innerHTML='<i class="theory"></i>平稳极限 <i class="sample"></i>Var(Xₜ)';
      $('secondary-note').textContent=`Var(X${state.n}) = ${format(variance[state.n])}。`+(stable?'红虚线为 σ² / (1 − φ²)。':state.sigma===0?'σ = 0，方差始终为 0。':'当前递推的方差没有有限极限，不画红虚线。');
      $('secondary').setAttribute('aria-label',`从固定初始值出发的理论方差，t = ${state.n} 时为 ${format(variance[state.n])}`);
    }else{
      $('secondary-title').textContent='自相关 ACF';document.querySelector('.acf-figure .legend').hidden=false;
      document.querySelector('.acf-figure .legend').innerHTML='<i class="theory"></i>理论 <i class="sample"></i>样本';
      const a=axes(r,-1.12,1.12,12,'ρ');
      const theoretical=Math.abs(state.phi)<1&&state.sigma>0;
      if(theoretical){const theory=Array.from({length:13},(_,h)=>state.phi**h);line(r,theory,a.x,a.y,'#7f3f43',1.7);theory.forEach((v,h)=>{r.ctx.fillStyle='#7f3f43';r.ctx.beginPath();r.ctx.arc(a.x(h),a.y(v),2,0,Math.PI*2);r.ctx.fill();});}
      const sample=acf(seen);
      sample.forEach((v,h)=>{const px=a.x(h)+2;r.ctx.strokeStyle='#806238';r.ctx.lineWidth=2;r.ctx.beginPath();r.ctx.moveTo(px,a.y(0));r.ctx.lineTo(px,a.y(v));r.ctx.stroke();});
      $('secondary-note').textContent=!theoretical?'当前参数下，因果平稳理论 ACF 未定义。'+(!sample.length?'样本方差为 0，样本 ACF 也未定义。':'暗金色仅为有限样本的描述。'):!sample.length?'样本方差为 0，暂不绘制样本 ACF。':'理论 ρ(h) = φʰ；样本估计包含有限样本误差。';
      $('secondary').setAttribute('aria-label',`自相关图：${theoretical?'理论自相关为 phi 的 h 次幂':'当前参数下理论自相关未定义'}；样本使用 ${seen.length} 个观测。`);
    }
  }
  function schedule(){if(frame===null)frame=requestAnimationFrame(()=>{frame=null;draw();});}
  function update(){
    $('phi-value').textContent=state.phi.toFixed(2);$('sigma-value').textContent=state.sigma.toFixed(1);$('constant-value').textContent=state.c.toFixed(1);
    $('phi').value=state.phi;$('sigma').value=state.sigma;$('constant').value=state.c;$('time').max=horizon();$('time').value=state.n;$('time-value').textContent=`${state.lesson===1?'h':'t'} = ${state.n}`;
    const stable=Math.abs(state.phi)<1;
    $('stability').classList.toggle('unstable',!stable);
    $('stability').textContent=stable?'|φ| < 1 · 初始影响消退':Math.abs(state.phi)===1?'|φ| = 1 · 单位根边界':'|φ| > 1 · 递推放大';
    $('mean').textContent=stable?format(state.c/(1-state.phi)):'不适用';
    $('variance').textContent=stable?format(state.sigma**2/(1-state.phi**2)):'不适用';
    $('current').textContent=format(values[state.n]);$('metric-label').textContent=`当前观测 X（t = ${state.n}）`;
    $('calculation-label').textContent=state.n?'当前一步':'初始状态';
    $('calculation').innerHTML=state.n?`X<sub>${state.n}</sub> = ${format(state.c)} + <em>${format(state.phi)} × (${format(values[state.n-1])})</em> + <b>(${format(state.sigma*innovations[state.n-1])})</b> = ${format(values[state.n])}`:'X<sub>0</sub> = 0，尚未加入随机冲击。';
    document.querySelectorAll('[data-phi]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.phi)===state.phi)));
    $('step').disabled=state.n>=horizon();
    document.querySelector('.formula-strip').classList.toggle('is-invalid',state.lesson===3&&(!stable||state.sigma===0));
    updateScene();
    schedule();
    window.dispatchEvent(new Event('ar1:change'));
  }
  function updateScene(){
    const short=v=>Math.abs(v)>=1000?v.toExponential(0):v.toFixed(Math.abs(v)>=10?1:3);
    const prev=state.n?values[state.n-1]:0;
    const shock=state.n?state.sigma*innovations[state.n-1]:0;
    $('previous-caption').textContent=state.n?'上一刻':'初始状态';
    $('previous-value').textContent=state.n?short(prev):'—';
    $('previous-symbol').innerHTML=state.n?`X<sub>${state.n-1}</sub>`:'尚未递推';
    $('memory-caption').textContent=`× ${state.phi.toFixed(2)}`;
    $('memory-value').textContent=state.n?short(state.phi*prev):'—';
    $('shock-time').textContent=state.n;
    $('shock-value').textContent=state.n?(shock>=0?'+':'')+short(shock):'—';
    $('drift-value').textContent=`常数 c = ${state.c.toFixed(2)}`;
    $('result-value').textContent=short(values[state.n]);
    $('result-symbol').innerHTML=`X<sub>${state.n}</sub>`;
    $('process-diagram').setAttribute('aria-label',state.n?`上一刻 ${format(prev)}，乘以 ${state.phi} 留下 ${format(state.phi*prev)}，加上冲击 ${format(shock)} 和常数 ${state.c}，得到 ${format(values[state.n])}`:'初始状态 X0 = 0，尚未递推');
    const magnitude=Math.round(Math.abs(state.phi)*100);
    $('parameter-hint').textContent=state.phi===0?'过去的影响，在下一步归零。':state.phi===1?'过去的影响原样保留，不再衰减。':state.phi===-1?'影响不衰减，但每一步都会反向。':Math.abs(state.phi)>1?`每一步放大到 ${magnitude}%${state.phi<0?'，同时反向':''}。`:`每一步保留 ${magnitude}%${state.phi<0?'，同时反向':''}。`;
    const texts=[
      state.n?`过去留下 <b>${short(state.phi*prev)}</b>，新冲击带来 <b>${short(shock)}</b>${state.c!==0?`，再加常数 ${short(state.c)}`:''}，得到 <b>${short(values[state.n])}</b>。`:'从 X₀ = 0 开始；下一次递推才会加入第一份冲击。',
      `最初的 1 单位冲击，经过 ${state.n} 步后留下 <b>${short(state.phi**state.n)}</b>。${state.n===0?'还没有进入下一步。':state.phi<0?'正负交替，'+(Math.abs(state.phi)<1?'幅度在消退。':'幅度没有消退。'):Math.abs(state.phi)<1?'影响在消退。':Math.abs(state.phi)===1?'幅度没有消退。':'影响在放大。'}`,
      `到 t = ${state.n}，理论方差累积到 <b>${short(finiteVariances()[state.n])}</b>。${state.sigma===0?'没有随机冲击，方差始终为零。':Math.abs(state.phi)<1?'越久以前的冲击，贡献越小。':'过去的方差贡献没有消退，新的还在不断加入。'}`,
      Math.abs(state.phi)<1&&state.sigma>0?`隔 1 步的理论相关是 <b>${short(state.phi)}</b>，隔 2 步是 <b>${short(state.phi**2)}</b>。暗金色样本不必与酒红色理论完全重合。`:'当前参数没有可绘制的因果平稳理论 ACF；暗金色仅描述这条有限样本。'
    ];
    $('scene-explanation').innerHTML=texts[state.lesson];
    if(state.lesson===0&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
      document.querySelector('.result-node').animate([{background:'#e8bb9e'},{background:'#f8e4d9'}],{duration:550});
    }
  }
  function stop(){if(timer)clearInterval(timer);timer=null;$('play').setAttribute('aria-pressed','false');$('play').setAttribute('aria-label','播放');$('play').title='播放';$('play').querySelector('img').src='./icons/play.svg';$('play-label').textContent='播放递推';}
  function lesson(index){
    stop();const previousLesson=state.lesson;state.lesson=index;const l=lessons[index];
    if(index===1)state.n=0;else if(previousLesson===1)state.n=32;
    const copy=document.createElement('div');copy.innerHTML=l.body;
    $('lesson-index').textContent=`0${index+1} / 04`;$('lesson-title').textContent=l.title;$('lesson-body').innerHTML=copy.firstElementChild.outerHTML;$('lesson-detail').innerHTML=Array.from(copy.children).slice(1).map(el=>el.outerHTML).join('');$('takeaway').textContent=l.takeaway;
    $('process-diagram').hidden=index!==0;
    $('scene-title').textContent=['过去留下的部分，与新的冲击相加','一份 +1 冲击，沿时间留下的回声','同一过程的理论方差，如何随时间累积','隔得越远，两个观测还剩多少相关'][index];
    $('guide-title').textContent=['一次递推','冲击的回声','平稳的边界','读懂 ACF'][index];
    document.querySelector('.calculation').hidden=index!==0;
    $('lesson-progress').textContent=`${index+1} / 4`;$('previous').disabled=index===0;$('next').disabled=index===3;
    document.querySelectorAll('[data-lesson]').forEach(b=>{if(Number(b.dataset.lesson)===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    $('question').textContent=l.question;$('feedback').textContent='';$('feedback').className='';$('choices').replaceChildren();
    l.choices.forEach((text,i)=>{const button=document.createElement('button');button.type='button';button.textContent=text;button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>{Array.from($('choices').children).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('feedback').textContent=(i===l.correct?'答对了。':'再想一下。')+l.feedback;$('feedback').className=i===l.correct?'correct':'incorrect';});$('choices').appendChild(button);});
    $('derivation-title').textContent=l.derivationTitle;$('derivation-body').innerHTML=l.derivation;showFormula(index);update();
  }
  ['phi','sigma','constant'].forEach(id=>$(id).addEventListener('input',()=>{stop();state[id==='constant'?'c':id]=Number($(id).value);simulate();update();}));
  document.querySelectorAll('[data-phi]').forEach(b=>b.addEventListener('click',()=>{stop();state.phi=Number(b.dataset.phi);simulate();update();}));
  document.querySelectorAll('[data-lesson]').forEach(b=>b.addEventListener('click',()=>lesson(Number(b.dataset.lesson))));
  $('previous').addEventListener('click',()=>lesson(Math.max(0,state.lesson-1)));$('next').addEventListener('click',()=>lesson(Math.min(3,state.lesson+1)));
  $('step').addEventListener('click',()=>{stop();state.n=Math.min(horizon(),state.n+1);update();});
  $('reset').addEventListener('click',()=>{stop();state.n=0;update();});
  $('time').addEventListener('input',()=>{stop();state.n=Number($('time').value);update();});
  $('resample').addEventListener('click',()=>{stop();innovations=makeInnovations(++state.seed);simulate();update();});
  $('play').addEventListener('click',()=>{
    if(timer){stop();return;}if(state.n>=horizon())state.n=0;
    $('play').setAttribute('aria-pressed','true');$('play').setAttribute('aria-label','暂停');$('play').title='暂停';$('play').querySelector('img').src='./icons/pause.svg';
    $('play-label').textContent='暂停';
    timer=setInterval(()=>{state.n=Math.min(horizon(),state.n+1);update();if(state.n===horizon())stop();},950);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();}).observe(document.querySelector('.experiment'));
  new ResizeObserver(schedule).observe(document.querySelector('.lesson-page'));
  innovations=makeInnovations(state.seed);simulate();lesson(0);
  // Kept read-only for deterministic regression checks and future article embeds.
  window.AR1Demo=Object.freeze({snapshot:()=>({...state,values:[...values],innovations:[...innovations],sampleACF:acf(values.slice(0,state.n+1)),finiteVariances:finiteVariances()})});
})();
