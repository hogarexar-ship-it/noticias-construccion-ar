(function () {
  'use strict';

  /* ---------- Menú hamburguesa (mobile) ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    var closeNav = function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    var openNav = function () {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    // Cerrar al elegir una categoría.
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    // Cerrar con Escape o clic afuera.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      closeNav();
    });

    // Si se agranda la ventana a desktop, aseguramos que quede el estado limpio.
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 780) closeNav();
    });
  }

  /* ---------- Ticker deslizante ---------- */
  var ticker = document.querySelector('[data-ticker]');
  if (ticker) {
    var items = ticker.querySelectorAll('.ticker__item');
    if (items.length > 1) {
      var current = 0;
      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      var showNext = function () {
        items[current].setAttribute('hidden', '');
        current = (current + 1) % items.length;
        items[current].removeAttribute('hidden');
      };

      if (!reduceMotion) {
        setInterval(showNext, 4500);
      }
    }
  }
})();
