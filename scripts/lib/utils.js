'use strict';

/** Convierte un string en un slug URL-friendly (sin acentos, minúsculas, guiones). */
function slugify(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Slug único de un post: slug del título + id, para evitar colisiones. */
function postSlug(post) {
  return `${slugify(post.title)}-${post.id}`;
}

/** Formatea una fecha ISO (YYYY-MM-DD) en formato legible es-AR. */
function formatDateHuman(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Fecha en formato RFC-822 para el feed RSS. */
function formatDateRss(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toUTCString();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(str) {
  return escapeHtml(str);
}

/** Quita etiquetas HTML de un string (para meta description a partir de content). */
function stripHtml(html) {
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1).trimEnd() + '…';
}

function sortByDateDesc(posts) {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
}

function categoryLabel(categories, catId) {
  const found = categories.find((c) => c.id === catId);
  return found ? found.label : catId;
}

function postPath(post) {
  return `/noticia/${postSlug(post)}/`;
}

function categoryPath(catId) {
  return `/categoria/${catId}/`;
}

function absoluteUrl(config, path) {
  return `${config.siteUrl}${path}`;
}

module.exports = {
  slugify,
  postSlug,
  formatDateHuman,
  formatDateRss,
  escapeHtml,
  escapeXml,
  stripHtml,
  truncate,
  sortByDateDesc,
  categoryLabel,
  postPath,
  categoryPath,
  absoluteUrl,
};
