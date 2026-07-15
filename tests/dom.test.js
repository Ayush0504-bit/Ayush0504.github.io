/**
 * Integration tests for the DOM wiring in script.js.
 *
 * A representative DOM plus stubs for the browser APIs jsdom doesn't implement
 * (IntersectionObserver, requestAnimationFrame, canvas 2d context, fetch,
 * alert) let us require the script and drive its event handlers.
 */

const flushMicrotasks = async () => {
  for (let i = 0; i < 6; i++) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
};

const DOM = `
  <nav id="navbar">
    <ul class="nav-links" id="navLinks">
      <li><a href="#about">About</a></li>
    </ul>
  </nav>
  <button id="hamburger"></button>
  <canvas id="particleCanvas"></canvas>
  <span id="typedText"></span>
  <div class="hero-avatar"></div>
  <div class="avatar-ring"></div>
  <a href="#" id="resumeBtn">Resume</a>

  <div class="skills-categories">
    <div class="skill-category"></div>
  </div>
  <div class="skills-pills">
    <span class="skill-pill"></span>
    <span class="skill-pill"></span>
  </div>
  <p class="reveal">reveal me</p>

  <section id="about"></section>

  <form id="contactForm" action="https://formspree.io/test">
    <input id="contactName" />
    <input id="contactEmail" />
    <textarea id="contactMsg"></textarea>
    <button id="submitBtn" type="submit">
      <span class="btn-text">Send Message</span>
      <span class="btn-icon">→</span>
    </button>
  </form>
  <div id="formSuccess"></div>
`;

let ioInstances;

function loadScript() {
  jest.isolateModules(() => {
    require('../script.js');
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  ioInstances = [];

  class MockIntersectionObserver {
    constructor(cb, opts) {
      this.cb = cb;
      this.opts = opts;
      this.observed = [];
      ioInstances.push(this);
    }
    observe(el) { this.observed.push(el); }
    unobserve() {}
    disconnect() {}
    trigger(entries) { this.cb(entries, this); }
  }
  global.IntersectionObserver = MockIntersectionObserver;
  window.IntersectionObserver = MockIntersectionObserver;

  global.requestAnimationFrame = () => 0;
  window.requestAnimationFrame = global.requestAnimationFrame;

  const ctxStub = {
    beginPath() {}, arc() {}, fill() {}, clearRect() {},
    moveTo() {}, lineTo() {}, stroke() {},
    strokeStyle: '', fillStyle: '', lineWidth: 0,
  };
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ctxStub);

  global.alert = jest.fn();
  window.alert = global.alert;

  document.body.innerHTML = DOM;
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.resetModules();
  delete global.fetch;
});

test('does not throw and renders the first typed character on load', () => {
  expect(loadScript).not.toThrow();
  expect(document.getElementById('typedText').textContent).toBe('A');
});

test('hamburger toggles the mobile menu open/closed', () => {
  loadScript();
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  hamburger.click();
  expect(hamburger.classList.contains('open')).toBe(true);
  expect(navLinks.classList.contains('mobile-open')).toBe(true);

  hamburger.click();
  expect(hamburger.classList.contains('open')).toBe(false);
  expect(navLinks.classList.contains('mobile-open')).toBe(false);
});

test('clicking a nav link closes the mobile menu', () => {
  loadScript();
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  hamburger.classList.add('open');
  navLinks.classList.add('mobile-open');

  navLinks.querySelector('a').click();
  expect(hamburger.classList.contains('open')).toBe(false);
  expect(navLinks.classList.contains('mobile-open')).toBe(false);
});

test('scrolling past the threshold adds the "scrolled" class', () => {
  loadScript();
  Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
  window.dispatchEvent(new Event('scroll'));
  expect(document.getElementById('navbar').classList.contains('scrolled')).toBe(true);

  Object.defineProperty(window, 'scrollY', { value: 10, configurable: true });
  window.dispatchEvent(new Event('scroll'));
  expect(document.getElementById('navbar').classList.contains('scrolled')).toBe(false);
});

test('resume button click is prevented and shows an alert', () => {
  loadScript();
  const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
  document.getElementById('resumeBtn').dispatchEvent(evt);
  expect(global.alert).toHaveBeenCalledTimes(1);
  expect(evt.defaultPrevented).toBe(true);
});

test('reveal observer adds the "visible" class when intersecting', () => {
  loadScript();
  const revealEl = document.querySelector('p.reveal');
  const observer = ioInstances.find(io => io.observed.includes(revealEl));
  expect(observer).toBeDefined();

  observer.trigger([{ isIntersecting: true, target: revealEl }]);
  jest.runOnlyPendingTimers();
  expect(revealEl.classList.contains('visible')).toBe(true);
});

test('stagger observer reveals grouped children with a delay', () => {
  loadScript();
  const group = document.querySelector('.skills-categories');
  const observer = ioInstances.find(io => io.observed.includes(group));
  expect(observer).toBeDefined();

  observer.trigger([{ isIntersecting: true, target: group }]);
  jest.runOnlyPendingTimers();
  expect(group.querySelector('.skill-category').classList.contains('visible')).toBe(true);
});

test('pill observer starts the skill-pill animations when visible', () => {
  loadScript();
  const pills = document.querySelector('.skills-pills');
  const observer = ioInstances.find(io => io.observed.includes(pills));
  expect(observer).toBeDefined();

  const pillEls = pills.querySelectorAll('.skill-pill');
  expect(pillEls[0].style.animationPlayState).toBe('paused');

  observer.trigger([{ isIntersecting: true, target: pills }]);
  expect(pillEls[0].style.animationPlayState).toBe('running');
  expect(pillEls[1].style.animationDelay).toBe('50ms');
});

test('active nav observer highlights the current section link', () => {
  loadScript();
  const section = document.getElementById('about');
  const observer = ioInstances.find(io => io.observed.includes(section));
  expect(observer).toBeDefined();

  const link = document.querySelector('.nav-links a[href="#about"]');
  link.style.color = 'rgb(255, 0, 0)';

  // jsdom rejects `var()` colour values, so we assert the observer ran its
  // clear-then-highlight branch (which resets every nav anchor first) rather
  // than the final custom-property value.
  observer.trigger([{ isIntersecting: true, target: section }]);
  expect(link.style.color).toBe('');
});

test('mousemove applies parallax transforms to hero elements', () => {
  loadScript();
  const evt = new MouseEvent('mousemove', { clientX: window.innerWidth, clientY: window.innerHeight });
  document.dispatchEvent(evt);
  expect(document.querySelector('.hero-avatar').style.transform).toBe('translate(6px, 6px)');
  expect(document.querySelector('.avatar-ring').style.transform).toMatch(/^rotate\(.*deg\) translate\(10px, 10px\)$/);
});

describe('contact form submission', () => {
  function fillForm() {
    document.getElementById('contactName').value = 'Ayush';
    document.getElementById('contactEmail').value = 'a@b.com';
    document.getElementById('contactMsg').value = 'Hello there';
  }

  function submit() {
    document.getElementById('contactForm').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
  }

  test('empty fields trigger the shake animation and skip fetch', () => {
    global.fetch = jest.fn();
    loadScript();
    submit();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(document.getElementById('submitBtn').style.animation).toContain('shake');
  });

  test('successful submission hides the form and shows a success message', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    loadScript();
    fillForm();
    submit();
    await flushMicrotasks();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(document.getElementById('contactForm').style.display).toBe('none');
    const success = document.getElementById('formSuccess');
    expect(success.style.display).toBe('block');
    expect(success.textContent).toContain('Message sent');
  });

  test('failed submission surfaces the returned error message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ errors: [{ message: 'Email invalid' }] }),
    });
    loadScript();
    fillForm();
    submit();
    await flushMicrotasks();

    const success = document.getElementById('formSuccess');
    expect(success.style.display).toBe('block');
    expect(success.textContent).toContain('Email invalid');
    expect(document.getElementById('submitBtn').disabled).toBe(false);
  });
});
