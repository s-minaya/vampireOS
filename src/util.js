// Timers that are all cleared when a screen is left.
export function createScope() {
  const timeouts = new Set();
  const intervals = new Set();
  return {
    after(ms, fn) {
      const id = setTimeout(() => {
        timeouts.delete(id);
        fn();
      }, ms);
      timeouts.add(id);
      return id;
    },
    every(ms, fn) {
      const id = setInterval(fn, ms);
      intervals.add(id);
      return id;
    },
    stop(id) {
      clearTimeout(id);
      clearInterval(id);
      timeouts.delete(id);
      intervals.delete(id);
    },
    dispose() {
      timeouts.forEach(clearTimeout);
      intervals.forEach(clearInterval);
      timeouts.clear();
      intervals.clear();
    },
  };
}

// Click delegation: <button data-act="name"> calls handlers.name(element).
export function onAction(root, handlers) {
  const listener = (event) => {
    const el = event.target.closest('[data-act]');
    if (!el || !root.contains(el)) return;
    const handler = handlers[el.dataset.act];
    if (handler) handler(el);
  };
  root.addEventListener('click', listener);
  return () => root.removeEventListener('click', listener);
}

export const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
