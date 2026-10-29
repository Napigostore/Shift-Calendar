import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications';
import { Platform } from 'react-native';
import { AppData } from '../types';
import { keyOf } from '../utils';

export const ALARM_CHANNEL = 'shift-alarm';
const DAYS_AHEAD = 30;
const MAX_SCHEDULED = 60; // iOS chỉ giữ 64 thông báo chờ, phần dư bị bỏ

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ALARM_CHANNEL, {
      name: 'Shift alarm',
      importance: AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 500, 300, 500, 300, 800],
      lightColor: '#FF7A1A',
      lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

interface PlannedAlarm {
  at: Date;
  title: string;
  body: string;
  shiftId: string;
  date: string;
}

/** Danh sách báo thức cần có cho N ngày tới (thuần tính toán, không gọi hệ thống). */
function planAlarms(data: AppData): PlannedAlarm[] {
  const { settings } = data;
  if (!settings.alarmsEnabled) return [];
  const sched = data.schedule[settings.alarmEmployeeId] ?? {};
  const byId = new Map(data.shiftTypes.map((s) => [s.id, s]));
  const now = Date.now();
  const out: PlannedAlarm[] = [];
  for (let i = 0; i <= DAYS_AHEAD && out.length < MAX_SCHEDULED; i++) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + i);
    const entry = sched[keyOf(day)];
    if (!entry) continue;
    for (const id of entry.shifts) {
      if (out.length >= MAX_SCHEDULED) break;
      const s = byId.get(id);
      if (!s || !s.alarmEnabled) continue;
      const [h, m] = s.alarmTime.split(':').map(Number);
      const at = new Date(day);
      at.setHours(h, m, 0, 0);
      if (at.getTime() <= now + 5000) continue;
      out.push({ at, title: `⏰ ${s.name}`, body: `${s.start} → ${s.end}${s.note ? ' · ' + s.note : ''}`, shiftId: s.id, date: keyOf(day) });
    }
  }
  return out;
}

let lastSignature = '';

/**
 * Đồng bộ báo thức ca cho N ngày tới. Nếu danh sách không đổi so với lần trước thì không đụng tới hệ thống
 * (huỷ rồi đặt lại vài chục thông báo mỗi lần sửa lịch là việc tốn pin nhất của app). Trả về số báo thức.
 */
export async function rescheduleAlarms(data: AppData, force = false): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const plan = planAlarms(data);
  const signature = plan.map((a) => `${a.at.getTime()}|${a.title}|${a.body}`).join(';');
  if (!force && signature === lastSignature) return plan.length;
  await Notifications.cancelAllScheduledNotificationsAsync();
  lastSignature = '';
  if (!plan.length) {
    lastSignature = signature;
    return 0;
  }
  if (!(await ensurePermission())) return 0;
  for (const a of plan) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: a.title,
        body: a.body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { shiftId: a.shiftId, date: a.date },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: a.at,
        channelId: ALARM_CHANNEL,
        delivery: 'alarmClock',
      },
    });
  }
  lastSignature = signature;
  return plan.length;
}

export async function testAlarm(title: string) {
  if (!(await ensurePermission())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: `⏰ ${title}`, body: 'Shift Calendar', sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: ALARM_CHANNEL },
  });
}
