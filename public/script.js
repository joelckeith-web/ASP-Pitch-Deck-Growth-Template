/* =============================================
   ASP PITCH DECK — SCROLL ENGINE
   ============================================= */

(function () {
  'use strict';

  var slides = document.querySelectorAll('.slide');
  var totalSlides = slides.length;
  var currentIndex = 0;

  // DOM refs
  var progressBar = document.getElementById('progressBar');
  var currentSlideEl = document.getElementById('currentSlide');
  var totalSlidesEl = document.getElementById('totalSlides');

  // Zero-pad helper
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // Init counter
  totalSlidesEl.textContent = pad(totalSlides);

  function updateUI() {
    currentSlideEl.textContent = pad(currentIndex + 1);
  }

  function triggerAnimations(slide) {
    var els = slide.querySelectorAll('.animate-in');
    els.forEach(function (el) {
      var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      setTimeout(function () {
        el.classList.add('visible');
      }, delay + 100);
    });
  }

  // --- SCROLL-BASED PROGRESS BAR ---
  window.addEventListener('scroll', function () {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      var pct = (scrollTop / docHeight) * 100;
      progressBar.style.width = Math.min(pct, 100) + '%';
    }
  }, { passive: true });

  // --- INTERSECTION OBSERVER: track current slide ---
  var slideObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
        var idx = Array.prototype.indexOf.call(slides, entry.target);
        if (idx !== -1) {
          currentIndex = idx;
          updateUI();
        }
      }
    });
  }, {
    root: null,
    threshold: 0.3
  });

  slides.forEach(function (s) { slideObserver.observe(s); });

  // --- INTERSECTION OBSERVER: animate elements on scroll ---
  var animObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        triggerAnimations(entry.target);
        animObserver.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    threshold: 0.15
  });

  slides.forEach(function (s) { animObserver.observe(s); });

  // Init first slide
  updateUI();
  triggerAnimations(slides[0]);

})();
