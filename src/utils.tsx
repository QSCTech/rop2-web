import { useLayoutEffect, useState } from 'react';
import { msg } from './App';
import { useSearchParams } from 'react-router-dom';
import { Id } from './api/models/shared';

export function mapRecur<
  K extends string,
  T extends { [key in K]?: Partial<T>[] } & Record<keyof any, any>,
  R extends T
>(arr: T[], key: K, handler: (obj: T, stack: T[]) => R, ancestors: T[] = []): R[] {
  return arr.map((v) => {
    const result = { ...v };
    if (result[key]?.length) (result[key] as any) = mapRecur(result[key]!, key, handler, [...ancestors, result]);
    return handler(result, ancestors);
  });
}

export function singleMatch(str: string, regexp: RegExp): string | null {
  const result = str.match(regexp);
  if (!result)
    return null;
  return result[1];
}

export function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);
  useLayoutEffect(() => {
    const updateMatches = ({ matches }: MediaQueryListEvent) => setIsDark(matches);
    const m = globalThis.matchMedia('(prefers-color-scheme: dark)');
    m.addEventListener('change', updateMatches);
    if (m.matches) setIsDark(true);
    return () => { m.removeEventListener('change', updateMatches); }
  });
  return isDark;
}

export function without<K extends string | symbol, O extends Record<K, any>>(obj: O, keys: K[]): Omit<O, K> {
  const nObj: any = {};
  for (const [k, v] of Object.entries(obj))
    if (!keys.includes(k as any)) nObj[k] = v;
  return nObj;
}

declare global {
  interface Number {
    pad(minLength?: number, floatMaxLength?: number): string;
  }
  interface Date {
    stringify(withTime?: boolean, useDot?: boolean): string;
  }
}
Object.defineProperty(Number.prototype, 'pad', {
  value(minLength = 0, floatMaxLength = 0) {
    const fixed = this.toFixed(floatMaxLength);
    if (!minLength) return fixed;
    else return fixed.padStart(minLength, '0');
  },
  configurable: true,
} satisfies ThisType<number> & PropertyDescriptor);
Object.defineProperty(Date.prototype, 'stringify', {
  value(withTime = false, useDot = false) {
    const sep = useDot ? ['.', '.', ''] : ['年', '月', '日'];
    let result = `${this.getFullYear()}${sep[0]}${this.getMonth() + 1}${sep[1]}${this.getDate()}${sep[2]}`;
    if (withTime) result += ` ${this.getHours().pad(2, 0)}:${this.getMinutes().pad(2, 0)}:${this.getSeconds().pad(2, 0)}`;
    return result;
  },
  configurable: true,
} satisfies ThisType<Date> & PropertyDescriptor);

/**仅限测试，返回一个指定延时后兑现的Promise */
export function delay(ms: number): Promise<void> {
  return new Promise((rs) => setTimeout(rs, ms));
}

/**如果`arg`为`undefined`或`null`，返回空数组；
 * 
 * 否则，返回`arg`或`[arg]`(取决于`arg`是否为数组)。 */
export function toArray<T extends NonNullable<any>>(arg: undefined | null | T | T[]): T[] {
  if (arg === null || arg === undefined) return []
  if (Array.isArray(arg)) return arg;
  return [arg];
}

export function notImplement() {
  msg.error('此功能还在开发中哦');
}

export function num(...from: (string | undefined | null | number)[]): number {
  for (const f of from) {
    if (typeof f === 'number') return f;
    if (f === undefined || f === null || !f.trim()) continue;
    const r = Number(f);
    if (isFinite(r)) return r;
  }
  return 0;
}

/**React Hook，根据url或localStorage返回正在管理的组织 */
export function useOrg(): Id {
  const [params] = useSearchParams();
  return num(params.get('org'), localStorage.getItem('defaultOrg'));
}

/**React Hook，根据url或localStorage返回正在管理的表单 */
export function useForm(): Id {
  const [params] = useSearchParams();
  return num(params.get('form'), localStorage.getItem('defaultForm'));
}

export function getUser(): string {
  return localStorage.getItem('userNickname') ?? '';
}

export function containsTag(tags: string[] | string | undefined, target: string) {
  return toArray(tags).includes(target);
}

export function newUniqueLabel(labels: string[]): string {
  let usedCount = 0;
  let result = `选项${labels.length + 1}`;
  while (labels.includes(result)) {
    usedCount++;
    result = `选项${labels.length + 1}(${usedCount})`;
  }
  return result;
}