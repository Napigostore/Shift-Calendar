import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventEditor } from '../components/EventEditor';
import { FeaturesPage } from '../components/FeaturesPage';
import { HolidayEditor } from '../components/HolidayEditor';
import { ProBadge } from '../components/Paywall';
import { FREE_LIMITS } from '../pro';
import { LeaveCard } from '../components/LeaveCard';
import { fmtShort, leaveSummary } from '../countdown';
import { ShiftEditor } from '../components/ShiftEditor';
import { SocialSignIn } from '../components/SocialSignIn';
import { Btn, Field, Group, haptic, IconName, InlineInput, LargeTitle, ListRow, NavHeader, Screen, Segmented, Stepper, TAB_BAR_HEIGHT, Toggle } from '../components/ui';
import { WidgetPreview } from '../components/WidgetPreview';
import { defaultData } from '../defaults';
import { QUOTE_CATEGORIES } from '../quotes';
import { REGIONS, regionOf } from '../region';
import * as Cloud from '../services/cloud';
import { exportJsonBackup } from '../services/export';
import { testAlarm } from '../services/notifications';
import { PlaceResult, searchPlaces } from '../services/weather';
import { useStore } from '../store';
import { Accent, CountdownEvent, CustomHoliday, DateFormat, Lang, ShiftPreset, ShiftType, WeatherSettings } from '../types';
import { formatMoney, formatTime, keyOf, parseKey } from '../utils';

export type SettingsPage = 'home' | 'features' | 'shift' | 'calendar' | 'salary' | 'leave' | 'weather' | 'quotes' | 'notify' | 'ui' | 'widget' | 'language' | 'cloud' | 'about';

export function SettingsScreen({ initialPage = 'home' }: { initialPage?: SettingsPage }) {
  const { data, t, c } = useStore();
  const [page, setPage] = useState<SettingsPage>(initialPage);
  const insets = useSafeAreaInsets();
  const leaveLeft = leaveSummary(data, data.activeEmployeeId, new Date().getFullYear()).remaining;

  const groups: { key: SettingsPage; icon: IconName; color: string; label: string; value?: string }[][] = [
    [
      { key: 'shift', icon: 'briefcase', color: c.orange, label: t.shiftSetting, value: `${data.shiftTypes.length}` },
      { key: 'calendar', icon: 'calendar', color: c.red, label: t.calendarSetting },
      { key: 'salary', icon: 'cash', color: c.green, label: t.salarySetting },
      ...(data.settings.features.leave
        ? [{ key: 'leave' as const, icon: 'airplane' as const, color: c.purple, label: `${t.annualLeave} & ${t.countdown.toLowerCase()}`, value: `${leaveLeft}` }]
        : []),
    ],
    [
      { key: 'weather', icon: 'partly-sunny', color: c.blue, label: t.weather, value: data.settings.weather.enabled ? t.yes : t.no },
      { key: 'quotes', icon: 'chatbubble-ellipses', color: c.pink, label: t.quotesSetting },
      { key: 'notify', icon: 'notifications', color: c.red, label: t.notifications },
    ],
    [
      { key: 'features', icon: 'toggle', color: c.green, label: t.features, value: { simple: t.modeSimple, full: t.modeFull, custom: t.modeCustom }[data.settings.uiMode] },
      { key: 'ui', icon: 'color-palette', color: c.indigo, label: t.uiSetting },
      { key: 'widget', icon: 'apps', color: c.purple, label: t.widgetSetting },
      { key: 'language', icon: 'globe', color: c.gray, label: t.languageRegion, value: { vi: 'Tiếng Việt', en: 'English', zh: '中文' }[data.settings.language] },
    ],
    [
      { key: 'cloud', icon: 'cloud', color: c.teal, label: t.cloudSetting },
      { key: 'about', icon: 'information-circle', color: c.gray, label: t.about },
    ],
  ];

  if (page !== 'home') {
    const cur = groups.flat().find((i) => i.key === page)!;
    return (
      <View style={{ flex: 1 }}>
        <NavHeader title={cur.label} backLabel={t.settings} onBack={() => setPage('home')} />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 32 }}
        >
          {page === 'shift' && <ShiftPage />}
          {page === 'calendar' && <CalendarPage />}
          {page === 'salary' && <SalaryPage />}
          {page === 'leave' && <LeavePage />}
          {page === 'features' && <FeaturesPage />}
          {page === 'weather' && <WeatherPage />}
          {page === 'quotes' && <QuotesPage />}
          {page === 'notify' && <NotifyPage />}
          {page === 'ui' && <UiPage />}
          {page === 'widget' && <WidgetPage />}
          {page === 'language' && <LanguagePage />}
          {page === 'cloud' && <CloudPage />}
          {page === 'about' && <AboutPage />}
        </ScrollView>
      </View>
    );
  }

  return (
    <Screen>
      <LargeTitle title={t.settings} />
      <ProBanner />
      <Pressable onPress={() => setPage(Cloud.isConfigured() ? 'cloud' : 'about')}>
        <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <Image source={require('../../assets/icon.png')} style={{ width: 60, height: 60, borderRadius: 14 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '600' }}>Shift Calendar</Text>
            <Text style={{ color: c.text2, fontSize: 14, marginTop: 2 }} numberOfLines={1}>
              {data.settings.cloudEmail ?? (Cloud.isConfigured() ? t.signInSubtitle : `${t.version} 1.0.0`)}
            </Text>
          </View>
        </View>
      </Pressable>
      {groups.map((g, i) => (
        <Group key={i}>
          {g.map((item) => (
            <ListRow key={item.key} icon={item.icon} iconColor={item.color} title={item.label} value={item.value} onPress={() => setPage(item.key)} />
          ))}
        </Group>
      ))}
    </Screen>
  );
}

function ShiftPage() {
  const { data, t, c, applyPreset, requirePro } = useStore();
  const [editing, setEditing] = useState<ShiftType | 'new' | null>(null);
  const h24 = data.settings.clock24h;
  const presets: { key: ShiftPreset; label: string; desc: string }[] = [
    { key: '8h', label: t.preset8h, desc: t.preset8hDesc },
    { key: '12h', label: t.preset12h, desc: t.preset12hDesc },
    { key: 'custom', label: t.presetCustom, desc: t.presetCustomDesc },
  ];
  return (
    <>
      <Group>
        {data.shiftTypes.map((s) => (
          <Pressable key={s.id} onPress={() => setEditing(s)}>
            {({ pressed }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: pressed ? c.fill : 'transparent' }}>
                <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: s.color, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>{s.short}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 17 }}>{s.name}</Text>
                  <Text style={{ color: c.text2, fontSize: 13, marginTop: 1 }}>
                    {s.hours > 0 ? `${formatTime(s.start, h24)} – ${formatTime(s.end, h24)} · ${s.hours}${t.hours}` : '—'}
                    {s.alarmEnabled && s.hours > 0 ? ` · ⏰ ${formatTime(s.alarmTime, h24)}` : ''}
                  </Text>
                </View>
                <Text style={{ color: c.text2, fontSize: 15 }}>{s.pay ? formatMoney(s.pay) : ''}</Text>
              </View>
            )}
          </Pressable>
        ))}
        <ListRow icon="add" iconColor={c.accent} title={t.newShift} titleStyle={{ color: c.accent }} onPress={() => (data.shiftTypes.length < FREE_LIMITS.shiftTypes || requirePro('shifts')) && setEditing('new')} chevron={false} />
      </Group>

      <Group header={t.shiftTemplate} footer={t.applyTemplateConfirm}>
        {presets.map((p) => (
          <ListRow
            key={p.key}
            title={p.label}
            subtitle={p.desc}
            checked={data.settings.shiftPreset === p.key}
            onPress={() =>
              Alert.alert(t.applyTemplate, t.applyTemplateConfirm, [
                { text: t.cancel, style: 'cancel' },
                { text: t.apply, onPress: () => applyPreset(p.key) },
              ])
            }
          />
        ))}
      </Group>
      <ShiftEditor shift={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function CalendarPage() {
  const { data, t, c, updateSettings, deleteHoliday } = useStore();
  const s = data.settings;
  const region = regionOf(s.region);
  const [hol, setHol] = useState<CustomHoliday | 'new' | null>(null);
  return (
    <>
      <Group>
        <ListRow
          icon="today"
          iconColor={c.red}
          title={t.firstDay}
          right={<Segmented style={{ width: 150 }} options={[{ value: 1 as const, label: t.weekdaysShort[1] }, { value: 0 as const, label: t.weekdaysShort[0] }]} value={s.firstDayOfWeek} onChange={(v) => updateSettings({ firstDayOfWeek: v })} />}
        />
        <ListRow icon="sunny" iconColor={c.orange} title={t.highlightWeekends} right={<Toggle value={s.highlightWeekends} onChange={(v) => updateSettings({ highlightWeekends: v })} />} />
        <ListRow
          icon="layers"
          iconColor={c.indigo}
          title={t.shiftsPerDay}
          right={<Segmented style={{ width: 120 }} options={[1, 2, 3].map((v) => ({ value: v as 1 | 2 | 3, label: String(v) }))} value={s.shiftsPerDay} onChange={(v) => updateSettings({ shiftsPerDay: v })} />}
        />
        <ListRow
          icon="grid"
          iconColor={c.blue}
          title={t.monthStyle}
          right={<Segmented style={{ width: 150 }} options={[{ value: 'full' as const, label: t.styleFull }, { value: 'compact' as const, label: t.styleCompact }]} value={s.monthStyle} onChange={(v) => updateSettings({ monthStyle: v })} />}
        />
      </Group>

      <Group footer={region.lunar ? undefined : t.lunarRegionNote}>
        {region.lunar ? <ListRow icon="moon" iconColor={c.indigo} title={t.showLunar} right={<Toggle value={s.showLunar} onChange={(v) => updateSettings({ showLunar: v })} />} /> : null}
        {region.holidays ? (
          <ListRow icon="flag" iconColor={c.red} title={t.defaultHolidays} subtitle="Tết, Giỗ Tổ, 30/4, 1/5, 2/9, Noel…" right={<Toggle value={s.showDefaultHolidays} onChange={(v) => updateSettings({ showDefaultHolidays: v })} />} />
        ) : null}
        <ListRow icon="earth" iconColor={c.gray} title={t.region} value={`${region.flag} ${region.name}`} />
      </Group>

      <Group header={t.customHolidays}>
        {data.customHolidays.map((h) => (
          <ListRow
            key={h.id}
            emoji={h.icon || s.holidayIcon}
            title={h.name}
            subtitle={`${h.day}/${h.month}${h.lunar ? ` · ${t.lunar}` : ''}${h.off ? ` · ${t.isOffDay}` : ''}`}
            onPress={() => setHol(h)}
            right={
              <Pressable hitSlop={10} onPress={() => deleteHoliday(h.id)}>
                <Text style={{ color: c.red, fontSize: 15 }}>{t.delete}</Text>
              </Pressable>
            }
          />
        ))}
        <ListRow icon="add" iconColor={c.accent} title={t.addHoliday} titleStyle={{ color: c.accent }} onPress={() => setHol('new')} chevron={false} />
      </Group>
      <HolidayEditor holiday={hol} onClose={() => setHol(null)} />
    </>
  );
}

function SalaryPage() {
  const { data, t, c, updateSettings } = useStore();
  const s = data.settings;
  const num = (v: string) => Number(v.replace(/[^\d]/g, '')) || 0;
  return (
    <>
      <Group>
        <ListRow icon="wallet" iconColor={c.green} title={t.payday} right={<Stepper value={s.payday} onChange={(v) => updateSettings({ payday: v })} min={0} max={31} />} />
      </Group>
      <Group footer={t.paydaySetting}>
        <InlineInput label={t.nightBonus} value={String(s.nightBonus)} keyboardType="number-pad" onChangeText={(v) => updateSettings({ nightBonus: num(v) })} />
        <InlineInput label={t.otPayHour} value={String(s.defaultOtRate)} keyboardType="number-pad" onChangeText={(v) => updateSettings({ defaultOtRate: num(v) })} />
      </Group>
      <GoalRow />
    </>
  );
}

function LeavePage() {
  const { data, t, c, updateSettings, requirePro } = useStore();
  const s = data.settings;
  const year = new Date().getFullYear();
  const L = leaveSummary(data, data.activeEmployeeId, year);
  const todayKey = keyOf(new Date());
  const [editing, setEditing] = useState<CountdownEvent | 'new' | null>(null);
  const toLabel = (k: string) => {
    const [y, m, d] = parseKey(k);
    const date = new Date(y, m - 1, d);
    return `${t.weekdaysLong[date.getDay()]}, ${fmtShort(date)}`;
  };
  return (
    <>
      <LeaveCard year={year} />
      <Group footer={t.leaveHint}>
        <ListRow icon="calendar" iconColor={c.purple} title={t.leavePerYear} right={<Stepper value={s.leaveDaysPerYear} onChange={(v) => updateSettings({ leaveDaysPerYear: v })} min={0} max={60} />} />
        <ListRow icon="arrow-redo" iconColor={c.indigo} title={t.carryOver} right={<Stepper value={s.leaveCarryOver} onChange={(v) => updateSettings({ leaveCarryOver: v })} min={0} max={60} />} />
      </Group>

      <Group header={t.events}>
        <ListRow icon="timer" iconColor={c.orange} title={t.showCountdown} right={<Toggle value={s.showCountdown} onChange={(v) => updateSettings({ showCountdown: v })} />} />
        {data.events.map((e) => (
          <ListRow
            key={e.id}
            emoji={e.icon}
            title={e.name}
            subtitle={`${toLabel(e.date)}${e.endDate ? ` → ${toLabel(e.endDate)}` : ''}`}
            onPress={() => setEditing(e)}
          />
        ))}
        <ListRow icon="add" iconColor={c.accent} title={t.addEvent} titleStyle={{ color: c.accent }} onPress={() => (data.events.length < FREE_LIMITS.events || requirePro('events')) && setEditing('new')} chevron={false} />
      </Group>

      <Group header={`${t.leaveTaken} ${year}`}>
        {L.takenDays.length ? (
          L.takenDays.map((k) => <ListRow key={k} emoji="✈️" title={toLabel(k)} value={k > todayKey ? t.leavePlanned : undefined} />)
        ) : (
          <ListRow title={t.noLeave} titleStyle={{ color: c.text2 }} />
        )}
      </Group>
      <EventEditor event={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function GoalRow() {
  const { data, t, c, updateSettings, isPro, requirePro } = useStore();
  const goal = data.settings.incomeGoal;
  return (
    <Group footer="🎯">
      {isPro ? (
        <InlineInput
          label={t.incomeGoal}
          value={goal ? String(goal) : ''}
          placeholder="10000000"
          keyboardType="number-pad"
          onChangeText={(v) => updateSettings({ incomeGoal: Number(v.replace(/[^0-9]/g, '')) || 0 })}
        />
      ) : (
        <ListRow icon="flag" iconColor={c.orange} title={t.incomeGoal} right={<ProBadge />} onPress={() => requirePro('goal')} />
      )}
    </Group>
  );
}

function ProBanner() {
  const { t, isPro, requirePro, proEnabled } = useStore();
  if (!proEnabled) return null;
  return (
    <Pressable onPress={() => requirePro('general') || undefined} style={{ marginBottom: 16 }}>
      <LinearGradient colors={isPro ? ['#30D158', '#0A9F6E'] : ['#FF9F0A', '#FF375F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 30 }}>{isPro ? '✨' : '👑'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{isPro ? t.proActive : t.goPro}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 }} numberOfLines={2}>
            {isPro ? t.proThanks : `${t.proF1} · ${t.proF3} · ${t.proF4}`}
          </Text>
        </View>
        {!isPro ? <Ionicons name="chevron-forward" size={20} color="#fff" /> : null}
      </LinearGradient>
    </Pressable>
  );
}

function WeatherPage() {
  const { data, t, c, updateSettings, lunarOn, requirePro } = useStore();
  const w = data.settings.weather;
  const setW = (patch: Partial<WeatherSettings>) => updateSettings({ weather: { ...w, ...patch } });
  const [q, setQ] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const id = setTimeout(() => {
      setBusy(true);
      searchPlaces(q, data.settings.language)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setBusy(false));
    }, 400);
    return () => clearTimeout(id);
  }, [q, data.settings.language]);

  return (
    <>
      <Group footer="Open-Meteo · open-meteo.com">
        <ListRow icon="partly-sunny" iconColor={c.blue} title={t.weatherShow} right={<Toggle value={w.enabled} onChange={(v) => setW({ enabled: v })} />} />
      </Group>
      {w.enabled && (
        <>
          <Group>
            <ListRow icon="navigate" iconColor={c.blue} title={t.useGps} right={<Toggle value={w.useGps} onChange={(v) => setW({ useGps: v })} />} />
            {!w.useGps ? <ListRow icon="location" iconColor={c.red} title={t.chooseCity} value={w.place ?? '—'} /> : null}
          </Group>
          {!w.useGps && (
            <>
              <Field placeholder={t.searchCity} value={q} onChangeText={setQ} autoCorrect={false} />
              {busy ? <ActivityIndicator color={c.accent} style={{ marginBottom: 12 }} /> : null}
              {q.trim().length >= 2 && results.length > 0 && (
                <Group>
                  {results.map((r, i) => (
                    <ListRow
                      key={i}
                      icon="location-outline"
                      iconColor={c.gray}
                      title={r.name}
                      subtitle={r.detail}
                      checked={w.lat === r.lat && w.lon === r.lon}
                      onPress={() => {
                        setW({ lat: r.lat, lon: r.lon, place: r.name });
                        setQ('');
                        setResults([]);
                      }}
                    />
                  ))}
                </Group>
              )}
            </>
          )}
          <Group header={t.appearance}>
            <ListRow icon="water" iconColor={c.teal} title={t.humidity} right={<Toggle value={w.showHumidity} onChange={(v) => setW({ showHumidity: v })} />} />
            <ListRow icon="leaf" iconColor={c.green} title={t.wind} right={<Toggle value={w.showWind} onChange={(v) => setW({ showWind: v })} />} />
            <ListRow icon="sunny" iconColor={c.yellow} title={t.uv} right={<Toggle value={w.showUv} onChange={(v) => setW({ showUv: v })} />} />
            <ListRow icon="boat" iconColor={c.blue} title={t.tide} right={<Toggle value={w.showTide} onChange={(v) => (!v || requirePro('tides')) && setW({ showTide: v })} />} />
            <ListRow icon="moon" iconColor={c.indigo} title={lunarOn ? t.moonTide : t.moonTide.split(' ')[0]} right={<Toggle value={w.showMoonTide} onChange={(v) => setW({ showMoonTide: v })} />} />
            <ListRow icon="thunderstorm" iconColor={c.orange} title={t.storm} right={<Toggle value={w.showStorm} onChange={(v) => (!v || requirePro('tides')) && setW({ showStorm: v })} />} />
            <ListRow icon="thermometer" iconColor={c.red} title={t.fahrenheit} right={<Toggle value={w.fahrenheit} onChange={(v) => setW({ fahrenheit: v })} />} />
          </Group>
        </>
      )}
    </>
  );
}

function QuotesPage() {
  const { data, t, c, updateSettings } = useStore();
  const s = data.settings;
  const lang = s.language;
  return (
    <>
      <Group>
        <ListRow icon="chatbubble-ellipses" iconColor={c.pink} title={t.quotesShow} right={<Toggle value={s.quotesEnabled} onChange={(v) => updateSettings({ quotesEnabled: v })} />} />
      </Group>
      {s.quotesEnabled && (
        <Group header={t.quoteCategories}>
          {QUOTE_CATEGORIES.map((q) => {
            const on = s.quoteCategories.includes(q.key);
            return (
              <ListRow
                key={q.key}
                emoji={q.icon}
                title={q.names[lang]}
                checked={on}
                onPress={() => {
                  const next = on ? s.quoteCategories.filter((x) => x !== q.key) : [...s.quoteCategories, q.key];
                  updateSettings({ quoteCategories: next.length ? next : [q.key] });
                }}
              />
            );
          })}
        </Group>
      )}
    </>
  );
}

function NotifyPage() {
  const { data, t, c, updateSettings } = useStore();
  const s = data.settings;
  return (
    <>
      <Group footer={t.feat2Desc}>
        <ListRow icon="alarm" iconColor={c.orange} title={t.alarmsEnabled} right={<Toggle value={s.alarmsEnabled} onChange={(v) => updateSettings({ alarmsEnabled: v })} />} />
      </Group>
      {data.employees.length > 1 && (
        <Group header={t.alarmFor}>
          {data.employees.map((e) => (
            <ListRow key={e.id} icon="person" iconColor={c.blue} title={e.name} checked={s.alarmEmployeeId === e.id} onPress={() => updateSettings({ alarmEmployeeId: e.id })} />
          ))}
        </Group>
      )}
      <Btn title={t.testAlarm} icon="notifications-outline" kind="tinted" onPress={() => testAlarm(t.testAlarm)} />
    </>
  );
}

function UiPage() {
  const { data, t, c, updateSettings, requirePro } = useStore();
  const s = data.settings;
  const accents: { value: Accent; color: string }[] = [
    { value: 'electric', color: '#0AB4FF' },
    { value: 'orange', color: '#FF9F0A' },
    { value: 'green', color: '#30D158' },
    { value: 'purple', color: '#BF5AF2' },
  ];
  return (
    <>
      <Group>
        <ListRow icon="moon" iconColor={c.indigo} title={t.darkMode} right={<Toggle value={s.darkMode} onChange={(v) => updateSettings({ darkMode: v })} />} />
      </Group>
      <Group header={t.theme}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 16 }}>
          {accents.map((a) => (
            <Pressable
              key={a.value}
              onPress={() => {
                haptic();
                if (a.value !== 'electric' && !requirePro('theme')) return;
                updateSettings({ accent: a.value });
              }}
              style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 3, borderColor: s.accent === a.value ? c.text : 'transparent', alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: a.color }} />
            </Pressable>
          ))}
        </View>
      </Group>
      <Group header={t.holidayIcon}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 12 }}>
          {['🎉', '🏮', '🎌', '⭐', '🔴', '🎊'].map((ic) => (
            <Pressable
              key={ic}
              onPress={() => {
                haptic();
                updateSettings({ holidayIcon: ic });
              }}
              style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: s.holidayIcon === ic ? c.accentSoft : 'transparent' }}
            >
              <Text style={{ fontSize: 24 }}>{ic}</Text>
            </Pressable>
          ))}
        </View>
      </Group>
    </>
  );
}

function WidgetPage() {
  const { data, t, c, updateSettings } = useStore();
  const s = data.settings;
  return (
    <>
      <WidgetPreview />
      <Group footer={t.widgetNote}>
        <ListRow icon="flash" iconColor={c.orange} title={t.widgetQuick} right={<Toggle value={s.widgetQuickButtons} onChange={(v) => updateSettings({ widgetQuickButtons: v })} />} />
        <ListRow
          icon="image"
          iconColor={c.blue}
          title={t.widgetBg}
          right={
            <Segmented
              style={{ width: 170 }}
              options={[
                { value: 'dark' as const, label: 'Dark' },
                { value: 'transparent' as const, label: 'Glass' },
                { value: 'accent' as const, label: 'Color' },
              ]}
              value={s.widgetBackground}
              onChange={(v) => updateSettings({ widgetBackground: v })}
            />
          }
        />
        <ListRow icon="contract" iconColor={c.gray} title={t.widgetCompact} right={<Toggle value={s.widgetCompact} onChange={(v) => updateSettings({ widgetCompact: v })} />} />
      </Group>
    </>
  );
}

function LanguagePage() {
  const { data, t, c, updateSettings } = useStore();
  const s = data.settings;
  const langs: { value: Lang; flag: string; label: string }[] = [
    { value: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
    { value: 'en', flag: '🇺🇸', label: 'English' },
    { value: 'zh', flag: '🇨🇳', label: '中文' },
  ];
  return (
    <>
      <Group header={t.language}>
        {langs.map((l) => (
          <ListRow key={l.value} emoji={l.flag} title={l.label} checked={s.language === l.value} onPress={() => updateSettings({ language: l.value })} />
        ))}
      </Group>
      <Group>
        <ListRow
          icon="calendar-outline"
          iconColor={c.red}
          title={t.dateFormat}
          right={
            <Segmented
              style={{ width: 190 }}
              options={(['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'] as DateFormat[]).map((v) => ({ value: v, label: v.slice(0, 5).toLowerCase() }))}
              value={s.dateFormat}
              onChange={(v) => updateSettings({ dateFormat: v })}
            />
          }
        />
        <ListRow icon="time-outline" iconColor={c.blue} title={t.clockFormat} right={<Segmented style={{ width: 110 }} options={[{ value: 1, label: '24h' }, { value: 0, label: '12h' }]} value={s.clock24h ? 1 : 0} onChange={(v) => updateSettings({ clock24h: v === 1 })} />} />
        <ListRow
          icon="phone-portrait-outline"
          iconColor={c.gray}
          title={t.orientation}
          right={
            <Segmented
              style={{ width: 170 }}
              options={[
                { value: 'portrait' as const, label: t.portrait },
                { value: 'landscape' as const, label: t.landscape },
                { value: 'auto' as const, label: t.auto },
              ]}
              value={s.orientation}
              onChange={(v) => updateSettings({ orientation: v })}
            />
          }
        />
      </Group>
      <Group header={t.region} footer={t.lunarRegionNote}>
        {REGIONS.map((r) => (
          <ListRow key={r.code} emoji={r.flag} title={r.name} subtitle={r.lunar ? `🌙 ${t.lunar}` : undefined} checked={s.region === r.code} onPress={() => updateSettings({ region: r.code })} />
        ))}
      </Group>
    </>
  );
}

function CloudPage() {
  const { data, t, c, replaceAll, updateSettings, requirePro } = useStore();
  const [email, setEmail] = useState(data.settings.cloudEmail ?? '');
  const [password, setPassword] = useState('');
  const [signedIn, setSignedIn] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Cloud.isConfigured()) Cloud.getSession().then((s) => setSignedIn(s?.email ?? null)).catch(() => {});
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert(t.error, e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const auth = (mode: 'in' | 'up') =>
    run(async () => {
      const s = mode === 'in' ? await Cloud.signIn(email.trim(), password) : await Cloud.signUp(email.trim(), password);
      setSignedIn(s.email);
      setPassword('');
      updateSettings({ cloudEmail: s.email, cloudProvider: 'password' });
    });

  return (
    <>
      {/* Chưa cấu hình Firebase (bản phát hành) → chỉ còn sao lưu ra file */}
      {!Cloud.isConfigured() ? null : signedIn ? (
        <>
          <Group header={t.account}>
            <ListRow icon="person-circle" iconColor={c.blue} title={signedIn} subtitle={`${t.lastBackup}: ${data.settings.lastBackup ? new Date(data.settings.lastBackup).toLocaleString() : '—'}`} />
          </Group>
          <Group>
            <ListRow
              icon="cloud-upload"
              iconColor={c.blue}
              title={t.backupNow}
              onPress={() =>
                !busy &&
                requirePro('cloud') &&
                run(async () => {
                  const at = await Cloud.backup(data);
                  updateSettings({ lastBackup: at });
                  Alert.alert(t.done);
                })
              }
            />
            <ListRow
              icon="cloud-download"
              iconColor={c.green}
              title={t.restore}
              onPress={() =>
                Alert.alert(t.restore, t.restoreConfirm, [
                  { text: t.cancel, style: 'cancel' },
                  {
                    text: t.confirm,
                    onPress: () =>
                      run(async () => {
                        const r = await Cloud.restore();
                        if (r) {
                          replaceAll(r.data);
                          Alert.alert(t.done);
                        } else Alert.alert(t.error, 'No backup');
                      }),
                  },
                ])
              }
            />
          </Group>
          <Group>
            <ListRow
              title={t.logout}
              titleStyle={{ color: c.accent }}
              onPress={() =>
                run(async () => {
                  await Cloud.signOut();
                  setSignedIn(null);
                })
              }
              chevron={false}
            />
            <ListRow
              title={t.deleteAccount}
              destructive
              chevron={false}
              onPress={() =>
                Alert.alert(t.deleteAccount, t.deleteAccountConfirm, [
                  { text: t.cancel, style: 'cancel' },
                  {
                    text: t.delete,
                    style: 'destructive',
                    onPress: () =>
                      run(async () => {
                        await Cloud.deleteAccount();
                        setSignedIn(null);
                        updateSettings({ cloudEmail: undefined, lastBackup: undefined, cloudProvider: undefined });
                        Alert.alert(t.done);
                      }),
                  },
                ])
              }
            />
          </Group>
        </>
      ) : (
        <>
          <Text style={{ color: c.text2, fontSize: 15, textAlign: 'center', marginBottom: 16 }}>{t.signInSubtitle}</Text>
          <SocialSignIn
            onSignedIn={(mail, provider) => {
              setSignedIn(mail);
              updateSettings({ cloudEmail: mail, cloudProvider: provider });
            }}
          />
          <Text style={{ color: c.text3, textAlign: 'center', marginVertical: 18 }}>— {t.orEmail} —</Text>
          <Field placeholder={t.email} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Field placeholder={t.password} value={password} onChangeText={setPassword} secureTextEntry />
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            <Btn title={t.register} kind="gray" style={{ flex: 1 }} disabled={busy || !Cloud.isConfigured()} onPress={() => auth('up')} />
            <Btn title={t.login} style={{ flex: 1 }} disabled={busy || !Cloud.isConfigured()} onPress={() => auth('in')} />
          </View>
        </>
      )}
      <Group header={t.dataSection}>
        <ListRow icon="download" iconColor={c.gray} title={t.exportJson} onPress={() => run(async () => void (await exportJsonBackup(data)))} />
      </Group>
    </>
  );
}

function AboutPage() {
  const { t, c, replaceAll } = useStore();
  const items: { icon: IconName; color: string; label: string; done?: boolean }[] = [
    { icon: 'sparkles', color: c.orange, label: t.autoSchedule, done: true },
    { icon: 'business', color: c.gray, label: 'Multi factory mode', done: true },
    { icon: 'location', color: c.blue, label: t.roadmapItems[0] },
    { icon: 'scan', color: c.green, label: t.roadmapItems[1] },
    { icon: 'logo-google', color: c.red, label: t.roadmapItems[2] },
    { icon: 'document', color: c.indigo, label: t.roadmapItems[3] },
    { icon: 'bar-chart', color: c.purple, label: t.roadmapItems[4] },
  ];
  return (
    <>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Image source={require('../../assets/icon.png')} style={{ width: 96, height: 96, borderRadius: 22 }} />
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '700', marginTop: 12 }}>Shift Calendar</Text>
        <Text style={{ color: c.text2 }}>
          {t.version} 1.0.0
        </Text>
      </View>
      <Group header={t.roadmap}>
        {items.map((i) => (
          <ListRow key={i.label} icon={i.icon} iconColor={i.color} title={i.label} checked={i.done} />
        ))}
      </Group>
      <Group>
        <ListRow
          title={t.resetData}
          destructive
          chevron={false}
          onPress={() =>
            Alert.alert(t.resetData, t.resetConfirm, [
              { text: t.cancel, style: 'cancel' },
              { text: t.confirm, style: 'destructive', onPress: () => replaceAll(defaultData()) },
            ])
          }
        />
      </Group>
    </>
  );
}
