(function() {
    const contentSelector = '.section';
    const loadingClass = 'is-pjax-loading';
    const cache = new Map();

    function isPlainLeftClick(event) {
        return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    }

    function isSkippableLink(link, url) {
        if (!link || !url) return true;
        if (link.target && link.target !== '_self') return true;
        if (link.hasAttribute('download')) return true;
        if (link.classList.contains('gallery-item') || link.classList.contains('copy')) return true;
        if (url.origin !== window.location.origin) return true;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return true;
        if (/\.(?:png|jpe?g|gif|webp|svg|pdf|zip|rar|7z|csv|tsv|xlsx?|pptx?|docx?|ogg|mp3|mp4|webm)$/i.test(url.pathname)) return true;
        return false;
    }

    function parsePage(html) {
        return new DOMParser().parseFromString(html, 'text/html');
    }

    function runContentEnhancements(root) {
        if (!window.jQuery) return;
        const $ = window.jQuery;
        const $root = $(root);

        $root.find('.article img:not(".not-gallery-item")').each(function() {
            if ($(this).parent('a').length === 0) {
                $(this).wrap('<a class="gallery-item" href="' + $(this).attr('src') + '"></a>');
                if (this.alt && $(this).next('.caption').length === 0) {
                    $(this).after('<p class="has-text-centered is-size-6 caption">' + this.alt + '</p>');
                }
            }
        });

        if (typeof window.moment === 'function') {
            $root.find('.article-meta time').each(function() {
                $(this).text(window.moment($(this).attr('datetime')).fromNow());
            });
        }

        $root.find('.article > .content > table').each(function() {
            if ($(this).parent('.table-overflow').length === 0 && $(this).width() > $(this).parent().width()) {
                $(this).wrap('<div class="table-overflow"></div>');
            }
        });
    }

    function replacePage(doc, url, shouldScroll) {
        const nextContent = doc.querySelector(contentSelector);
        const currentContent = document.querySelector(contentSelector);
        if (!nextContent || !currentContent) {
            window.location.href = url.href;
            return;
        }

        document.title = doc.title || document.title;
        document.body.className = doc.body.className;
        currentContent.replaceWith(nextContent);
        runContentEnhancements(nextContent);

        if (shouldScroll) {
            window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
        }
        window.dispatchEvent(new CustomEvent('richardf:page-loaded', { detail: { url: url.href } }));
    }

    function fetchPage(url) {
        const key = url.href;
        if (cache.has(key)) return Promise.resolve(cache.get(key));

        return fetch(key, {
            headers: { 'X-Requested-With': 'fetch' },
            credentials: 'same-origin'
        }).then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.text();
        }).then(function(html) {
            const doc = parsePage(html);
            cache.set(key, doc);
            return doc;
        });
    }

    function navigate(url, options) {
        const opts = options || {};
        document.documentElement.classList.add(loadingClass);
        fetchPage(url).then(function(doc) {
            replacePage(doc.cloneNode(true), url, opts.scroll !== false);
            if (!opts.history) return;
            window.history.pushState({ pjax: true, url: url.href }, '', url.href);
        }).catch(function() {
            window.location.href = url.href;
        }).finally(function() {
            document.documentElement.classList.remove(loadingClass);
        });
    }

    document.addEventListener('click', function(event) {
        if (!isPlainLeftClick(event)) return;
        const link = event.target.closest && event.target.closest('a[href]');
        if (!link) return;

        let url;
        try {
            url = new URL(link.href, window.location.href);
        } catch (e) {
            return;
        }

        if (isSkippableLink(link, url)) return;
        event.preventDefault();
        navigate(url, { history: true });
    });

    window.addEventListener('popstate', function() {
        navigate(new URL(window.location.href), { history: false });
    });

    if (!window.history.state) {
        window.history.replaceState({ pjax: true, url: window.location.href }, '', window.location.href);
    }
}());
