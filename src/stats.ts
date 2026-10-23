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
  total: number;
  byShift: Record<string, number>;
  rows: DayRow[];
}

const WORK_KINDS = new Set(['day', 'night', 'ot']);

export function computeDay(data: AppData, entry: DayEntry | undefined, key: string, day: number, weekday: number): DayRow {
  const shifts = (entry?.shifts ?? [])
    .map((id) => data.shiftTypes.find((s) => s.id === id))
    .filter((s): s is ShiftType => !!s);
  let hours = 0;
  let otHours = entry?.otHours ?? 0;
  let shiftPay = 0;
  let otPay = 0;
  let nightBonus = 0;
  let rate = 0;
  for (const s of shifts) {
    shiftPay += s.pay;
    if (s.kind === 'ot') {
      otHours += s.hours;
      otPay += s.hours * s.otPay;
    } else {
      hours += s.hours;
      rate = Math.max(rate, s.otPay);
    }
    if (s.kind === 'night') nightBonus += data.settings.nightBonus;
  }
  otPay += (entry?.otHours ?? 0) * (rate || data.settings.defaultOtRate);
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
    otHours: 0, hours: 0, shiftPay: 0, otPay: 0, nightBonus: 0, total: 0, byShift: {}, rows: [],
  };
  const n = daysInMonth(y, m);
  for (let d = 1; d <= n; d++) {
    const key = dateKey(y, m, d);
    const row = computeDay(data, sched[key], key, d, new Date(y, m - 1, d).getDay());
    res.rows.push(row);
    const kinds = new Set(row.shifts.map((s) => s.kind));
    if ([...kinds].some((k) => WORK_KINDS.has(k))) res.workDays++;
    else if (kinds.has('off')) res.offDays++;
    if (kinds.has('sick')) res.sickDays++;
    if (kinds.has('holiday')) res.holidayDays++;
    if (kinds.has('leave')) res.leaveDays++;
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
