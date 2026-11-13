// Scroll activity marker: while anything in the document scrolls (the window
// or any inner overflow container), <html> carries .is-scrolling so the styled
// scrollbars show their thumb; half a second after the last scroll event the
// class drops and the scrollbars fade out of view.
//
// One capture+passive listener on document catches every scroll target (scroll
// does not bubble, but the capture phase reaches inner containers). Per event
// the work is one rAF-coalesced class add plus a timer reset: no measuring, no
// rAF loop at rest, no layout reads, so scrolling cost stays flat.

let started = false;

export const SCROLL_ACTIVITY_CLASS = 'is-scrolling';

export function initScrollActivity({ idleMs = 500 } = {}) {
  if (started || typeof document === 'undefined') return;
  started = true;

  const root = document.documentElement;
  let hideTimer = 0;
  let ticking = false;

  const markActive = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        root.classList.add(SCROLL_ACTIVITY_CLASS);
        ticking = false;
      });
    }

    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => root.classList.remove(SCROLL_ACTIVITY_CLASS), idleMs);
  };

  document.addEventListener('scroll', markActive, { capture: true, passive: true });
}
