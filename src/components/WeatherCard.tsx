import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { describeWeather, getWeather, moonTide, toUnit, WeatherData } from '../services/weather';
import { useStore } from '../store';
import { haptic } from './ui';
import { Text } from './AppText';
import { Icon } from './Icon';

/** Ô thời tiết kiểu Apple Weather. Chỉ hiện khi tải được dữ liệu (có mạng). */
export function WeatherCard() {
  const { data, t, lunarOn, isPro } = useStore();
  const ws = data.settings.weather;
  const lang = data.settings.language;
  const lowPower = data.settings.lowPower;
  const [w, setW] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    (force: boolean) =>
      getWeather(ws, force, lowPower)
        .then(setW)
        .catch(() => setW(null))
        .finally(() => setLoading(false)),
    [ws, lowPower],
  );

  useEffect(() => {
    if (ws.enabled) load(false);
  }, [ws.enabled, ws.useGps, ws.lat, ws.lon, ws.showTide]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ws.enabled || !w) return null;
  const desc = describeWeather(w.code, lang);
  const hour = new Date().getHours();
  const night = hour < 6 || hour >= 18;
  const rainy = w.code >= 51;
  const bg: [string, string] = night ? ['#0B1A3A', '#2C3E70'] : rainy ? ['#4A5A70', '#7D8CA3'] : ['#1E7CE8', '#5FB1F5'];
  const mt = moonTide(new Date(), lang);
  const F = ws.fahrenheit;

  const stormText = w.stormRisk === 'storm' ? t.stormStorm : w.stormRisk === 'strong-wind' ? t.stormWind : w.stormRisk === 'thunder' ? t.stormThunder : '';

  return (
    <LinearGradient colors={bg} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={styles.card}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {ws.useGps ? <Icon name="navigate" size={12} color="#fff" /> : null}
            <Text style={styles.place} numberOfLines={1}>
              {w.place || ws.place || t.weather}
            </Text>
          </View>
          <Text style={styles.temp}>{toUnit(w.temp, F)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Pressable
            hitSlop={10}
            onPress={() => {
              haptic();
              setLoading(true);
              load(true);
            }}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Icon name="refresh" size={16} color="rgba(255,255,255,0.8)" />}
          </Pressable>
          <Text style={styles.icon}>{desc.icon}</Text>
          <Text style={styles.cond}>{desc.text}</Text>
          <Text style={styles.hl}>
            H:{toUnit(w.tMax, F)}  L:{toUnit(w.tMin, F)}
          </Text>
        </View>
      </View>

      {isPro && ws.showStorm && w.stormRisk !== 'none' && (
        <View style={[styles.alert, { backgroundColor: w.stormRisk === 'storm' ? 'rgba(255,69,58,0.9)' : 'rgba(255,159,10,0.9)' }]}>
          <Icon name="warning" size={16} color="#fff" />
          <Text style={styles.alertText}>
            {stormText}
            {w.stormDay ? ` · ${w.stormDay.slice(8, 10)}/${w.stormDay.slice(5, 7)}` : ''}
          </Text>
        </View>
      )}

      <View style={styles.stats}>
        <Stat icon="thermometer-outline" label={t.feelsLike} value={toUnit(w.feels, F)} />
        {ws.showHumidity && <Stat icon="water-outline" label={t.humidity} value={`${Math.round(w.humidity)}%`} />}
        {ws.showWind && <Stat icon="leaf-outline" label={t.wind} value={`${Math.round(w.wind)} km/h`} />}
        {ws.showUv && <Stat icon="sunny-outline" label={t.uv} value={`${Math.round(w.uv)}`} />}
        <Stat icon="umbrella-outline" label={t.rainChance} value={`${Math.round(w.rainChance)}%`} />
      </View>

      {isPro && ws.showTide && w.tides && w.tides.length > 0 && (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>
            🌊 {t.tide.toUpperCase()}
            {w.wave != null ? `  ·  ${t.wave} ${w.wave.toFixed(1)} m` : ''}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {w.tides.map((p, i) => (
              <View key={i} style={styles.tide}>
                <Icon name={p.high ? 'arrow-up' : 'arrow-down'} size={14} color="#fff" />
                <Text style={styles.tideTime}>{p.time}</Text>
                <Text style={styles.tideH}>{p.height.toFixed(2)} m</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {ws.showMoonTide && (
        <View style={[styles.block, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
          <Text style={{ fontSize: 26 }}>{mt.moonIcon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.moonName}>{mt.moonName}</Text>
            {lunarOn ? (
              <Text style={styles.moonSub}>
                {t.moonTide}: {mt.tideName} · {t.lunar} {mt.lunarDay}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

function Stat({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={15} color="rgba(255,255,255,0.75)" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 16, marginBottom: 16 },
  top: { flexDirection: 'row' },
  place: { color: '#fff', fontSize: 15, fontWeight: '600' },
  temp: { color: '#fff', fontSize: 54, fontWeight: '200', marginTop: -2 },
  icon: { fontSize: 30, marginTop: 4 },
  cond: { color: '#fff', fontSize: 14, fontWeight: '600' },
  hl: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginTop: 10 },
  alertText: { color: '#fff', fontWeight: '700', fontSize: 14, flex: 1 },
  stats: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.35)' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11 },
  block: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.35)' },
  blockTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.4 },
  tide: { flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 10, paddingVertical: 8, alignItems: 'center', gap: 2 },
  tideTime: { color: '#fff', fontWeight: '700', fontSize: 15 },
  tideH: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  moonName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  moonSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 1 },
});
