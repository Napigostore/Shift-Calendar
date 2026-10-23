import { AppData, FeatureFlags, Settings, ShiftPreset, ShiftType } from './types';

export const DATA_VERSION = 1;

type S = Omit<ShiftType, 'note' | 'alarmEnabled'> & Partial<Pick<ShiftType, 'note' | 'alarmEnabled'>>;
const mk = (s: S): ShiftType => ({ note: '', alarmEnabled: s.kind === 'day' || s.kind === 'night', ...s });

// Các ca nghỉ dùng chung cho mọi mẫu
const COMMON: ShiftType[] = [
  mk({ id: 'ot', name: 'OT', short: 'OT', kind: 'ot', color: '#FF9F0A', start: '17:30', end: '21:30', hours: 4, pay: 0, otPay: 45000, alarmTime: '17:00', alarmEnabled: false }),
  mk({ id: 'off', name: 'Off', short: 'O', kind: 'off', color: '#8E8E93', start: '00:00', end: '00:00', hours: 0, pay: 0, otPay: 0, alarmTime: '07:00' }),
  mk({ id: 'holiday', name: 'Holiday', short: 'H', kind: 'holiday', color: '#FF453A', start: '00:00', end: '00:00', hours: 0, pay: 300000, otPay: 0, alarmTime: '07:00', note: 'Nghỉ lễ hưởng lương' }),
  mk({ id: 'leave', name: 'Nghỉ phép', short: 'P', kind: 'leave', color: '#BF5AF2', start: '00:00', end: '00:00', hours: 0, pay: 300000, otPay: 0, alarmTime: '07:00', note: 'Phép năm hưởng lương' }),
  mk({ id: 'sick', name: 'Sick leave', short: 'S', kind: 'sick', color: '#00C7BE', start: '00:00', end: '00:00', hours: 0, pay: 0, otPay: 0, alarmTime: '07:00' }),
];

/** Mẫu ca: 8 tiếng (3 ca xoay), 12 tiếng (2 ca), hoặc tự cài (ngày/đêm hành chính để sửa). */
export function presetShifts(preset: ShiftPreset): ShiftType[] {
  if (preset === '8h') {
    return [
      mk({ id: 'day', name: 'Ca sáng', short: 'S', kind: 'day', color: '#0A84FF', start: '06:00', end: '14:00', hours: 8, pay: 300000, otPay: 45000, alarmTime: '05:00' }),
      mk({ id: 'afternoon', name: 'Ca chiều', short: 'C', kind: 'day', color: '#0AB4FF', start: '14:00', end: '22:00', hours: 8, pay: 330000, otPay: 50000, alarmTime: '13:00' }),
      mk({ id: 'night', name: 'Ca đêm', short: 'Đ', kind: 'night', color: '#5E5CE6', start: '22:00', end: '06:00', hours: 8, pay: 380000, otPay: 60000, alarmTime: '21:00' }),
      ...COMMON.map((s) => ({ ...s })),
    ];
  }
  if (preset === '12h') {
    return [
      mk({ id: 'day', name: 'Ca ngày 12h', short: 'D', kind: 'day', color: '#0A84FF', start: '06:00', end: '18:00', hours: 11, pay: 450000, otPay: 50000, alarmTime: '05:00' }),
      mk({ id: 'night', name: 'Ca đêm 12h', short: 'N', kind: 'night', color: '#5E5CE6', start: '18:00', end: '06:00', hours: 11, pay: 550000, otPay: 65000, alarmTime: '17:00' }),
      ...COMMON.map((s) => ({ ...s })),
    ];
  }
  return [
    mk({ id: 'day', name: 'Day Shift', short: 'D', kind: 'day', color: '#0A84FF', start: '08:00', end: '17:00', hours: 8, pay: 300000, otPay: 45000, alarmTime: '07:30' }),
    mk({ id: 'night', name: 'Night Shift', short: 'N', kind: 'night', color: '#5E5CE6', start: '20:00', end: '05:00', hours: 8, pay: 380000, otPay: 60000, alarmTime: '19:00' }),
    ...COMMON.map((s) => ({ ...s })),
  ];
}

export const DEFAULT_SHIFTS = presetShifts('custom');

export const FULL_FEATURES: FeatureFlags = { almanac: true, stickers: true, quickTools: true, staff: true, salary: true, leave: true };
export const SIMPLE_FEATURES: FeatureFlags = { almanac: false, stickers: false, quickTools: true, staff: false, salary: true, leave: false };

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  uiMode: 'full',
  features: { ...FULL_FEATURES },
  incomeGoal: 0,
  region: 'VN',
  quotesEnabled: true,
  showCountdown: true,
  leaveDaysPerYear: 12,
  leaveCarryOver: 0,
  quoteCategories: ['motivation', 'proverb', 'famous', 'funny'],
  weather: {
    enabled: true,
    useGps: true,
    fahrenheit: false,
    showHumidity: true,
    showWind: true,
    showTide: true,
    showMoonTide: true,
    showStorm: true,
    showUv: true,
  },
  firstDayOfWeek: 1,
  highlightWeekends: true,
  shiftsPerDay: 2,
  monthStyle: 'full',
  showLunar: true,
  showDefaultHolidays: true,
  payday: 10,
  holidayIcon: '🎉',
  accent: 'electric',
  darkMode: true,
  widgetQuickButtons: true,
  widgetBackground: 'dark',
  widgetCompact: false,
  language: 'vi',
  dateFormat: 'dd/MM/yyyy',
  clock24h: true,
  orientation: 'portrait',
  nightBonus: 50000,
  defaultOtRate: 45000,
  alarmEmployeeId: 'me',
  alarmsEnabled: true,
};

export function defaultData(): AppData {
  return {
    version: DATA_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    shiftTypes: DEFAULT_SHIFTS.map((s) => ({ ...s })),
    employees: [{ id: 'me', name: 'Tôi', role: '', factory: '' }],
    activeEmployeeId: 'me',
    schedule: { me: {} },
    customHolidays: [],
    events: [],
  };
}

/** Gộp dữ liệu đã lưu với mặc định để tương thích khi thêm trường mới. */
export function migrate(raw: Partial<AppData> | null | undefined): AppData {
  const base = defaultData();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    version: DATA_VERSION,
    settings: {
      ...base.settings,
      ...(raw.settings ?? {}),
      weather: { ...base.settings.weather, ...(raw.settings?.weather ?? {}) },
      features: { ...base.settings.features, ...(raw.settings?.features ?? {}) },
    },
    shiftTypes: withLeaveShift(raw.shiftTypes?.length ? raw.shiftTypes : base.shiftTypes),
    employees: raw.employees?.length ? raw.employees : base.employees,
    schedule: raw.schedule ?? base.schedule,
    customHolidays: raw.customHolidays ?? [],
    events: raw.events ?? [],
  };
}

/** Dữ liệu cũ chưa có ca "Nghỉ phép" → thêm vào. */
function withLeaveShift(list: ShiftType[]): ShiftType[] {
  if (list.some((s) => s.kind === 'leave')) return list;
  const leave = COMMON.find((s) => s.kind === 'leave')!;
  const id = list.some((s) => s.id === leave.id) ? `leave-${Date.now().toString(36)}` : leave.id;
  return [...list, { ...leave, id }];
}
