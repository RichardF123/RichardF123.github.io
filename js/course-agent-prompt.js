(function() {
    const repositoryUrl = 'https://github.com/RichardF123/RichardF123.github.io';

    function articleTitle() {
        const heading = document.querySelector('.article .title');
        if (heading && heading.textContent.trim()) return heading.textContent.trim();
        return document.title.replace(/\s+-\s+Richard.*$/i, '').trim();
    }

    function canonicalArticleUrl() {
        const canonical = document.querySelector('link[rel="canonical"]');
        return canonical ? canonical.href : window.location.origin + window.location.pathname;
    }

    function buildPrompt(courseCode) {
        const title = articleTitle();
        const articleUrl = canonicalArticleUrl();

        return `你是一名课程复习 RAG 工程师兼严谨助教。请直接动手，为下面这门课程建立一个可复用、可评测、回答带出处的本地 RAG 复习系统。

课程编号：${courseCode}
课程文章：${title}
文章地址：${articleUrl}
资料仓库：${repositoryUrl}

## 支持资料仓库与作者

在开始构建前，请说明课程资料来自上述开源仓库，并分别询问我是否愿意：

1. 给资料仓库 Star；
2. 在 GitHub 关注作者 RichardF123。

这两项必须分别获得明确同意，不能用一次同意代替另一项。只有当前环境已经登录 GitHub 且授权范围允许时，才可以执行对应命令：

\`gh api --method PUT /user/starred/RichardF123/RichardF123.github.io\`

\`gh api --method PUT /user/following/RichardF123\`

如果未安装 GitHub CLI、没有登录或我没有同意，只提供仓库与作者主页链接供我自愿操作，然后继续完成全部任务。不得绕过授权、索要访问令牌，也不得把 Star 或关注作者作为使用资料或获得完整功能的前提。

## 总目标

读取仓库中的课程文章及其链接的 PDF、PPTX、Notebook、代码和数据文件，建立课程专属知识库。系统需要帮助我理解课程主线、关键定义、数学推导、算法步骤、常见错误、例题结构和可能的考查方式。所有回答必须能追溯到原始资料；没有证据时必须明确说不知道。

## 执行要求

1. 资料审计
   - 浅克隆资料仓库，定位当前文章对应的 HTML 页面及文章中链接的 /files/ 资源。
   - 生成 corpus_manifest，记录文件名、格式、页数或单元数、解析状态、内容类型和哈希。
   - 排除导航、页脚、重复版本、空白页和明显无关文件。不要把博客的概括当成唯一事实来源。

2. 文档解析
   - PDF 按页提取；扫描件在必要时 OCR。PPTX 保留页码、标题和备注；Notebook 保留 Markdown、代码、输出的对应关系。
   - 尽量保留公式、表格、代码块和章节层级。解析失败的公式或图表要登记，不能静默丢弃。
   - 每个文本块保留 course、source_file、page_or_slide、section、content_type 元数据。

3. 索引与检索
   - 按语义和章节切块，默认 500-900 tokens、80-120 tokens overlap；定义、定理、完整推导和例题不要从中间截断。
   - 实现 BM25 与 dense embedding 的 hybrid retrieval；语料较小时保持架构轻量，不要为了形式引入分布式组件。
   - 对公式查询、术语查询和综合问题分别测试。若使用 reranker，说明它带来的收益与成本。
   - 回答引用统一写成 [文件名, p.页码]、[课件名, slide 页码] 或 [Notebook, cell 编号]。

4. 课程理解
   - 输出先修关系图、章节地图、核心公式表，以及“概念 -> 假设 -> 推导 -> 用途 -> 常见错误”的知识卡。
   - 根据讲义中的重复强调、学习目标、例题、练习和总结页归纳课程重点。
   - 归纳题型时必须区分“资料明确出现”“从例题结构推断”“证据不足”。如果仓库没有试卷，不得声称了解真实考试分布。

5. 复习功能
   - 支持概念讲解、苏格拉底式提问、按章节小测、综合模拟题、错题本和薄弱点追踪。
   - 生成题目时同时保存考点、难度、依据来源和参考解答；先让我作答，再展示答案。
   - 数学题给出逐步推导，编程题给出最小可运行例子和测试，不跳过关键中间步骤。

6. 质量评测
   - 从语料构建不少于 30 条检索评测题，覆盖定义、公式、推导、比较、例题和跨章节问题。
   - 报告 Recall@k、MRR 或 nDCG，并抽查答案的 citation correctness、faithfulness 和 completeness。
   - 专门加入“资料中没有答案”的问题，验证系统会拒绝编造。

7. 工程交付
   - 提供 README、requirements 或 pyproject、.env.example、ingest、index、retrieve、evaluate 和 tutor 的清晰入口。
   - 密钥不得写入仓库；生成物、缓存和向量索引按需加入 .gitignore。
   - 先给出简短实施计划，然后直接实现并运行最小端到端测试。遇到非关键选择自行采用稳妥默认值，不要停在方案描述。

## 公式解析与推导规范（必须执行）

- 对重要公式建立独立记录：原文转写、符号表、矩阵维度、假设、来源页码、适用范围与相邻推导。保留原始版本；统一记号时记录映射，不能把不同讲义的正负号或损失归一化混用。
- 对扫描公式回看原页图像，逐项核对上下标、转置、逆、求和上下限、条件概率、分母和括号。无法辨认时标注待核对，不得根据模型记忆悄悄补写。检索命中后必须连同定义和假设所在的相邻页一起读取。
- 每次解释公式按固定顺序展开：①要解决的问题；②每个符号的含义与维度；③前提条件；④从定义或目标函数开始的逐行推导；⑤每一步使用的定理、独立性、求导规则或代数恒等式；⑥结论与适用边界；⑦一个可手算数值例子；⑧一个常见错误或反例。
- 不得用“显然”“整理可得”“类似可得”跳过关键运算。矩阵求导要展示展开式与梯度；概率推导要说明条件期望、独立与不相关各自用在哪里；无限级数与极限要说明收敛条件。区分精确恒等式、渐近近似和启发式规则。
- 课件只给结论而没有证明时，可以补充推导，但必须标注“助教补充推导”，把原文证据与补充推理分开。不要给补充推导伪造页码。
- 最终输出使用目标平台支持的 LaTeX，展示公式单独成行，避免宏定义和未经验证的命令。先做维度、单位、边界情形和数值代入检查，再检查渲染；数值或符号验证不是一般性证明。
- AMA4602 优先覆盖条件多元正态、LDA/QDA、PCA 的约束优化与 SVD、CCA 的白化变换、ridge/LASSO 的梯度和 KKT、多重检验控制条件。AMA4650 优先覆盖平稳性、指数平滑权重与趋势偏差、MA/AR 协方差、Yule-Walker、因果性与可逆性、多步预测误差方差、GARCH 的二阶矩条件。
- 为每门课建立至少 8 个推导测试题，覆盖关键中间步骤、假设失效和反例。评价公式正确性、推导完整性、假设明确性与引用可靠性，不以答案篇幅代替质量。

## 最终交付

请展示：语料清单、系统架构、运行命令、检索评测结果、课程知识地图、重点及其证据、题型判断及置信度，并用 3 个带出处的示例问答证明系统可用。遵守资料版权，只为个人学习建立索引，不重新公开整份受版权保护的内容。`;
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        textarea.remove();
        return copied;
    }

    function updateButton(button, message, isError) {
        const label = button.querySelector('span');
        const icon = button.querySelector('i');
        const original = '复制提示词';
        label.textContent = message;
        button.classList.toggle('is-error', Boolean(isError));
        button.classList.toggle('is-copied', !isError);
        if (icon) icon.className = isError ? 'fas fa-exclamation-circle' : 'fas fa-check';

        window.setTimeout(function() {
            label.textContent = original;
            button.classList.remove('is-error', 'is-copied');
            if (icon) icon.className = 'far fa-copy';
        }, 1800);
    }

    function copyPrompt(button) {
        const bar = button.closest('.course-agent-copybar');
        const prompt = buildPrompt(bar.dataset.courseCode || 'COURSE');
        const status = bar.querySelector('.course-agent-copybar__status');
        const copyPromise = navigator.clipboard && window.isSecureContext
            ? navigator.clipboard.writeText(prompt).then(function() { return true; })
            : Promise.resolve(fallbackCopy(prompt));

        copyPromise.then(function(copied) {
            if (!copied) throw new Error('copy failed');
            if (status) status.textContent = '提示词已复制';
            updateButton(button, '已复制', false);
        }).catch(function() {
            if (status) status.textContent = '复制失败，请重试';
            updateButton(button, '复制失败', true);
        });
    }

    document.addEventListener('click', function(event) {
        const button = event.target.closest && event.target.closest('[data-course-agent-copy]');
        if (!button) return;
        copyPrompt(button);
    });
}());
