import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

const NPM_BILLING = "https://www.npmjs.com/package/@autlantic/payments-recurring";
const PRODUCT = "https://autlantic.com";
const GITHUB = "https://github.com/autlantic/payments-sdk";
const docsRoot = path.dirname(fileURLToPath(import.meta.url));

export default withMermaid(
  defineConfig({
    // Markdown lives in ./docs; static assets live in ./public (not docs/public).
    srcDir: "docs",
    vite: {
      publicDir: path.resolve(docsRoot, "../public"),
    },
    title: "Autlantic Billing",
    description:
      "USDC payments on Base. Recurring subscriptions, one-time payments, payment links, hosted API, and webhooks for Autlantic Payments.",
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
            { text: "15-minute integration", link: "/guide/integration" },
            { text: "One-time payments", link: "/guide/one-time-payments" },
            { text: "Payment links", link: "/guide/payment-links" },
            { text: "Lifecycle", link: "/guide/lifecycle" },
            { text: "Error codes", link: "/guide/errors" },
            { text: "Debugging", link: "/guide/debugging" },
            { text: "Retries", link: "/guide/retries" },
            { text: "Sandbox & testing", link: "/guide/sandbox" },
            { text: "Webhooks", link: "/guide/webhooks" },
            { text: "Local webhooks", link: "/guide/local-webhooks" },
            { text: "Security", link: "/guide/security" },
            { text: "FAQ", link: "/guide/faq" },
          ],
        },
        {
          text: "API reference",
          items: [
            { text: "Node.js SDK", link: "/api/nodejs" },
            { text: "TypeScript types", link: "/api/types" },
            { text: "Hosted HTTP API", link: "/api/http" },
            { text: "OpenAPI", link: "/openapi.yaml" },
          ],
        },
        {
          text: "Resources",
          items: [
            { text: "Changelog", link: "/resources/changelog" },
            { text: "Deploy on Railway", link: "/resources/deploy-railway" },
            {
              text: "Postman collection",
              link: "/postman/autlantic-billing.postman_collection.json",
            },
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