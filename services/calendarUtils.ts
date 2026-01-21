import { DayData } from '../types';

// Pasaran Jawa: Legi, Pahing, Pon, Wage, Kliwon
const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
// Reference: 1 Jan 2024 was Monday, Pahing
const REF_DATE = new Date(2024, 0, 1);
const REF_PASARAN_INDEX = 1; // Pahing

export const getJavanesePasaran = (date: Date): string => {
  // Normalize to start of day UTC to avoid timezone issues with day difference
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const ref = new Date(Date.UTC(REF_DATE.getFullYear(), REF_DATE.getMonth(), REF_DATE.getDate()));
  
  const diffTime = d.getTime() - ref.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Modulo in JS can return negative for negative numbers, handle that
  let index = (REF_PASARAN_INDEX + diffDays) % 5;
  if (index < 0) index += 5;
  
  return PASARAN[index];
};

export const getHijriDate = (date: Date): string => {
  try {
    return new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
    }).format(date);
  } catch (e) {
    return '';
  }
};

export const getChineseDate = (date: Date): string => {
  try {
    return new Intl.DateTimeFormat('id-ID-u-ca-chinese', {
      day: 'numeric',
      month: 'numeric',
    }).format(date);
  } catch (e) {
    return '';
  }
};

// Simplified fixed holidays for Indonesia (Demo purposes - accurate calculation requires complex libraries)
const getHoliday = (date: Date): string | undefined => {
  const month = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();

  // Fixed Dates
  if (month === 0 && day === 1) return "Tahun Baru Masehi";
  if (month === 4 && day === 1) return "Hari Buruh";
  if (month === 5 && day === 1) return "Hari Lahir Pancasila";
  if (month === 7 && day === 17) return "HUT RI";
  if (month === 11 && day === 25) return "Hari Natal";

  // Note: Movable holidays (Eid, Vesak, Nyepi, Easter) require complex calc or API.
  // We will leave them blank or handle basic logic if needed, but for this demo, we focus on the structure.
  
  return undefined;
};

export const generateCalendarGrid = (year: number, month: number): DayData[] => {
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  
  const days: DayData[] = [];
  
  // Previous month padding
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthDays - i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: false,
      dayOfMonth: d.getDate(),
      hijriDate: getHijriDate(d),
      javaneseDate: getJavanesePasaran(d),
      chineseDate: getChineseDate(d),
      holiday: getHoliday(d),
      isWeekend: d.getDay() === 0 || d.getDay() === 6
    });
  }
  
  // Current month
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(),
      dayOfMonth: i,
      hijriDate: getHijriDate(d),
      javaneseDate: getJavanesePasaran(d),
      chineseDate: getChineseDate(d),
      holiday: getHoliday(d),
      isWeekend: d.getDay() === 0 || d.getDay() === 6
    });
  }
  
  // Next month padding to complete 42 cells (6 rows) or just 35 (5 rows)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: false,
      dayOfMonth: i,
      hijriDate: getHijriDate(d),
      javaneseDate: getJavanesePasaran(d),
      chineseDate: getChineseDate(d),
      holiday: getHoliday(d),
      isWeekend: d.getDay() === 0 || d.getDay() === 6
    });
  }
  
  return days;
};
