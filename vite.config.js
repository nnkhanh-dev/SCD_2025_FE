import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(), // Kích hoạt Tailwind v4
  ],
  resolve: {
    alias: {
      // Cấu hình alias '@' trỏ về thư mục 'src'
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
