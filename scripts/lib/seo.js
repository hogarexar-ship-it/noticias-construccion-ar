'use strict';

const { escapeHtml } = require('./utils');

/**
 * Arma el bloque <head> de SEO: title, description, canonical, Open Graph,
 * Twitter Card y geo tags. `jsonLd` recibe un array de objetos que se
 * serializan como <script type="application/ld+json"> independientes.
 */
function renderHead(config, { title, description, canonical, image, type = 'website', jsonLd = [], robots = 'index, follow' }) {
  const fullTitle = title ? `${title} | ${config.siteName}` : config.siteName;
  const desc = escapeHtml(description);
  const ogImage = image || `${config.siteUrl}/logo.png`;

  const jsonLdBlocks = jsonLd
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join('\n    ');

  return `<meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(fullTitle)}</title>
    <meta name="description" content="${desc}">
    <link rel="canonical" href="${canonical}">
    <meta name="robots" content="${robots}">

    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(title || config.siteName)}">
    <meta property="og:description" content="${desc}">
    <meta property="og:type" content="${type}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:locale" content="${config.locale}">
    <meta property="og:site_name" content="${escapeHtml(config.siteName)}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    ${config.twitterHandle ? `<meta name="twitter:site" content="${config.twitterHandle}">\n    ` : ''}<meta name="twitter:title" content="${escapeHtml(title || config.siteName)}">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="${ogImage}">

    <!-- Geo -->
    <meta name="geo.region" content="${config.geo.region}">
    <meta name="geo.placename" content="${escapeHtml(config.geo.placename)}">
    <meta name="geo.position" content="${config.geo.position}">
    <meta name="ICBM" content="${config.geo.position.replace(';', ', ')}">

    <link rel="icon" href="/logo.png" type="image/png">
    <link rel="apple-touch-icon" href="/logo.png">
    <link rel="stylesheet" href="/styles/main.css">
    <link rel="alternate" type="application/rss+xml" title="${escapeHtml(config.siteName)}" href="/rss.xml">
    ${jsonLdBlocks}`;
}

function websiteJsonLd(config) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.siteName,
    url: config.siteUrl,
    description: config.siteDescription,
    inLanguage: config.language,
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
      url: config.siteUrl,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${config.siteUrl}/?s={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

function articleJsonLd(config, post, canonical) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.summary || post.excerpt,
    image: [post.image],
    datePublished: `${post.date}T08:00:00-03:00`,
    dateModified: `${post.date}T08:00:00-03:00`,
    inLanguage: config.language,
    author: {
      '@type': 'Organization',
      name: config.siteName,
      url: config.siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
      url: config.siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${config.siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    ...(post.sourceUrl ? { isBasedOn: post.sourceUrl } : {}),
  };
}

function faqJsonLd(faqItems) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.pregunta,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.respuesta,
      },
    })),
  };
}

function breadcrumbJsonLd(config, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

module.exports = { renderHead, websiteJsonLd, articleJsonLd, breadcrumbJsonLd, faqJsonLd };
