export interface CalendarConfig {
  bgColor: string;
  // Map month index (0-11) to image string. Key 'default' for fallback.
  bgImages: Record<string, string | null>; 
  textColor: string;
  titleColor: string; // New property for title specific color
  fontFamily: 'sans' | 'serif' | 'mono';
  layout: 'classic' | 'elegant' | 'poster' | 'planner' | 'wall' | 'side' | 'minimal' | 'fullyear';
  orientation: 'portrait' | 'landscape';
  overlayOpacity: number; // 0 to 1
  overlayColor: 'black' | 'white';
  showHijri: boolean;
  showJavanese: boolean;
  showChinese: boolean;
  showHolidays: boolean;
  titleText: string;
  imagePosition: 'top' | 'center' | 'bottom';
  imageFit: 'cover' | 'contain';
  // New customizations
  borderRadius: number; // 0 to 24px
  gridGap: number; // 0 to 8px
  shadowIntensity: number; // 0 to 1 opacity scale
  fontScale: number; // 0.5 to 1.5 multiplier
}

export interface DayData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfMonth: number;
  hijriDate: string;
  javaneseDate: string;
  chineseDate: string;
  holiday?: string;
  isWeekend: boolean;
}

export enum CalendarType {
  MASEHI = 'Masehi',
  HIJRI = 'Hijriah',
  JAWA = 'Jawa',
  CINA = 'Cina'
}