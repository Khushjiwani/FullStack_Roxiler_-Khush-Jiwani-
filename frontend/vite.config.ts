import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === "production" ? "/FullStack_Roxiler_-Khush-Jiwani-/" : "/",
  server: { port: 5173 },
});
