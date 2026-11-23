import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/scrap-yard-3d/' : '/',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1300,
    rolldownOptions: {
      output: {
        // three.js tách riêng: trang và chữ hiện trước, cảnh 3D tải sau
        advancedChunks: { groups: [{ name: 'three', test: /node_modules[\\/](three|@react-three)/ }] },
      },
    },
  },
  // chunk three được tải lười, không chặn lần vẽ đầu tiên
  // (giao diện chính chỉ ~15 KB)
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as never)
