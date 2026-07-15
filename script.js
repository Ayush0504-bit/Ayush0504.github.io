/* ===========================
   AYUSH GAJBHIYE — PORTFOLIO
   script.js
   =========================== */

(function (global) {
  'use strict';

  // ─── Pure logic (unit-testable, no DOM) ────────────────────────────────────

  const WORDS = ['AI Engineer', 'Full-Stack Developer', 'WebRTC Builder', 'ML Enthusiast'];

  const PARTICLE_COLORS = ['rgba(232,97,26,', 'rgba(251,176,101,', 'rgba(242,139,48,'];
  const PARTICLE_COUNT  = 90;
  const CONNECT_DIST     = 120;

  /**
   * Advance the typing state machine by one frame.
   * Returns the text to render plus the next state and delay.
   */
  function computeTypedFrame(words, wordIndex, charIndex, isDeleting) {
    const word = words[wordIndex];
    const text = isDeleting
      ? word.substring(0, charIndex - 1)
      : word.substring(0, charIndex + 1);

    const nextCharIndex = isDeleting ? charIndex - 1 : charIndex + 1;
    let nextIsDeleting  = isDeleting;
    let nextWordIndex   = wordIndex;
    let speed           = isDeleting ? 60 : 110;

    if (!isDeleting && nextCharIndex === word.length) {
      speed          = 1800;
      nextIsDeleting = true;
    } else if (isDeleting && nextCharIndex === 0) {
      nextIsDeleting = false;
      nextWordIndex  = (wordIndex + 1) % words.length;
      speed          = 400;
    }

    return {
      text,
      charIndex:  nextCharIndex,
      isDeleting: nextIsDeleting,
      wordIndex:  nextWordIndex,
      speed,
    };
  }

  /** Create a single particle with randomized attributes. */
  function createParticle(W, H, rng) {
    const rand = rng || Math.random;
    return {
      x:     rand() * W,
      y:     rand() * H,
      r:     rand() * 1.8 + 0.4,
      vx:    (rand() - 0.5) * 0.35,
      vy:    (rand() - 0.5) * 0.35,
      alpha: rand() * 0.5 + 0.1,
      color: PARTICLE_COLORS[Math.floor(rand() * PARTICLE_COLORS.length)],
    };
  }

  /** Euclidean distance between two points. */
  function distance(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Opacity for a connection line between two particles, or null when they are
   * too far apart to be connected.
   */
  function connectionOpacity(dist, maxDist) {
    const max = maxDist == null ? CONNECT_DIST : maxDist;
    if (dist < max) return 0.12 * (1 - dist / max);
    return null;
  }

  /** Reflect a velocity component when the position leaves the [0, max] range. */
  function bounceVelocity(pos, vel, max) {
    return (pos < 0 || pos > max) ? -vel : vel;
  }

  /** Compose a particle's fill style from its color prefix and alpha. */
  function particleColor(color, alpha) {
    return color + alpha + ')';
  }

  /** Whether the navbar should be in the "scrolled" state. */
  function isScrolled(scrollY, threshold) {
    return scrollY > (threshold == null ? 50 : threshold);
  }

  /** True when all contact fields are non-empty after trimming. */
  function hasRequiredFields(name, email, message) {
    return Boolean(trim(name) && trim(email) && trim(message));
  }

  function trim(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  /** Normalized [-1, 1] pointer position ratios for parallax effects. */
  function parallaxRatios(clientX, clientY, width, height) {
    return {
      xRatio: (clientX / width  - 0.5) * 2,
      yRatio: (clientY / height - 0.5) * 2,
    };
  }

  function avatarTransform(xRatio, yRatio) {
    return `translate(${xRatio * 6}px, ${yRatio * 6}px)`;
  }

  function ringTransform(xRatio, yRatio, now) {
    return `rotate(${now / 50}deg) translate(${xRatio * 10}px, ${yRatio * 10}px)`;
  }

  const portfolio = {
    WORDS,
    PARTICLE_COLORS,
    PARTICLE_COUNT,
    CONNECT_DIST,
    computeTypedFrame,
    createParticle,
    distance,
    connectionOpacity,
    bounceVelocity,
    particleColor,
    isScrolled,
    hasRequiredFields,
    parallaxRatios,
    avatarTransform,
    ringTransform,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = portfolio;
  }
  global.portfolio = portfolio;

  // ─── Browser wiring (only when a real DOM is present) ───────────────────────

  if (typeof document === 'undefined' || !document.getElementById('typedText')) {
    return;
  }

  // ─── Typed Text Animation ─────────────────────────────────────────────────
  const typedEl   = document.getElementById('typedText');
  let   wordIndex  = 0;
  let   charIndex  = 0;
  let   isDeleting = false;

  function typeLoop() {
    const frame = computeTypedFrame(WORDS, wordIndex, charIndex, isDeleting);
    typedEl.textContent = frame.text;
    charIndex  = frame.charIndex;
    isDeleting = frame.isDeleting;
    wordIndex  = frame.wordIndex;
    setTimeout(typeLoop, frame.speed);
  }
  typeLoop();


  // ─── Particle Canvas ────────────────────────────────────────────────────────
  (function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx    = canvas.getContext('2d');
    let   W, H;
    let   particles = [];

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle(W, H));

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist    = distance(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
          const opacity = connectionOpacity(dist);
          if (opacity !== null) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(232,97,26,${opacity})`;
            ctx.lineWidth   = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, W, H);
      drawConnections();

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx = bounceVelocity(p.x, p.vx, W);
        p.vy = bounceVelocity(p.y, p.vy, H);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = particleColor(p.color, p.alpha);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }
    animate();
  })();


  // ─── Sticky Navbar ────────────────────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', isScrolled(window.scrollY));
  });


  // ─── Mobile Hamburger ─────────────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('mobile-open');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('mobile-open');
      });
    });
  }


  // ─── Scroll Reveal ──────────────────────────────────────────────────────────
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, 80);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


  // ─── Staggered Reveal for Groups ───────────────────────────────────────────
  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const items = entry.target.querySelectorAll('.skill-category, .project-card, .cert-card, .edu-card');
        items.forEach((item, i) => {
          setTimeout(() => {
            item.classList.add('visible');
          }, i * 120);
        });
        staggerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.skills-categories, .projects-grid, .certs-grid, .about-education').forEach(el => {
    el.querySelectorAll('.skill-category, .project-card, .cert-card, .edu-card').forEach(child => {
      child.classList.add('reveal');
    });
    staggerObserver.observe(el);
  });


  // ─── Skill Pills Stagger ──────────────────────────────────────────────────
  const pillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.skill-pill').forEach((p, i) => {
          p.style.animationDelay = `${i * 50}ms`;
          p.style.animationPlayState = 'running';
        });
        pillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.skills-pills').forEach(el => {
    el.querySelectorAll('.skill-pill').forEach(p => {
      p.style.animationPlayState = 'paused';
    });
    pillObserver.observe(el);
  });


  // ─── Contact Form — Formspree ───────────────────────────────────────────────
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn   = document.getElementById('submitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();

      const name    = document.getElementById('contactName').value.trim();
      const email   = document.getElementById('contactEmail').value.trim();
      const message = document.getElementById('contactMsg').value.trim();

      // Basic validation
      if (!hasRequiredFields(name, email, message)) {
        submitBtn.style.animation = 'shake 0.4s ease';
        setTimeout(() => submitBtn.style.animation = '', 500);
        return;
      }

      // Loading state
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'Sending…';
      submitBtn.querySelector('.btn-icon').textContent = '⏳';

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(contactForm),
        });

        if (response.ok) {
          // Success
          contactForm.reset();
          contactForm.style.display = 'none';
          formSuccess.style.display = 'block';
          formSuccess.textContent   = '✅ Message sent! I\'ll get back to you soon.';
        } else {
          // Formspree returned an error
          const data = await response.json();
          throw new Error(data?.errors?.map(err => err.message).join(', ') || 'Submission failed.');
        }
      } catch (err) {
        // Network / unknown error
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = 'Send Message';
        submitBtn.querySelector('.btn-icon').textContent = '→';
        formSuccess.style.display  = 'block';
        formSuccess.style.color    = '#ff8a65';
        formSuccess.style.borderColor = '#ff8a65';
        formSuccess.textContent    = '❌ ' + (err.message || 'Something went wrong. Please email me directly.');
      }
    });
  }


  // ─── Resume Button (placeholder alert) ─────────────────────────────────────
  document.querySelectorAll('#resumeBtn, #resumeBtn2').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      // Replace href with actual resume PDF path
      alert('📄 Resume download will be available once the PDF is uploaded!');
    });
  });


  // ─── Floating Hero Elements parallax ───────────────────────────────────────
  document.addEventListener('mousemove', e => {
    const { xRatio, yRatio } = parallaxRatios(e.clientX, e.clientY, window.innerWidth, window.innerHeight);

    const avatar = document.querySelector('.hero-avatar');
    if (avatar) {
      avatar.style.transform = avatarTransform(xRatio, yRatio);
    }

    const ring = document.querySelector('.avatar-ring');
    if (ring) {
      ring.style.transform = ringTransform(xRatio, yRatio, Date.now());
    }
  });


  // ─── Shake keyframes via JS (injected once) ─────────────────────────────────
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    @keyframes shake {
      0%,100%{transform:translateX(0)}
      20%{transform:translateX(-6px)}
      40%{transform:translateX(6px)}
      60%{transform:translateX(-4px)}
      80%{transform:translateX(4px)}
    }
  `;
  document.head.appendChild(shakeStyle);


  // ─── Active nav link on scroll ──────────────────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navAnchs = document.querySelectorAll('.nav-links a');

  const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navAnchs.forEach(a => a.style.color = '');
        const activeA = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (activeA) activeA.style.color = 'var(--amber-light)';
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => activeObserver.observe(s));

})(typeof window !== 'undefined' ? window : globalThis);
