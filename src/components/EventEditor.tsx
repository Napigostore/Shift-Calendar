import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useStore } from '../store';
import { CountdownEvent } from '../types';
import { keyOf, parseKey } from '../utils';
import { DatePicker } from './DatePicker';
import { StickerPicker } from './StickerPicker';
import { Btn, Group, InlineInput, ListRow, Sheet, Toggle } from './ui';
import { Text } from './AppText';

export function EventEditor({ event, onClose }: { event: CountdownEvent | 'new' | null; onClose: () => void }) {
  if (!event) return null;
  return <EventForm key={event === 'new' ? 'new' : event.id} event={event} onClose={onClose} />;
}

function EventForm({ event, onClose }: { event: CountdownEvent | 'new'; onClose: () => void }) {
  const { t, c, saveEvent, deleteEvent } = useStore();
  const [e, setE] = useState<Omit<CountdownEvent, 'id'> & { id?: string }>(() => {
    if (event !== 'new') return { ...event };
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return { name: '', icon: '🏖️', date: keyOf(d) };
  });
  const multi = e.endDate !== undefined;
  const nights = multi && e.endDate ? daysDiff(e.date, e.endDate) + 1 : 1;

  return (
    <Sheet
      onClose={onClose}
      title={event === 'new' ? t.addEvent : t.editEvent}
      doneDisabled={!e.name.trim()}
      onDone={() => {
        saveEvent({ ...e, name: e.name.trim(), endDate: multi && e.endDate !== e.date ? e.endDate : undefined });
        onClose();
      }}
      footer={
        event !== 'new' ? (
          <Btn
            title={t.delete}
            kind="destructive"
            icon="trash-outline"
            style={{ flex: 1 }}
            onPress={() =>
              Alert.alert(t.delete, e.name, [
                { text: t.cancel, style: 'cancel' },
                {
                  text: t.delete,
                  style: 'destructive',
                  onPress: () => {
                    deleteEvent(event.id);
                    onClose();
                  },
                },
              ])
            }
          />
        ) : undefined
      }
    >
      <Text style={{ fontSize: 60, textAlign: 'center', marginBottom: 14 }}>{e.icon}</Text>
      <Group>
        <InlineInput label={t.eventName} value={e.name} onChangeText={(v) => setE({ ...e, name: v })} placeholder="Đà Lạt, Phú Quốc…" />
        <ListRow
          icon="calendar"
          iconColor={c.teal}
          title={t.multiDay}
          subtitle={multi ? `${nights} ${t.days}` : undefined}
          right={<Toggle value={multi} onChange={(v) => setE({ ...e, endDate: v ? e.date : undefined })} />}
        />
      </Group>
      <Text style={{ color: c.text2, fontSize: 13, marginLeft: 16, marginBottom: 7 }}>
        {(multi ? `${t.fromDate} – ${t.toDate}` : t.day).toUpperCase()}
      </Text>
      <DatePicker value={e.date} end={multi ? e.endDate : undefined} onChange={(start, end) => setE({ ...e, date: start, endDate: multi ? end : undefined })} />
      <Text style={{ color: c.text2, fontSize: 13, marginLeft: 16, marginBottom: 7 }}>{t.icon.toUpperCase()}</Text>
      <StickerPicker max={1} value={[e.icon]} onChange={(v) => setE({ ...e, icon: v[0] ?? e.icon })} />
    </Sheet>
  );
}

function daysDiff(a: string, b: string) {
  const [y1, m1, d1] = parseKey(a);
  const [y2, m2, d2] = parseKey(b);
  return Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000);
}
