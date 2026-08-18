/**
 * Configuración central del sitio.
 * Este es el ÚNICO lugar donde se define el nombre, el dominio y los datos
 * de contacto/redes. No hardcodear estos valores en ningún otro archivo:
 * las plantillas y el build script siempre importan este módulo.
 */
module.exports = {
  // Nombre público del sitio. Se usa en el header, footer, títulos y metadatos.
  siteName: 'ReformAR',

  // Dominio final, SIN barra final. Todas las URLs absolutas (canonical, OG,
  // sitemap, RSS, JSON-LD) se arman a partir de esta única variable.
  siteUrl: 'https://www.reformar.digital',

  siteDescription:
    'Noticias y resúmenes sobre construcción, reformas, mercado inmobiliario y novedades regulatorias en Argentina, con foco en la Ciudad de Buenos Aires.',

  // Usado en og:locale y en los metadatos de idioma.
  locale: 'es_AR',
  language: 'es-AR',

  // Cuenta de Twitter/X del sitio (sin @ para twitter:site se agrega en el template).
  // Dejar vacío ('') hasta tener una cuenta real: si está vacío, seo.js no imprime
  // la etiqueta twitter:site en vez de mostrar un handle inventado.
  twitterHandle: '',

  // Datos de contacto genéricos, mostrados en Quiénes somos / footer.
  // TODO: confirmar que esta casilla exista y tenga a alguien leyéndola antes de
  // depender de ella para contacto de lectores.
  contactEmail: 'redaccion@reformar.digital',

  // Disclosure de titularidad obligatorio (footer + Quiénes somos).
  owner: {
    name: 'Hogarex',
    url: 'https://hogarex.ar',
  },

  // Anuncio nativo de Hogarex insertado entre noticias en la home (ver README).
  nativeAd: {
    question: '¿Necesitás un plomero de confianza?',
    ctaText: 'Encontrá profesionales verificados en',
  },

  // Ticker/banner deslizante debajo del header, presente en todo el sitio.
  // Primer slide siempre es la tagline; después rota con los títulos de las
  // últimas noticias (se arma automáticamente en build time).
  ticker: {
    label: 'Últimas noticias',
    tagline: 'El sitio de resúmenes diarios de noticias sobre construcción, reformas, inmobiliario y regulación en Argentina',
  },

  // Geo tags (meta geo.region / geo.placename) — foco CABA, contenido nacional cuando aplique.
  geo: {
    region: 'AR-C',
    placename: 'Ciudad Autónoma de Buenos Aires, Argentina',
    position: '-34.6037;-58.3816',
  },

  // Página de precios de mano de obra por oficio (contenido en
  // content/precios-mano-de-obra.json). Sección propia para SEO de cola larga
  // ("cuánto cobra un electricista", "precio plomero 2026", etc.), separada de
  // los posts de la categoría "precios".
  laborPrices: {
    path: '/precios-mano-de-obra/',
    navLabel: 'Precios de mano de obra',
    title: 'Precios de mano de obra por oficio en Argentina',
    description:
      'Cuánto cobra un electricista, plomero, gasista, pintor, cerrajero y albañil en Argentina: precios de referencia actualizados, oficio por oficio.',
    image: 'https://images.pexels.com/photos/8985454/pexels-photo-8985454.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },

  // Categorías del sitio. El "id" debe coincidir exactamente con el campo
  // "cat" de cada post en content/posts.json.
  categories: [
    {
      id: 'construccion',
      label: 'Construcción',
      description: 'Obra nueva, materiales, mano de obra y actualidad del sector de la construcción en Argentina.',
    },
    {
      id: 'reformas',
      label: 'Reformas',
      description: 'Refacciones, ampliaciones, remodelaciones y créditos para reformar tu casa.',
    },
    {
      id: 'precios',
      label: 'Precios',
      description: 'Índices de costos, evolución de precios de materiales y del metro cuadrado.',
    },
    {
      id: 'inmobiliario',
      label: 'Inmobiliario',
      description: 'Mercado de compraventa y alquileres, precios, oferta y demanda en CABA y el resto del país.',
    },
    {
      id: 'regulatorio',
      label: 'Regulatorio',
      description: 'Normativa, códigos de edificación, permisos de obra y cambios legales que afectan al sector.',
    },
    {
      id: 'actualidad',
      label: 'Actualidad',
      description: 'Noticias generales y temas en tendencia en Argentina — un poco más allá de construcción e inmobiliario.',
    },
  ],
};
