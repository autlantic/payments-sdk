import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Acme Store · Autlantic Payments example",
  description:
    "Example subscription storefront powered by @autlantic/payments-recurring (USDC on Base).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body
        style={
          {
            ["--font-sans" as string]: "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif",
            ["--font-display" as string]: "var(--font-fraunces), Georgia, serif",
          } as React.CSSProperties
        }
      >
        <div className="shell">
          <header className="topbar">
            <Link href="/" className="brand">
              <img
                src="https://autlantic.com/brand/autlantic-icon-1024-master.png"
                alt=""
                width={36}
                height={36}
              />
              Acme Store
            </Link>
            <nav className="nav">
              <Link href="/">Home</Link>
              <Link href="/one-time">One-time</Link>
              <Link href="/recurring">Recurring</Link>
              <Link href="/account">Account</Link>
              <Link href="/webhooks">Webhooks</Link>
              <Link href="/settings">Settings</Link>
            </nav>
          </header>
          {children}
          <footer className="footer">
            Example for{" "}
            <a href="https://github.com/autlantic/payments-sdk">@autlantic/payments-recurring</a>
            {" · "}
            <a href="https://docs.autlantic.com">docs</a>
            {" · "}
            <a href="https://portal.autlantic.com">billing portal</a>
          </footer>
        </div>
      </body>
    </html>
  );
}
