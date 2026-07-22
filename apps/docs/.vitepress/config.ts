import { defineConfig } from "vitepress";

const NPM_BILLING = "https://www.npmjs.com/package/@autlantic/payments-recurring";
const PRODUCT = "https://autlantic.com";

export default defineConfig({
  // Markdown lives in ./docs; theme/config/public stay at apps/docs/.vitepress + public.
  srcDir: "docs",
  title: "Autlantic Billing",
  description:
    "USDC subscriptions on Base. Recurring billing SDK, hosted API, and webhooks for Autlantic Payments.",
  lang: "en-US",
  cleanUrls: true,
  lastUpdated: true,
  head: [["link", { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }]],
  themeConfig: {
    // Custom VPNavBarTitle theme component renders the Autlantic wordmark.
    siteTitle: false,
    nav: [
      { text: "Guide", link: "/guide/getting-started", activeMatch: "/guide/" },
      { text: "API", link: "/api/nodejs", activeMatch: "/api/" },
      { text: "npm", link: NPM_BILLING },
      { text: "Product", link: PRODUCT },
    ],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Overview", link: "/" },
          { text: "Packages", link: "/guide/packages" },
        ],
      },
      {
        text: "Guide",
        items: [
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Sandbox & testing", link: "/guide/sandbox" },
          { text: "Webhooks", link: "/guide/webhooks" },
          { text: "Security", link: "/guide/security" },
        ],
      },
      {
        text: "API reference",
        items: [
          { text: "Node.js SDK", link: "/api/nodejs" },
          { text: "Hosted HTTP API", link: "/api/http" },
        ],
      },
      {
        text: "Resources",
        items: [
          { text: "Changelog", link: "/resources/changelog" },
          { text: "Deploy on Railway", link: "/resources/deploy-railway" },
        ],
      },
    ],
    // GitHub source links are on package READMEs and docs.autlantic.com.
    socialLinks: [],
    footer: {
      message: "Autlantic Recurring Billing SDK",
      copyright: "Copyright © Autlantic",
    },
  },
});
