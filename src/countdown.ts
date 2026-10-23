import { Dict } from './i18n';
import { getHolidays } from './holidays';
import { lunarNewYearEve } from './lunar';
import { nextPayday } from './stats';
import { AppData } from './types';
import { dateKey, keyOf, parseKey } from './utils';

export interface CountdownItem {
  id: string;
  kind: 'payday' | 'tet' | 'holiday' | 'dayoff' | 'event';
  icon: string;
  title: string;
  date: Date;
  endDate?: Date;
  days: number; // 0 = hôm nay / đang diễn ra
  ongoing: boolean;
  color: string;
}

const DAY = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);
const toDate = (key: string) => {
  const [y, m, d] = parseKey(key);
  return new Date(y, m - 1, d);
};

/** Mùng 1 Tết âm lịch kế tiếp (tính cả hôm nay). */
export function nextTet(from: Date): Date {
  for (const y of [from.getFullYear() - 1, from.getFullYear()]) {
    const [d, m, yy] = lunarNewYearEve(y);
    const tet = new Date(yy, m - 1, d + 1);
    if (daysBetween(from, tet) >= 0) return tet;
  }
  const [d, m, yy] = lunarNewYearEve(from.getFullYear() + 1);
  return new Date(yy, m - 1, d + 1);
}

export function buildCountdowns(data: AppData, t: Dict, lunarOn: boolean, holidaysOn: boolean, now = new Date()): CountdownItem[] {
  const s = data.settings;
  const today = startOfDay(now);
  const out: CountdownItem[] = [];
  const push = (it: Omit<CountdownItem, 'days' | 'ongoing'> & { ongoing?: boolean }) =>
    out.push({ ...it, days: Math.max(0, daysBetween(today, it.date)), ongoing: !!it.ongoing });

  // Kỳ nghỉ / sự kiện người dùng tạo
  for (const e of data.events) {
    const start = toDate(e.date);
    const end = e.endDate ? toDate(e.endDate) : start;
    if (daysBetween(today, end) < 0) continue; // đã qua
    const ongoing = daysBetween(today, start) <= 0;
    push({ id: e.id, kind: 'event', icon: e.icon || '🏖️', title: e.name, date: ongoing ? today : start, endDate: end, ongoing, color: '#00C7BE' });
  }

  // Ngày lương
  const pay = nextPayday(s.payday, now);
  if (pay) push({ id: 'payday', kind: 'payday', icon: '💰', title: t.payday, date: pay, color: '#30D158' });

  // Tết âm lịch (nước dùng âm lịch) hoặc Năm mới
  if (lunarOn) push({ id: 'tet', kind: 'tet', icon: '🧧', title: t.tet, date: nextTet(today), color: '#FF453A' });
  else push({ id: 'newyear', kind: 'tet', icon: '🎆', title: t.newYear, date: new Date(today.getFullYear() + 1, 0, 1), color: '#FF453A' });

  // Ngày lễ được nghỉ tiếp theo (bỏ qua Tết vì đã có thẻ riêng)
  for (let i = 1; i <= 366; i++) {
    const d = new Date(today.getTime() + i * DAY);
    const hol = getHolidays(d.getDate(), d.getMonth() + 1, d.getFullYear(), s.language, data.customHolidays, holidaysOn, s.holidayIcon).find(
      (h) => h.off && !(lunarOn && h.icon === '🧧') && h.icon !== '🎇',
    );
    if (hol) {
      push({ id: 'holiday', kind: 'holiday', icon: hol.icon, title: hol.name, date: d, color: '#FF9F0A' });
      break;
    }
  }

  // Ngày nghỉ tiếp theo theo lịch ca
  const sched = data.schedule[data.activeEmployeeId] ?? {};
  const restKinds = new Set(['off', 'holiday', 'leave']);
  for (let i = 1; i <= 60; i++) {
    const d = new Date(today.getTime() + i * DAY);
    const ids = sched[keyOf(d)]?.shifts ?? [];
    const kinds = ids.map((id) => data.shiftTypes.find((x) => x.id === id)?.kind);
    if (kinds.length && kinds.every((k) => k && restKinds.has(k))) {
      push({ id: 'dayoff', kind: 'dayoff', icon: '😴', title: t.nextDayOff, date: d, color: '#5E5CE6' });
      break;
    }
  }

  return out.sort((a, b) => a.days - b.days || (a.ongoing ? -1 : 1));
}

export interface LeaveSummary {
  total: number;
  used: number; // đã nghỉ tới hôm nay
  planned: number; // đã xếp sau hôm nay
  remaining: number;
  takenDays: string[]; // các ngày (yyyy-MM-dd) có ca phép trong năm
}

/** Phép năm theo năm dương lịch: tổng = mức phép (riêng hoặc chung) + phép chuyển sang. */
export function leaveSummary(data: AppData, employeeId: string, year: number, now = new Date()): LeaveSummary {
  const emp = data.employees.find((e) => e.id === employeeId);
  const total = (emp?.leaveDays ?? data.settings.leaveDaysPerYear) + data.settings.leaveCarryOver;
  const leaveIds = new Set(data.shiftTypes.filter((s) => s.kind === 'leave').map((s) => s.id));
  const sched = data.schedule[employeeId] ?? {};
  const todayKey = keyOf(now);
  const takenDays = Object.keys(sched)
    .filter((k) => k.startsWith(`${year}-`) && sched[k].shifts.some((id) => leaveIds.has(id)))
    .sort();
  const used = takenDays.filter((k) => k <= todayKey).length;
  const planned = takenDays.length - used;
  return { total, used, planned, remaining: total - takenDays.length, takenDays };
}

export const fmtShort = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
export const keyFromDate = (d: Date) => dateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
