import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Konfigurasi Vite (alat pengembangan frontend).
// - plugin react(): agar Vite paham sintaks JSX/TSX milik React.
// - plugin tailwindcss(): agar class Tailwind (misal "bg-amber-500") diubah menjadi CSS.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // PROXY: setiap request dari browser ke "/api/..." diteruskan oleh Vite
    // ke backend Go di http://localhost:8080/api/...
    // Jadi di kode React cukup menulis fetch("/api/characters"), tanpa alamat lengkap.
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
