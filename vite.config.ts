import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub project Pages serves this repository below /portfolio/.
  base: "/portfolio/",
  build: {
    rollupOptions: {
      input: {
        portfolio: "index.html",
        survey: "survey/index.html",
        business: "business/index.html",
        roomPlanning: "business/services/room-planning/index.html",
        styling: "business/services/styling/index.html",
        workspace: "business/services/workspace/index.html",
      },
    },
  },
});
