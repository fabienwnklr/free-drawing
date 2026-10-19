import { defineConfig } from 'vitepress';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// sidebar of the API, generated with its pages by `yarn doc:typedoc`
const apiSidebarFile = fileURLToPath(new URL('../api/typedoc-sidebar.json', import.meta.url));
const apiSidebar = existsSync(apiSidebarFile) ? JSON.parse(readFileSync(apiSidebarFile, 'utf8')) : [];

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'free-drawing',
  description: 'Infinite canvas drawing library',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: '16x16 32x32 48x48' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],
  cleanUrls: true,
  // local search index of every page (API included, about 2.3 MB), loaded when search is opened
  vite: { build: { chunkSizeWarningLimit: 3000 } },
  themeConfig: {
    logo: '/logo.svg',
    search: { provider: 'local' },
    footer: {
      message:
        'Released under the <a href="https://github.com/fabienwnklr/free-drawing/blob/master/LICENCE">MIT License</a>.',
      copyright: 'Copyright © 2023-present <a href="https://github.com/fabienwnklr">Fabien Winkler</a>',
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Get started', link: '/get-started/' },
      { text: 'Features', link: '/features' },
      { text: 'API', link: '/api/' },
      { text: 'Changelog', link: '/changelog' },
      { text: 'Demo', link: 'https://free-drawing-demo.netlify.app/', target: '_blank' },
    ],
    sidebar: {
      '/get-started/': [
        {
          text: 'Guide',
          items: [
            { text: 'Get started', link: '/get-started/' },
            { text: 'Contribute', link: '/get-started/contribute' },
          ],
        },
      ],
      '/api/': [{ text: 'API', items: apiSidebar }],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/fabienwnklr/free-drawing' }],
  },
});
