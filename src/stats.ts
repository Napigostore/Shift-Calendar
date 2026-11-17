import { getHolidays } from './holidays';
import { AppData, DayEntry, ShiftType } from './types';
import { dateKey, daysInMonth } from './utils';

export interface DayRow {
  key: string;
  day: number;
  weekday: number;
  shifts: ShiftType[];
  hours: number;
  otHours: number;
  shiftPay: number;
  otPay: number;
  nightBonus: number;
  total: number;
  note: string;
}

export interface MonthStats {
  workDays: number;
  offDays: number;
  sickDays: number;
  holidayDays: number;
  leaveDays: number;
  nightShifts: number;
  otHours: number;
  hours: number;
  shiftPay: number;
  otPay: number;
  nightBonus: number;
  baseSalary: number;
  total: number;
  byShift: Record<string, number>;
  rows: DayRow[];
}

const WORK_KINDS = new Set(['day', 'night', 'ot']);

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Số giờ của ca (start → end, qua nửa đêm được) nằm trong khung giờ from → to (cũng qua nửa đêm được). */
export function hoursInWindow(start: string, end: string, from: string, to: string): number {
  const s = toMin(start);
  let e = toMin(end);
  if (e <= s) e += 1440;
  const f = toMin(from);
  let t = toMin(to);
  if (t <= f) t += 1440;
  let minutes = 0;
  // Thử cả khung giờ dịch một ngày để bắt phần giao qua nửa đêm
  for (const shift of [-1440, 0, 1440]) minutes += Math.max(0, Math.min(e, t + shift) - Math.max(s, f + shift));
  return minutes / 60;
}

/** Lương một giờ của ca: lương ca chia số giờ, hoặc lương OT/giờ với ca OT. */
const hourlyRate = (s: ShiftType) => (s.kind === 'ot' ? s.otPay : s.hours > 0 ? s.pay / s.hours : 0);

/**
 * Tính lương một ngày.
 * - Ca làm (sáng/chiều/đêm): lương ca; ngày lễ nhân hệ số ngày lễ.
 * - OT: giờ OT × lương OT/giờ × hệ số (ngày thường hoặc ngày lễ).
 * - Phụ cấp đêm: giờ rơi vào khung đêm được cộng (hệ số đêm - 1) × lương một giờ.
 */
export function computeDay(data: AppData, entry: DayEntry | undefined, key: string, day: number, weekday: number, isHoliday = false): DayRow {
  const st = data.settings;
  const shifts = (entry?.shifts ?? [])
    .map((id) => data.shiftTypes.find((s) => s.id === id))
    .filter((s): s is ShiftType => !!s);
  const nightFrom = HHMM.test(st.nightFrom) ? st.nightFrom : '22:00';
  const nightTo = HHMM.test(st.nightTo) ? st.nightTo : '06:00';
  const shiftMul = isHoliday ? st.holidayMul : 1;
  const otMul = isHoliday ? st.holidayMul : st.weekdayMul;
  let hours = 0;
  let otHours = entry?.otHours ?? 0;
  let shiftPay = 0;
  let otPay = 0;
  let nightBonus = 0;
  let rate = 0;
  for (const s of shifts) {
    const timed = s.kind === 'day' || s.kind === 'night' || s.kind === 'ot';
    const nightHours = timed ? hoursInWindow(s.start, s.end, nightFrom, nightTo) : 0;
    if (s.kind === 'ot') {
      otHours += s.hours;
      otPay += s.hours * s.otPay * otMul;
      nightBonus += nightHours * s.otPay * (st.nightMul - 1) * otMul;
    } else {
      hours += s.hours;
      rate = Math.max(rate, s.otPay);
      shiftPay += s.kind === 'day' || s.kind === 'night' ? s.pay * shiftMul : s.pay;
      nightBonus += nightHours * hourlyRate(s) * (st.nightMul - 1) * shiftMul;
    }
  }
  otPay += (entry?.otHours ?? 0) * (rate || st.defaultOtRate) * otMul;
  return {
    key,
    day,
    weekday,
    shifts,
    hours,
    otHours,
    shiftPay,
    otPay,
    nightBonus,
    total: shiftPay + otPay + nightBonus,
    note: entry?.note ?? '',
  };
}

export function computeMonth(data: AppData, employeeId: string, y: number, m: number): MonthStats {
  const sched = data.schedule[employeeId] ?? {};
  const res: MonthStats = {
    workDays: 0, offDays: 0, sickDays: 0, holidayDays: 0, leaveDays: 0, nightShifts: 0,
    otHours: 0, hours: 0, shiftPay: 0, otPay: 0, nightBonus: 0, baseSalary: 0, total: 0, byShift: {}, rows: [],
  };
  const n = daysInMonth(y, m);
  for (let d = 1; d <= n; d++) {
    const key = dateKey(y, m, d);
    const isHoliday = getHolidays(d, m, y, data.settings.language, data.customHolidays, data.settings.showDefaultHolidays, data.settings.holidayIcon).some((h) => h.off);
    const row = computeDay(data, sched[key], key, d, new Date(y, m - 1, d).getDay(), isHoliday);
    res.rows.push(row);
    const kinds = new Set(row.shifts.map((s) => s.kind));
    if ([...kinds].some((k) => WORK_KINDS.has(k))) res.workDays++;
    else if (kinds.has('off')) res.offDays++;
    if (kinds.has('sick')) res.sickDays++;
    if (kinds.has('holiday')) res.holidayDays++;
    if (kinds.has('leave')) res.leaveDays += Math.max(0, ...row.shifts.filter((s) => s.kind === 'leave').map((s) => s.leaveDays ?? 1));
    for (const s of row.shifts) {
      res.byShift[s.id] = (res.byShift[s.id] ?? 0) + 1;
      if (s.kind === 'night') res.nightShifts++;
    }
    res.hours += row.hours;
    res.otHours += row.otHours;
    res.shiftPay += row.shiftPay;
    res.otPay += row.otPay;
    res.nightBonus += row.nightBonus;
    res.total += row.total;
  }
  // Lương cơ bản tính theo tháng, cộng một lần
  res.baseSalary = data.settings.baseSalary;
  res.total += res.baseSalary;
  return res;
}

export function computeYear(data: AppData, employeeId: string, y: number) {
  const months = Array.from({ length: 12 }, (_, i) => computeMonth(data, employeeId, y, i + 1));
  const sum = (f: (s: MonthStats) => number) => months.reduce((a, s) => a + f(s), 0);
  return {
    months,
    workDays: sum((s) => s.workDays),
    offDays: sum((s) => s.offDays),
    nightShifts: sum((s) => s.nightShifts),
    otHours: sum((s) => s.otHours),
    hours: sum((s) => s.hours),
    total: sum((s) => s.total),
  };
}

/** Ngày lương kế tiếp tính từ hôm nay. */
export function nextPayday(payday: number, from = new Date()): Date | null {
  if (!payday) return null;
  const y = from.getFullYear();
  const m = from.getMonth();
  const clamp = (yy: number, mm: number) => Math.min(payday, new Date(yy, mm + 1, 0).getDate());
  const thisMonth = new Date(y, m, clamp(y, m));
  if (thisMonth.getDate() >= from.getDate()) return thisMonth;
  return new Date(y, m + 1, clamp(y, m + 1));
}
