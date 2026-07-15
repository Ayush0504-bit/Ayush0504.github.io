/* ===========================
   AYUSH GAJBHIYE — PORTFOLIO
   script.js
   =========================== */

// ─── Typed Text Animation ─────────────────────────────────────────────────────
const typedEl    = document.getElementById('typedText');
const words      = ['AI Engineer', 'Full-Stack Developer', 'WebRTC Builder', 'ML Enthusiast'];
let   wordIndex  = 0;
let   charIndex  = 0;
let   isDeleting = false;

function typeLoop() {
  const word    = words[wordIndex];
  const current = isDeleting
    ? word.substring(0, charIndex - 1)
    : word.substring(0, charIndex + 1);

  typedEl.textContent = current;

  if (!isDeleting) charIndex++;
  else             charIndex--;

  let speed = isDeleting ? 60 : 110;

  if (!isDeleting && charIndex === word.length) {
    speed = 1800;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    wordIndex  = (wordIndex + 1) % words.length;
    speed = 400;
  }

  setTimeout(typeLoop, speed);
}
if (typedEl) typeLoop();


// ─── Particle Canvas ──────────────────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');
  if (!ctx) return;
  let   W, H;
  let   particles = [];

  const COLORS = ['rgba(232,97,26,', 'rgba(251,176,101,', 'rgba(242,139,48,'];
  const COUNT  = 90;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function createParticle() {
    return {
      x:    Math.random() * W,
      y:    Math.random() * H,
      r:    Math.random() * 1.8 + 0.4,
      vx:   (Math.random() - 0.5) * 0.35,
      vy:   (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  for (let i = 0; i < COUNT; i++) particles.push(createParticle());

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(232,97,26,${0.12 * (1 - dist / 120)})`;
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
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }
  animate();
})();


// ─── Sticky Navbar ────────────────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}


// ─── Mobile Hamburger ─────────────────────────────────────────────────────────
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


// ─── Scroll Reveal ────────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


// ─── Staggered Reveal for Groups ─────────────────────────────────────────────
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


// ─── Skill Pills Stagger ──────────────────────────────────────────────────────
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


// ─── Contact Form — Formspree ─────────────────────────────────────────────────
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
    if (!name || !email || !message) {
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
        // Formspree returned an error — surface its message, but fall back to
        // the HTTP status if the body isn't valid JSON (so the real failure
        // isn't masked by a parse error).
        let detail = '';
        try {
          const data = await response.json();
          detail = data?.errors?.map(e => e.message).join(', ') || '';
        } catch {
          // Response body was not JSON; ignore and use the status below.
        }
        throw new Error(detail || `Submission failed (HTTP ${response.status}).`);
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


// ─── Resume Button (placeholder alert) ───────────────────────────────────────
document.querySelectorAll('#resumeBtn, #resumeBtn2').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    // Replace href with actual resume PDF path
    alert('📄 Resume download will be available once the PDF is uploaded!');
  });
});


// ─── Floating Hero Elements parallax ─────────────────────────────────────────
document.addEventListener('mousemove', e => {
  const xRatio = (e.clientX / window.innerWidth  - 0.5) * 2;
  const yRatio = (e.clientY / window.innerHeight - 0.5) * 2;

  const avatar = document.querySelector('.hero-avatar');
  if (avatar) {
    avatar.style.transform = `translate(${xRatio * 6}px, ${yRatio * 6}px)`;
  }

  const ring = document.querySelector('.avatar-ring');
  if (ring) {
    ring.style.transform = `rotate(${Date.now() / 50}deg) translate(${xRatio * 10}px, ${yRatio * 10}px)`;
  }
});


// ─── Shake keyframes via JS (injected once) ───────────────────────────────────
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


// ─── Active nav link on scroll ────────────────────────────────────────────────
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
