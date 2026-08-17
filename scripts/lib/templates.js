'use strict';

const { renderHead, websiteJsonLd, articleJsonLd, breadcrumbJsonLd } = require('./seo');
const {
  escapeHtml,
  formatDateHuman,
  postPath,
  categoryPath,
  absoluteUrl,
  categoryLabel,
  stripHtml,
  truncate,
} = require('./utils');

/* ------------------------------------------------------------------ */
/* Shell: header, footer, layout                                       */
/* ------------------------------------------------------------------ */

function headerHtml(config, activeCat) {
  const navItems = config.categories
    .map((cat) => {
      const isActive = cat.id === activeCat;
      return `<li><a href="${categoryPath(cat.id)}"${isActive ? ' class="is-active" aria-current="page"' : ''}>${escapeHtml(cat.label)}</a></li>`;
    })
    .join('\n              ');

  return `<header class="site-header">
    <div class="wrap site-header__inner">
      <a class="site-header__logo" href="/">
        <span class="site-header__logo-badge"><img src="/logo.png" alt="" width="40" height="40"></span>
        <span class="site-header__logo-text">${escapeHtml(config.siteName)}</span>
      </a>
      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav">
        <span class="visually-hidden">Abrir menú</span>
        <span class="nav-toggle__bars" aria-hidden="true"></span>
      </button>
      <nav class="site-nav" id="site-nav" aria-label="Categorías">
        <ul>
              ${navItems}
        </ul>
      </nav>
    </div>
  </header>`;
}

function tickerHtml(config, posts) {
  const latest = (posts || []).slice(0, 5);
  const slides = [
    { text: config.ticker.tagline, href: null },
    ...latest.map((p) => ({
      text: `${p.emoji ? `${p.emoji} ` : ''}${p.title}`,
      href: postPath(p),
    })),
  ];

  const itemsHtml = slides
    .map((slide, i) => {
      const inner = slide.href
        ? `<a href="${slide.href}">${escapeHtml(slide.text)}</a>`
        : `<span>${escapeHtml(slide.text)}</span>`;
      return `<li class="ticker__item"${i === 0 ? '' : ' hidden'}>${inner}</li>`;
    })
    .join('\n              ');

  return `<div class="ticker" data-ticker role="region" aria-label="Titulares destacados">
    <div class="wrap ticker__inner">
      <span class="ticker__label">${escapeHtml(config.ticker.label)}</span>
      <ul class="ticker__track">
              ${itemsHtml}
      </ul>
    </div>
  </div>`;
}

function footerHtml(config) {
  const year = new Date().getFullYear();

  const catLinks = config.categories
    .map((cat) => `<li><a href="${categoryPath(cat.id)}">${escapeHtml(cat.label)}</a></li>`)
    .join('\n              ');

  return `<footer class="site-footer">
    <div class="wrap site-footer__inner">
      <div class="site-footer__col">
        <p class="site-footer__brand">${escapeHtml(config.siteName)}</p>
        <p class="site-footer__desc">${escapeHtml(config.siteDescription)}</p>
        <p class="site-footer__disclosure">Un proyecto de <a href="${config.owner.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(config.owner.name)}</a>.</p>
      </div>
      <div class="site-footer__col">
        <p class="site-footer__heading">Secciones</p>
        <ul class="site-footer__links">
              ${catLinks}
        </ul>
      </div>
    </div>
    <div class="wrap site-footer__bottom">
      <p>© ${year} ${escapeHtml(config.siteName)}. Todos los derechos reservados.</p>
    </div>
  </footer>`;
}

function layout({ config, head, activeCat = null, bodyClass = '', content, posts = [] }) {
  return `<!DOCTYPE html>
<html lang="es-AR">
  <head>
    ${head}
  </head>
  <body class="${bodyClass}">
    <a class="skip-link" href="#main">Saltar al contenido</a>
    ${headerHtml(config, activeCat)}
    ${tickerHtml(config, posts)}
    <main id="main">
      ${content}
    </main>
    ${footerHtml(config)}
    <script src="/main.js" defer></script>
  </body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* Componentes reutilizables                                           */
/* ------------------------------------------------------------------ */

function categoryTagHtml(config, post) {
  const label = categoryLabel(config.categories, post.cat);
  return `<a class="tag" href="${categoryPath(post.cat)}">${post.emoji ? `${post.emoji} ` : ''}${escapeHtml(label)}</a>`;
}

function postCardHtml(config, post, { eager = false } = {}) {
  const url = postPath(post);
  const loading = eager ? 'eager' : 'lazy';
  const fetchPriority = eager ? ' fetchpriority="high"' : '';
  return `<article class="card">
        <a class="card__media" href="${url}">
          <img src="${post.image}" alt="${escapeHtml(post.title)}" loading="${loading}"${fetchPriority} width="1260" height="750">
        </a>
        <div class="card__body">
          ${categoryTagHtml(config, post)}
          <h3 class="card__title"><a href="${url}">${escapeHtml(post.title)}</a></h3>
          <p class="card__excerpt">${escapeHtml(post.excerpt)}</p>
          <p class="card__meta">
            <time datetime="${post.date}">${formatDateHuman(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>${escapeHtml(post.readTime)}</span>
          </p>
        </div>
      </article>`;
}

function newsRailHtml(config, category, posts) {
  if (!posts.length) return '';
  const cardsHtml = posts.map((p) => postCardHtml(config, p)).join('\n            ');
  return `<section class="news-rail wrap">
        <div class="news-rail__header">
          <h2 class="news-rail__title">${escapeHtml(category.label)}</h2>
          <a class="news-rail__link" href="${categoryPath(category.id)}">Ver todo ${escapeHtml(category.label)} →</a>
        </div>
        <div class="news-rail__track">
            ${cardsHtml}
        </div>
      </section>`;
}

function nativeAdHtml(config) {
  return `<aside class="native-ad wrap" aria-label="Publicidad">
        <span class="native-ad__badge">Publicidad</span>
        <a class="native-ad__banner" href="${config.owner.url}" target="_blank" rel="noopener noreferrer sponsored" aria-label="${escapeHtml(config.nativeAd.question)} — ${escapeHtml(config.owner.name)}">
          <img src="/hogarex-banner.png" alt="${escapeHtml(config.owner.name)}: ${escapeHtml(config.nativeAd.question)}" width="1280" height="630" loading="lazy">
        </a>
      </aside>`;
}

function breadcrumbHtml(items) {
  const lis = items
    .map((item, i) =>
      i === items.length - 1
        ? `<li aria-current="page">${escapeHtml(item.name)}</li>`
        : `<li><a href="${item.path}">${escapeHtml(item.name)}</a></li>`
    )
    .join('\n          ');
  return `<nav class="breadcrumb" aria-label="Miga de pan">
        <ol>
          ${lis}
        </ol>
      </nav>`;
}

/* ------------------------------------------------------------------ */
/* Home                                                                 */
/* ------------------------------------------------------------------ */

function pickFeatured(posts, count) {
  // Elige las noticias más recientes priorizando que sean de categorías distintas,
  // para que el hero represente "lo más importante del momento" en todo el sitio
  // y no vacíe el riel de una sola categoría cuando coinciden varias fechas recientes.
  const featured = [];
  const usedCats = new Set();
  for (const post of posts) {
    if (featured.length >= count) break;
    if (usedCats.has(post.cat)) continue;
    featured.push(post);
    usedCats.add(post.cat);
  }
  for (const post of posts) {
    if (featured.length >= count) break;
    if (featured.includes(post)) continue;
    featured.push(post);
  }
  return featured;
}

function homePage(config, posts) {
  const canonical = absoluteUrl(config, '/');
  const featured = pickFeatured(posts, 3);
  const [hero, ...secondary] = featured;
  const featuredIds = new Set(featured.map((p) => p.id));
  const rest = posts.filter((p) => !featuredIds.has(p.id));

  const head = renderHead(config, {
    title: null,
    description: config.siteDescription,
    canonical,
    image: hero ? hero.image : null,
    type: 'website',
    jsonLd: [websiteJsonLd(config)],
  });

  const secondaryHtml = secondary
    .map((p) => postCardHtml(config, p, { eager: true }))
    .join('\n          ');

  const rails = config.categories
    .map((category) => ({ category, catPosts: rest.filter((p) => p.cat === category.id) }))
    .filter(({ catPosts }) => catPosts.length > 0);

  const adInsertIndex = Math.min(1, rails.length - 1);
  const railsHtml = rails
    .map(({ category, catPosts }, index) => {
      const rail = newsRailHtml(config, category, catPosts);
      return index === adInsertIndex ? `${nativeAdHtml(config)}\n\n      ${rail}` : rail;
    })
    .join('\n\n      ');

  const content = `<section class="hero wrap">
        <article class="hero__main">
          <a class="hero__media" href="${postPath(hero)}">
            <img src="${hero.image}" alt="${escapeHtml(hero.title)}" loading="eager" fetchpriority="high" width="1260" height="750">
          </a>
          <div class="hero__body">
            ${categoryTagHtml(config, hero)}
            <h1 class="hero__title"><a href="${postPath(hero)}">${escapeHtml(hero.title)}</a></h1>
            <p class="hero__excerpt">${escapeHtml(hero.excerpt)}</p>
            <p class="card__meta">
              <time datetime="${hero.date}">${formatDateHuman(hero.date)}</time>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml(hero.readTime)}</span>
              <span aria-hidden="true">·</span>
              <span>Fuente: ${escapeHtml(hero.sourceName)}</span>
            </p>
          </div>
        </article>
        <div class="hero__secondary">
          ${secondaryHtml}
        </div>
      </section>

      <section class="wrap news-rail__intro">
        <h2 class="section__title">Últimas noticias</h2>
      </section>

      ${railsHtml || '<p class="wrap">Todavía no hay más noticias cargadas.</p>'}`;

  return layout({ config, head, activeCat: null, bodyClass: 'page-home', content, posts });
}

/* ------------------------------------------------------------------ */
/* Categoría                                                            */
/* ------------------------------------------------------------------ */

function categoryPage(config, category, posts, allPosts) {
  const canonical = absoluteUrl(config, categoryPath(category.id));
  const description = category.description;

  const head = renderHead(config, {
    title: category.label,
    description,
    canonical,
    image: posts[0] ? posts[0].image : null,
    type: 'website',
    jsonLd: [
      breadcrumbJsonLd(config, [
        { name: 'Inicio', url: absoluteUrl(config, '/') },
        { name: category.label, url: canonical },
      ]),
    ],
  });

  const cardsHtml = posts.map((p, i) => postCardHtml(config, p, { eager: i === 0 })).join('\n          ');

  const content = `<section class="wrap section category-header">
        ${breadcrumbHtml([
          { name: 'Inicio', path: '/' },
          { name: category.label },
        ])}
        <h1 class="section__title">${escapeHtml(category.label)}</h1>
        <p class="category-header__desc">${escapeHtml(description)}</p>
      </section>
      <section class="wrap section">
        <div class="card-grid">
          ${cardsHtml || '<p>Todavía no hay noticias en esta categoría.</p>'}
        </div>
      </section>`;

  return layout({ config, head, activeCat: category.id, bodyClass: 'page-category', content, posts: allPosts || posts });
}

/* ------------------------------------------------------------------ */
/* Post individual                                                      */
/* ------------------------------------------------------------------ */

function postPage(config, post, relatedPosts, allPosts) {
  const url = postPath(post);
  const canonical = absoluteUrl(config, url);
  const category = config.categories.find((c) => c.id === post.cat);
  const description = post.summary || post.excerpt || truncate(stripHtml(post.content), 160);

  const head = renderHead(config, {
    title: post.title,
    description,
    canonical,
    image: post.image,
    type: 'article',
    jsonLd: [
      articleJsonLd(config, post, canonical),
      breadcrumbJsonLd(config, [
        { name: 'Inicio', url: absoluteUrl(config, '/') },
        { name: category ? category.label : post.cat, url: absoluteUrl(config, categoryPath(post.cat)) },
        { name: post.title, url: canonical },
      ]),
    ],
  });

  const relatedHtml = relatedPosts.map((p) => postCardHtml(config, p)).join('\n          ');

  const content = `<article class="wrap post">
        ${breadcrumbHtml([
          { name: 'Inicio', path: '/' },
          { name: category ? category.label : post.cat, path: categoryPath(post.cat) },
          { name: post.title },
        ])}
        <header class="post__header">
          ${categoryTagHtml(config, post)}
          <h1 class="post__title">${escapeHtml(post.title)}</h1>
          <p class="card__meta">
            <time datetime="${post.date}">${formatDateHuman(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>${escapeHtml(post.readTime)}</span>
          </p>
        </header>
        <div class="post__summary">
          <p class="post__summary-label">Resumen de la noticia</p>
          <p class="post__summary-text">${escapeHtml(post.summary || post.excerpt)}</p>
        </div>
        <figure class="post__media">
          <img src="${post.image}" alt="${escapeHtml(post.title)}" loading="eager" fetchpriority="high" width="1260" height="750">
        </figure>
        <div class="post__content">
          ${post.content}
        </div>
        <aside class="post__source">
          <p><strong>Fuente:</strong> ${escapeHtml(post.sourceName)} — <a href="${post.sourceUrl}" target="_blank" rel="noopener noreferrer nofollow">ver nota original</a></p>
        </aside>
      </article>

      ${
        relatedPosts.length
          ? `<section class="wrap section">
        <h2 class="section__title">Más de ${category ? escapeHtml(category.label) : ''}</h2>
        <div class="card-grid">
          ${relatedHtml}
        </div>
      </section>`
          : ''
      }`;

  return layout({ config, head, activeCat: post.cat, bodyClass: 'page-post', content, posts: allPosts || relatedPosts });
}

/* ------------------------------------------------------------------ */
/* Quiénes somos                                                        */
/* ------------------------------------------------------------------ */

function aboutPage(config, allPosts) {
  const canonical = absoluteUrl(config, '/quienes-somos/');
  const head = renderHead(config, {
    title: 'Quiénes somos',
    description: `Quiénes hacen ${config.siteName}: propósito editorial, enfoque y titularidad del sitio.`,
    canonical,
    type: 'website',
  });

  const content = `<section class="wrap section about">
        ${breadcrumbHtml([{ name: 'Inicio', path: '/' }, { name: 'Quiénes somos' }])}
        <h1 class="section__title">Quiénes somos</h1>
        <div class="about__body">
          <p>[PLACEHOLDER: reemplazar por el copy editorial definitivo. Sugerencia de estructura: qué es ${escapeHtml(config.siteName)}, qué cubre (construcción, reformas, inmobiliario y novedades regulatorias en Argentina, con foco en CABA y alcance nacional cuando corresponde), a quién está dirigido y cuál es el criterio editorial para seleccionar y resumir noticias.]</p>
          <p>[PLACEHOLDER: método de trabajo — cómo se seleccionan y resumen las noticias, y por qué siempre se cita y enlaza la fuente original de cada nota.]</p>
          <p>[PLACEHOLDER: forma de contacto — sugerencias, correcciones o prensa a <a href="mailto:${config.contactEmail}">${config.contactEmail}</a>.]</p>
          <p class="about__disclosure">${escapeHtml(config.siteName)} es un proyecto de <a href="${config.owner.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(config.owner.name)}</a>.</p>
        </div>
      </section>`;

  return layout({ config, head, activeCat: null, bodyClass: 'page-about', content, posts: allPosts });
}

/* ------------------------------------------------------------------ */
/* 404                                                                   */
/* ------------------------------------------------------------------ */

function notFoundPage(config) {
  const canonical = absoluteUrl(config, '/404.html');
  const head = renderHead(config, {
    title: 'Página no encontrada',
    description: 'La página que buscás no existe o fue movida.',
    canonical,
    type: 'website',
    robots: 'noindex, follow',
  });

  const content = `<section class="wrap section not-found">
        <h1 class="section__title">404</h1>
        <p>La página que buscás no existe o fue movida.</p>
        <p><a class="button" href="/">Volver al inicio</a></p>
      </section>`;

  return layout({ config, head, activeCat: null, bodyClass: 'page-404', content });
}

module.exports = {
  layout,
  homePage,
  categoryPage,
  postPage,
  aboutPage,
  notFoundPage,
};
