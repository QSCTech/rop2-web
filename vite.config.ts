import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
/**@ts-ignore */
import { execSync } from 'node:child_process';

function sh(cmd: string, fallback = '[unknown]') {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch {
    return fallback;
  }
}
/**@ts-ignore */
const isDocker: boolean = process.env.VITE_IS_DOCKER_ENVIRONMENT?.match(/true|1/i);
const headSha = sh('git rev-parse HEAD');
const headCommitCount = sh('git rev-list --count HEAD');
const headBranch = sh('git rev-parse --abbrev-ref HEAD');
const anyChanges = sh('git status --porcelain -uall', '').length > 0;
const BUILD_INFO = isDocker ? '使用 Docker 构建' : `构建版本 {${headCommitCount}${anyChanges ? '*' : ''}}`;

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_BUILD_INFO': JSON.stringify(BUILD_INFO),
    'import.meta.env.VITE_BUILD_INFO_DETAIL': JSON.stringify(
      `${anyChanges ? '有未提交的更改\n' : ''}提交总数: ${headCommitCount}\nbranch: ${headBranch}\ncommit: ${headSha}`
    ),
  },
  plugins: [react()],
  css: {
    devSourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        hashCharacters: 'base64',
        assetFileNames: 'assets/[name]-[hash:8][extname]',
        chunkFileNames: '[name]-[hash:6].js',
        manualChunks: {
          react: ['react-router-dom', 'react-dom', 'react'],
          antd: ['antd', '@ant-design/icons'],
        },
      },
    },
  },
});
