// Khoá ứng dụng: mở bằng Face ID / Touch ID / mật mã máy. Khi app vào nền thì khoá lại và che nội dung
// (ảnh chụp trong trình chuyển app không lộ lịch ca, lương).
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { DEMO } from '../demo';
import { useStore } from '../store';
import { Text } from './AppText';
import { Icon } from './Icon';

export const appLockSupported = Platform.OS !== 'web';

/** Máy có Face ID / vân tay / mật mã để mở khoá không. */
export async function canUseAppLock(): Promise<boolean> {
  if (!appLockSupported) return false;
  try {
    return (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

export async function authenticate(prompt: string): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: prompt, disableDeviceFallback: false, cancelLabel: undefined });
    return r.success;
  } catch {
    return false;
  }
}

export function AppLockGate() {
  const { data, t, c } = useStore();
  const enabled = appLockSupported && data.settings.appLock && !DEMO;
  const [locked, setLocked] = useState(enabled);
  const [covered, setCovered] = useState(false);
  const [wake, setWake] = useState(0);
  const busy = useRef(false);

  const unlock = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const ok = await authenticate(t.unlock);
    busy.current = false;
    if (ok) setLocked(false);
  }, [t.unlock]);

  useEffect(() => {
    if (!enabled) return;
    let wasBackground = false;
    const sub = AppState.addEventListener('change', (st) => {
      // "inactive" cũng xảy ra khi hộp thoại Face ID hiện lên: chỉ che, không khoá, không hỏi lại
      if (st === 'background') {
        wasBackground = true;
        setLocked(true);
      }
      setCovered(st !== 'active');
      if (st === 'active' && wasBackground) {
        wasBackground = false;
        setWake((n) => n + 1); // quay lại từ nền → hỏi Face ID một lần; huỷ thì bấm nút "Mở khoá"
      }
    });
    return () => sub.remove();
  }, [enabled]);

  // Tự hiện Face ID khi mở app / quay lại app
  useEffect(() => {
    if (!enabled || !locked) return;
    const id = setTimeout(() => AppState.currentState === 'active' && unlock(), 250);
    return () => clearTimeout(id);
  }, [enabled, locked, unlock, wake]);

  if (!enabled || (!locked && !covered)) return null;
  return (
    <View style={[StyleSheet.absoluteFill, styles.wrap, { backgroundColor: c.bg }]}>
      <Image source={require('../../assets/icon.png')} style={styles.icon} />
      {locked ? (
        <>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '600', marginTop: 18 }}>{t.lockedTitle}</Text>
          <Pressable onPress={unlock} style={[styles.btn, { backgroundColor: c.accent }]}>
            <Icon name="lock-open" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>{t.unlock}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', zIndex: 1000, elevation: 1000 },
  icon: { width: 88, height: 88, borderRadius: 20 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, paddingHorizontal: 28, height: 50, borderRadius: 14 },
});
