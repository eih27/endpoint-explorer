/**
 * The prototype is fully client-rendered with locally generated synthetic data,
 * so it exports to static HTML and can be hosted anywhere (Vercel, GitHub Pages,
 * any static host).
 *
 * For GitHub Pages project sites the app is served from /<repo>, so set
 * NEXT_PUBLIC_BASE_PATH (the deploy workflow does this). Local dev and Vercel
 * leave it unset and serve from the root.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
