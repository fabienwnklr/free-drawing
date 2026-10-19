import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './custom.css';

/**
 * Section of the page opened by a link of another page (cards of the homepage): shown once rendered, the router of
 * VitePress looks for it before a page of another layout is rendered, then stays at the top
 * @param hash Hash of the link (`#section`)
 * @param tries Checks left, every 50 ms
 */
function scrollToSection(hash: string, tries = 20) {
  const section = document.getElementById(decodeURIComponent(hash.slice(1)));

  if (section) section.scrollIntoView();
  else if (tries) setTimeout(() => scrollToSection(hash, tries - 1), 50);
}

// default theme with the colors of free-drawing, frames of screenshots
export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (typeof window === 'undefined') return;

    // page before a navigation by link (not back and forward, scroll kept by the router)
    let from: string | null = null;

    router.onBeforeRouteChange = () => {
      from = location.pathname;
    };
    router.onAfterRouteChange = (to) => {
      const { pathname, hash } = new URL(to, location.href);

      // after the router, which scrolls to the top when the section is not rendered yet
      if (hash && from !== null && pathname !== from) setTimeout(() => scrollToSection(hash));
      from = null;
    };
  },
} satisfies Theme;
