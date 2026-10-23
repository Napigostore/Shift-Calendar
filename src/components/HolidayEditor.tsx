import React, { useState } from 'react';

import { useStore } from '../store';
import { CustomHoliday } from '../types';
import { StickerPicker } from './StickerPicker';
import { Group, InlineInput, ListRow, Sheet, Stepper, Toggle } from './ui';
import { Text } from './AppText';

export function HolidayEditor({ holiday, onClose }: { holiday: CustomHoliday | 'new' | null; onClose: () => void }) {
  if (!holiday) return null;
  return <HolidayForm key={holiday === 'new' ? 'new' : holiday.id} holiday={holiday} onClose={onClose} />;
}

function HolidayForm({ holiday, onClose }: { holiday: CustomHoliday | 'new'; onClose: () => void }) {
  const { t, c, saveHoliday } = useStore();
  const [h, setH] = useState<Omit<CustomHoliday, 'id'> & { id?: string }>(() =>
    holiday === 'new' ? { name: '', day: 1, month: 1, lunar: false, off: true, icon: '🎉' } : { ...holiday },
  );

  return (
    <Sheet
      onClose={onClose}
      title={t.addHoliday}
      doneDisabled={!h.name.trim()}
      onDone={() => {
        saveHoliday({ ...h, name: h.name.trim() });
        onClose();
      }}
    >
      <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}>{h.icon || '🎉'}</Text>
      <Group>
        <InlineInput label={t.holidayName} value={h.name} onChangeText={(v) => setH({ ...h, name: v })} placeholder="…" />
      </Group>
      <Group>
        <ListRow icon="calendar" iconColor={c.red} title={t.day} right={<Stepper value={h.day} onChange={(v) => setH({ ...h, day: v })} min={1} max={h.lunar ? 30 : 31} />} />
        <ListRow icon="calendar-outline" iconColor={c.orange} title={t.month} right={<Stepper value={h.month} onChange={(v) => setH({ ...h, month: v })} min={1} max={12} />} />
        <ListRow icon="moon" iconColor={c.indigo} title={t.isLunar} right={<Toggle value={h.lunar} onChange={(v) => setH({ ...h, lunar: v })} />} />
        <ListRow icon="bed" iconColor={c.green} title={t.isOffDay} right={<Toggle value={h.off} onChange={(v) => setH({ ...h, off: v })} />} />
      </Group>
      <Text style={{ color: c.text2, fontSize: 13, marginLeft: 16, marginBottom: 7 }}>{t.icon.toUpperCase()}</Text>
      <StickerPicker max={1} value={h.icon ? [h.icon] : []} onChange={(v) => setH({ ...h, icon: v[0] })} />
    </Sheet>
  );
}
