import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { defaultData, migrate, presetShifts } from './defaults';
import { DEMO, demoData } from './demo';
import { DICTS, Dict } from './i18n';
import { ProReason } from './pro';
import { regionOf } from './region';
import { cachedPro, initPurchases, purchasesConfigured } from './services/purchases';
import { makePalette, Palette } from './theme';
import { AppData, CountdownEvent, CustomHoliday, DayEntry, Employee, Settings, ShiftPreset, ShiftType } from './types';
import { uid } from './utils';

const STORAGE_KEY = 'shiftcalendar:data:v1';
const PRO_ENABLED = purchasesConfigured() || __DEV__;

interface Store {
  ready: boolean;
  data: AppData;
  t: Dict;
  c: Palette;
  lunarOn: boolean; // hiện âm lịch (chỉ ở nước dùng lịch âm)
  holidaysOn: boolean; // ngày lễ mặc định VN
  sessionSeed: number; // ngẫu nhiên mỗi lần mở app (chọn câu nói)
  applyPreset: (p: ShiftPreset) => void;
  proEnabled: boolean; // có bán gói PRO (đã cấu hình RevenueCat, hoặc đang phát triển)
  isPro: boolean;
  setPro: (v: boolean) => void;
  paywall: ProReason | null; // đang mở màn hình mua (lý do)
  closePaywall: () => void;
  /** true nếu đã PRO; nếu chưa thì mở màn hình mua và trả về false. */
  requirePro: (reason: ProReason) => boolean;
  setData: (fn: (d: AppData) => AppData) => void;
  replaceAll: (d: AppData) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setDay: (employeeId: string, key: string, entry: DayEntry | null) => void;
  setDays: (employeeId: string, entries: Record<string, DayEntry | null>) => void;
  saveShift: (s: ShiftType) => void;
  deleteShift: (id: string) => void;
  saveEmployee: (e: Omit<Employee, 'id'> & { id?: string }) => void;
  deleteEmployee: (id: string) => void;
  setActiveEmployee: (id: string) => void;
  saveHoliday: (h: Omit<CustomHoliday, 'id'> & { id?: string }) => void;
  deleteHoliday: (id: string) => void;
  saveEvent: (e: Omit<CountdownEvent, 'id'> & { id?: string }) => void;
  deleteEvent: (id: string) => void;
  shiftById: (id: string) => ShiftType | undefined;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Chụp ảnh App Store (DEMO): dữ liệu mẫu, không đọc/ghi dữ liệu thật
  const [data, setDataState] = useState<AppData>(() => (DEMO ? demoData(DEMO.lang) : defaultData()));
  const [ready, setReady] = useState(!!DEMO);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sessionSeed] = useState(() => Math.random());
  const [isPro, setPro] = useState(false);
  // Ảnh chụp cho App Review của gói đăng ký: mở sẵn màn hình mua
  const [paywall, setPaywall] = useState<ProReason | null>(DEMO?.screen === 'paywall' ? 'general' : null);

  useEffect(() => {
    cachedPro().then((v) => v && setPro(true));
    initPurchases(setPro).catch(() => {});
  }, []);

  useEffect(() => {
    if (DEMO) return;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setDataState(migrate(JSON.parse(raw)));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || DEMO) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
    }, 300);
  }, [data, ready]);

  const setData = useCallback((fn: (d: AppData) => AppData) => setDataState((d) => fn(d)), []);

  const store = useMemo<Store>(() => {
    const updateSettings = (patch: Partial<Settings>) =>
      setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));

    const setDays = (employeeId: string, entries: Record<string, DayEntry | null>) =>
      setData((d) => {
        const emp = { ...(d.schedule[employeeId] ?? {}) };
        for (const [k, v] of Object.entries(entries)) {
          if (!v || (v.shifts.length === 0 && !v.otHours && !v.note)) delete emp[k];
          else emp[k] = v;
        }
        return { ...d, schedule: { ...d.schedule, [employeeId]: emp } };
      });

    return {
      ready,
      data,
      t: DICTS[data.settings.language] ?? DICTS.vi,
      c: makePalette(data.settings.darkMode, data.settings.accent),
      lunarOn: data.settings.showLunar && regionOf(data.settings.region).lunar,
      holidaysOn: data.settings.showDefaultHolidays && regionOf(data.settings.region).holidays,
      sessionSeed,
      // Bản phát hành chưa có khoá RevenueCat → chưa bán PRO, mở hết tính năng
      proEnabled: PRO_ENABLED,
      isPro: isPro || !PRO_ENABLED,
      setPro,
      paywall,
      closePaywall: () => setPaywall(null),
      requirePro: (reason) => {
        if (isPro || !PRO_ENABLED) return true;
        setPaywall(reason);
        return false;
      },
      applyPreset: (p) => setData((d) => ({ ...d, shiftTypes: presetShifts(p), settings: { ...d.settings, shiftPreset: p } })),
      setData,
      replaceAll: (d) => setDataState(migrate(d)),
      updateSettings,
      setDay: (employeeId, key, entry) => setDays(employeeId, { [key]: entry }),
      setDays,
      saveShift: (s) =>
        setData((d) => {
          const exists = d.shiftTypes.some((x) => x.id === s.id);
          return {
            ...d,
            shiftTypes: exists ? d.shiftTypes.map((x) => (x.id === s.id ? s : x)) : [...d.shiftTypes, s],
          };
        }),
      deleteShift: (id) =>
        setData((d) => {
          const schedule: AppData['schedule'] = {};
          for (const [emp, days] of Object.entries(d.schedule)) {
            const nd: Record<string, DayEntry> = {};
            for (const [k, v] of Object.entries(days)) {
              const shifts = v.shifts.filter((s) => s !== id);
              if (shifts.length || v.otHours || v.note) nd[k] = { ...v, shifts };
            }
            schedule[emp] = nd;
          }
          return { ...d, shiftTypes: d.shiftTypes.filter((x) => x.id !== id), schedule };
        }),
      saveEmployee: (e) =>
        setData((d) => {
          if (e.id && d.employees.some((x) => x.id === e.id)) {
            return { ...d, employees: d.employees.map((x) => (x.id === e.id ? { ...x, ...e, id: x.id } : x)) };
          }
          const id = uid();
          return { ...d, employees: [...d.employees, { ...e, id }], schedule: { ...d.schedule, [id]: {} } };
        }),
      deleteEmployee: (id) =>
        setData((d) => {
          if (d.employees.length <= 1) return d;
          const employees = d.employees.filter((x) => x.id !== id);
          const { [id]: _removed, ...schedule } = d.schedule;
          const activeEmployeeId = d.activeEmployeeId === id ? employees[0].id : d.activeEmployeeId;
          const alarmEmployeeId = d.settings.alarmEmployeeId === id ? employees[0].id : d.settings.alarmEmployeeId;
          return { ...d, employees, schedule, activeEmployeeId, settings: { ...d.settings, alarmEmployeeId } };
        }),
      setActiveEmployee: (id) => setData((d) => ({ ...d, activeEmployeeId: id })),
      saveHoliday: (h) =>
        setData((d) => {
          if (h.id && d.customHolidays.some((x) => x.id === h.id)) {
            return { ...d, customHolidays: d.customHolidays.map((x) => (x.id === h.id ? { ...x, ...h, id: x.id } : x)) };
          }
          return { ...d, customHolidays: [...d.customHolidays, { ...h, id: uid() }] };
        }),
      deleteHoliday: (id) => setData((d) => ({ ...d, customHolidays: d.customHolidays.filter((x) => x.id !== id) })),
      saveEvent: (e) =>
        setData((d) => {
          if (e.id && d.events.some((x) => x.id === e.id)) {
            return { ...d, events: d.events.map((x) => (x.id === e.id ? { ...x, ...e, id: x.id } : x)) };
          }
          return { ...d, events: [...d.events, { ...e, id: uid() }] };
        }),
      deleteEvent: (id) => setData((d) => ({ ...d, events: d.events.filter((x) => x.id !== id) })),
      shiftById: (id) => data.shiftTypes.find((s) => s.id === id),
    };
  }, [data, ready, setData, sessionSeed, isPro, paywall]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
