// Kiểm tra dữ liệu đọc từ máy / bản sao lưu / cloud trước khi dùng: sai kiểu thì bỏ, chuỗi và số được giới hạn.
// Bản sao lưu bị sửa tay hay bị chèn dữ liệu lạ không làm app treo hoặc chạy chậm.
import { AppData, CountdownEvent, CustomHoliday, DayEntry, Employee, Settings, ShiftKind, ShiftType } from './types';

const KINDS: ShiftKind[] = ['day', 'night', 'ot', 'off', 'holiday', 'sick', 'leave'];
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const COLOR = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;
const MAX = { shiftTypes: 60, employees: 200, holidays: 300, events: 300, daysPerEmployee: 20000 };

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, max: number, dflt = '') => (typeof v === 'string' ? v.slice(0, max) : dflt);
const num = (v: unknown, min: number, max: number, dflt = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : dflt);
const bool = (v: unknown, dflt = false) => (typeof v === 'boolean' ? v : dflt);
const time = (v: unknown, dflt: string) => (typeof v === 'string' && HHMM.test(v) ? v : dflt);
const arr = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);

function shiftType(v: unknown): ShiftType | null {
  if (!isObj(v) || typeof v.id !== 'string' || !v.id) return null;
  return {
    id: str(v.id, 64),
    name: str(v.name, 40, 'Ca'),
    short: str(v.short, 4, '?'),
    kind: KINDS.includes(v.kind as ShiftKind) ? (v.kind as ShiftKind) : 'day',
    color: typeof v.color === 'string' && COLOR.test(v.color) ? v.color : '#8E8E93',
    start: time(v.start, '00:00'),
    end: time(v.end, '00:00'),
    hours: num(v.hours, 0, 24),
    pay: num(v.pay, 0, 1e9),
    otPay: num(v.otPay, 0, 1e8),
    note: str(v.note, 200),
    alarmEnabled: bool(v.alarmEnabled),
    alarmTime: time(v.alarmTime, '07:00'),
  };
}

function dayEntry(v: unknown): DayEntry | null {
  if (!isObj(v)) return null;
  const shifts = arr(v.shifts, 3).filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 64));
  const e: DayEntry = { shifts };
  if (v.otHours != null) e.otHours = num(v.otHours, 0, 24);
  if (v.note != null) e.note = str(v.note, 500);
  if (v.icons != null) e.icons = arr(v.icons, 3).filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 16));
  return e;
}

function employee(v: unknown): Employee | null {
  if (!isObj(v) || typeof v.id !== 'string' || !v.id) return null;
  const e: Employee = { id: str(v.id, 64), name: str(v.name, 60, '—'), role: str(v.role, 60), factory: str(v.factory, 80) };
  if (v.leaveDays != null) e.leaveDays = num(v.leaveDays, 0, 365);
  return e;
}

function holiday(v: unknown): CustomHoliday | null {
  if (!isObj(v) || typeof v.id !== 'string') return null;
  return { id: str(v.id, 64), name: str(v.name, 60), day: num(v.day, 1, 31, 1), month: num(v.month, 1, 12, 1), lunar: bool(v.lunar), off: bool(v.off), icon: str(v.icon, 16) || undefined };
}

function event(v: unknown): CountdownEvent | null {
  if (!isObj(v) || typeof v.id !== 'string' || typeof v.date !== 'string' || !DATE_KEY.test(v.date)) return null;
  const e: CountdownEvent = { id: str(v.id, 64), name: str(v.name, 60), icon: str(v.icon, 16), date: v.date };
  if (typeof v.endDate === 'string' && DATE_KEY.test(v.endDate)) e.endDate = v.endDate;
  return e;
}

const keep = <T,>(list: unknown[], fn: (v: unknown) => T | null) => list.map(fn).filter((x): x is T => x !== null);

/** Settings: giữ đúng kiểu của mặc định (sai kiểu → bỏ, dùng mặc định). Chuỗi bị cắt ngắn. */
function settingsPatch(v: unknown, base: Settings): Partial<Settings> {
  if (!isObj(v)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, def] of Object.entries(base)) {
    const val = v[k];
    if (val === undefined) continue;
    if (isObj(def)) {
      if (isObj(val)) out[k] = settingsPatch(val, def as never);
    } else if (Array.isArray(def)) {
      if (Array.isArray(val)) out[k] = val.filter((x) => typeof x === 'string').slice(0, 20);
    } else if (typeof def === typeof val) {
      out[k] = typeof val === 'string' ? val.slice(0, 200) : typeof val === 'number' && !Number.isFinite(val) ? def : val;
    }
  }
  // Trường tuỳ chọn không có trong mặc định
  for (const k of ['onboarded', 'shiftPreset', 'cloudEmail', 'cloudProvider']) if (typeof v[k] === 'string' || typeof v[k] === 'boolean') out[k] = v[k];
  if (typeof v.lastBackup === 'number' && Number.isFinite(v.lastBackup)) out.lastBackup = v.lastBackup;
  return out as Partial<Settings>;
}

/** Trả về dữ liệu đã làm sạch (một phần), để `migrate` gộp với mặc định. */
export function sanitizeData(raw: unknown, base: AppData): Partial<AppData> | null {
  if (!isObj(raw)) return null;
  const schedule: AppData['schedule'] = {};
  if (isObj(raw.schedule)) {
    for (const [emp, days] of Object.entries(raw.schedule).slice(0, MAX.employees)) {
      if (!isObj(days)) continue;
      const out: Record<string, DayEntry> = {};
      for (const [k, d] of Object.entries(days).slice(0, MAX.daysPerEmployee)) {
        if (!DATE_KEY.test(k)) continue;
        const e = dayEntry(d);
        if (e) out[k] = e;
      }
      schedule[emp.slice(0, 64)] = out;
    }
  }
  const employees = keep(arr(raw.employees, MAX.employees), employee);
  return {
    settings: { ...base.settings, ...settingsPatch(raw.settings, base.settings) },
    shiftTypes: keep(arr(raw.shiftTypes, MAX.shiftTypes), shiftType),
    employees,
    activeEmployeeId: typeof raw.activeEmployeeId === 'string' && employees.some((e) => e.id === raw.activeEmployeeId) ? raw.activeEmployeeId : employees[0]?.id,
    schedule,
    customHolidays: keep(arr(raw.customHolidays, MAX.holidays), holiday),
    events: keep(arr(raw.events, MAX.events), event),
  };
}
