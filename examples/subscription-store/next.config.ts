import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@autlantic/payments-recurring", "@autlantic/chain-evm"],
};

export default nextConfig;
