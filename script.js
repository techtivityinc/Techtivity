(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ============================================================
     PAGE LOAD SEQUENCE — counting veil, then reveal
     ============================================================ */
  function initLoadSequence() {
    const veil = document.createElement('div');
    veil.className = 'load-veil';
    veil.innerHTML = `
      <span class="load-veil__mark">TECHTIVITY</span>
      <span class="load-veil__count mono">0</span>
      <div class="load-veil__bar"><div class="load-veil__bar-fill"></div></div>
    `;
    document.body.prepend(veil);
    document.body.classList.add('is-loading');

    const countEl = veil.querySelector('.load-veil__count');
    const barEl = veil.querySelector('.load-veil__bar-fill');

    let pct = 0;
    let raf;
    function tick() {
      pct += (100 - pct) * 0.09 + 0.6;
      if (pct > 99) pct = 99;
      countEl.textContent = Math.floor(pct);
      barEl.style.width = pct + '%';
      raf = requestAnimationFrame(tick);
    }
    if (!prefersReducedMotion) tick();

    window.addEventListener('load', () => {
      cancelAnimationFrame(raf);
      countEl.textContent = '100';
      barEl.style.width = '100%';
      const delay = prefersReducedMotion ? 0 : 380;
      setTimeout(() => {
        veil.classList.add('is-hidden');
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-loaded');
        setTimeout(() => veil.remove(), 900);
      }, delay);
    });
  }

  /* ============================================================
     CUSTOM CURSOR
     ============================================================ */
  function initCursor() {
    if (isTouch) return;
    const cursor = document.querySelector('.cursor');
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    const label = document.querySelector('.cursor-ring__label');
    if (!cursor || !dot || !ring) return;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      cursor.classList.remove('is-hidden');
    }, { passive: true });

    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));

    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    const hoverTargets = document.querySelectorAll('a, button, input, textarea, .value-card');
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });

    const labeledTargets = [
      { selector: '.project-card', text: 'VIEW' },
      { selector: '.creator-card', text: 'OPEN' }
    ];
    labeledTargets.forEach(({ selector, text }) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.addEventListener('mouseenter', () => {
          if (label) label.textContent = text;
          ring.classList.add('is-labeled');
        });
        el.addEventListener('mouseleave', () => ring.classList.remove('is-labeled'));
      });
    });
  }

  /* ============================================================
     MAGNETIC BUTTONS
     ============================================================ */
  function initMagnetic() {
    if (isTouch || prefersReducedMotion) return;
    const targets = document.querySelectorAll('[data-magnetic]');
    targets.forEach((el) => {
      let rect;
      el.addEventListener('mouseenter', () => { rect = el.getBoundingClientRect(); });
      el.addEventListener('mousemove', (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;
        const moveX = (relX - rect.width / 2) * 0.3;
        const moveY = (relY - rect.height / 2) * 0.3;
        el.style.transform = `translate(${moveX}px, ${moveY}px)`;
        el.style.setProperty('--btn-x', `${relX}px`);
        el.style.setProperty('--btn-y', `${relY}px`);
      });
      el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0, 0)'; });
    });
  }

  /* ============================================================
     NAV LINK SCRAMBLE — small text-decode flourish on hover
     ============================================================ */
  function initScramble() {
    if (isTouch || prefersReducedMotion) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    document.querySelectorAll('[data-scramble]').forEach((el) => {
      const textNode = Array.from(el.childNodes).find((n) => n.nodeType === 3 && n.textContent.trim());
      if (!textNode) return;
      const original = textNode.textContent.trim();
      let frame;
      el.addEventListener('mouseenter', () => {
        let iteration = 0;
        clearInterval(frame);
        frame = setInterval(() => {
          textNode.textContent = original
            .split('')
            .map((ch, i) => {
              if (i < iteration) return original[i];
              if (ch === ' ') return ' ';
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('');
          iteration += 1 / 2;
          if (iteration >= original.length) {
            clearInterval(frame);
            textNode.textContent = original;
          }
        }, 28);
      });
      el.addEventListener('mouseleave', () => {
        clearInterval(frame);
        textNode.textContent = original;
      });
    });
  }

  /* ============================================================
     LOCAL CLOCK — small ambient detail in the nav
     ============================================================ */
  function initClock() {
    const el = document.getElementById('localClock');
    if (!el) return;
    function update() {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }
    update();
    setInterval(update, 1000);
  }

  /* ============================================================
     NAVIGATION — scroll behavior + mobile menu + active section
     ============================================================ */
  function initNav() {
    const nav = document.getElementById('siteNav');
    const toggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    let lastY = window.scrollY;

    function onScroll() {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 40);
      if (y > lastY && y > 200 && !mobileNav.classList.contains('is-open')) {
        nav.classList.add('is-hidden');
      } else {
        nav.classList.remove('is-hidden');
      }
      lastY = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    function closeMenu() {
      toggle.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('is-open');
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    function openMenu() {
      toggle.setAttribute('aria-expanded', 'true');
      mobileNav.classList.add('is-open');
      mobileNav.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    toggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    });
    mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    // Active-section highlighting
    const sections = document.querySelectorAll('main .section, .hero');
    const navLinks = document.querySelectorAll('.nav__link');
    if ('IntersectionObserver' in window && sections.length) {
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((link) => {
              link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
            });
          }
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      sections.forEach((s) => sectionObserver.observe(s));
    }
  }

  /* ============================================================
     SCROLL PROGRESS
     ============================================================ */
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    function update() {
      const h = document.documentElement;
      const scrollable = h.scrollHeight - h.clientHeight;
      const pct = scrollable > 0 ? (h.scrollTop / scrollable) * 100 : 0;
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ============================================================
     SCROLL-TRIGGERED REVEALS
     ============================================================ */
  function initReveals() {
    const items = document.querySelectorAll('.reveal-up');
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          setTimeout(() => el.classList.add('is-visible'), (i % 6) * 60);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    items.forEach((el) => observer.observe(el));
  }

  /* ============================================================
     SCROLL INDICATOR
     ============================================================ */
  function initScrollIndicator() {
    const btn = document.getElementById('scrollIndicator');
    if (!btn) return;
    btn.addEventListener('click', () => {
      document.getElementById('about')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ============================================================
     BACK TO TOP
     ============================================================ */
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ============================================================
     HERO WORDMARK — per-letter reveal
     ============================================================ */
  function initHeroLetters() {
    document.querySelectorAll('[data-letters]').forEach((word) => {
      const text = word.textContent;
      word.textContent = '';
      text.split('').forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.style.setProperty('--i', i);
        span.textContent = ch;
        word.appendChild(span);
      });
    });
  }

  /* ============================================================
     HERO EYEBROW — typewriter
     ============================================================ */
  function initTypewriter() {
    const el = document.getElementById('heroEyebrow');
    if (!el) return;
    const text = el.getAttribute('data-type') || '';
    if (prefersReducedMotion) { el.textContent = text; return; }
    el.textContent = '';
    let i = 0;
    function type() {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i++;
        setTimeout(type, 26);
      } else {
        el.classList.add('is-done');
      }
    }
    setTimeout(type, 700);
  }

  /* ============================================================
     COUNT-UP STATS
     ============================================================ */
  function initCounters() {
    const nums = document.querySelectorAll('[data-count-to]');
    if (!nums.length) return;
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      nums.forEach((el) => { el.textContent = el.getAttribute('data-count-to'); });
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count-to'), 10);
        const duration = 1400;
        const start = performance.now();
        function step(now) {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    }, { threshold: 0.6 });
    nums.forEach((el) => observer.observe(el));
  }

  /* ============================================================
     ABOUT VISUAL — SVG line-draw on reveal
     ============================================================ */
  function initAboutDraw() {
    const visual = document.querySelector('.about__visual');
    if (!visual) return;
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      visual.classList.add('is-drawn');
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visual.classList.add('is-drawn');
          observer.unobserve(visual);
        }
      });
    }, { threshold: 0.4 });
    observer.observe(visual);
  }

  /* ============================================================
     TIMELINE — scroll-linked fill
     ============================================================ */
  function initTimelineFill() {
    const track = document.getElementById('timeline');
    const fill = document.getElementById('timelineFill');
    if (!track || !fill) return;
    function update() {
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height;
      const visible = Math.min(total, Math.max(0, vh * 0.75 - rect.top));
      const pct = total > 0 ? Math.min(100, (visible / total) * 100) : 0;
      fill.style.height = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ============================================================
     CARD TILT — subtle 3D response to pointer
     ============================================================ */
  function initTilt() {
    if (isTouch || prefersReducedMotion) return;
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      let rect;
      card.addEventListener('mouseenter', () => {
        rect = card.getBoundingClientRect();
        card.style.transition = 'transform 120ms ' + 'ease-out';
      });
      card.addEventListener('mousemove', (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        const rotX = (-py * 6).toFixed(2);
        const rotY = (px * 8).toFixed(2);
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

  /* ============================================================
     HERO CANVAS — reactive particle network
     ============================================================ */
  function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const hero = canvas.closest('.hero');

    let width, height, dpr;
    let nodes = [];
    let pointer = { x: null, y: null, active: false };
    let animId = null;

    const NODE_COLOR = 'rgba(210, 218, 235,';
    const LINE_COLOR = 'rgba(120, 135, 165,';

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = hero.clientWidth;
      height = hero.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildNodes();
    }

    function buildNodes() {
      const area = width * height;
      const count = Math.min(46, Math.max(20, Math.round(area / 34000)));
      nodes = new Array(count).fill(0).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 0.9 + 0.4
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      const linkDist = Math.min(170, width / 6);
      const pointerDist = 150;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
        n.x = Math.max(0, Math.min(width, n.x));
        n.y = Math.max(0, Math.min(height, n.y));

        if (pointer.active) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < pointerDist) {
            const force = (1 - dist / pointerDist) * 0.6;
            n.x -= dx * force * 0.02;
            n.y -= dy * force * 0.02;
          }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * 0.22;
            ctx.strokeStyle = LINE_COLOR + alpha + ')';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        if (pointer.active) {
          const dx = pointer.x - nodes[i].x;
          const dy = pointer.y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < pointerDist) {
            ctx.strokeStyle = LINE_COLOR + (1 - dist / pointerDist) * 0.32 + ')';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(pointer.x, pointer.y);
            ctx.lineTo(nodes[i].x, nodes[i].y);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = NODE_COLOR + '0.55)';
        ctx.fill();
      }

      animId = requestAnimationFrame(step);
    }

    function handlePointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    }
    function handlePointerLeave() { pointer.active = false; }
    function handleTouchMove(e) {
      if (!e.touches || !e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.touches[0].clientX - rect.left;
      pointer.y = e.touches[0].clientY - rect.top;
      pointer.active = true;
    }

    hero.addEventListener('mousemove', handlePointerMove, { passive: true });
    hero.addEventListener('mouseleave', handlePointerLeave, { passive: true });
    hero.addEventListener('touchmove', handleTouchMove, { passive: true });
    hero.addEventListener('touchend', handlePointerLeave, { passive: true });

    // subtle parallax as the hero scrolls out of view
    if (!prefersReducedMotion) {
      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y < window.innerHeight) {
          canvas.style.transform = `translateY(${y * 0.15}px)`;
        }
      }, { passive: true });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!animId) { resize(); step(); }
        } else {
          if (animId) { cancelAnimationFrame(animId); animId = null; }
        }
      });
    }, { threshold: 0.01 });
    io.observe(hero);

    if (prefersReducedMotion) {
      resize();
      // draw a single static frame, no animation loop
      step();
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  /* ============================================================
     CONTACT FORM — client-side validation only, no submission
     ============================================================ */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const status = document.getElementById('formStatus');
    const messageField = document.getElementById('message');
    const messageCount = document.getElementById('messageCount');
    const submitBtn = form.querySelector('.btn--primary');
    const submitLabel = submitBtn ? submitBtn.querySelector('.btn__label') : null;

    if (messageField && messageCount) {
      const max = messageField.getAttribute('maxlength') || 400;
      const updateCount = () => { messageCount.textContent = `${messageField.value.length} / ${max}`; };
      messageField.addEventListener('input', updateCount);
      updateCount();
    }

    const validators = {
      name: (v) => v.trim().length >= 2,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: (v) => v.trim().length >= 10
    };
    const messages = {
      name: 'Enter your name (2+ characters).',
      email: 'Enter a valid email address.',
      message: 'Message should be at least 10 characters.'
    };

    function validateField(field) {
      const wrapper = field.closest('.field');
      const errorEl = wrapper.querySelector('.field__error');
      const valid = validators[field.name] ? validators[field.name](field.value) : true;
      wrapper.classList.toggle('has-error', !valid);
      errorEl.textContent = valid ? '' : messages[field.name];
      return valid;
    }

    ['name', 'email', 'message'].forEach((id) => {
      const field = document.getElementById(id);
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.closest('.field').classList.contains('has-error')) validateField(field);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fields = [document.getElementById('name'), document.getElementById('email'), document.getElementById('message')];
      const allValid = fields.map(validateField).every(Boolean);

      status.classList.remove('is-success', 'is-error');

      if (!allValid) {
        status.textContent = 'Please correct the highlighted fields.';
        status.classList.add('is-error');
        return;
      }

      status.textContent = 'Message ready — form submission is not yet connected.';
      status.classList.add('is-success');

      if (submitBtn && submitLabel) {
        const original = submitLabel.textContent;
        submitLabel.textContent = 'Message ready';
        submitBtn.classList.add('is-success');
        setTimeout(() => {
          submitLabel.textContent = original;
          submitBtn.classList.remove('is-success');
        }, 2400);
      }

      form.reset();
      if (messageCount) messageCount.textContent = `0 / ${messageField.getAttribute('maxlength') || 400}`;
      fields.forEach((f) => f.closest('.field').classList.remove('has-error'));
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    initHeroLetters();
    initLoadSequence();
    initCursor();
    initMagnetic();
    initScramble();
    initClock();
    initNav();
    initScrollProgress();
    initReveals();
    initScrollIndicator();
    initBackToTop();
    initTypewriter();
    initCounters();
    initAboutDraw();
    initTimelineFill();
    initTilt();
    initHeroCanvas();
    initContactForm();
  });
})();
