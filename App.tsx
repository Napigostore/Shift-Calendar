import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { BlurView } from 'expo-blur';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLockGate } from './src/components/AppLock';
import { haptic, IconName, setHapticsEnabled, TAB_BAR_HEIGHT } from './src/components/ui';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SettingsPage, SettingsScreen } from './src/screens/SettingsScreen';
import { StaffScreen } from './src/screens/StaffScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { setAdsEnabled, showAppOpenAd } from './src/services/ads';
import { rescheduleAlarms } from './src/services/notifications';
import { DEMO } from './src/demo';
import { StoreProvider, useStore } from './src/store';
import { Paywall } from './src/components/Paywall';
import { Text } from './src/components/AppText';
import { Icon } from './src/components/Icon';

type Tab = 'calendar' | 'stats' | 'staff' | 'settings';

function Shell() {
  const { ready, data, t, c, isPro } = useStore();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>(() => (DEMO ? (DEMO.screen === 'features' ? 'settings' : DEMO.screen === 'paywall' ? 'calendar' : DEMO.screen) : 'calendar'));
  const [settingsPage, setSettingsPage] = useState<SettingsPage>(DEMO?.screen === 'features' ? 'features' : 'home');

  useEffect(() => {
    setAdsEnabled(!isPro);
  }, [isPro]);

  useEffect(() => {
    showAppOpenAd();
  }, []);

  const lowPower = data.settings.lowPower;
  useEffect(() => {
    setHapticsEnabled(!lowPower);
  }, [lowPower]);

  // Lên lịch lại báo thức khi lịch ca / loại ca / cài đặt báo thức thay đổi
  // (so sánh theo tham chiếu: chỉ đổi khi phần dữ liệu đó thật sự được sửa, không cần JSON.stringify mỗi lần vẽ)
  const alarmSched = data.schedule[data.settings.alarmEmployeeId];
  useEffect(() => {
    if (!ready || !data.settings.onboarded) return;
    const id = setTimeout(() => rescheduleAlarms(data).catch(() => {}), 1500);
    return () => clearTimeout(id);
  }, [ready, alarmSched, data.shiftTypes, data.settings.alarmsEnabled, data.settings.alarmEmployeeId, data.settings.onboarded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const lock = {
      portrait: ScreenOrientation.OrientationLock.PORTRAIT_UP,
      landscape: ScreenOrientation.OrientationLock.LANDSCAPE,
      auto: ScreenOrientation.OrientationLock.DEFAULT,
    }[data.settings.orientation];
    ScreenOrientation.lockAsync(lock).catch(() => {});
  }, [data.settings.orientation]);

  if (!ready) {
    return (
      <View style={[styles.fill, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#0AB4FF" />
      </View>
    );
  }

  if (!data.settings.onboarded) {
    return (
      <>
        <StatusBar style={data.settings.darkMode ? 'light' : 'dark'} />
        <OnboardingScreen
          onFinish={(preset) => {
            // Chọn "Tự cài đặt" → mở ngay trang cài đặt ca
            if (preset === 'custom') {
              setSettingsPage('shift');
              setTab('settings');
            }
          }}
        />
      </>
    );
  }

  const tabs: { key: Tab; icon: IconName; iconOn: IconName; label: string }[] = [
    { key: 'calendar', icon: 'calendar-outline', iconOn: 'calendar', label: t.tabCalendar },
    { key: 'stats', icon: 'pie-chart-outline', iconOn: 'pie-chart', label: t.tabStats },
    { key: 'staff', icon: 'people-outline', iconOn: 'people', label: t.tabStaff },
    { key: 'settings', icon: 'settings-outline', iconOn: 'settings', label: t.tabSettings },
  ];
  const visibleTabs = tabs.filter((x) => x.key !== 'staff' || data.settings.features.staff);
  const current: Tab = tab === 'staff' && !data.settings.features.staff ? 'calendar' : tab;

  const bar = (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
      {visibleTabs.map((x) => {
        const on = x.key === current;
        return (
          <Pressable
            key={x.key}
            style={styles.tab}
            onPress={() => {
              if (!on) haptic();
              if (x.key === 'settings' && on) setSettingsPage('home');
              setTab(x.key);
            }}
          >
            <Icon name={on ? x.iconOn : x.icon} size={25} color={on ? c.accent : c.gray} />
            <Text style={{ color: on ? c.accent : c.gray, fontSize: 10, fontWeight: '600', marginTop: 2 }}>{x.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.fill, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <StatusBar style={data.settings.darkMode ? 'light' : 'dark'} />
      <View style={styles.fill}>
        {current === 'calendar' && (
          <CalendarScreen
            onOpenLeave={() => {
              setSettingsPage('leave');
              setTab('settings');
            }}
          />
        )}
        {current === 'stats' && <StatsScreen />}
        {current === 'staff' && <StaffScreen onOpenCalendar={() => setTab('calendar')} />}
        {current === 'settings' && <SettingsScreen key={settingsPage} initialPage={settingsPage} />}
      </View>

      <View style={[styles.barWrap, { borderTopColor: c.separator }]}>
        {Platform.OS === 'ios' && !lowPower ? (
          <BlurView tint={data.settings.darkMode ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} intensity={100} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.barBg }]} />
        )}
        {bar}
      </View>
      <Paywall />
      <AppLockGate />
    </View>
  );
}

export default function App() {
  // Inter thay SF Pro trên Android/web; iOS dùng San Francisco của hệ thống nên không cần chờ
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!fontsLoaded && Platform.OS !== 'ios') {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  barWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  tabBar: { flexDirection: 'row', paddingTop: 7, minHeight: TAB_BAR_HEIGHT },
  tab: { flex: 1, alignItems: 'center' },
});
