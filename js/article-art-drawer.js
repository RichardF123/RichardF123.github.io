(function() {
    const artworks = [
        {
            image: '/images/remixed-classics/girl-with-pearl-earring.jpg',
            credit: 'Johannes Vermeer · Girl with a Pearl Earring',
            url: 'https://www.mauritshuis.nl/en/our-collection/artworks/670-girl-with-a-pearl-earring'
        },
        {
            image: '/images/remixed-classics/coronation-of-napoleon.jpg',
            credit: 'Jacques-Louis David · The Coronation of Napoleon',
            url: 'https://collections.louvre.fr/en/ark:/53355/cl010065720'
        },
        {
            image: '/images/remixed-classics/pere-tanguy.jpg',
            credit: 'Vincent van Gogh · Portrait of Pere Tanguy',
            url: 'https://www.musee-rodin.fr/en/musee/collections/oeuvres/pere-tanguy'
        },
        {
            image: '/images/remixed-classics/ramesses-anubis.jpg',
            credit: 'Ancient Egyptian artists · Ramesses I with Horus and Anubis',
            url: 'https://www.cartermuseum.org/collection/tomb-16-area-c-wall-5-pharaoh-ramesses-i-guided-anubis-right-and-harsiesi-tomb-ramesses'
        },
        {
            image: '/images/remixed-classics/orpheus-eurydice.jpg',
            credit: 'Edward Poynter · Orpheus and Eurydice',
            url: 'https://www.christies.com/lot/lot-6290737'
        },
        {
            image: '/images/remixed-classics/ascension-of-christ.jpg',
            credit: 'Peter Paul Rubens · The Ascension of Christ',
            url: 'https://catalogo.fondazionezeri.unibo.it/scheda.v2.jsp?apply=true&decorator=layout_resp&id=101282&locale=en&tipo_scheda=OA'
        },
        {
            image: '/images/remixed-classics/milk-dragon-starry-night.jpg',
            credit: 'Vincent van Gogh · The Starry Night',
            url: 'https://www.moma.org/collection/works/79802'
        },
        {
            image: '/images/remixed-classics/milk-dragon-last-supper.jpg',
            credit: 'Leonardo da Vinci · The Last Supper',
            url: 'https://cenacolovinciano.org/en/museum/the-works/the-last-supper-leonardo-da-vinci-1452-1519/'
        },
        {
            image: '/images/remixed-classics/sargent-lantern-garden.jpg',
            credit: 'John Singer Sargent · Carnation, Lily, Lily, Rose',
            url: 'https://www.tate.org.uk/art/artworks/sargent-carnation-lily-lily-rose-n01615'
        }
    ];

    function createIconButton(className, label, iconName) {
        const button = document.createElement('button');
        button.className = className;
        button.type = 'button';
        button.setAttribute('aria-label', label);
        button.title = label;

        const icon = document.createElement('i');
        icon.className = 'fas ' + iconName;
        icon.setAttribute('aria-hidden', 'true');
        button.appendChild(icon);
        return button;
    }

    function closeArtwork(article, toggle) {
        article.classList.remove('is-art-open');
        toggle.setAttribute('aria-expanded', 'false');
    }

    function enhanceArticleCards() {
        const cards = document.querySelectorAll('body.is-home-list main.column-main > .card:has(> article.article)');

        cards.forEach(function(card, index) {
            if (card.dataset.artDrawerReady === 'true') return;

            const article = card.querySelector(':scope > article.article');
            if (!article) return;

            const artwork = artworks[index % artworks.length];
            card.dataset.artDrawerReady = 'true';
            card.style.setProperty('--home-article-art', 'url("' + artwork.image + '")');

            const toggle = createIconButton('article-art-toggle', '查看画作', 'fa-chevron-left');
            toggle.setAttribute('aria-expanded', 'false');

            const close = createIconButton('article-art-close', '收起画作', 'fa-chevron-left');

            const credit = document.createElement('a');
            credit.className = 'article-art-credit';
            credit.href = artwork.url;
            credit.target = '_blank';
            credit.rel = 'noopener';
            credit.textContent = artwork.credit;
            credit.setAttribute('aria-label', '查看原画：' + artwork.credit);

            toggle.addEventListener('click', function() {
                article.classList.add('is-art-open');
                toggle.setAttribute('aria-expanded', 'true');
                close.focus({ preventScroll: true });
            });

            close.addEventListener('click', function() {
                closeArtwork(article, toggle);
                toggle.focus({ preventScroll: true });
            });

            article.appendChild(toggle);
            article.appendChild(close);
            article.appendChild(credit);
        });
    }

    document.addEventListener('keydown', function(event) {
        if (event.key !== 'Escape') return;
        const article = document.querySelector('article.article.is-art-open');
        if (!article) return;
        const toggle = article.querySelector('.article-art-toggle');
        closeArtwork(article, toggle);
        toggle.focus({ preventScroll: true });
    });

    document.addEventListener('DOMContentLoaded', enhanceArticleCards);
    window.addEventListener('richardf:page-loaded', enhanceArticleCards);
}());
