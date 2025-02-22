import { basename } from './utils';

declare global {
  interface Window {
    /**运行时环境变量配置对象。可能不存在，若存在必须包含以下全部键 */
    __env__?: {
      APIBASE: string;
    };
  }

  interface ImportMetaEnv {
    VITE_APIBASE?: string;
    VITE_ENABLE_RUNTIME_CONFIG?: string;
  }
}

/**api基路径(api基路径和前端基路径无关)。该值不能以/结尾 */
export let APIBASE = import.meta.env.VITE_APIBASE?.replace(/\/+$/, '') ?? 'http://127.0.0.1:8080';

export const envInitPromise = (async () => {
  if (import.meta.env.VITE_ENABLE_RUNTIME_CONFIG?.match(/^true|1$/i)) {
    const envConfigModule = `${location.origin}${basename}/env-config.js`;
    await import(/* @vite-ignore */ envConfigModule).catch((err) => console.error(`导入运行时环境文件失败: ${envConfigModule}`, err));
  }
  if (self.__env__) {
    ({ APIBASE } = self.__env__);
    console.log('已使用__env__', self.__env__);
  } else console.log('未使用__env__');
})();
