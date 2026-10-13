import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub project Pages serves this repository below /portfolio/.
  base: "/portfolio/",
  build: {
    rollupOptions: {
      input: { portfolio: "index.html", survey: "survey/index.html" },
    },
  },
});
