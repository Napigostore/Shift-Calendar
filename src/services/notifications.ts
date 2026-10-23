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

/** Huỷ và lên lịch lại toàn bộ báo thức ca cho N ngày tới. Trả về số báo thức đã đặt. */
export async function rescheduleAlarms(data: AppData): Promise<number> {
  if (Platform.OS === 'web') return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { settings } = data;
  if (!settings.alarmsEnabled) return 0;
  if (!(await ensurePermission())) return 0;

  const sched = data.schedule[settings.alarmEmployeeId] ?? {};
  const now = Date.now();
  let count = 0;
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + i);
    const entry = sched[keyOf(day)];
    if (!entry) continue;
    for (const id of entry.shifts) {
      if (count >= MAX_SCHEDULED) return count;
      const s = data.shiftTypes.find((x) => x.id === id);
      if (!s || !s.alarmEnabled) continue;
      const [h, m] = s.alarmTime.split(':').map(Number);
      const at = new Date(day);
      at.setHours(h, m, 0, 0);
      if (at.getTime() <= now + 5000) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${s.name}`,
          body: `${s.start} → ${s.end}${s.note ? ' · ' + s.note : ''}`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { shiftId: s.id, date: keyOf(day) },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: at,
          channelId: ALARM_CHANNEL,
          delivery: 'alarmClock',
        },
      });
      count++;
    }
  }
  return count;
}

export async function testAlarm(title: string) {
  if (!(await ensurePermission())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: `⏰ ${title}`, body: 'Shift Calendar', sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: ALARM_CHANNEL },
  });
}
