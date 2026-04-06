// Moksha Writes — main.js

document.addEventListener('DOMContentLoaded', () => {
  const navLogo = document.querySelector('.nav-logo');
  const flower = document.querySelector('.flower');

  // Paste a raw GitHub .lottie URL into the data attribute in index.html.
  function convertRawGitHubLottieUrl(url) {
    if (!url) return '';

    const trimmedUrl = url.trim();
    const rawGithubMatch = trimmedUrl.match(
      /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+\.lottie)$/i,
    );

    if (rawGithubMatch) {
      const [, owner, repo, ref, assetPath] = rawGithubMatch;
      return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${ref}/${assetPath}`;
    }

    return trimmedUrl;
  }

  async function initLottieElement(container, canvasSelector) {
    if (!container) return;

    const rawUrl = container.dataset.lottieRawUrl;
    const stateMachineId = container.dataset.lottieStateMachine;
    if (!rawUrl) return;

    const canvas = container.querySelector(canvasSelector);
    const src = convertRawGitHubLottieUrl(rawUrl);
    if (!canvas || !src) return;

    try {
      const { DotLottie } = await import('https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm');

      const dotLottieConfig = {
        autoplay: true,
        loop: true,
        canvas,
        src,
        renderConfig: {
          autoResize: true,
        },
        layout: {
          fit: 'contain',
          align: [0.5, 0.5],
        },
      };

      if (stateMachineId) {
        dotLottieConfig.stateMachineId = stateMachineId;
      }

      new DotLottie(dotLottieConfig);

      container.dataset.lottieReady = 'true';
    } catch (error) {
      console.error('Failed to initialize .lottie animation.', error);
    }
  }

  initLottieElement(navLogo, '.nav-logo-canvas');
  initLottieElement(flower, '.flower-canvas');

  // CUSTOM CURSOR
  const cursor = document.querySelector('.cursor');
  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Show cursor on first move
    if (!cursor.classList.contains('active')) {
      cursor.classList.add('active');
    }
  });

  // DOTS CANVAS INTERACTION
  const canvas = document.getElementById('dots-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const dotsContainer = canvas.parentElement;
    let dots = [];
    let dpr = window.devicePixelRatio || 1;
    let spacing = 35;
    let edgeBuffer = 96;
    const baseRadius = 2.4;
    const maxRadius = 55; // Large for overlapping effect
    const proximity = 220;
    const displaceAmount = 30; // Increased push
    const hoverSustain = 50;

    class Dot {
      constructor(x, y) {
        this.baseX = x;
        this.baseY = y;
        this.x = x;
        this.y = y;
        this.radius = baseRadius;
        this.targetRadius = baseRadius;
        this.lastHover = 0;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Solid White
        ctx.fill();
      }

      update(mX, mY) {
        const rect = canvas.getBoundingClientRect();
        const relMouseX = mX - rect.left;
        const relMouseY = mY - rect.top;

        const dx = relMouseX - this.baseX;
        const dy = relMouseY - this.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const safeDistance = Math.max(distance, 0.001);

        const now = Date.now();

        if (distance < proximity) {
          this.lastHover = now;
          const ratio = (proximity - distance) / proximity;
          const power = Math.pow(ratio, 1.25);

          this.targetRadius = baseRadius + (maxRadius - baseRadius) * power;

          this.x = this.baseX - (dx / safeDistance) * (displaceAmount * power);
          this.y = this.baseY - (dy / safeDistance) * (displaceAmount * power);
        } else if (now - this.lastHover < hoverSustain) {
          // Seamless sustain decay
          const sustainRatio = (now - this.lastHover) / hoverSustain;
          this.targetRadius = baseRadius + (maxRadius - baseRadius) * 0.2 * (1 - sustainRatio);
          this.x = this.baseX;
          this.y = this.baseY;
        } else {
          this.targetRadius = baseRadius;
          this.x = this.baseX;
          this.y = this.baseY;
        }

        // Smoothly transition everything
        this.radius += (this.targetRadius - this.radius) * 0.25; // Snappier
      }
    }

    function initCanvas() {
      const rootStyles = getComputedStyle(document.documentElement);
      const spacingVar = parseFloat(rootStyles.getPropertyValue('--dot-grid-spacing'));
      const edgeBufferVar = parseFloat(rootStyles.getPropertyValue('--dot-overflow-buffer'));
      spacing = Number.isFinite(spacingVar) && spacingVar > 0 ? spacingVar : 35;
      edgeBuffer = Number.isFinite(edgeBufferVar) && edgeBufferVar >= 0 ? edgeBufferVar : 96;

      const rect = canvas.getBoundingClientRect();
      const containerRect = dotsContainer.getBoundingClientRect();
      const inner = document.querySelector('.hero .inner') || document.querySelector('nav .inner');
      const innerRect = inner.getBoundingClientRect();

      dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      const contentWidth = Math.min(innerRect.width, containerRect.width);
      const sideInset = Math.max((containerRect.width - contentWidth) / 2, 0);
      const startX = edgeBuffer + sideInset + spacing / 2;
      const startY = edgeBuffer + spacing / 2;
      const cols = Math.max(Math.floor((contentWidth - spacing) / spacing) + 1, 1);
      const rows = Math.max(Math.floor((containerRect.height - spacing) / spacing) + 1 + 2, 1);

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          dots.push(new Dot(startX + j * spacing, startY + i * spacing));
        }
      }
    }

    window.addEventListener('resize', initCanvas);
    initCanvas();

    function animateDots() {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      dots.forEach(dot => {
        dot.update(mouseX, mouseY);
        dot.draw();
      });
      requestAnimationFrame(animateDots);
    }
    animateDots();

    // Toggle cursor visibility over dots
    const container = canvas.parentElement;
    container.addEventListener('mouseenter', () => cursor.classList.add('cursor-hidden'));
    container.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hidden'));
  }

  // Smooth follow (lerp) for cursor
  function animateCursor() {
    let dx = mouseX - cursorX;
    let dy = mouseY - cursorY;

    cursorX += dx * 0.15;
    cursorY += dy * 0.15;

    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;

    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // CURSOR COLOR: pink on light sections, default on hero
  const heroSection = document.querySelector('.hero-section');
  cursor.classList.add('cursor--pink'); // default to pink (light bg)
  if (heroSection) {
    heroSection.addEventListener('mouseenter', () => cursor.classList.remove('cursor--pink'));
    heroSection.addEventListener('mouseleave', () => cursor.classList.add('cursor--pink'));
  }

  // Load more button: white cursor (dark bg on hover)
  const loadMoreBtnEl = document.getElementById('load-more-btn');
  if (loadMoreBtnEl) {
    loadMoreBtnEl.addEventListener('mouseenter', () => cursor.classList.remove('cursor--pink'));
    loadMoreBtnEl.addEventListener('mouseleave', () => cursor.classList.add('cursor--pink'));
  }

  // Hover states
  const interactives = document.querySelectorAll('a, button, .nav-brand, .nav-logo, .b-card, .p-card, .b-card-link, .p-card-link');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });



  // TYPEWRITER EFFECT
  const typewriter = document.getElementById('typewriter');
  const phrases = [
    "I think out loud.",
    "I design stuff.",
    "I build products."
  ];
  let phraseIndex = 0;
  let charIndex = phrases[0].length;
  let isErasing = true; // First action will be to backspace
  let typewriterTimeout;

  function handleTypewriter() {
    const currentPhrase = phrases[phraseIndex];
    
    if (isErasing) {
      // "Backspace" phase: erase character-by-character
      typewriter.innerHTML = `<em>${currentPhrase.substring(0, charIndex - 1)}</em>`;
      charIndex--;
      
      if (charIndex === 0) {
        isErasing = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typewriterTimeout = setTimeout(handleTypewriter, 500); // 0.5s pause before typing new word
      } else {
        typewriterTimeout = setTimeout(handleTypewriter, 40); // Fast backspace speed
      }
    } else {
      // Typing logic (one by one)
      const nextPhrase = phrases[phraseIndex];
      typewriter.innerHTML = `<em>${nextPhrase.substring(0, charIndex + 1)}</em>`;
      charIndex++;
      
      if (charIndex === nextPhrase.length) {
        isErasing = true;
        typewriterTimeout = setTimeout(handleTypewriter, 2000); // 2-second pause between phrases
      } else {
        typewriterTimeout = setTimeout(handleTypewriter, 80); // Quick typing speed
      }
    }
  }

  if (typewriter) {
    // Start after initial delay
    typewriterTimeout = setTimeout(handleTypewriter, 2000);
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

  // ── FILTER PILLS ──
  let loadedMore = false;

  const pills = document.querySelectorAll('.pill');
  const postCards = document.querySelectorAll('.p-card');
  const postsFade = document.getElementById('posts-fade');
  const loadMoreBtn = document.getElementById('load-more-btn');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('pill--on'));
      pill.classList.add('pill--on');

      const filter = pill.dataset.filter;

      postCards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        const isHidden = card.classList.contains('p-hidden');

        if (filter === 'all') {
          // Restore default: show only first 9 unless loaded more
          if (isHidden && !loadedMore) {
            card.style.display = 'none';
          } else {
            card.style.display = '';
          }
        } else {
          // Show all matching cards regardless of hidden status
          card.style.display = match ? '' : 'none';
        }
      });

      // Show/hide fade + load more based on filter
      if (filter === 'all' && !loadedMore) {
        if (postsFade) postsFade.style.display = '';
        if (loadMoreBtn) loadMoreBtn.style.display = '';
      } else {
        if (postsFade) postsFade.style.display = 'none';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      }
    });
  });

  // ── LOAD MORE ──
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      loadedMore = true;

      document.querySelectorAll('.p-card.p-hidden').forEach(card => {
        card.style.display = '';
      });

      if (postsFade) postsFade.style.display = 'none';
      loadMoreBtn.style.display = 'none';
    });
  }

  // Re-trigger animations if user navigates back (bfcache)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      document.querySelectorAll('[style*="animation"]').forEach(el => {
        el.style.animation = 'none';
        el.offsetHeight; // reflow
        el.style.animation = '';
      });
    }
  });

});
