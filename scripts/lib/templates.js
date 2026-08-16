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
    .join('\n            ');

  return `<header class="site-header">
    <div class="wrap site-header__inner">
      <a class="site-header__logo" href="/">
        <span class="site-header__logo-badge"><img src="/logo.png" alt="" width="24" height="24"></span>
        <span class="site-header__logo-text">${escapeHtml(config.siteName)}</span>
      </a>
      <nav class="site-nav" aria-label="Categorías">
        <ul>
            ${navItems}
        </ul>
      </nav>
    </div>
  </header>`;
}

function footerHtml(config) {
  const year = new Date().getFullYear();
  const socialLinks = Object.entries(config.social)
    .map(([name, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a>`)
    .join('\n          ');

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
      <div class="site-footer__col">
        <p class="site-footer__heading">Seguinos</p>
        <div class="site-footer__social">
          ${socialLinks}
        </div>
        <p class="site-footer__heading site-footer__heading--spaced">Institucional</p>
        <ul class="site-footer__links">
          <li><a href="/quienes-somos/">Quiénes somos</a></li>
          <li><a href="mailto:${config.contactEmail}">Contacto</a></li>
          <li><a href="/rss.xml">RSS</a></li>
        </ul>
      </div>
    </div>
    <div class="wrap site-footer__bottom">
      <p>© ${year} ${escapeHtml(config.siteName)}. Todos los derechos reservados.</p>
    </div>
  </footer>`;
}

function layout({ config, head, activeCat = null, bodyClass = '', content }) {
  return `<!DOCTYPE html>
<html lang="es-AR">
  <head>
    ${head}
  </head>
  <body class="${bodyClass}">
    <a class="skip-link" href="#main">Saltar al contenido</a>
    ${headerHtml(config, activeCat)}
    <main id="main">
      ${content}
    </main>
    ${footerHtml(config)}
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

function homePage(config, posts) {
  const canonical = absoluteUrl(config, '/');
  const featured = posts.slice(0, 4);
  const [hero, ...secondary] = featured;
  const rest = posts.slice(4);

  const head = renderHead(config, {
    title: null,
    description: config.siteDescription,
    canonical,
    image: hero ? hero.image : null,
    type: 'website',
    jsonLd: [websiteJsonLd(config)],
  });

  const secondaryHtml = secondary
    .map((p) => postCardHtml(config, p))
    .join('\n          ');

  const restHtml = rest.map((p) => postCardHtml(config, p)).join('\n          ');

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
            </p>
          </div>
        </article>
        <div class="hero__secondary">
          ${secondaryHtml}
        </div>
      </section>

      <section class="wrap section">
        <h2 class="section__title">Últimas noticias</h2>
        <div class="card-grid">
          ${restHtml || '<p>Todavía no hay más noticias cargadas.</p>'}
        </div>
      </section>`;

  return layout({ config, head, activeCat: null, bodyClass: 'page-home', content });
}

/* ------------------------------------------------------------------ */
/* Categoría                                                            */
/* ------------------------------------------------------------------ */

function categoryPage(config, category, posts) {
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

  return layout({ config, head, activeCat: category.id, bodyClass: 'page-category', content });
}

/* ------------------------------------------------------------------ */
/* Post individual                                                      */
/* ------------------------------------------------------------------ */

function postPage(config, post, relatedPosts) {
  const url = postPath(post);
  const canonical = absoluteUrl(config, url);
  const category = config.categories.find((c) => c.id === post.cat);
  const description = post.excerpt || truncate(stripHtml(post.content), 160);

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
          <p class="post__excerpt">${escapeHtml(post.excerpt)}</p>
          <p class="card__meta">
            <time datetime="${post.date}">${formatDateHuman(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>${escapeHtml(post.readTime)}</span>
          </p>
        </header>
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

  return layout({ config, head, activeCat: post.cat, bodyClass: 'page-post', content });
}

/* ------------------------------------------------------------------ */
/* Quiénes somos                                                        */
/* ------------------------------------------------------------------ */

function aboutPage(config) {
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

  return layout({ config, head, activeCat: null, bodyClass: 'page-about', content });
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
