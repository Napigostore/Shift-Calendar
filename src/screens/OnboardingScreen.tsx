import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModeCards, modePatch } from '../components/FeaturesPage';
import { SocialSignIn } from '../components/SocialSignIn';
import { isConfigured } from '../services/cloud';
import { Btn, Group, haptic, IconName, ListRow } from '../components/ui';
import { detectLocale, REGIONS } from '../region';
import { ensurePermission } from '../services/notifications';
import { useStore } from '../store';
import { Lang, ShiftPreset } from '../types';

const LANGS: { value: Lang; flag: string; label: string; sub: string }[] = [
  { value: 'vi', flag: '🇻🇳', label: 'Tiếng Việt', sub: 'Vietnamese' },
  { value: 'en', flag: '🇺🇸', label: 'English', sub: 'English' },
  { value: 'zh', flag: '🇨🇳', label: '中文', sub: 'Chinese' },
];

export function OnboardingScreen({ onFinish }: { onFinish: (preset: ShiftPreset) => void }) {
  const { data, t, c, updateSettings, applyPreset } = useStore();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [detected] = useState(detectLocale);
  const [region, setRegion] = useState(data.settings.onboarded ? data.settings.region : detected.region);

  // Lần đầu: chọn sẵn ngôn ngữ theo máy
  useEffect(() => {
    if (!data.settings.onboarded) updateSettings({ language: detected.lang });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [preset, setPreset] = useState<ShiftPreset>('8h');
  const lang = data.settings.language;
  const [mode, setMode] = useState<'simple' | 'full'>('full');
  const total = 5;

  const next = () => setStep((s) => Math.min(total - 1, s + 1));
  const finish = async () => {
    applyPreset(preset);
    updateSettings({ onboarded: true, region, shiftPreset: preset, ...modePatch(mode, data.settings) });
    ensurePermission().catch(() => {});
    onFinish(preset);
  };

  const presets: { key: ShiftPreset; icon: IconName; color: string; title: string; desc: string; badge: string }[] = [
    { key: '8h', icon: 'sync', color: c.blue, title: t.preset8h, desc: t.preset8hDesc, badge: '8h' },
    { key: '12h', icon: 'contrast', color: c.indigo, title: t.preset12h, desc: t.preset12hDesc, badge: '12h' },
    { key: 'custom', icon: 'options', color: c.orange, title: t.presetCustom, desc: t.presetCustomDesc, badge: '⚙︎' },
  ];

  const cloudOn = isConfigured();
  const features: { icon: IconName; color: string; title: string; desc: string }[] = [
    { icon: 'calendar', color: c.red, title: t.feat1Title, desc: t.feat1Desc },
    { icon: 'alarm', color: c.orange, title: t.feat2Title, desc: t.feat2Desc },
    { icon: 'stats-chart', color: c.green, title: t.feat3Title, desc: t.feat3Desc },
    ...(cloudOn ? [{ icon: 'cloud-done' as const, color: c.blue, title: t.feat4Title, desc: t.feat4Desc }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top, paddingBottom: insets.bottom + 12 }}>
      {/* Thanh tiến độ */}
      <View style={styles.topBar}>
        <Pressable hitSlop={12} onPress={() => setStep((s) => Math.max(0, s - 1))} style={{ width: 70, opacity: step ? 1 : 0 }} disabled={!step}>
          <Ionicons name="chevron-back" size={26} color={c.accent} />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: total }, (_, i) => (
            <View key={i} style={{ width: i === step ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: i <= step ? c.accent : c.fill }} />
          ))}
        </View>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <>
            <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 28 }}>
              <Image source={require('../../assets/icon.png')} style={styles.appIcon} />
              <Text style={[styles.hero, { color: c.text }]}>{t.welcome}</Text>
              <Text style={[styles.heroSub, { color: c.text2 }]}>{t.welcomeSub}</Text>
            </View>
            <Group header={t.chooseLanguage}>
              {LANGS.map((l) => (
                <ListRow
                  key={l.value}
                  emoji={l.flag}
                  title={l.label}
                  subtitle={l.sub}
                  checked={lang === l.value}
                  onPress={() => updateSettings({ language: l.value })}
                />
              ))}
            </Group>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>{t.region}</Text>
            <Text style={[styles.sub, { color: c.text2 }]}>{t.lunarRegionNote}</Text>
            <Group>
              {REGIONS.map((r) => (
                <ListRow
                  key={r.code}
                  emoji={r.flag}
                  title={r.name}
                  subtitle={r.lunar ? `🌙 ${t.lunar}` : undefined}
                  checked={region === r.code}
                  onPress={() => setRegion(r.code)}
                />
              ))}
            </Group>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>{t.chooseShiftTemplate}</Text>
            <Text style={[styles.sub, { color: c.text2 }]}>{t.shiftTemplateDesc}</Text>
            <View style={{ gap: 12 }}>
              {presets.map((p) => {
                const on = preset === p.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => {
                      haptic();
                      setPreset(p.key);
                    }}
                    style={[styles.preset, { backgroundColor: c.card, borderColor: on ? c.accent : 'transparent' }]}
                  >
                    <View style={[styles.presetBadge, { backgroundColor: p.color }]}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>{p.badge}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>{p.title}</Text>
                      <Text style={{ color: c.text2, fontSize: 14, marginTop: 3, lineHeight: 19 }}>{p.desc}</Text>
                    </View>
                    <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={on ? c.accent : c.text3} />
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>{t.chooseMode}</Text>
            <Text style={[styles.sub, { color: c.text2 }]}>{t.chooseModeDesc}</Text>
            <ModeCards value={mode} onChange={setMode} />
          </>
        )}

        {step === 4 && (
          <>
            <Text style={[styles.title, { color: c.text, marginTop: 12 }]}>{t.featuresTitle}</Text>
            <View style={{ gap: 22, marginVertical: 24 }}>
              {features.map((f) => (
                <View key={f.title} style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  <Ionicons name={f.icon} size={34} color={f.color} style={{ width: 44, textAlign: 'center' }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>{f.title}</Text>
                    <Text style={{ color: c.text2, fontSize: 15, marginTop: 2, lineHeight: 20 }}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
            {cloudOn ? <SocialSignIn onSignedIn={(email, provider) => updateSettings({ cloudEmail: email, cloudProvider: provider })} /> : null}
            {data.settings.cloudEmail ? (
              <Text style={{ color: c.green, textAlign: 'center', marginTop: 10 }}>✓ {data.settings.cloudEmail}</Text>
            ) : null}
          </>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 20 }}>
        <Btn title={step === total - 1 ? t.getStarted : t.continue} onPress={step === total - 1 ? finish : next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 44 },
  appIcon: { width: 96, height: 96, borderRadius: 22, marginBottom: 20 },
  hero: { fontSize: 34, fontWeight: '800', textAlign: 'center', letterSpacing: -0.8, lineHeight: 40 },
  heroSub: { fontSize: 17, textAlign: 'center', marginTop: 8 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, marginTop: 8 },
  sub: { fontSize: 16, lineHeight: 22, marginTop: 8, marginBottom: 22 },
  preset: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 2 },
  presetBadge: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
