import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During `vite dev` (no Netlify functions running) the app falls back to the
// bundled fixtures, so no proxy is required. When running `netlify dev` the
// functions are served on the same origin under /api/* via netlify.toml redirects.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
