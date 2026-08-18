import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // The marketing site is still the original hand-written index.html,
      // served verbatim from /public. Keeping it as a static file rather than
      // porting it to JSX means the live homepage can't drift during the move
      // from GitHub Pages to Vercel — edit public/index.html exactly the way
      // you always have.
      beforeFiles: [{ source: "/", destination: "/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
