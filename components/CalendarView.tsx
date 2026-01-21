import React, { useEffect, useRef, useState } from 'react';
import { CalendarConfig, DayData } from '../types';
import { ChevronLeft, ChevronRight, Quote, CalendarDays, ListTodo } from 'lucide-react';
import { generateCalendarGrid } from '../services/calendarUtils';

interface CalendarViewProps {
  year: number;
  month: number;
  days: DayData[];
  config: CalendarConfig;
  quote: string;
  onMonthChange: (delta: number) => void;
  isExporting?: boolean;
  defaultBgUrl?: string;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const WEEKDAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const WEEKDAYS_SHORT = ["Mg", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"];

// Constants for A4 dimensions in pixels (approx 96 DPI)
// 210mm = ~794px, 297mm = ~1123px
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

interface MiniCalendarProps {
  monthIndex: number;
  year: number;
  config: CalendarConfig;
  isExporting: boolean;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ monthIndex, year, config, isExporting }) => {
  const miniDays = generateCalendarGrid(year, monthIndex);
  const effectiveTitleColor = config.titleColor || config.textColor;
  const showExtras = config.showHijri || config.showJavanese || config.showChinese;
  const scale = config.fontScale || 1;

  return (
      <div className="flex flex-col h-full w-full overflow-hidden">
          <h3 
            className="font-extrabold uppercase tracking-tight mb-1 border-b border-black/10 leading-tight pb-0.5" 
            style={{ color: effectiveTitleColor, fontSize: `${0.7 * scale}rem` }}
          >
            {MONTH_NAMES[monthIndex]}
          </h3>
          <div className="grid grid-cols-7 mb-0.5 border-b border-black/5" style={{ gap: `${config.gridGap}px` }}>
              {WEEKDAYS_SHORT.map((d, i) => (
                  <div 
                    key={i} 
                    className={`font-bold text-center py-0.5 leading-none ${i===0 ? 'text-red-600' : 'opacity-80'}`} 
                    style={{ color: i !== 0 ? config.textColor : undefined, fontSize: `${0.5 * scale}rem` }}
                  >
                    {d}
                  </div>
              ))}
          </div>
          <div 
             className="grid grid-cols-7 auto-rows-fr flex-1 content-start mt-0.5"
             style={{ gap: `${config.gridGap}px` }}
          >
              {miniDays.map((d, i) => {
                  const isHoliday = d.holiday !== undefined;
                  const isSunday = d.isWeekend && d.date.getDay() === 0;
                  const isRedDate = isHoliday || isSunday;
                  const holidayBg = isHoliday ? 'bg-red-50' : '';
                  const todayBg = (d.isToday && !isExporting) ? 'bg-indigo-50 ring-1 ring-indigo-200' : '';
                  
                  if (!d.isCurrentMonth) return <div key={i} className=""></div>;

                  return (
                    <div 
                        key={i} 
                        className={`relative flex flex-col items-center justify-start py-0 px-[1px] ${holidayBg} ${todayBg}`}
                        style={{ borderRadius: `${config.borderRadius}px` }}
                        title={d.holiday}
                    >
                        <span 
                            className={`font-bold leading-none block mt-[1px] ${isRedDate ? 'text-red-600' : ''}`}
                            style={{ color: (!isRedDate) ? config.textColor : undefined, fontSize: `${0.7 * scale}rem` }}
                        >
                            {d.dayOfMonth}
                        </span>
                        {showExtras && (
                            <div className="flex flex-col items-center space-y-0 w-full mt-[1px] leading-none">
                                {config.showHijri && (
                                    <span className="leading-none text-emerald-700 opacity-90 font-bold scale-100 origin-top" style={{ fontSize: `${0.45 * scale}rem` }}>
                                        {d.hijriDate.split(' ')[0]}
                                    </span>
                                )}
                                {config.showJavanese && (
                                    <span className="leading-none text-amber-700 opacity-90 font-bold tracking-tighter scale-100 origin-top" style={{ fontSize: `${0.45 * scale}rem` }}>
                                        {d.javaneseDate}
                                    </span>
                                )}
                                {config.showChinese && (
                                    <span className="leading-none text-rose-700 opacity-90 font-bold scale-100 origin-top" style={{ fontSize: `${0.45 * scale}rem` }}>
                                        {d.chineseDate.split('/')[0]}
                                    </span>
                                )}
                            </div>
                        )}
                        {isHoliday && <div className="absolute top-0 right-0 w-1 h-1 bg-red-500 rounded-full m-[1px]"></div>}
                    </div>
                  );
              })}
          </div>
      </div>
  );
};

const CalendarView: React.FC<CalendarViewProps> = ({ year, month, days, config, quote, onMonthChange, isExporting = false, defaultBgUrl }) => {
  // -- Scaling Logic --
  const containerRef = useRef<HTMLDivElement>(null);
  // FIX: Use useRef correctly. useRef returns a single object { current: ... }, not an array.
  const viewScaleRef = useRef<{scale: number, x: number, y: number}>({ scale: 1, x: 0, y: 0 });
  const [forceUpdate, setForceUpdate] = useState(0); // Trigger re-render to apply scale

  useEffect(() => {
    if (isExporting || !containerRef.current) return;

    const calculateScale = () => {
      if (!containerRef.current) return;
      
      const parentWidth = containerRef.current.clientWidth;
      const parentHeight = containerRef.current.clientHeight;
      const padding = 20; // Padding around the preview

      const availableWidth = parentWidth - (padding * 2);
      const availableHeight = parentHeight - (padding * 2);

      // Determine dimensions based on orientation
      const targetWidth = config.orientation === 'portrait' ? A4_WIDTH_PX : A4_HEIGHT_PX;
      const targetHeight = config.orientation === 'portrait' ? A4_HEIGHT_PX : A4_WIDTH_PX;

      // Calculate scale to Fit Contain
      const scaleX = availableWidth / targetWidth;
      const scaleY = availableHeight / targetHeight;
      const scale = Math.min(scaleX, scaleY); // Fit entirely visible

      // Safety check
      const finalScale = scale > 0 ? scale : 0.1;

      viewScaleRef.current = { scale: finalScale, x: 0, y: 0 };
      setForceUpdate(prev => prev + 1);
    };

    const observer = new ResizeObserver(calculateScale);
    observer.observe(containerRef.current);
    calculateScale(); // Initial call

    return () => observer.disconnect();
  }, [config.orientation, isExporting]);

  // -- Dynamic Styles & Logic --
  const containerFont = config.fontFamily === 'serif' ? '"Playfair Display", serif' : config.fontFamily === 'mono' ? '"Roboto Mono", monospace' : '"Inter", sans-serif';
  const bgImage = config.bgImages[month] || config.bgImages['default'] || null;
  const isDefaultBg = defaultBgUrl && bgImage === defaultBgUrl;

  const isPoster = config.layout === 'poster';
  const isElegant = config.layout === 'elegant';
  const isPlanner = config.layout === 'planner';
  const isClassic = config.layout === 'classic';
  const isWall = config.layout === 'wall';
  const isSide = config.layout === 'side';
  const isMinimal = config.layout === 'minimal';
  const isFullYear = config.layout === 'fullyear';

  const gridOnSolidBg = isWall || isSide || isMinimal || isFullYear; 
  const effectiveTextColor = gridOnSolidBg ? config.textColor : config.textColor; 
  const effectiveTitleColor = config.titleColor ? config.titleColor : effectiveTextColor;
  const effectiveOverlayColor = config.overlayColor;
  const overlayOpacity = config.overlayOpacity;
  const scale = config.fontScale || 1;

  const bgPositionMap: Record<string, string> = {
    'top': 'center top',
    'center': 'center center',
    'bottom': 'center bottom'
  };
  const bgPos = bgPositionMap[config.imagePosition] || 'center center';
  const bgSize = config.imageFit || 'cover';

  const shadowStyle = config.shadowIntensity > 0 ? `drop-shadow-[0_4px_6px_rgba(0,0,0,${config.shadowIntensity})]` : '';
  const boxShadowStyle = config.shadowIntensity > 0 ? `shadow-[0_4px_12px_rgba(0,0,0,${config.shadowIntensity * 0.5})]` : '';
  
  const isTextOverImage = !gridOnSolidBg && (effectiveTextColor === '#ffffff' || effectiveTextColor === 'white' || effectiveTextColor === '#fff');
  const textShadowClass = isTextOverImage ? 'drop-shadow-md' : '';

  const imageBgStyle: React.CSSProperties = {
    backgroundColor: config.bgColor,
    backgroundImage: bgImage ? `url(${bgImage})` : 'none',
    backgroundSize: bgSize,
    backgroundPosition: bgPos,
    backgroundRepeat: 'no-repeat',
  };

  const overlayStyle: React.CSSProperties = {
    backgroundColor: effectiveOverlayColor,
    opacity: overlayOpacity,
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    pointerEvents: 'none',
    borderRadius: isElegant ? config.borderRadius : 0
  };

  // Watermark Component
  const Watermark = () => {
    if (!isDefaultBg) return null;
    return (
        <div 
            className="absolute bottom-4 right-4 z-20 pointer-events-none"
            style={{ 
                textShadow: '0 1px 2px rgba(0,0,0,0.6)', 
                color: 'rgba(255,255,255,0.8)',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.05em'
            }}
        >
            Miko Layno
        </div>
    );
  };

  const Header = ({ customColor, hideNav }: { customColor?: string, hideNav?: boolean }) => (
    <div className={`flex justify-between items-end mb-4 relative z-20 ${textShadowClass}`}>
      <div>
        <div className="flex items-center gap-2">
            {!hideNav && !isExporting && (
                <button onClick={() => onMonthChange(-1)} className={`p-1 rounded-full hover:bg-black/10 transition-colors print:hidden ${customColor ? '' : 'text-current'}`}>
                <ChevronLeft className="w-5 h-5" color={customColor} />
                </button>
            )}
            <div>
              <h2 className={`font-bold leading-none uppercase tracking-tight ${isPoster || isMinimal ? 'text-5xl' : 'text-4xl'}`} style={{ color: customColor }}>
                {MONTH_NAMES[month]}
              </h2>
              <div className={`text-xl font-light tracking-[0.2em] opacity-80 mt-1`} style={{ color: customColor }}>{year}</div>
            </div>
            {!hideNav && !isExporting && (
                <button onClick={() => onMonthChange(1)} className={`p-1 rounded-full hover:bg-black/10 transition-colors print:hidden ${customColor ? '' : 'text-current'}`}>
                <ChevronRight className="w-5 h-5" color={customColor} />
                </button>
            )}
        </div>
        {(!isPoster && !isMinimal) && (
          <div className={`mt-3 flex gap-2 items-start max-w-sm opacity-70`} style={{ color: customColor }}>
              <Quote className="w-3 h-3 mt-0.5 shrink-0" />
              <p className="text-xs italic font-medium leading-relaxed">{quote}</p>
          </div>
        )}
      </div>
      {(!isPoster && !isMinimal) && (
        <div className="text-right" style={{ color: customColor || effectiveTitleColor }}>
          <h1 className={`text-lg font-bold opacity-90`}>{config.titleText}</h1>
          <div className={`text-[10px] mt-1 uppercase tracking-widest opacity-60`}>
             Tahun {year}
          </div>
        </div>
      )}
    </div>
  );

  const DaysHeader = ({ customColor, short = false }: { customColor?: string, short?: boolean }) => (
    <div className={`grid grid-cols-7 mb-2 ${isPoster ? 'border-b border-white/30 pb-1' : ''}`} style={{ gap: config.gridGap }}>
      {(short ? WEEKDAYS_SHORT : WEEKDAYS).map((day, idx) => (
        <div key={idx} className={`font-bold uppercase tracking-widest text-center py-2 ${idx === 0 ? 'text-red-500' : 'opacity-70'} ${textShadowClass}`} style={{ color: idx === 0 ? undefined : customColor, fontSize: `${0.65 * scale}rem` }}>
          {isPoster || isMinimal ? day.substring(0, 3) : day}
        </div>
      ))}
    </div>
  );

  const Grid = () => (
    <div className={`grid grid-cols-7 h-full relative z-20 ${isClassic ? 'border-t border-l' : ''} ${isClassic && effectiveOverlayColor === 'white' ? 'border-gray-200' : isClassic ? 'border-white/20' : ''}`} style={{ gap: config.gridGap }}>
      {days.map((day, index) => {
        let cellClass = "relative flex flex-col transition-all overflow-hidden ";
        if (isClassic) cellClass += "border-b border-r min-h-[90px] p-2 ";
        else if (isElegant) cellClass += "min-h-[80px] p-1 rounded-lg hover:bg-black/5 ";
        else if (isPlanner) cellClass += "min-h-[70px] p-2 border-b border-dashed border-gray-300/50 ";
        else if (isWall) cellClass += "border-b border-r border-gray-100 min-h-[90px] p-2 ";
        else if (isSide) cellClass += "border-b border-r border-gray-100 min-h-[60px] p-1.5 ";
        else if (isPoster) cellClass += "min-h-[60px] p-1 items-center justify-start pt-2 ";
        else if (isMinimal) cellClass += "min-h-[70px] p-2 items-center justify-start ";

        const opacityClass = !day.isCurrentMonth ? "opacity-30" : "";
        const todayClass = (day.isToday && day.isCurrentMonth && !isExporting) ? `bg-indigo-600 text-white ${boxShadowStyle}` : "";
        const weekendClass = (day.isWeekend && day.isCurrentMonth && !isPoster && !day.isToday && !isMinimal) ? "bg-red-50/30" : "";

        return (
          <div key={index} className={`${cellClass} ${opacityClass} ${todayClass} ${weekendClass}`} style={{ borderRadius: config.borderRadius }}>
            <span className={`font-semibold leading-none mb-1 ${textShadowClass} ${shadowStyle} ${(day.isWeekend || day.holiday) && (!day.isToday || isExporting) ? 'text-red-500' : ''}`} style={{ fontSize: `${1.125 * scale}rem` }}>
              {day.dayOfMonth}
            </span>
            <div className={`mt-auto flex flex-col gap-0.5 w-full ${isMinimal ? 'items-center' : ''}`}>
                <div className={`flex flex-wrap content-start gap-1 w-full ${isMinimal ? 'justify-center' : ''}`}>
                  {config.showHijri && day.isCurrentMonth && (
                    <span className={`leading-tight px-1 rounded-sm whitespace-nowrap ${day.isToday && !isExporting ? 'bg-white/20 text-white' : 'bg-emerald-100/50 text-emerald-700'}`} style={{ fontSize: `${0.5 * scale}rem` }}>{day.hijriDate.split(' ')[0]}</span>
                  )}
                  {config.showJavanese && day.isCurrentMonth && (
                    <span className={`leading-tight px-1 rounded-sm whitespace-nowrap ${day.isToday && !isExporting ? 'bg-white/20 text-white' : 'bg-amber-100/50 text-amber-700'}`} style={{ fontSize: `${0.5 * scale}rem` }}>{day.javaneseDate}</span>
                  )}
                   {config.showChinese && day.isCurrentMonth && (
                    <span className={`leading-tight px-1 rounded-sm whitespace-nowrap ${day.isToday && !isExporting ? 'text-rose-100' : 'text-rose-500'}`} style={{ fontSize: `${0.5 * scale}rem` }}>{day.chineseDate}</span>
                  )}
                </div>
                {config.showHolidays && day.holiday && (
                  <div className={`mt-0.5 font-bold leading-tight w-full p-1 rounded-sm ${day.isToday && !isExporting ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 border border-red-100'} ${isMinimal ? 'text-center' : 'text-left'}`} style={{ fontSize: `${0.55 * scale}rem` }}>
                    {day.holiday}
                  </div>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // The main Render of the Calendar Card Content
  const CalendarCard = () => (
    <div 
        className={`relative bg-white shadow-2xl overflow-hidden text-gray-800 calendar-card`}
        style={{
            // Hardcode dimensions to A4 pixel equivalent for consistency in scaling and export
            width: config.orientation === 'portrait' ? A4_WIDTH_PX : A4_HEIGHT_PX,
            height: config.orientation === 'portrait' ? A4_HEIGHT_PX : A4_WIDTH_PX,
            backgroundColor: config.bgColor,
            fontFamily: containerFont,
            color: effectiveTextColor,
            ...((!gridOnSolidBg && !isFullYear) ? imageBgStyle : {})
        }}
    >
        {!gridOnSolidBg && !isFullYear && <div style={overlayStyle}></div>}
        {!gridOnSolidBg && !isFullYear && <Watermark />}

        {isFullYear && (
            <div className={`h-full flex ${config.orientation === 'portrait' ? 'flex-col' : 'flex-row'}`}>
                <div 
                  className={`relative bg-gray-100 flex p-6 text-white ${config.orientation === 'portrait' ? 'h-[22%] w-full items-end justify-between' : 'w-[25%] h-full flex-col justify-between items-start'}`} 
                  style={imageBgStyle}
                  role="img"
                  aria-label={`Background Kalender Tahun ${year}`}
                >
                    <div style={overlayStyle}></div>
                    <Watermark />
                    <div className="relative z-10 w-full">
                        <h1 className={`${config.orientation === 'portrait' ? 'text-5xl' : 'text-5xl'} font-bold tracking-tighter mb-2`}>{year}</h1>
                        <div className="h-1 w-20 bg-white/50 mb-4 rounded-full"></div>
                        <p className="text-xs font-serif italic opacity-90 max-w-xs leading-relaxed">"{quote}"</p>
                    </div>
                    {config.orientation === 'landscape' && (
                        <div className="relative z-10 mt-auto pt-8">
                             <div className="uppercase tracking-[0.2em] text-xs font-bold opacity-70">Kalender</div>
                             <div className="text-lg font-bold">{config.titleText}</div>
                        </div>
                    )}
                </div>
                <div className="flex-1 p-4 overflow-hidden" style={{ backgroundColor: config.bgColor }}>
                    {config.orientation === 'portrait' && (
                         <div className="text-right mb-2">
                            <h2 className="font-bold uppercase tracking-widest text-lg" style={{ color: effectiveTitleColor }}>{config.titleText}</h2>
                         </div>
                    )}
                    <div className={`grid h-full gap-x-4 gap-y-2 pb-0 ${config.orientation === 'portrait' ? 'grid-cols-3 grid-rows-4' : 'grid-cols-4 grid-rows-3'}`}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <MiniCalendar key={i} monthIndex={i} year={year} config={config} isExporting={isExporting} />
                        ))}
                    </div>
                    {config.showHolidays && (
                        <div className="text-gray-400 text-center flex items-center justify-center gap-2 mt-1" style={{ fontSize: `${0.4 * scale}rem` }}>
                             <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div><span>Hari Libur Nasional / Tanggal Merah</span></div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {isWall && (
           <div className="h-full flex flex-col">
              <div 
                className="h-[55%] w-full relative bg-gray-100 flex items-end p-8" 
                style={imageBgStyle}
                role="img"
                aria-label={`Background Kalender Bulan ${MONTH_NAMES[month]} ${year}`}
              >
                 <div style={overlayStyle}></div>
                 <Watermark />
                 <div className="relative z-10 text-white w-full drop-shadow-lg">
                    <h1 className="text-6xl font-serif font-bold tracking-tighter mb-2">{MONTH_NAMES[month]}</h1>
                    <div className="flex justify-between items-end border-t border-white/40 pt-4"><span className="text-3xl font-light">{year}</span><p className="text-sm italic opacity-90 max-w-md text-right">"{quote}"</p></div>
                 </div>
              </div>
              <div className="flex-1 bg-white p-6 relative"><DaysHeader customColor="#1f2937" /><Grid /><div className="absolute bottom-4 right-6 text-[10px] uppercase tracking-widest font-bold opacity-50" style={{ color: effectiveTitleColor }}>{config.titleText}</div></div>
           </div>
        )}

        {isSide && (
           <div className="h-full flex flex-row">
              <div 
                className="w-[40%] h-full relative bg-gray-100 flex flex-col justify-between p-8" 
                style={imageBgStyle}
                role="img"
                aria-label={`Background Kalender Bulan ${MONTH_NAMES[month]} ${year}`}
              >
                  <div style={overlayStyle}></div>
                  <Watermark />
                  <div className="relative z-10 mt-10 drop-shadow-lg">
                    <h1 className="text-5xl font-serif font-bold text-white tracking-wide rotate-0">{MONTH_NAMES[month]}</h1>
                    <span className="text-8xl font-bold text-white/90 block -ml-1">{year}</span>
                  </div>
                  <div className="relative z-10 text-white/80 text-sm border-l-2 pl-4 italic drop-shadow-md">{quote}</div>
              </div>
              <div className="flex-1 bg-white p-8 flex flex-col">
                 <div className="mb-8 text-right"><h2 className="font-bold uppercase tracking-widest text-lg" style={{ color: effectiveTitleColor }}>{config.titleText}</h2><div className="text-xs text-gray-500">{config.showHijri && 'Hijriah • '} {config.showJavanese && 'Jawa • '} Masehi</div></div>
                 <DaysHeader customColor="#1f2937" /><div className="flex-1"><Grid /></div>
              </div>
           </div>
        )}

        {isMinimal && (
            <div className="h-full flex flex-col p-12 relative bg-white">
                <div className="flex justify-between items-start mb-12">
                     <div><h1 className="text-7xl font-bold tracking-tighter leading-none text-gray-900" style={{ color: config.titleColor }}>{MONTH_NAMES[month]}</h1><p className="text-2xl text-gray-400 font-light mt-2">{year}</p></div>
                     <div className="w-32 h-32 relative overflow-hidden rounded-full shadow-inner bg-gray-100">
                        <div 
                          className="absolute inset-0" 
                          style={imageBgStyle}
                          role="img"
                          aria-label={`Background Kalender ${MONTH_NAMES[month]} ${year}`}
                        ></div>
                        <div style={{...overlayStyle, borderRadius: '999px'}}></div>
                        {/* No watermark on minimal small circle as it is too small, or maybe inside? */}
                    </div>
                </div>
                <div className="flex-1"><DaysHeader customColor="#9ca3af" /><div className="mt-4 h-full"><Grid /></div></div>
                <div className="text-center text-xs text-gray-400 uppercase tracking-widest mt-8">{quote}</div>
            </div>
        )}

        {isPoster && (
            <div className="h-full flex flex-col relative z-10">
               <div className="flex-1 p-10 flex flex-col justify-between relative z-20">
                 <div className="bg-white/20 backdrop-blur-md self-start px-6 py-2 rounded-full text-white text-sm font-bold tracking-widest border border-white/20 shadow-lg" style={{ color: config.titleColor || 'white' }}>{config.titleText}</div>
                 <div className="max-w-xl"><p className="text-4xl text-white font-serif italic leading-tight drop-shadow-lg">"{quote}"</p></div>
              </div>
              <div className={`p-8 rounded-t-[3rem] relative z-20 ${boxShadowStyle}`} style={{ backgroundColor: effectiveOverlayColor === 'white' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)' }}>
                <Header /><DaysHeader /><Grid />
              </div>
              <Watermark />
            </div>
        )}

        {(!isWall && !isSide && !isPoster && !isMinimal && !isFullYear) && (
             <div className="h-full w-full relative z-10 flex flex-col p-8">
                 <div className="relative z-10 flex flex-col h-full">
                    {isElegant ? (
                        <div className={`flex-1 flex flex-col p-8 rounded-3xl border border-white/20 backdrop-blur-lg ${boxShadowStyle}`} style={{ backgroundColor: effectiveOverlayColor === 'white' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)', borderRadius: config.borderRadius * 2 }}><Header /><DaysHeader /><div className="flex-1"><Grid /></div></div>
                    ) : isPlanner ? (
                        <div className="flex-1 flex flex-col bg-white/95 p-6 shadow-xl" style={{ borderRadius: config.borderRadius }}><Header customColor="#1f2937" /><div className="flex flex-1 gap-6 mt-4"><div className="flex-[2] flex flex-col"><DaysHeader customColor="#1f2937" /><Grid /></div><div className={`flex-1 border-l-2 border-dashed border-gray-200 pl-6 flex flex-col`}><div className="flex items-center gap-2 mb-4 opacity-70 text-gray-700"><ListTodo className="w-5 h-5" /><h3 className="font-bold uppercase tracking-widest text-sm">Notes</h3></div><div className={`flex-1 rounded-xl p-4 bg-gray-50/80`}>{[...Array(15)].map((_, i) => (<div key={i} className={`h-8 border-b border-gray-300`}></div>))}</div></div></div></div>
                    ) : (
                         <div className="flex-1 flex flex-col bg-white/90 p-6 shadow-xl" style={{ borderRadius: config.borderRadius }}><Header customColor="#000" /><DaysHeader customColor="#000" /><div className="flex-1"><Grid /></div></div>
                    )}
                 </div>
             </div>
        )}
    </div>
  );

  // If exporting, render raw component without wrapper scaling
  if (isExporting) {
      return (
        <div className="p-0 font-sans bg-transparent">
            <CalendarCard />
        </div>
      );
  }

  // Interactive View: Scaled to Fit Container
  return (
    <div className="flex-1 h-full w-full bg-gray-200/50 flex items-center justify-center font-sans overflow-hidden p-0 relative">
        <div ref={containerRef} className="absolute inset-0 flex items-center justify-center overflow-hidden">
             {/* The Scaled Wrapper */}
             <div 
                style={{ 
                    transform: `scale(${viewScaleRef.current.scale})`,
                    transformOrigin: 'center center',
                    width: config.orientation === 'portrait' ? A4_WIDTH_PX : A4_HEIGHT_PX,
                    height: config.orientation === 'portrait' ? A4_HEIGHT_PX : A4_WIDTH_PX,
                    // Ensure shadow remains crisp even when scaled down
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    transition: 'width 0.3s, height 0.3s'
                }}
             >
                 <CalendarCard />
             </div>
        </div>
    </div>
  );
};

export default CalendarView;