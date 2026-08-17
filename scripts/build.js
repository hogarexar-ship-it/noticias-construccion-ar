'use strict';

const fs = require('fs');
const path = require('path');

const config = require('../site.config.js');
const { homePage, categoryPage, postPage, aboutPage, laborPricesPage, notFoundPage } = require('./lib/templates');
const {
  postPath,
  categoryPath,
  absoluteUrl,
  sortByDateDesc,
  formatDateRss,
  escapeXml,
} = require('./lib/utils');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const CONTENT_FILE = path.join(ROOT, 'content', 'posts.json');
const LABOR_PRICES_FILE = path.join(ROOT, 'content', 'precios-mano-de-obra.json');
const STYLES_SRC = path.join(ROOT, 'src', 'styles');
const ASSETS_SRC = path.join(ROOT, 'src', 'assets');

function readPosts() {
  const raw = fs.readFileSync(CONTENT_FILE, 'utf-8');
  let posts;
  try {
    posts = JSON.parse(raw);
  } catch (err) {
    throw new Error(`content/posts.json no es un JSON válido: ${err.message}`);
  }

  const validCats = new Set(config.categories.map((c) => c.id));
  const seenIds = new Set();

  posts.forEach((post) => {
    const required = ['id', 'cat', 'title', 'excerpt', 'date', 'image', 'content'];
    required.forEach((field) => {
      if (post[field] === undefined || post[field] === null || post[field] === '') {
        throw new Error(`Post id=${post.id ?? '?'} no tiene el campo requerido "${field}".`);
      }
    });
    if (seenIds.has(post.id)) {
      throw new Error(`Hay más de un post con id=${post.id}. Los ids deben ser únicos.`);
    }
    seenIds.add(post.id);
    if (!validCats.has(post.cat)) {
      throw new Error(
        `Post id=${post.id} usa la categoría "${post.cat}", que no existe en site.config.js. Categorías válidas: ${[...validCats].join(', ')}`
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)) {
      throw new Error(`Post id=${post.id} tiene una fecha inválida ("${post.date}"). Formato esperado: YYYY-MM-DD.`);
    }
  });

  return sortByDateDesc(posts);
}

function readLaborPrices() {
  const raw = fs.readFileSync(LABOR_PRICES_FILE, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`content/precios-mano-de-obra.json no es un JSON válido: ${err.message}`);
  }
  if (!Array.isArray(data.oficios) || !data.oficios.length) {
    throw new Error('content/precios-mano-de-obra.json necesita al menos un oficio en "oficios".');
  }
  return data;
}

function emptyDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(relPath, content) {
  const fullPath = path.join(DIST, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
}

function writePage(urlPath, html) {
  // urlPath: '/', '/categoria/reformas/', etc. -> se guarda como .../index.html
  const relPath = urlPath.endsWith('/') ? path.join(urlPath, 'index.html') : urlPath;
  writeFile(relPath, html);
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function buildSitemap(posts, laborPrices) {
  const today = new Date().toISOString().slice(0, 10);
  const latestPostDate = posts.length ? posts[0].date : today;

  const staticUrls = [
    { loc: '/', lastmod: latestPostDate },
    { loc: '/quienes-somos/', lastmod: today },
    { loc: config.laborPrices.path, lastmod: (laborPrices && laborPrices.actualizado) || today },
    ...config.categories.map((c) => ({ loc: categoryPath(c.id), lastmod: latestPostDate })),
  ];
  const postUrls = posts.map((p) => ({ loc: postPath(p), lastmod: p.date }));
  const allUrls = [...staticUrls, ...postUrls];

  const urlEntries = allUrls
    .map((u) => `  <url>\n    <loc>${absoluteUrl(config, u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;
}

function buildRss(posts) {
  const items = posts
    .slice(0, 30)
    .map(
      (p) => `  <item>
    <title>${escapeXml(p.title)}</title>
    <link>${absoluteUrl(config, postPath(p))}</link>
    <guid>${absoluteUrl(config, postPath(p))}</guid>
    <pubDate>${formatDateRss(p.date)}</pubDate>
    <description>${escapeXml(p.excerpt)}</description>
    <category>${escapeXml(p.cat)}</category>
  </item>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(config.siteName)}</title>
  <link>${config.siteUrl}</link>
  <description>${escapeXml(config.siteDescription)}</description>
  <language>${config.language}</language>
${items}
</channel>
</rss>
`;
}

function buildRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`;
}

function build() {
  const startedAt = Date.now();
  console.log(`\n[build] Sitio: ${config.siteName} (${config.siteUrl})`);

  const posts = readPosts();
  console.log(`[build] ${posts.length} posts cargados desde content/posts.json`);

  const laborPrices = readLaborPrices();
  console.log(`[build] ${laborPrices.oficios.length} oficios cargados desde content/precios-mano-de-obra.json`);

  emptyDir(DIST);

  // Home
  writePage('/', homePage(config, posts));

  // Categorías
  config.categories.forEach((category) => {
    const catPosts = posts.filter((p) => p.cat === category.id);
    writePage(categoryPath(category.id), categoryPage(config, category, catPosts, posts));
  });

  // Posts individuales
  posts.forEach((post) => {
    const related = posts.filter((p) => p.cat === post.cat && p.id !== post.id).slice(0, 3);
    writePage(postPath(post), postPage(config, post, related, posts));
  });

  // Páginas estáticas
  writePage('/quienes-somos/', aboutPage(config, posts));
  writePage(config.laborPrices.path, laborPricesPage(config, laborPrices, posts));
  writeFile('404.html', notFoundPage(config));

  // SEO: sitemap, RSS, robots
  writeFile('sitemap.xml', buildSitemap(posts, laborPrices));
  writeFile('rss.xml', buildRss(posts));
  writeFile('robots.txt', buildRobots());

  // Assets estáticos
  copyDir(STYLES_SRC, path.join(DIST, 'styles'));
  copyDir(ASSETS_SRC, DIST);

  const elapsed = Date.now() - startedAt;
  console.log(`[build] Listo. Salida en /dist (${elapsed}ms)\n`);
}

build();
