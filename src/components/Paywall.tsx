import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LEGAL } from '../config';
import { devSetPro, getPlans, Plan, PlanType, purchase, purchasesConfigured, restore } from '../services/purchases';
import { useStore } from '../store';
import { haptic, IconName } from './ui';
import { Text } from './AppText';
import { Icon } from './Icon';

export function ProBadge({ small }: { small?: boolean }) {
  return (
    <LinearGradient colors={['#FF9F0A', '#FF375F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.badge, small && { paddingHorizontal: 5, paddingVertical: 1 }]}>
      <Text style={[styles.badgeText, small && { fontSize: 9 }]}>PRO</Text>
    </LinearGradient>
  );
}

export function Paywall() {
  const { t, c, paywall, closePaywall, isPro, setPro } = useStore();
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sel, setSel] = useState<PlanType>('yearly');
  const [busy, setBusy] = useState(false);
  const open = paywall !== null;

  useEffect(() => {
    if (open) getPlans().then(setPlans);
  }, [open]);

  const features: { icon: IconName; color: string; text: string }[] = [
    { icon: 'ban', color: '#FF453A', text: t.proF1 },
    { icon: 'infinite', color: '#0A84FF', text: t.proF2 },
    { icon: 'stats-chart', color: '#30D158', text: t.proF3 },
    { icon: 'share', color: '#FF9F0A', text: t.proF4 },
    { icon: 'cloud-done', color: '#64D2FF', text: t.proF5 },
    { icon: 'sparkles', color: '#BF5AF2', text: t.proF6 },
  ];
  const label: Record<PlanType, string> = { yearly: t.planYearly, monthly: t.planMonthly, lifetime: t.planLifetime };
  const unit: Record<PlanType, string> = { yearly: t.perYear, monthly: t.perMonth, lifetime: ` · ${t.oneTime}` };
  const selected = plans.find((p) => p.type === sel);

  const buy = async () => {
    if (!selected) return;
    if (!purchasesConfigured() || !selected.pkg) {
      Alert.alert(t.proTitle, t.purchasesNotConfigured);
      return;
    }
    setBusy(true);
    try {
      if (await purchase(selected)) {
        haptic('success');
        setPro(true);
        Alert.alert(t.proActive, t.proThanks);
        closePaywall();
      }
    } catch (e) {
      Alert.alert(t.error, e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    if (!purchasesConfigured()) return Alert.alert(t.proTitle, t.purchasesNotConfigured);
    setBusy(true);
    try {
      const ok = await restore();
      setPro(ok);
      Alert.alert(ok ? t.proActive : t.restorePurchases, ok ? t.proThanks : '—');
      if (ok) closePaywall();
    } catch (e) {
      Alert.alert(t.error, e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={closePaywall}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <LinearGradient colors={['#0A2A5E', c.bg]} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.55 }} />
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <Pressable onPress={closePaywall} hitSlop={12} style={[styles.close, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Icon name="close" size={20} color="#fff" />
          </Pressable>

          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Image source={require('../../assets/icon.png')} style={styles.icon} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <Text style={styles.title}>Shift Calendar</Text>
              <ProBadge />
            </View>
            <Text style={styles.subtitle}>{isPro ? t.proActive : t.proSubtitle}</Text>
          </View>

          <View style={{ gap: 14, marginTop: 28, marginBottom: 26 }}>
            {features.map((f) => (
              <View key={f.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={[styles.fIcon, { backgroundColor: f.color }]}>
                  <Icon name={f.icon} size={17} color="#fff" />
                </View>
                <Text style={{ color: c.text, fontSize: 16, flex: 1, fontWeight: '500' }}>{f.text}</Text>
              </View>
            ))}
          </View>

          {!isPro && (
            <View style={{ gap: 10 }}>
              {plans.length === 0 ? <ActivityIndicator color={c.accent} /> : null}
              {plans.map((p) => {
                const on = p.type === sel;
                return (
                  <Pressable
                    key={p.type}
                    onPress={() => {
                      haptic();
                      setSel(p.type);
                    }}
                    style={[styles.plan, { backgroundColor: c.card, borderColor: on ? c.accent : c.separator }]}
                  >
                    <Icon name={on ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={on ? c.accent : c.text3} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 17, fontWeight: '600' }}>{label[p.type]}</Text>
                      {p.type === 'yearly' ? <Text style={{ color: c.green, fontSize: 13, marginTop: 1 }}>{t.freeTrial}</Text> : null}
                    </View>
                    <Text style={{ color: c.text, fontSize: 17, fontWeight: '700' }}>
                      {p.price}
                      <Text style={{ color: c.text2, fontSize: 13, fontWeight: '400' }}>{unit[p.type]}</Text>
                    </Text>
                    {p.type === 'yearly' ? (
                      <View style={[styles.best, { backgroundColor: c.accent }]}>
                        <Text style={styles.bestText}>{t.bestValue}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 12, gap: 10 }}>
          {isPro ? (
            <Pressable onPress={closePaywall} style={[styles.cta, { backgroundColor: c.accent }]}>
              <Text style={styles.ctaText}>{t.done}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={buy} disabled={busy} style={({ pressed }) => [{ opacity: pressed || busy ? 0.8 : 1 }]}>
              <LinearGradient colors={['#0AB4FF', '#5E5CE6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{sel === 'yearly' ? t.freeTrial : t.subscribe}</Text>}
              </LinearGradient>
            </Pressable>
          )}
          <Text style={{ color: c.text3, fontSize: 12, textAlign: 'center' }}>{t.cancelAnytime}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
            <Text onPress={doRestore} style={[styles.link, { color: c.text2 }]}>
              {t.restorePurchases}
            </Text>
            <Text onPress={() => Linking.openURL(LEGAL.termsUrl)} style={[styles.link, { color: c.text2 }]}>
              {t.terms}
            </Text>
            {LEGAL.privacyUrl ? (
              <Text onPress={() => Linking.openURL(LEGAL.privacyUrl)} style={[styles.link, { color: c.text2 }]}>
                {t.privacy}
              </Text>
            ) : null}
          </View>
          {__DEV__ && !purchasesConfigured() ? (
            <Text
              onPress={async () => {
                await devSetPro(!isPro);
                setPro(!isPro);
              }}
              style={[styles.link, { color: c.orange, textAlign: 'center' }]}
            >
              DEV: {isPro ? 'tắt' : 'bật'} PRO để thử
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  close: { alignSelf: 'flex-end', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 88, height: 88, borderRadius: 20 },
  title: { color: '#fff', fontSize: 30, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 6, textAlign: 'center' },
  fIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 2 },
  best: { position: 'absolute', top: -9, right: 14, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  bestText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cta: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  link: { fontSize: 13, textDecorationLine: 'underline' },
});
