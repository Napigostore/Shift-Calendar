import { DateFormat } from './types';

export const pad = (n: number) => (n < 10 ? '0' + n : String(n));

export const dateKey = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

export const keyOf = (date: Date) => dateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());

export function parseKey(key: string): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y, m, d];
}

export const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

export function formatDate(y: number, m: number, d: number, fmt: DateFormat): string {
  switch (fmt) {
    case 'MM/dd/yyyy':
      return `${pad(m)}/${pad(d)}/${y}`;
    case 'yyyy-MM-dd':
      return `${y}-${pad(m)}-${pad(d)}`;
    default:
      return `${pad(d)}/${pad(m)}/${y}`;
  }
}

export function formatTime(hhmm: string, h24: boolean): string {
  if (h24) return hhmm;
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad(m)} ${suffix}`;
}

export function formatMoney(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

export function isValidTime(s: string): boolean {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}

/** Số giờ giữa 2 mốc HH:mm, tự cộng 24h nếu qua đêm. */
export function hoursBetween(start: string, end: string): number {
  if (!isValidTime(start) || !isValidTime(end)) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
