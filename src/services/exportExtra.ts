// Xuất lịch ca (.ics) và báo cáo PDF.
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Dict } from '../i18n';
import { computeMonth } from '../stats';
import { AppData, Employee } from '../types';
import { dateKey, daysInMonth, formatDate, formatMoney, pad } from '../utils';

async function shareText(name: string, content: string, mimeType: string) {
  if (Platform.OS === 'web') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mimeType }));
    a.download = name;
    a.click();
    return name;
  }
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
  return name;
}

const icsDate = (y: number, m: number, d: number, hhmm?: string) => `${y}${pad(m)}${pad(d)}${hhmm ? 'T' + hhmm.replace(':', '') + '00' : ''}`;
const icsEscape = (s: string) => s.replace(/[\\,;]/g, (ch) => '\\' + ch).replace(/\n/g, '\\n');

/** Xuất lịch ca ra .ics để nhập vào Google Calendar / Apple Calendar / Outlook. */
export async function exportIcs(data: AppData, employee: Employee, y: number, m: number, months = 3) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Shift Calendar//VI', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:Shift Calendar - ${icsEscape(employee.name)}`];
  const sched = data.schedule[employee.id] ?? {};
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  for (let i = 0; i < months; i++) {
    const first = new Date(y, m - 1 + i, 1);
    const yy = first.getFullYear();
    const mm = first.getMonth() + 1;
    for (let d = 1; d <= daysInMonth(yy, mm); d++) {
      const key = dateKey(yy, mm, d);
      for (const id of sched[key]?.shifts ?? []) {
        const s = data.shiftTypes.find((x) => x.id === id);
        if (!s) continue;
        lines.push('BEGIN:VEVENT', `UID:${key}-${s.id}-${employee.id}@shiftcalendar`, `DTSTAMP:${stamp}`, `SUMMARY:${icsEscape(s.name)}`);
        if (s.hours > 0) {
          const end = new Date(yy, mm - 1, d + (s.end <= s.start ? 1 : 0)); // ca qua đêm kết thúc ngày hôm sau
          lines.push(`DTSTART:${icsDate(yy, mm, d, s.start)}`, `DTEND:${icsDate(end.getFullYear(), end.getMonth() + 1, end.getDate(), s.end)}`);
          if (s.alarmEnabled) {
            const [sh, sm] = s.start.split(':').map(Number);
            const [ah, am] = s.alarmTime.split(':').map(Number);
            let before = sh * 60 + sm - (ah * 60 + am);
            if (before < 0) before += 24 * 60;
            lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(s.name)}`, `TRIGGER:-PT${before}M`, 'END:VALARM');
          }
        } else {
          const next = new Date(yy, mm - 1, d + 1);
          lines.push(`DTSTART;VALUE=DATE:${icsDate(yy, mm, d)}`, `DTEND;VALUE=DATE:${icsDate(next.getFullYear(), next.getMonth() + 1, next.getDate())}`);
        }
        if (s.note) lines.push(`DESCRIPTION:${icsEscape(s.note)}`);
        lines.push('END:VEVENT');
      }
    }
  }
  lines.push('END:VCALENDAR');
  return shareText(`ShiftCalendar_${y}-${pad(m)}.ics`, lines.join('\r\n'), 'text/calendar');
}

const esc = (s: string) => s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch] ?? ch);

/** Báo cáo tháng dạng PDF (bảng công + tổng hợp lương) cho từng nhân viên. */
export async function exportPdf(data: AppData, t: Dict, employees: Employee[], y: number, m: number) {
  const pages = employees.map((e) => {
    const st = computeMonth(data, e.id, y, m);
    const rows = st.rows
      .map(
        (r) =>
          `<tr class="${r.weekday === 0 || r.weekday === 6 ? 'we' : ''}"><td>${formatDate(y, m, r.day, data.settings.dateFormat)}</td><td>${t.weekdaysShort[r.weekday]}</td>` +
          `<td>${r.shifts.map((s) => `<span class="pill" style="background:${s.color}">${esc(s.name)}</span>`).join(' ')}</td>` +
          `<td class="n">${r.hours || ''}</td><td class="n">${r.otHours || ''}</td><td class="n">${r.total ? formatMoney(r.total) : ''}</td><td>${esc(r.note)}</td></tr>`,
      )
      .join('');
    return `<section><h1>${esc(e.name)} <small>${t.month} ${m}/${y}</small></h1>
      <div class="kpis">
        <div><b>${st.workDays}</b><span>${t.workDays}</span></div>
        <div><b>${st.hours}</b><span>${t.totalHours}</span></div>
        <div><b>${st.otHours}</b><span>${t.totalOT}</span></div>
        <div><b>${st.nightShifts}</b><span>${t.nightShifts}</span></div>
        <div class="money"><b>${formatMoney(st.total)}</b><span>${t.totalSalary}</span></div>
      </div>
      <table><thead><tr><th>${t.day}</th><th>${t.weekday}</th><th>${t.selectShift}</th><th>${t.hours}</th><th>OT</th><th>${t.salary}</th><th>${t.note}</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  });
  const html = `<html><head><meta charset="utf-8"/><style>
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#111;padding:24px}
    section{page-break-after:always}h1{font-size:22px;margin:0 0 12px}h1 small{color:#888;font-weight:500;font-size:15px}
    .kpis{display:flex;gap:10px;margin-bottom:14px}.kpis div{flex:1;background:#F2F2F7;border-radius:10px;padding:10px}
    .kpis b{display:block;font-size:20px}.kpis span{font-size:11px;color:#666}.money b{color:#1E9E50}
    table{width:100%;border-collapse:collapse;font-size:11px}th{text-align:left;background:#111;color:#fff;padding:6px}
    td{padding:5px 6px;border-bottom:1px solid #eee}.n{text-align:right}.we td{background:#FFF7EC}
    .pill{color:#fff;border-radius:4px;padding:1px 6px;font-weight:600}</style></head><body>${pages.join('')}</body></html>`;
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return 'PDF';
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  return `ShiftCalendar_${y}-${pad(m)}.pdf`;
}
