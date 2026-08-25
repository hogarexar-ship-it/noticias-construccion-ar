'use strict';

const { renderHead, websiteJsonLd, articleJsonLd, breadcrumbJsonLd, faqJsonLd } = require('./seo');
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

  const isPricesActive = activeCat === 'precios-mano-de-obra';
  const pricesNavClasses = ['site-nav__tool-link', ...(isPricesActive ? ['is-active'] : [])].join(' ');
  const pricesNavItem = `<li><a href="${config.laborPrices.path}" class="${pricesNavClasses}"${isPricesActive ? ' aria-current="page"' : ''}>🛠️ ${escapeHtml(config.laborPrices.navLabel)}</a></li>`;

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
              ${pricesNavItem}
        </ul>
      </nav>
    </div>
  </header>`;
}

function subtitleHtml(config) {
  return `<div class="site-subtitle">
    <div class="wrap">
      <p>${escapeHtml(config.ticker.tagline)}</p>
    </div>
  </div>`;
}

function tickerHtml(config, posts) {
  const latest = (posts || []).slice(0, 5);
  // La tagline ahora vive fija en subtitleHtml() (siempre visible, sin animación),
  // así que acá el ticker rota solo títulos de noticias. Si todavía no hay ningún
  // post cargado, dejamos la tagline como único slide para no mostrar un ticker vacío.
  const slides = latest.length
    ? latest.map((p) => ({
        text: `${p.emoji ? `${p.emoji} ` : ''}${p.title}`,
        href: postPath(p),
      }))
    : [{ text: config.ticker.tagline, href: null }];

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
              <li><a href="${config.laborPrices.path}" class="site-footer__tool-link">🛠️ ${escapeHtml(config.laborPrices.navLabel)}</a></li>
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
    <div class="site-topbar">
      ${headerHtml(config, activeCat)}
      ${tickerHtml(config, posts)}
    </div>
    ${subtitleHtml(config)}
    <main id="main">
      ${content}
    </main>
    ${footerHtml(config)}
    <script src="/main.js" defer></script>
    <script>
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/insights/script.js"></script>
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

function actualidadStripHtml(config, posts) {
  const category = config.categories.find((c) => c.id === 'actualidad');
  const label = category ? category.label : 'Actualidad';
  const cardsHtml = posts.map((p) => postCardHtml(config, p)).join('\n            ');
  return `<section class="actualidad-strip wrap">
        <div class="actualidad-strip__panel">
          <div class="actualidad-strip__header">
            <div>
              <h2 class="actualidad-strip__title">${escapeHtml(label)}</h2>
              <p class="actualidad-strip__desc">Un poco más allá de construcción e inmobiliario: otras noticias de la Argentina que están en la conversación del día.</p>
            </div>
            <a class="news-rail__link" href="${categoryPath('actualidad')}">Ver todo ${escapeHtml(label)} →</a>
          </div>
          <div class="news-rail__track">
            ${cardsHtml}
          </div>
        </div>
      </section>`;
}

// CTA hacia /precios-mano-de-obra/, reutilizando el mismo estilo (verde "herramienta") que
// ya usa el banner de esa página, para que se reconozca como el mismo destino se lo vea donde
// se lo vea (home o secciones de noticias relacionadas con costos de mano de obra).
function laborPricesCtaHtml(config) {
  return `<section class="labor-prices-cta wrap">
        <div class="labor-prices__banner">
          <div class="labor-prices__banner-text">
            <p class="labor-prices__banner-eyebrow">Herramienta</p>
            <h2 class="labor-prices__banner-title">¿Cuánto cobra un electricista, plomero o gasista hoy?</h2>
            <p class="labor-prices__banner-sub">Consultá la lista de precios de referencia actualizada, oficio por oficio, antes de pedir un presupuesto.</p>
          </div>
          <a class="button labor-prices__banner-cta" href="${config.laborPrices.path}">Ver precios de mano de obra →</a>
        </div>
      </section>`;
}

function nativeAdHtml(config, questionOverride) {
  const question = questionOverride || config.nativeAd.question;
  return `<aside class="hogarex-spot wrap" aria-label="Publicidad">
        <span class="hogarex-spot__badge">Publicidad</span>
        <a class="hogarex-spot__banner" href="${config.owner.url}" target="_blank" rel="noopener noreferrer sponsored" aria-label="${escapeHtml(question)} — ${escapeHtml(config.owner.name)}">
          <img src="/hogarex-banner.png" alt="${escapeHtml(config.owner.name)}: ${escapeHtml(question)}" width="1280" height="630" loading="lazy">
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
  // "actualidad" nunca ocupa el hero ni los destacados: es contenido aparte del rubro del
  // sitio (noticias generales/tendencia), así que se arma su propia franja más abajo, con
  // fondo distinto y una bajada que aclara de qué se trata.
  const featuredPool = posts.filter((p) => p.cat !== 'actualidad');
  const featured = pickFeatured(featuredPool, 3);
  const [hero, ...secondary] = featured;
  const featuredIds = new Set(featured.map((p) => p.id));
  const rest = posts.filter((p) => !featuredIds.has(p.id));

  const actualidadPosts = rest.filter((p) => p.cat === 'actualidad').slice(0, 3);
  const railPosts = rest.filter((p) => p.cat !== 'actualidad');

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

  const actualidadHtml = actualidadPosts.length ? actualidadStripHtml(config, actualidadPosts) : '';

  const rails = config.categories
    .filter((category) => category.id !== 'actualidad')
    .map((category) => ({ category, catPosts: railPosts.filter((p) => p.cat === category.id) }))
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

      ${actualidadHtml}

      ${laborPricesCtaHtml(config)}

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

  // En las categorías más ligadas a costos de mano de obra, sumamos el CTA a la sección de
  // precios de mano de obra — es un destino relacionado que el lector de estas notas suele
  // estar buscando.
  const laborRelatedCats = ['precios', 'construccion', 'reformas'];
  const laborCtaHtml = laborRelatedCats.includes(category.id) ? laborPricesCtaHtml(config) : '';

  const content = `<section class="wrap section category-header">
        ${breadcrumbHtml([
          { name: 'Inicio', path: '/' },
          { name: category.label },
        ])}
        <h1 class="section__title">${escapeHtml(category.label)}</h1>
        <p class="category-header__desc">${escapeHtml(description)}</p>
      </section>
      ${laborCtaHtml}
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
        ${post.hogarexCta ? `\n        ${nativeAdHtml(config, post.hogarexCtaQuestion)}\n        ` : ''}
        <aside class="post__source">
          <p><strong>Fuente:</strong> ${escapeHtml(post.sourceName)}${post.sourceUrl ? ` — <a href="${post.sourceUrl}" target="_blank" rel="noopener noreferrer nofollow">ver nota original</a>` : ''}</p>
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
          <p>${escapeHtml(config.siteName)} es un sitio de noticias que resume todos los días la actualidad de la construcción, las reformas, el mercado inmobiliario y la regulación del sector en Argentina, con foco en la Ciudad de Buenos Aires y alcance nacional cuando la noticia lo amerita. Está pensado para quien está por construir, reformar, comprar, alquilar o vender, y no tiene tiempo de rastrear diez fuentes distintas para enterarse de lo importante.</p>
          <p>Cada nota que publicamos es un resumen propio: leemos la cobertura de medios especializados y generalistas, y la volvemos a contar con nuestras palabras, en un formato breve y directo. Nunca copiamos el texto de la fuente: al final de cada artículo citamos y enlazamos la nota original para que quien quiera profundizar pueda hacerlo.</p>
          <p>También publicamos una sección de <a href="${config.laborPrices.path}">precios de mano de obra por oficio</a>, con rangos de referencia para los trabajos más pedidos del hogar, actualizados periódicamente.</p>
          <p>Para sugerencias, correcciones o consultas de prensa, podés escribirnos a <a href="mailto:${config.contactEmail}">${config.contactEmail}</a>.</p>
          <p class="about__disclosure">${escapeHtml(config.siteName)} es un proyecto de <a href="${config.owner.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(config.owner.name)}</a>, un marketplace de profesionales del hogar en Argentina.</p>
        </div>
      </section>`;

  return layout({ config, head, activeCat: null, bodyClass: 'page-about', content, posts: allPosts });
}

/* ------------------------------------------------------------------ */
/* Precios de mano de obra                                              */
/* ------------------------------------------------------------------ */

function oficioSectionHtml(config, oficio) {
  const rowsHtml = oficio.items
    .map(
      (item) => `<tr>
              <td>${escapeHtml(item.tarea)}</td>
              <td>${escapeHtml(item.rango)}</td>
            </tr>`
    )
    .join('\n            ');

  return `<section class="labor-prices__oficio" id="${escapeHtml(oficio.id)}">
        <h2 class="labor-prices__oficio-title">${oficio.emoji ? `${oficio.emoji} ` : ''}${escapeHtml(oficio.titulo)}</h2>
        <p class="labor-prices__oficio-desc">${escapeHtml(oficio.resumen)}</p>
        <div class="labor-prices__table-wrap">
          <table class="labor-prices__table">
            <thead>
              <tr>
                <th scope="col">Trabajo</th>
                <th scope="col">Precio de referencia</th>
              </tr>
            </thead>
            <tbody>
            ${rowsHtml}
            </tbody>
          </table>
        </div>
        <div class="labor-prices__cta">
          <a class="button" href="https://hogarex.ar/solicitud-enviar" target="_blank" rel="noopener noreferrer sponsored">¿Buscando un ${escapeHtml(oficio.profesion)}? Pedí presupuesto en Hogarex →</a>
          <a class="button button--outline" href="https://hogarex.ar/precios" target="_blank" rel="noopener noreferrer sponsored">Ver tabla de precios completa</a>
        </div>
      </section>`;
}

function laborPricesPage(config, laborData, allPosts) {
  const canonical = absoluteUrl(config, config.laborPrices.path);
  const faqBlock = laborData.faq && laborData.faq.length ? faqJsonLd(laborData.faq) : null;

  const head = renderHead(config, {
    title: config.laborPrices.title,
    description: config.laborPrices.description,
    canonical,
    image: config.laborPrices.image,
    type: 'website',
    jsonLd: [
      breadcrumbJsonLd(config, [
        { name: 'Inicio', url: absoluteUrl(config, '/') },
        { name: config.laborPrices.navLabel, url: canonical },
      ]),
      ...(faqBlock ? [faqBlock] : []),
    ],
  });

  const oficiosNavHtml = laborData.oficios
    .map((o) => `<a href="#${escapeHtml(o.id)}">${o.emoji ? `${o.emoji} ` : ''}${escapeHtml(o.titulo)}</a>`)
    .join('\n          ');

  const oficiosHtml = laborData.oficios.map((o) => oficioSectionHtml(config, o)).join('\n\n      ');

  const faqHtml = (laborData.faq || [])
    .map(
      (item) => `<div class="labor-prices__faq-item">
          <h3>${escapeHtml(item.pregunta)}</h3>
          <p>${escapeHtml(item.respuesta)}</p>
        </div>`
    )
    .join('\n        ');

  const content = `<section class="wrap section labor-prices">
        ${breadcrumbHtml([{ name: 'Inicio', path: '/' }, { name: config.laborPrices.navLabel }])}

        <div class="labor-prices__banner">
          <div class="labor-prices__banner-text">
            <p class="labor-prices__banner-eyebrow">Guía de precios</p>
            <h1 class="labor-prices__banner-title">¿Cuánto vale contratar un profesional en Argentina?</h1>
            <p class="labor-prices__banner-sub">Lista de precios actualizada de electricista, plomero, gasista, pintor, cerrajero y albañil.</p>
          </div>
          <a class="button labor-prices__banner-cta" href="#${escapeHtml(laborData.oficios[0].id)}">Ver lista de precios ↓</a>
        </div>

        <p class="labor-prices__intro">${escapeHtml(laborData.intro)}</p>
        <p class="labor-prices__updated">Última actualización: ${formatDateHuman(laborData.actualizado)}</p>

        <nav class="labor-prices__jumplinks" aria-label="Ir a un oficio">
          ${oficiosNavHtml}
        </nav>

        ${oficiosHtml}

        ${
          faqHtml
            ? `<section class="labor-prices__faq">
          <h2 class="section__title">Preguntas frecuentes</h2>
          ${faqHtml}
        </section>`
            : ''
        }
      </section>`;

  return layout({ config, head, activeCat: 'precios-mano-de-obra', bodyClass: 'page-labor-prices', content, posts: allPosts });
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
  laborPricesPage,
  notFoundPage,
};
