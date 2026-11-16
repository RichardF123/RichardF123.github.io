(function() {
    if (window.richardReadingToc) return;
    window.richardReadingToc = true;
    const wide = window.matchMedia('(min-width: 1100px)');
    let state = null;
    let frame = 0;
    let dirty = true;
    let observer = null;

    function setOpen(open, restoreFocus) {
        if (!state) return;
        open = wide.matches || open;
        state.open = open;
        document.body.classList.toggle('has-reading-toc-open', open);
        state.panel.hidden = !open;
        state.toggle.setAttribute('aria-expanded', String(open));
        if (restoreFocus && !wide.matches) state.toggle.focus({ preventScroll: true });
        dirty = true;
        schedule();
    }

    function schedule() {
        if (frame || !state) return;
        frame = window.requestAnimationFrame(update);
    }

    function update() {
        frame = 0;
        if (!state) return;
        if (dirty) {
            if (wide.matches) {
                const container = document.getElementById('site-main');
                const main = container.getBoundingClientRect();
                const inset = parseFloat(window.getComputedStyle(container).paddingLeft) || 0;
                state.panel.style.left = (main.left + inset) + 'px';
            } else {
                state.panel.style.removeProperty('left');
            }
            state.positions = state.headings.map(h => h.getBoundingClientRect().top + window.scrollY);
            dirty = false;
        }
        const threshold = window.scrollY + 116;
        let active = 0;
        for (let i = 0; i < state.positions.length; i++) {
            if (state.positions[i] <= threshold) active = i;
        }
        if (active === state.active) return;
        if (state.active >= 0) state.links[state.active].removeAttribute('aria-current');
        state.active = active;
        const link = state.links[active];
        link.setAttribute('aria-current', 'location');
        if (state.open) {
            const bounds = link.getBoundingClientRect();
            const listBounds = state.list.getBoundingClientRect();
            if (bounds.top < listBounds.top || bounds.bottom > listBounds.bottom) {
                state.list.scrollTop += bounds.top - listBounds.top - state.list.clientHeight / 3;
            }
        }
    }

    function init() {
        if (observer) observer.disconnect();
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        state = null;
        document.body.classList.remove('has-reading-toc', 'has-reading-toc-open');
        const panel = document.querySelector('.reading-toc');
        const toggle = document.querySelector('.reading-toc-toggle');
        const article = document.querySelector('body.is-reading-post .article > .content');
        if (!panel || !toggle || !article) return;
        panel.hidden = true;
        toggle.hidden = true;
        const headings = Array.from(article.querySelectorAll('h2, h3'));
        if (headings.length < 3) return;
        const list = panel.querySelector('nav');
        list.replaceChildren();
        const items = document.createElement('ol');
        const links = headings.map((heading, i) => {
            if (!heading.id) {
                let id = 'reading-section-' + i;
                while (document.getElementById(id)) id += '-';
                heading.id = id;
            }
            const item = document.createElement('li');
            if (heading.tagName === 'H3') item.className = 'reading-toc__sub';
            const link = document.createElement('a');
            link.href = '#' + encodeURIComponent(heading.id);
            const copy = heading.cloneNode(true);
            copy.querySelectorAll('.katex-mathml, .headerlink').forEach(el => el.remove());
            link.textContent = copy.textContent.trim();
            link.title = link.textContent;
            link.dataset.readingIndex = i;
            item.appendChild(link);
            items.appendChild(item);
            return link;
        });
        list.appendChild(items);
        state = { panel, toggle, list, headings, links, active: -1, positions: [], open: false };
        document.body.classList.add('has-reading-toc');
        toggle.hidden = false;
        setOpen(wide.matches);
        dirty = true;
        if (window.ResizeObserver) {
            observer = new ResizeObserver(() => { dirty = true; schedule(); });
            observer.observe(article);
        }
        schedule();
    }

    document.addEventListener('click', function(event) {
        if (!state) return;
        const button = event.target.closest('[data-reading-toggle]');
        if (button) {
            setOpen(!state.open, button !== state.toggle);
            return;
        }
        const link = event.target.closest('.reading-toc a[data-reading-index]');
        if (link) {
            event.preventDefault();
            const heading = state.headings[Number(link.dataset.readingIndex)];
            const url = new URL(window.location.href);
            url.hash = heading.id;
            window.history.pushState(null, '', url.href);
            window.scrollTo({ top: Math.max(0, heading.getBoundingClientRect().top + window.scrollY - 100),
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
            if (!wide.matches) setOpen(false);
            return;
        }
        if (!wide.matches && state.open && !state.panel.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && state && state.open) setOpen(false, true);
    });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => { dirty = true; schedule(); });
    wide.addEventListener('change', () => { if (state) { setOpen(wide.matches); dirty = true; schedule(); } });
    window.addEventListener('richardf:page-loaded', init);
    window.addEventListener('hashchange', schedule);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
}());
