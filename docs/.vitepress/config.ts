import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'free-drawing',
  description: 'Free Drawing Docs',
  head: [],
  themeConfig: {
    logo: '/logo.svg',
    footer: {
      message: 'Released under the <a href="https://github.com/fabienwnklr/free-drawing/blob/main/LICENSE">MIT License</a.',
      copyright: 'Copyright © 2023-present <a href="https://github.com/fabienwnklr">Fabien Winkler</a>'
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Get started', link: '/get-started/' },
      { text: 'API', link: '/api/README' },
      { text: 'Changelog', link: '/changelog' },
      { text: 'Demo', link: 'https://free-drawing.fabienwinkler.fr/', target: "_blank"},
    ],

    sidebar: {
      // This sidebar gets displayed when a user
      // is on `guide` directory.
      '/get-started/': [
        {
          text: 'Guide',
          items: [
            { text: 'Get started', link: '/get-started/' },
            { text: 'Constants', link: '/get-started/constants' },
            { text: 'Contribute', link: '/get-started/contribute' },
            { text: 'Events', link: '/get-started/events' }
          ]
        }
      ],

      // This sidebar gets displayed when a user
      // is on `config` directory.
      '/config/': [
        {
          text: 'Config',
          items: [
            { text: 'Index', link: '/config/' },
            { text: 'Three', link: '/config/three' },
            { text: 'Four', link: '/config/four' }
          ]
        }
      ]
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/fabienwnklr/free-drawing' }],
  },
});
