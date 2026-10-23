import React from 'react';
import { ScrollView, View } from 'react-native';
import { useStore } from '../store';
import { Chip } from './ui';

/** Bộ lọc nhân viên dạng chip ngang. Ẩn khi chỉ có 1 người. */
export function EmployeeBar() {
  const { data, setActiveEmployee } = useStore();
  if (data.employees.length < 2) return null;
  return (
    <View style={{ marginBottom: 14, marginHorizontal: -16 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {data.employees.map((e) => (
          <Chip key={e.id} icon="person" label={e.name} active={e.id === data.activeEmployeeId} onPress={() => setActiveEmployee(e.id)} />
        ))}
      </ScrollView>
    </View>
  );
}
