import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FULL_FEATURES, SIMPLE_FEATURES } from '../defaults';
import { useStore } from '../store';
import { FeatureFlags, Settings } from '../types';
import { Group, haptic, IconName, ListRow, Toggle } from './ui';

type Mode = Settings['uiMode'];

/** Gói cài đặt cho từng chế độ, dùng chung cho màn hình chào và trang Tính năng. */
export function modePatch(mode: 'simple' | 'full', s: Settings): Partial<Settings> {
  const full = mode === 'full';
  return {
    uiMode: mode,
    features: { ...(full ? FULL_FEATURES : SIMPLE_FEATURES) },
    quotesEnabled: full,
    showCountdown: full,
    weather: { ...s.weather, enabled: full },
  };
}

export function ModeCards({ value, onChange }: { value: Mode; onChange: (m: 'simple' | 'full') => void }) {
  const { t, c } = useStore();
  const items: { key: 'simple' | 'full'; icon: IconName; color: string; title: string; desc: string }[] = [
    { key: 'simple', icon: 'leaf', color: c.green, title: t.modeSimple, desc: t.modeSimpleDesc },
    { key: 'full', icon: 'grid', color: c.blue, title: t.modeFull, desc: t.modeFullDesc },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
      {items.map((it) => {
        const on = value === it.key;
        return (
          <Pressable
            key={it.key}
            onPress={() => {
              haptic();
              onChange(it.key);
            }}
            style={[styles.card, { backgroundColor: c.card, borderColor: on ? c.accent : 'transparent' }]}
          >
            <View style={[styles.icon, { backgroundColor: it.color }]}>
              <Ionicons name={it.icon} size={22} color="#fff" />
            </View>
            <Text style={{ color: c.text, fontSize: 17, fontWeight: '700', marginTop: 12 }}>{it.title}</Text>
            <Text style={{ color: c.text2, fontSize: 13, marginTop: 4, lineHeight: 18 }}>{it.desc}</Text>
            <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={on ? c.accent : c.text3} style={{ marginTop: 12 }} />
          </Pressable>
        );
      })}
    </View>
  );
}

export function FeaturesPage() {
  const { data, t, c, updateSettings } = useStore();
  const s = data.settings;
  const setFlag = (k: keyof FeatureFlags, v: boolean) => updateSettings({ features: { ...s.features, [k]: v }, uiMode: 'custom' });

  const rows: { icon: IconName; color: string; title: string; value: boolean; set: (v: boolean) => void }[] = [
    { icon: 'chatbubble-ellipses', color: c.pink, title: t.quotesSetting, value: s.quotesEnabled, set: (v) => updateSettings({ quotesEnabled: v, uiMode: 'custom' }) },
    { icon: 'timer', color: c.orange, title: t.countdown, value: s.showCountdown, set: (v) => updateSettings({ showCountdown: v, uiMode: 'custom' }) },
    { icon: 'partly-sunny', color: c.blue, title: t.weather, value: s.weather.enabled, set: (v) => updateSettings({ weather: { ...s.weather, enabled: v }, uiMode: 'custom' }) },
    { icon: 'book', color: c.red, title: t.almanac, value: s.features.almanac, set: (v) => setFlag('almanac', v) },
    { icon: 'happy', color: c.yellow, title: t.stickers, value: s.features.stickers, set: (v) => setFlag('stickers', v) },
    { icon: 'brush', color: c.accent, title: t.fQuickTools, value: s.features.quickTools, set: (v) => setFlag('quickTools', v) },
    { icon: 'cash', color: c.green, title: t.fSalary, value: s.features.salary, set: (v) => setFlag('salary', v) },
    { icon: 'airplane', color: c.purple, title: t.fLeave, value: s.features.leave, set: (v) => setFlag('leave', v) },
    { icon: 'people', color: c.indigo, title: t.fStaff, value: s.features.staff, set: (v) => setFlag('staff', v) },
  ];

  return (
    <>
      <Text style={{ color: c.text2, fontSize: 15, marginBottom: 16, marginHorizontal: 4 }}>{t.featuresDesc}</Text>
      <ModeCards value={s.uiMode} onChange={(m) => updateSettings(modePatch(m, s))} />
      <Group header={s.uiMode === 'custom' ? t.modeCustom : undefined}>
        {rows.map((r) => (
          <ListRow key={r.title} icon={r.icon} iconColor={r.color} title={r.title} right={<Toggle value={r.value} onChange={r.set} />} />
        ))}
      </Group>
    </>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 2 },
  icon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
