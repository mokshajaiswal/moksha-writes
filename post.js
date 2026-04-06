// Moksha Writes — post.js

document.addEventListener('DOMContentLoaded', () => {

  // ── CUSTOM CURSOR ──
  const cursor = document.querySelector('.cursor');
  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (cursor && !cursor.classList.contains('active')) {
      cursor.classList.add('active');
    }
  });

  if (cursor) {
    // Default: pink cursor (light background page)
    cursor.classList.add('cursor--pink');

    // Smooth follow
    function animateCursor() {
      const dx = mouseX - cursorX;
      const dy = mouseY - cursorY;
      cursorX += dx * 0.15;
      cursorY += dy * 0.15;
      cursor.style.left = `${cursorX}px`;
      cursor.style.top  = `${cursorY}px`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover states on interactive elements
    const interactives = document.querySelectorAll('a, button, .toc-link, .p-card, .p-card-link');
    interactives.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }

  // ── SCROLL PROGRESS BAR ──
  const progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    function updateProgress() {
      const scrollTop    = window.scrollY;
      const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
      const pct          = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = `${pct}%`;
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // ── TOC SECTION HIGHLIGHTING ──
  const tocLinks = document.querySelectorAll('.toc-link');

  if (tocLinks.length) {
    // Build a map: section id → toc link
    const sectionMap = {};
    tocLinks.forEach(link => {
      const id = link.getAttribute('href').replace('#', '');
      sectionMap[id] = link;
    });

    const sections = document.querySelectorAll('.post-content section[id]');

    const tocObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Deactivate all
          tocLinks.forEach(l => l.classList.remove('toc-active'));
          // Activate matching
          const link = sectionMap[entry.target.id];
          if (link) link.classList.add('toc-active');
        }
      });
    }, {
      rootMargin: '-15% 0px -70% 0px',
      threshold: 0
    });

    sections.forEach(section => tocObserver.observe(section));
  }

  // ── SCROLL REVEAL ──
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -48px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => revealObserver.observe(el));

  // ── RE-TRIGGER ANIMATIONS ON BFCACHE RESTORE ──
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      document.querySelectorAll('[style*="animation"]').forEach(el => {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = '';
      });
    }
  });

});
