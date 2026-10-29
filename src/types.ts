export type ShiftKind = 'day' | 'night' | 'ot' | 'off' | 'holiday' | 'sick' | 'leave';

export interface ShiftType {
  id: string;
  name: string;
  short: string; // 1-3 ký tự hiển thị trong ô lịch
  kind: ShiftKind;
  color: string;
  start: string; // "HH:mm"
  end: string;
  hours: number;
  pay: number; // lương mỗi ca
  otPay: number; // lương OT mỗi giờ
  note: string;
  alarmEnabled: boolean;
  alarmTime: string; // "HH:mm"
}

export interface DayEntry {
  shifts: string[]; // id các ca trong ngày
  otHours?: number;
  note?: string;
  icons?: string[]; // sticker emoji gắn vào ngày (tối đa 3)
}

export interface Employee {
  id: string;
  name: string;
  role?: string;
  factory?: string;
  leaveDays?: number; // số ngày phép/năm riêng (bỏ trống = theo cài đặt chung)
}

/** Kỳ nghỉ / sự kiện để đếm ngược. */
export interface CountdownEvent {
  id: string;
  name: string;
  icon: string;
  date: string; // yyyy-MM-dd
  endDate?: string;
}

export interface CustomHoliday {
  id: string;
  name: string;
  day: number;
  month: number;
  lunar: boolean;
  off: boolean; // được nghỉ
  icon?: string;
}

export type Lang = 'vi' | 'en' | 'zh';
export type DateFormat = 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
export type Accent = 'electric' | 'orange' | 'green' | 'purple';

export type ShiftPreset = '8h' | '12h' | 'custom';

export type QuoteCategory = 'motivation' | 'proverb' | 'famous' | 'funny';

export interface WeatherSettings {
  enabled: boolean;
  useGps: boolean;
  lat?: number;
  lon?: number;
  place?: string;
  fahrenheit: boolean;
  showHumidity: boolean;
  showWind: boolean;
  showTide: boolean; // thuỷ triều (Open-Meteo Marine)
  showMoonTide: boolean; // con nước theo âm lịch
  showStorm: boolean;
  showUv: boolean;
}

/** Bật/tắt từng nhóm tính năng để giao diện gọn hơn. */
export interface FeatureFlags {
  almanac: boolean; // giờ hoàng đạo, ngày tốt xấu, tiết khí
  stickers: boolean;
  quickTools: boolean; // Xếp nhanh, Tự chia ca
  staff: boolean; // tab Nhân viên
  salary: boolean; // lương & thu nhập
  leave: boolean; // phép năm
}

export interface Settings {
  onboarded?: boolean;
  uiMode: 'simple' | 'full' | 'custom';
  features: FeatureFlags;
  incomeGoal: number; // mục tiêu thu nhập / tháng (0 = tắt)
  shiftPreset?: ShiftPreset;
  region: string; // mã quốc gia ISO, quyết định có hiện âm lịch hay không
  quotesEnabled: boolean;
  showCountdown: boolean;
  leaveDaysPerYear: number;
  leaveCarryOver: number; // phép năm trước chuyển sang
  quoteCategories: QuoteCategory[];
  weather: WeatherSettings;
  // Calendar
  firstDayOfWeek: 0 | 1; // 0 = CN, 1 = T2
  highlightWeekends: boolean;
  shiftsPerDay: 1 | 2 | 3;
  monthStyle: 'full' | 'compact';
  showLunar: boolean;
  showDefaultHolidays: boolean;
  // UI
  payday: number; // ngày nhận lương trong tháng (0 = tắt)
  holidayIcon: string;
  accent: Accent;
  darkMode: boolean;
  lowPower: boolean; // máy yếu: không blur, không rung, không GPS
  appLock: boolean; // khoá bằng Face ID / mật mã máy
  // Widget
  widgetQuickButtons: boolean;
  widgetBackground: 'dark' | 'transparent' | 'accent';
  widgetCompact: boolean;
  // System
  language: Lang;
  dateFormat: DateFormat;
  clock24h: boolean;
  orientation: 'portrait' | 'landscape' | 'auto';
  // Salary
  nightBonus: number; // phụ cấp mỗi ca đêm
  defaultOtRate: number;
  // Alarm
  alarmEmployeeId: string;
  alarmsEnabled: boolean;
  // Cloud
  cloudEmail?: string;
  cloudProvider?: 'password' | 'apple' | 'google';
  lastBackup?: number;
}

export interface AppData {
  version: number;
  settings: Settings;
  shiftTypes: ShiftType[];
  employees: Employee[];
  activeEmployeeId: string;
  // employeeId -> "yyyy-MM-dd" -> DayEntry
  schedule: Record<string, Record<string, DayEntry>>;
  customHolidays: CustomHoliday[];
  events: CountdownEvent[];
}
