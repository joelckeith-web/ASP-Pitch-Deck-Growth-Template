/* =============================================
   ASP PITCH DECK — SLIDE ENGINE
   ============================================= */

(function () {
  'use strict';

  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;
  let currentIndex = 0;
  let isAnimating = false;

  // DOM refs
  const progressBar = document.getElementById('progressBar');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const currentSlideEl = document.getElementById('currentSlide');
  const totalSlidesEl = document.getElementById('totalSlides');

  // Zero-pad helper
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // Detect mobile
  const MOBILE_BP = 768;
  const isMobile = window.matchMedia('(max-width: ' + MOBILE_BP + 'px)').matches;

  // Init
  totalSlidesEl.textContent = pad(totalSlides);

  // --- SHARED HELPERS ---
  function updateUI() {
    currentSlideEl.textContent = pad(currentIndex + 1);
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex === totalSlides - 1;
    const pct = ((currentIndex + 1) / totalSlides) * 100;
    progressBar.style.width = pct + '%';
  }

  function triggerAnimations(slide) {
    const els = slide.querySelectorAll('.animate-in');
    els.forEach((el) => {
      const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      setTimeout(() => {
        el.classList.add('visible');
      }, delay + 100);
    });
  }

  function resetAnimations(slide) {
    const els = slide.querySelectorAll('.animate-in');
    els.forEach((el) => {
      el.classList.remove('visible');
    });
  }

  /* =============================================
     MOBILE — Continuous scroll mode
     ============================================= */
  if (isMobile) {
    // Enable mobile scroll mode
    document.body.classList.add('mobile-scroll');

    // Make all slides visible in flow
    slides.forEach(function (s) {
      s.classList.add('active');
    });

    // Update progress + counter on scroll using IntersectionObserver
    const scrollObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          const idx = Array.prototype.indexOf.call(slides, entry.target);
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

    slides.forEach(function (s) { scrollObserver.observe(s); });

    // Animate elements as they scroll into view
    const animObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // Get the parent slide
          var slide = entry.target.closest('.slide');
          if (slide) {
            triggerAnimations(slide);
          }
          animObserver.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.15
    });

    // Observe each slide for animation triggering
    slides.forEach(function (s) { animObserver.observe(s); });

    // Also update progress on raw scroll for smoother bar
    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        var pct = (scrollTop / docHeight) * 100;
        progressBar.style.width = Math.min(pct, 100) + '%';
      }
    }, { passive: true });

    // Init first slide
    updateUI();
    triggerAnimations(slides[0]);

  /* =============================================
     DESKTOP — Slide-based navigation
     ============================================= */
  } else {
    updateUI();
    triggerAnimations(slides[0]);

    // --- NAVIGATION ---
    function goToSlide(index) {
      if (isAnimating || index === currentIndex || index < 0 || index >= totalSlides) return;
      isAnimating = true;

      const outgoing = slides[currentIndex];
      const incoming = slides[index];
      const direction = index > currentIndex ? 1 : -1;

      outgoing.classList.remove('active');
      outgoing.classList.add(direction > 0 ? 'exit-left' : '');
      outgoing.style.transform = `translateX(${direction * -60}px)`;
      outgoing.style.opacity = '0';

      setTimeout(() => {
        outgoing.classList.remove('exit-left');
        outgoing.style.transform = '';
        outgoing.style.opacity = '';
        resetAnimations(outgoing);
      }, 500);

      incoming.style.transform = `translateX(${direction * 60}px)`;
      incoming.style.opacity = '0';
      void incoming.offsetWidth;
      incoming.classList.add('active');

      requestAnimationFrame(() => {
        incoming.style.transform = 'translateX(0)';
        incoming.style.opacity = '1';
        triggerAnimations(incoming);
      });

      currentIndex = index;
      updateUI();

      setTimeout(() => {
        isAnimating = false;
      }, 550);
    }

    function next() { goToSlide(currentIndex + 1); }
    function prev() { goToSlide(currentIndex - 1); }

    // Buttons
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prev();
      }
    });

    // Touch / Swipe
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - touchStartX;
      const dy = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) next();
        else prev();
      }
    }, { passive: true });

    // Mouse wheel
    let wheelTimer = null;
    document.addEventListener('wheel', (e) => {
      if (wheelTimer) return;
      wheelTimer = setTimeout(() => { wheelTimer = null; }, 800);
      if (e.deltaY > 0 || e.deltaX > 0) next();
      else if (e.deltaY < 0 || e.deltaX < 0) prev();
    }, { passive: true });
  } // end desktop

  // --- PDF DOWNLOAD ---
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', generatePDF);
  }

  async function generatePDF() {
    // Guard: ensure libraries loaded
    if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
      alert('PDF libraries are still loading. Please wait a moment and try again.');
      return;
    }

    const { jsPDF } = jspdf;

    // Disable button
    downloadPdfBtn.disabled = true;
    const origHTML = downloadPdfBtn.innerHTML;
    downloadPdfBtn.innerHTML = 'Generating&hellip;';

    // Show progress overlay
    const overlay = document.createElement('div');
    overlay.className = 'pdf-overlay';
    overlay.innerHTML =
      '<div class="pdf-overlay__text">Generating PDF &mdash; <span id="pdfSlideProgress">0</span> / ' + totalSlides + '</div>' +
      '<div class="pdf-overlay__progress"><div class="pdf-overlay__bar" id="pdfProgressBar"></div></div>';
    document.body.appendChild(overlay);

    const pdfSlideProgress = document.getElementById('pdfSlideProgress');
    const pdfProgressBar = document.getElementById('pdfProgressBar');

    // Remember current slide
    const savedIndex = currentIndex;

    // Capture dimensions
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Create landscape PDF sized to viewport
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [vw, vh],
      compress: true
    });

    // Elements to hide during capture
    const navEl = document.getElementById('deckNav');

    for (let i = 0; i < totalSlides; i++) {
      // Update progress
      pdfSlideProgress.textContent = (i + 1);
      pdfProgressBar.style.width = ((i + 1) / totalSlides * 100) + '%';

      // Show only this slide with all animations visible
      slides.forEach(function (s, idx) {
        if (idx === i) {
          s.classList.add('active');
          s.style.opacity = '1';
          s.style.transform = 'translateX(0)';
          s.style.pointerEvents = 'auto';
          s.querySelectorAll('.animate-in').forEach(function (el) { el.classList.add('visible'); });
        } else {
          s.classList.remove('active');
          s.style.opacity = '0';
          s.style.transform = '';
          s.style.pointerEvents = 'none';
        }
      });

      // Let styles settle
      await new Promise(function (r) { setTimeout(r, 200); });

      try {
        var canvas = await html2canvas(document.body, {
          width: vw,
          height: vh,
          windowWidth: vw,
          windowHeight: vh,
          scale: 2,
          useCORS: true,
          backgroundColor: '#000000',
          logging: false,
          ignoreElements: function (el) {
            return el === overlay || el === navEl;
          }
        });

        var imgData = canvas.toDataURL('image/jpeg', 0.92);

        if (i > 0) {
          pdf.addPage([vw, vh], 'landscape');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, vw, vh);
      } catch (err) {
        console.error('Error capturing slide ' + (i + 1) + ':', err);
      }
    }

    // Restore original slide
    slides.forEach(function (s, idx) {
      if (idx === savedIndex) {
        s.classList.add('active');
        s.style.opacity = '1';
        s.style.transform = 'translateX(0)';
        s.style.pointerEvents = 'auto';
        s.querySelectorAll('.animate-in').forEach(function (el) { el.classList.add('visible'); });
      } else {
        s.classList.remove('active');
        s.style.opacity = '';
        s.style.transform = '';
        s.style.pointerEvents = '';
      }
    });

    currentIndex = savedIndex;
    updateUI();

    // Clean up overlay
    document.body.removeChild(overlay);

    // Restore button
    downloadPdfBtn.disabled = false;
    downloadPdfBtn.innerHTML = origHTML;

    // Download
    pdf.save('ASP-Growth-Accelerator-Alpha-Solutions.pdf');
  }

})();
