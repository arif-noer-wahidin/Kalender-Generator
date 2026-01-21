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

// Simplified fixed holidays for Indonesia
// NOTE: Accurate religious holidays (Eid, Nyepi, Vesak, Easter) require 
// complex astronomical calculations or an external API which is beyond this static demo scope.
const getHoliday = (date: Date): string | undefined => {
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  const holidays: Record<string, string> = {
    "0-1": "Tahun Baru Masehi",
    "4-1": "Hari Buruh Internasional",
    "5-1": "Hari Lahir Pancasila",
    "7-17": "Hari Kemerdekaan RI",
    "11-25": "Hari Raya Natal"
  };

  const key = `${month}-${day}`;
  return holidays[key];
};

export const generateCalendarGrid = (year: number, month: number): DayData[] => {
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  
  const days: DayData[] = [];
  const today = new Date();
  
  // Previous month padding
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthDays - i);
    days.push(createDayData(d, false, today));
  }
  
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push(createDayData(d, true, today));
  }
  
  // Next month padding
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i);
    days.push(createDayData(d, false, today));
  }
  
  return days;
};

// Helper to keep code DRY
const createDayData = (d: Date, isCurrentMonth: boolean, today: Date): DayData => {
  return {
    date: d,
    isCurrentMonth,
    isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(),
    dayOfMonth: d.getDate(),
    hijriDate: getHijriDate(d),
    javaneseDate: getJavanesePasaran(d),
    chineseDate: getChineseDate(d),
    holiday: getHoliday(d),
    isWeekend: d.getDay() === 0 || d.getDay() === 6
  };
};