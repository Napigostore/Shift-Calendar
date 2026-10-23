import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { EmployeeBar } from '../components/EmployeeBar';
import { LeaveCard } from '../components/LeaveCard';
import { Rings } from '../components/Rings';
import { Card, Group, IconBtn, LargeTitle, ListRow, Screen, Segmented, Toggle } from '../components/ui';
import { maybeShowInterstitial } from '../services/ads';
import { exportExcel, ExportKind } from '../services/export';
import { exportIcs, exportPdf } from '../services/exportExtra';
import { computeMonth, computeYear, nextPayday } from '../stats';
import { useStore } from '../store';
import { formatDate, formatMoney } from '../utils';
import { Text } from '../components/AppText';
import { Icon } from '../components/Icon';

const OT_LIMIT = 40; // giờ OT tối đa / tháng (Bộ luật Lao động 2019)

export function StatsScreen() {
  const { data, t, c, requirePro, isPro } = useStore();
  const f = data.settings.features;
  const goal = data.settings.incomeGoal;
  const now = new Date();
  const [mode, setMode] = useState<'month' | 'year'>('month');
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth() + 1);
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const empId = data.activeEmployeeId;

  const ms = useMemo(() => computeMonth(data, empId, y, m), [data, empId, y, m]);
  const ys = useMemo(() => computeYear(data, empId, y), [data, empId, y]);
  const pay = nextPayday(data.settings.payday);

  const move = (delta: number) => {
    if (mode === 'year') return setY(y + delta);
    const d = new Date(y, m - 1 + delta, 1);
    setY(d.getFullYear());
    setM(d.getMonth() + 1);
  };

  const doExport = async (kind: ExportKind | 'pdf' | 'ics') => {
    if (!requirePro('export')) return;
    setBusy(true);
    try {
      const emps = all ? data.employees : data.employees.filter((e) => e.id === empId);
      const me = data.employees.find((e) => e.id === empId) ?? data.employees[0];
      const name =
        kind === 'pdf' ? await exportPdf(data, t, emps, y, m) : kind === 'ics' ? await exportIcs(data, me, y, m) : await exportExcel(data, t, kind, emps, y, m);
      maybeShowInterstitial();
      if (name) Alert.alert(t.exported, name);
    } catch (e) {
      Alert.alert(t.error, String(e));
    } finally {
      setBusy(false);
    }
  };

  const maxSalary = Math.max(1, ...ys.months.map((x) => x.total));
  const shiftTotal = Object.values(ms.byShift).reduce((a, b) => a + b, 0) || 1;

  return (
    <Screen>
      <LargeTitle
        eyebrow={mode === 'month' ? `${t.month} ${m}, ${y}` : `${t.year} ${y}`}
        title={t.tabStats}
        right={
          <>
            <IconBtn name="chevron-back" onPress={() => move(-1)} />
            <IconBtn name="chevron-forward" onPress={() => move(1)} />
          </>
        }
      />
      <Segmented
        style={{ marginBottom: 16 }}
        options={[
          { value: 'month', label: t.monthly },
          { value: 'year', label: t.yearly },
        ]}
        value={mode}
        onChange={(v) => (v === 'month' || requirePro('yearly')) && setMode(v)}
      />
      <EmployeeBar />

      {mode === 'month' ? (
        <>
          {/* Vòng tổng quan */}
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <Rings
              track={c.card}
              rings={[
                { value: ms.workDays / 26, color: c.accent },
                { value: ms.hours / 208, color: c.green },
                { value: ms.otHours / OT_LIMIT, color: c.orange },
              ]}
            />
            <View style={{ flex: 1, gap: 10 }}>
              <RingLegend color={c.accent} label={t.workDays} value={`${ms.workDays}/26`} />
              <RingLegend color={c.green} label={t.totalHours} value={`${Math.round(ms.hours)}/208h`} />
              <RingLegend color={c.orange} label={t.otLimit} value={`${ms.otHours}/${OT_LIMIT}h`} />
            </View>
          </Card>
          {ms.otHours > OT_LIMIT && (
            <View style={[styles.warn, { backgroundColor: c.red + '22' }]}>
              <Icon name="warning" size={18} color={c.red} />
              <Text style={{ color: c.red, flex: 1, fontSize: 14, fontWeight: '600' }}>{t.otWarning}</Text>
            </View>
          )}

          {/* Lương */}
          {f.salary && (
          <>
          <LinearGradient colors={['#30D158', '#0A9F6E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.salaryCard}>
            <Text style={styles.salaryLabel}>{t.totalSalary.toUpperCase()}</Text>
            <Text style={styles.salaryValue}>{formatMoney(ms.total)}</Text>
            {goal > 0 && isPro ? (
              <View style={{ marginTop: 10 }}>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
                  <View style={{ width: `${Math.min(100, (ms.total / goal) * 100)}%`, height: '100%', backgroundColor: '#fff' }} />
                </View>
                <Text style={[styles.salaryFoot, { marginTop: 6 }]}>
                  🎯 {ms.total >= goal ? t.goalReached : `${t.goalLeft} ${formatMoney(goal - ms.total)} · ${t.incomeGoalShort} ${formatMoney(goal)}`}
                </Text>
              </View>
            ) : null}
            {pay && (
              <Text style={styles.salaryFoot}>
                💰 {t.nextPayday}: {formatDate(pay.getFullYear(), pay.getMonth() + 1, pay.getDate(), data.settings.dateFormat)}
              </Text>
            )}
          </LinearGradient>

          <Group header={t.salary}>
            <ListRow icon="briefcase" iconColor={c.blue} title={t.shiftPay} value={formatMoney(ms.shiftPay)} />
            <ListRow icon="flash" iconColor={c.orange} title={t.otPay} value={formatMoney(ms.otPay)} />
            <ListRow icon="moon" iconColor={c.indigo} title={t.nightBonus} value={formatMoney(ms.nightBonus)} />
          </Group>
          </>
          )}

          <Group header={t.monthOverview}>
            <ListRow icon="checkmark-done" iconColor={c.accent} title={t.workDays} value={`${ms.workDays} ${t.days}`} />
            <ListRow icon="time" iconColor={c.green} title={t.totalHours} value={`${ms.hours} ${t.hours}`} />
            <ListRow icon="moon" iconColor={c.indigo} title={t.nightShifts} value={`${ms.nightShifts}`} />
            <ListRow icon="cafe" iconColor={c.gray} title={t.offDays} value={`${ms.offDays} ${t.days}`} />
            <ListRow icon="medkit" iconColor={c.teal} title={t.sickDays} value={`${ms.sickDays} ${t.days}`} />
            <ListRow icon="gift" iconColor={c.pink} title={t.holidayDays} value={`${ms.holidayDays} ${t.days}`} />
            <ListRow icon="airplane" iconColor={c.purple} title={t.kindLeave} value={`${ms.leaveDays} ${t.days}`} />
          </Group>

          {f.leave && <LeaveCard year={y} />}

          <Text style={[styles.groupHeader, { color: c.text2 }]}>{t.byShift.toUpperCase()}</Text>
          <Card>
            <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 14, backgroundColor: c.fill }}>
              {data.shiftTypes.map((s) => (
                <View key={s.id} style={{ flex: ms.byShift[s.id] ?? 0, backgroundColor: s.color }} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 }}>
              {data.shiftTypes.map((s) => (
                <View key={s.id} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
                  <Text style={{ color: c.text, fontSize: 14, flex: 1 }} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={{ color: c.text2, fontSize: 14, marginRight: 12 }}>
                    {ms.byShift[s.id] ?? 0} · {Math.round(((ms.byShift[s.id] ?? 0) / shiftTotal) * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </>
      ) : (
        <>
          <LinearGradient colors={['#30D158', '#0A9F6E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.salaryCard}>
            <Text style={styles.salaryLabel}>
              {t.totalSalary.toUpperCase()} {y}
            </Text>
            <Text style={styles.salaryValue}>{formatMoney(ys.total)}</Text>
            <Text style={styles.salaryFoot}>
              {ys.workDays} {t.days} · {Math.round(ys.hours)} {t.hours} · OT {ys.otHours}
              {t.hours}
            </Text>
          </LinearGradient>

          <Text style={[styles.groupHeader, { color: c.text2 }]}>{t.performance.toUpperCase()}</Text>
          <Card>
            <View style={styles.chart}>
              {ys.months.map((mm, i) => {
                const cur = i + 1 === m;
                return (
                  <Pressable
                    key={i}
                    style={styles.barCol}
                    onPress={() => {
                      setM(i + 1);
                      setMode('month');
                    }}
                  >
                    <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
                      <View style={[styles.bar, { height: `${Math.max(2, (mm.total / maxSalary) * 100)}%`, backgroundColor: cur ? c.green : c.green + '66' }]} />
                    </View>
                    <Text style={{ color: cur ? c.text : c.text2, fontSize: 11, fontWeight: cur ? '700' : '500', marginTop: 6 }}>{i + 1}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
          <Group>
            {ys.months.map((mm, i) => (
              <ListRow key={i} title={`${t.month} ${i + 1}`} subtitle={`${mm.workDays} ${t.days} · OT ${mm.otHours}${t.hours}`} value={formatMoney(mm.total)} />
            ))}
          </Group>
        </>
      )}

      <Group header={`${t.dataSection}${isPro ? '' : ' · PRO'}`} footer={all ? `${data.employees.length} ${t.employees.toLowerCase()}` : undefined}>
        <ListRow icon="people" iconColor={c.indigo} title={t.exportAll} right={<Toggle value={all} onChange={setAll} />} />
        <ListRow icon="cash" iconColor={c.green} title={t.exportExcel} onPress={() => !busy && doExport('salary')} />
        <ListRow icon="list" iconColor={c.blue} title={t.exportTimesheet} onPress={() => !busy && doExport('timesheet')} />
        <ListRow icon="document-text" iconColor={c.orange} title={t.exportReport} onPress={() => !busy && doExport('report')} />
        <ListRow icon="document" iconColor={c.red} title={t.exportPdf} onPress={() => !busy && doExport('pdf')} />
        <ListRow icon="calendar" iconColor={c.indigo} title={t.exportIcs} onPress={() => !busy && doExport('ics')} />
      </Group>
    </Screen>
  );
}

function RingLegend({ color, label, value }: { color: string; label: string; value: string }) {
  const { c } = useStore();
  return (
    <View>
      <Text style={{ color: c.text2, fontSize: 12 }} numberOfLines={1}>
        {label}
      </Text>
      <Text style={{ color, fontSize: 20, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  warn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginTop: -6, marginBottom: 16 },
  salaryCard: { borderRadius: 18, padding: 18, marginBottom: 24 },
  salaryLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  salaryValue: { color: '#fff', fontSize: 36, fontWeight: '700', marginTop: 4 },
  salaryFoot: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 6 },
  groupHeader: { fontSize: 13, marginLeft: 16, marginBottom: 7 },
  chart: { flexDirection: 'row', height: 170, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', height: '100%' },
  bar: { width: '62%', borderRadius: 5, minHeight: 3 },
});
