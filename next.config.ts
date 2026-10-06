import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages: `next build` writes plain HTML/CSS/JS to
 * out/. The site is served from https://<owner>.github.io/<repo>/, so CI sets
 * PAGES_BASE_PATH="/<repo>"; local builds and `next dev` serve from the root.
 */
const nextConfig: NextConfig = {
  output: "export",
  // Emit /plan/index.html rather than /plan.html — works on any static host.
  trailingSlash: true,
  basePath: process.env.PAGES_BASE_PATH ?? "",
};

export default nextConfig;
