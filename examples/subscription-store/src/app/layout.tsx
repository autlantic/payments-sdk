import type { Metadata } from "next";
import { Instrument_Sans, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Acme Store · Autlantic Billing examples",
  description:
    "Example merchant patterns for recurring, one-time, and payment-link USDC on Base.",
};

const NAV_LINKS = [
  { href: "/", label: "Stores" },
  { href: "/recurring", label: "Recurring" },
  { href: "/one-time", label: "One-time" },
  { href: "/payment-links", label: "Payment links" },
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body
        style={
          {
            ["--font-sans" as string]: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
            ["--font-display" as string]:
              "var(--font-instrument), ui-sans-serif, system-ui, sans-serif",
          } as React.CSSProperties
        }
      >
        <header className="topbar">
          <div className="topbar__inner">
            <Link href="/" className="brand">
              <span className="sr-only">Autlantic Billing examples</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="brand__wordmark"
                src="https://autlantic.com/brand/autlantic-wordmark-nav-header-light.png"
                alt="Autlantic"
                height={22}
              />
              <span className="brand__caption">Examples</span>
            </Link>

            <nav className="nav" aria-label="Example store">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="topbar__actions">
              <Link href="/account" className="topbar__ghost">
                Account
              </Link>
              <Link href="/settings" className="topbar__ghost">
                Settings
              </Link>
              <Link href="/webhooks" className="topbar__ghost">
                Webhooks
              </Link>
              <a
                className="topbar__cta"
                href="https://docs.autlantic.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Docs
              </a>
            </div>
          </div>
        </header>

        <div className="shell">
          {children}
          <footer className="footer">
            Demo for{" "}
            <a href="https://www.npmjs.com/package/@autlantic/payments-recurring">
              @autlantic/payments-recurring
            </a>
            {" · "}
            <a href="https://docs.autlantic.com">Docs</a>
            {" · "}
            <a href="https://portal.autlantic.com">Billing portal</a>
            {" · "}
            <a href="https://github.com/autlantic/payments-sdk">GitHub</a>
          </footer>
        </div>
      </body>
    </html>
  );
}
