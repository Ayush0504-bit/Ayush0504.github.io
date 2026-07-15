/* ===========================
   AYUSH GAJBHIYE — PORTFOLIO
   utils.js — shared helpers
   =========================== */

// ─── IntersectionObserver factory ─────────────────────────────────────────────
// Removes the repeated "new IntersectionObserver(entries => entries.forEach(...))"
// boilerplate. `onIntersect(entry, index, observer)` runs whenever a target
// becomes visible. When `once` is true (default) the target is unobserved after
// the first intersection.
function createIntersectionObserver(onIntersect, options = {}, { once = true } = {}) {
  return new IntersectionObserver((entries, observer) => {
    entries.forEach((entry, index) => {
      if (!entry.isIntersecting) return;
      onIntersect(entry, index, observer);
      if (once) observer.unobserve(entry.target);
    });
  }, options);
}

// Observe every element matching a selector (or every node in a NodeList/array).
function observeAll(target, observer) {
  const elements = typeof target === 'string'
    ? document.querySelectorAll(target)
    : target;
  elements.forEach(el => observer.observe(el));
}

// ─── Button content helper ────────────────────────────────────────────────────
// Updates the `.btn-text` / `.btn-icon` spans of a button in one call.
function setButtonContent(btn, text, icon) {
  const textEl = btn.querySelector('.btn-text');
  const iconEl = btn.querySelector('.btn-icon');
  if (textEl) textEl.textContent = text;
  if (iconEl) iconEl.textContent = icon;
}
