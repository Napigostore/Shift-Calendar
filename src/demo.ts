// Chế độ demo để chụp ảnh App Store: dữ liệu mẫu, không hỏi quyền, không lưu.
// iOS: xcrun simctl launch <device> <bundle> -demo calendar -demoLang vi
// Web: /?demo=calendar&lang=vi
import { Platform, Settings as IOSSettings } from 'react-native';
import { defaultData, FULL_FEATURES, presetShifts } from './defaults';
import { AppData, DayEntry, Lang } from './types';
import { keyOf } from './utils';

export type DemoScreen = 'calendar' | 'stats' | 'staff' | 'settings' | 'features';

export interface Demo {
  screen: DemoScreen;
  lang: Lang;
}

function read(): Demo | null {
  let screen: unknown;
  let lang: unknown;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search);
    screen = q.get('demo');
    lang = q.get('lang');
  } else if (Platform.OS === 'ios') {
    screen = IOSSettings.get('demo');
    lang = IOSSettings.get('demoLang');
  }
  if (typeof screen !== 'string' || !screen) return null;
  return { screen: screen as DemoScreen, lang: lang === 'en' || lang === 'zh' ? lang : 'vi' };
}

export const DEMO = read();

/** Dữ liệu mẫu: 3 tháng ca 8h xoay, OT, sticker, kỳ nghỉ, 4 nhân viên. */
export function demoData(lang: Lang): AppData {
  const d = defaultData();
  const vi = lang === 'vi';
  d.settings = {
    ...d.settings,
    onboarded: true,
    language: lang,
    region: vi ? 'VN' : lang === 'zh' ? 'CN' : 'US',
    uiMode: 'full',
    features: { ...FULL_FEATURES },
    shiftPreset: '8h',
    alarmsEnabled: false,
    payday: 10,
    incomeGoal: 9000000,
    weather: { ...d.settings.weather, enabled: false },
  };
  d.shiftTypes = presetShifts('8h');
  if (!vi) {
    const names: Record<string, string> = { day: 'Morning', afternoon: 'Evening', night: 'Night', leave: 'Leave' };
    d.shiftTypes = d.shiftTypes.map((s) => (names[s.id] ? { ...s, name: names[s.id], short: names[s.id][0] } : s));
  }
  const people = vi
    ? [['me', 'Tôi', 'Vận hành', 'Nhà máy A'], ['e2', 'Minh Anh', 'Kỹ sư', 'Nhà máy A'], ['e3', 'Quốc Bảo', 'Tổ trưởng', 'Nhà máy B'], ['e4', 'Thu Hà', 'Điều độ', 'Nhà máy B']]
    : [['me', 'Me', 'Operator', 'Plant A'], ['e2', 'Alex', 'Engineer', 'Plant A'], ['e3', 'Sam', 'Supervisor', 'Plant B'], ['e4', 'Jordan', 'Dispatcher', 'Plant B']];
  d.employees = people.map(([id, name, role, factory]) => ({ id, name, role, factory }));
  d.activeEmployeeId = 'me';

  const cycle = ['day', 'day', 'afternoon', 'afternoon', 'night', 'night', 'off', 'off'];
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  d.schedule = {};
  d.employees.forEach((e, ei) => {
    const days: Record<string, DayEntry> = {};
    let i = ei * 2;
    for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1), i++) {
      const entry: DayEntry = { shifts: [cycle[i % cycle.length]] };
      if (i % 9 === 3 && entry.shifts[0] !== 'off') entry.otHours = 2;
      days[keyOf(day)] = entry;
    }
    d.schedule[e.id] = days;
  });
  const me = d.schedule.me;
  const at = (offset: number) => keyOf(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset));
  me[at(0)] = { ...me[at(0)], icons: ['☀️'] };
  me[at(3)] = { shifts: ['leave'], icons: ['🏖️', '🥥'] };
  me[at(4)] = { shifts: ['leave'], icons: ['🌴'] };
  me[at(-6)] = { ...me[at(-6)], icons: ['🎂'], note: vi ? 'Sinh nhật mẹ' : "Mom's birthday" };
  me[at(-12)] = { shifts: ['leave'] };

  d.events = [
    { id: 'v1', name: vi ? 'Phú Quốc' : 'Beach trip', icon: '🏝️', date: at(3), endDate: at(5) },
    { id: 'v2', name: vi ? 'Đà Lạt' : 'Mountains', icon: '⛰️', date: at(40) },
  ];
  return d;
}
