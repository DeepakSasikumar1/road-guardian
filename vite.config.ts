import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  assetsInclude: ['**/*.onnx', '**/*.wasm'], // Support AI/GPU assets
  optimizeDeps: {
    exclude: ['onnxruntime-web'], // Crucial for Vite: stop pre-bundling AI logic
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
