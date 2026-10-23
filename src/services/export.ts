import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import { Dict } from '../i18n';
import { computeMonth } from '../stats';
import { AppData, Employee } from '../types';
import { formatDate, pad } from '../utils';

export type ExportKind = 'salary' | 'timesheet' | 'report';

function sheetName(s: string) {
  return s.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Sheet';
}

function timesheetRows(data: AppData, t: Dict, emp: Employee, y: number, m: number) {
  const st = computeMonth(data, emp.id, y, m);
  return st.rows.map((r) => ({
    [t.day]: formatDate(y, m, r.day, data.settings.dateFormat),
    [t.weekday]: t.weekdaysShort[r.weekday],
    [t.selectShift]: r.shifts.map((s) => s.name).join(' + '),
    [t.workHours]: r.hours,
    [t.otHours]: r.otHours,
    [t.shiftPay]: r.shiftPay,
    [t.otPay]: r.otPay,
    [t.nightBonus]: r.nightBonus,
    [t.salary]: r.total,
    [t.note]: r.note,
  }));
}

function summaryRow(data: AppData, t: Dict, emp: Employee, y: number, m: number) {
  const s = computeMonth(data, emp.id, y, m);
  return {
    [t.employeeName]: emp.name,
    [t.role]: emp.role ?? '',
    [t.factory]: emp.factory ?? '',
    [t.workDays]: s.workDays,
    [t.totalHours]: s.hours,
    [t.totalOT]: s.otHours,
    [t.nightShifts]: s.nightShifts,
    [t.offDays]: s.offDays,
    [t.sickDays]: s.sickDays,
    [t.holidayDays]: s.holidayDays,
    [t.shiftPay]: s.shiftPay,
    [t.otPay]: s.otPay,
    [t.nightBonus]: s.nightBonus,
    [t.totalSalary]: s.total,
  };
}

export function buildWorkbook(data: AppData, t: Dict, kind: ExportKind, employees: Employee[], y: number, m: number) {
  const wb = XLSX.utils.book_new();
  if (kind === 'salary' || kind === 'report') {
    const rows = employees.map((e) => summaryRow(data, t, e, y, m));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0] ?? {}).map(() => ({ wch: 14 }));
    XLSX.utils.book_append_sheet(wb, ws, sheetName(`${t.salary} ${pad(m)}-${y}`));
  }
  if (kind === 'timesheet' || kind === 'report') {
    for (const e of employees) {
      const ws = XLSX.utils.json_to_sheet(timesheetRows(data, t, e, y, m));
      ws['!cols'] = [{ wch: 12 }, { wch: 6 }, { wch: 22 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(wb, ws, sheetName(e.name));
    }
  }
  if (kind === 'report') {
    const legend = data.shiftTypes.map((s) => ({
      [t.shiftName]: s.name,
      [t.startTime]: s.start,
      [t.endTime]: s.end,
      [t.workHours]: s.hours,
      [t.payPerShift]: s.pay,
      [t.otPayHour]: s.otPay,
      [t.note]: s.note,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(legend), sheetName(t.shiftSetting));
  }
  return wb;
}

/** Tạo file .xlsx và mở hộp thoại chia sẻ (Zalo, Gmail, Drive...). */
export async function exportExcel(data: AppData, t: Dict, kind: ExportKind, employees: Employee[], y: number, m: number) {
  const wb = buildWorkbook(data, t, kind, employees, y, m);
  const name = `ShiftCalendar_${kind}_${y}-${pad(m)}.xlsx`;
  if (Platform.OS === 'web') {
    XLSX.writeFile(wb, name);
    return name;
  }
  const bytes: Uint8Array = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(new Uint8Array(bytes));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: name,
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
  }
  return name;
}

export async function exportJsonBackup(data: AppData) {
  const name = `ShiftCalendar_backup_${new Date().toISOString().slice(0, 10)}.json`;
  if (Platform.OS === 'web') return name;
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(data));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: name });
  }
  return name;
}
