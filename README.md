# ReformAR

Sitio editorial estático de noticias sobre **construcción, reformas, mercado inmobiliario y
novedades regulatorias en Argentina** (foco en CABA, con contenido nacional cuando aplica).

- 100% estático (SSG), sin backend ni base de datos.
- Generador propio en Node.js puro (sin frameworks pesados, **cero dependencias de npm**).
- El contenido se carga desde `content/posts.json`. Está pensado para que ese archivo se
  actualice con otra herramienta (por ejemplo, un script de scraping/automatización externo) sin
  tocar el código del sitio.

## Requisitos

- Node.js 18 o superior. No hace falta instalar nada más (`npm install` no tiene dependencias
  que bajar).

## Comandos

```bash
npm run build
```
Genera el sitio completo en `/dist`: home, una página por categoría, una página por post,
`sitemap.xml`, `rss.xml` y `robots.txt`. Se puede correr las veces que haga falta; cada build
borra y regenera `/dist` desde cero.

```bash
npm run serve
```
Levanta un servidor local mínimo en `http://localhost:4000` para previsualizar el contenido de
`/dist` tal como se vería en producción (rutas limpias, página 404, etc). Requiere haber
corrido `npm run build` antes.

## Estructura del proyecto

```
site.config.js         → única fuente de verdad: nombre del sitio, dominio, categorías, redes
content/posts.json     → contenido editorial (posts). Lo actualiza la herramienta externa.
scripts/build.js       → build script: lee posts.json y genera /dist
scripts/serve.js       → servidor estático local para previsualizar /dist
scripts/lib/templates.js → funciones que arman el HTML de cada tipo de página
scripts/lib/seo.js     → head SEO (meta tags, Open Graph, Twitter Card, JSON-LD)
scripts/lib/utils.js   → helpers (slugs, fechas, URLs)
src/styles/main.css    → CSS del sitio (se copia tal cual a /dist/styles)
src/assets/            → logo.png y otros archivos estáticos (se copian tal cual a /dist)
dist/                  → salida generada por el build (no se versiona, ver .gitignore)
```

## Cómo agregar o editar posts

Todo el contenido vive en **`content/posts.json`**, un array de objetos con esta forma:

```json
{
  "id": 6,
  "cat": "inmobiliario",
  "emoji": "🏢",
  "image": "https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "tag": "Mercado inmobiliario",
  "title": "Título de la noticia",
  "excerpt": "Resumen de 1-2 líneas que se muestra en las tarjetas y como meta description.",
  "date": "2026-08-20",
  "readTime": "4 min",
  "sourceName": "Nombre del medio de origen",
  "sourceUrl": "https://medio-original.com/nota",
  "content": "<p>Cuerpo de la noticia en HTML. Párrafos con &lt;p&gt;, negritas con &lt;strong&gt;, etc.</p>"
}
```

Reglas a respetar:

- **`id`**: número entero único. No reutilizar ids de posts existentes.
- **`cat`**: tiene que ser exactamente uno de los ids definidos en `site.config.js` →
  `categories`: `construccion`, `reformas`, `inmobiliario`, `regulatorio`, `precios`. Si se
  agrega una categoría nueva, primero hay que sumarla en `site.config.js`.
- **`date`**: formato `YYYY-MM-DD`. El build valida el formato y ordena los posts por fecha
  descendente automáticamente; no hace falta ordenar el JSON a mano.
- **`image`**: solo URLs de Pexels con el formato
  `https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`.
- **`sourceName`** / **`sourceUrl`**: siempre citar y linkear la fuente original de la noticia.
  El sitio nunca reproduce texto textual de otro medio: `content` debe ser un resumen/paráfrasis
  propia.
- **`content`**: HTML simple (párrafos, `<strong>`, `<em>`, listas). Se inyecta tal cual en la
  página del post, así que tiene que venir ya saneado/bien formado desde el origen.

El build (`npm run build`) valida automáticamente que cada post tenga los campos obligatorios,
que la categoría exista y que la fecha tenga el formato correcto, y corta con un mensaje de
error claro si algo no cumple.

No hace falta tocar ningún template para que un post nuevo aparezca: en el próximo build se
suma solo a la home, a su página de categoría, al sitemap y al RSS.

## Antes de publicar

1. Reemplazar `siteUrl` en `site.config.js` por el dominio final (sin `/` al final). De esa
   variable salen todas las URLs absolutas: canonical, Open Graph, sitemap y RSS.
2. Completar redes sociales, email de contacto y el copy de `content` en la sección
   "Quiénes somos" (hay placeholders marcados como `[PLACEHOLDER: ...]` en
   `scripts/lib/templates.js`, función `aboutPage`).
3. Revisar/editar los 5 posts de ejemplo en `content/posts.json` o reemplazarlos por contenido
   real generado por la herramienta externa.
4. `src/assets/logo.png` se usa como logo del header, favicon e imagen de Open Graph por
   defecto. Si el archivo actual no tiene licencia confirmada para uso como marca/logo,
   reemplazarlo antes de publicar por una versión con los derechos correspondientes (mismo
   nombre de archivo, o actualizar las referencias en `scripts/lib/templates.js` y
   `scripts/lib/seo.js`).

## Deploy

El repo incluye `vercel.json` y `netlify.toml` ya configurados con:

- Build command: `npm run build`
- Output/publish directory: `dist`

Alcanza con conectar el repo de GitHub en Vercel o Netlify; no hace falta configuración
adicional. Ambas plataformas corren `npm install` (no descarga nada, el proyecto no tiene
dependencias) y después `npm run build`.

## SEO incluido en cada build

- Meta title y description únicos por página.
- Open Graph completo (`og:title`, `og:description`, `og:image`, `og:type`, `og:locale es_AR`,
  `og:site_name`) y Twitter Card `summary_large_image`.
- Canonical URL en todas las páginas.
- Meta geo tags (`geo.region`, `geo.placename`, `geo.position`).
- JSON-LD: `WebSite` en home, `NewsArticle` en cada post (headline, fecha, autor, publisher),
  `BreadcrumbList` en categorías y posts.
- `sitemap.xml` y `robots.txt` autogenerados en cada build.
- `rss.xml` con los últimos 30 posts.
- Todo el HTML sale prerenderizado del build: no hay contenido que dependa de JavaScript en
  runtime.
- Imágenes con `loading="lazy"` salvo la primera imagen above-the-fold de cada página
  (`loading="eager"` + `fetchpriority="high"`).
