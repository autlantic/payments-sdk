import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

const NPM_BILLING = "https://www.npmjs.com/package/@autlantic/payments-recurring";
const PRODUCT = "https://autlantic.com";
const GITHUB = "https://github.com/autlantic/payments-sdk";

export default withMermaid(
  defineConfig({
    // Markdown lives in ./docs; theme/config/public stay at apps/docs/.vitepress + public.
    srcDir: "docs",
    title: "Autlantic Billing",
    description:
      "USDC payments on Base. Recurring subscriptions and one-time checkout, hosted API, and webhooks for Autlantic Payments.",
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
        { text: "GitHub", link: GITHUB },
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
            { text: "One-time payments", link: "/guide/one-time-payments" },
            { text: "Lifecycle", link: "/guide/lifecycle" },
            { text: "Error codes", link: "/guide/errors" },
            { text: "Retries", link: "/guide/retries" },
            { text: "Sandbox & testing", link: "/guide/sandbox" },
            { text: "Webhooks", link: "/guide/webhooks" },
            { text: "Security", link: "/guide/security" },
          ],
        },
        {
          text: "API reference",
          items: [
            { text: "Node.js SDK", link: "/api/nodejs" },
            { text: "TypeScript types", link: "/api/types" },
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
      socialLinks: [{ icon: "github", link: GITHUB }],
      footer: {
        message: "Autlantic Payments SDK",
        copyright: "Copyright © Autlantic",
      },
    },
  }),
);