import React, { useEffect, useRef, useState } from 'react';
import { CalendarConfig, DayData } from '../types';
import { ChevronLeft, ChevronRight, Quote, CalendarDays, ListTodo, ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';
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

  // Optimized sizes
  const titleSize = 0.9 * scale; 
  const headerSize = 0.55 * scale; 
  const daySize = 0.65 * scale; 
  const extraSize = 0.45 * scale; 

  return (
      <div className="flex flex-col h-full w-full overflow-hidden">
          <h3 
            className="font-extrabold uppercase tracking-tight mb-1 border-b border-black/10 leading-tight pb-0.5" 
            style={{ color: effectiveTitleColor, fontSize: `${titleSize}rem` }}
          >
            {MONTH_NAMES[monthIndex]}
          </h3>
          
          <div className="grid grid-cols-7 mb-0.5 border-b border-black/5" style={{ gap: `${config.gridGap}px` }}>
              {WEEKDAYS_SHORT.map((d, i) => (
                  <div 
                    key={i} 
                    className={`font-bold text-center py-0.5 leading-none ${i===0 ? 'text-red-600' : 'opacity-80'}`} 
                    style={{ color: i !== 0 ? config.textColor : undefined, fontSize: `${headerSize}rem` }}
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
                        style={{ borderRadius: `${config.borderRadius}px`, minHeight: '26px' }}
                        title={d.holiday}
                    >
                        <span 
                            className={`font-bold leading-none block mt-[2px] ${isRedDate ? 'text-red-600' : ''}`}
                            style={{ color: (!isRedDate) ? config.textColor : undefined, fontSize: `${daySize}rem` }}
                        >
                            {d.dayOfMonth}
                        </span>
                        
                        {showExtras && (
                            <div className="flex flex-col items-center space-y-0 w-full mt-[1px] leading-none">
                                {config.showHijri && (
                                    <span className="leading-none text-emerald-700 opacity-90 font-bold tracking-tight scale-100 origin-top" style={{ fontSize: `${extraSize}rem` }}>
                                        {d.hijriDate.split(' ')[0]}
                                    </span>
                                )}
                                {config.showJavanese && (
                                    <span className="leading-none text-amber-700 opacity-90 font-bold tracking-tighter scale-100 origin-top" style={{ fontSize: `${extraSize}rem` }}>
                                        {d.javaneseDate}
                                    </span>
                                )}
                                {config.showChinese && (
                                    <span className="leading-none text-rose-700 opacity-90 font-bold scale-100 origin-top" style={{ fontSize: `${extraSize}rem` }}>
                                        {d.chineseDate.split('/')[0]}
                                    </span>
                                )}
                            </div>
                        )}
                        {isHoliday && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full m-[1px]"></div>}
                    </div>
                  );
              })}
          </div>
      </div>
  );
};

const CalendarView: React.FC<CalendarViewProps> = ({ year, month, days, config, quote, onMonthChange, isExporting = false, defaultBgUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.5); // Default zoom logic handles initial state
  const [isReady, setIsReady] = useState(false);

  // Initial Fit Logic
  useEffect(() => {
    if (isExporting || !containerRef.current) return;
    
    const fitToScreen = () => {
        if (!containerRef.current) return;
        const parent = containerRef.current;
        const padding = 60; // Extra padding for comfort
        
        const targetW = config.orientation === 'portrait' ? A4_WIDTH_PX : A4_HEIGHT_PX;
        const targetH = config.orientation === 'portrait' ? A4_HEIGHT_PX : A4_WIDTH_PX;
        
        const availableW = parent.clientWidth - padding;
        const availableH = parent.clientHeight - padding;
        
        const scale = Math.min(availableW / targetW, availableH / targetH);
        setZoom(Math.max(scale, 0.2)); // Min zoom 0.2
    };

    fitToScreen();
    setIsReady(true);
    
    // Auto-fit on resize only if not manually zoomed ideally, but here we fit on orientation change
  }, [config.orientation, isExporting]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.2));
  const handleResetZoom = () => {
    if (!containerRef.current) return;
    const padding = 60;
    const targetW = config.orientation === 'portrait' ? A4_WIDTH_PX : A4_HEIGHT_PX;
    const targetH = config.orientation === 'portrait' ? A4_HEIGHT_PX : A4_WIDTH_PX;
    const availableW = containerRef.current.clientWidth - padding;
    const availableH = containerRef.current.clientHeight - padding;
    const scale = Math.min(availableW / targetW, availableH / targetH);
    setZoom(scale);
  };

  const containerFont = config.fontFamily === 'serif' ? '"Playfair Display", serif' : config.fontFamily === 'mono' ? '"Roboto Mono", monospace' : '"Inter", sans-serif';
  const bgImage = config.bgImages[month] || config.bgImages['default'] || null;
  const isDefaultBg = defaultBgUrl && bgImage === defaultBgUrl;

  // Layout Checks
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
        <div key={idx} className={`font-bold uppercase tracking-widest text-center py-2 ${idx === 0 ? 'text-red-500' : 'opacity-70'} ${textShadowClass}`} style={{ color: idx === 0 ? undefined : customColor, fontSize: `${0.75 * scale}rem` }}>
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

  const CalendarCard = () => (
    <div 
        className={`relative bg-white shadow-2xl overflow-hidden text-gray-800 calendar-card origin-top-left`}
        style={{
            width: config.orientation === 'portrait' ? A4_WIDTH_PX : A4_HEIGHT_PX,
            height: config.orientation === 'portrait' ? A4_HEIGHT_PX : A4_WIDTH_PX,
            backgroundColor: config.bgColor,
            fontFamily: containerFont,
            color: effectiveTextColor,
            // Only apply visual scaling when NOT exporting. 
            // When Exporting (pdfService uses cloning), scale should be handled by the service or removed.
            transform: !isExporting ? `scale(${zoom})` : 'none',
            ...((!gridOnSolidBg && !isFullYear) ? imageBgStyle : {})
        }}
    >
        {!gridOnSolidBg && !isFullYear && <div style={overlayStyle}></div>}
        {!gridOnSolidBg && !isFullYear && <Watermark />}

        {isFullYear && (
            <div className={`h-full flex ${config.orientation === 'portrait' ? 'flex-col' : 'flex-row'}`}>
                {/* Header Full Year */}
                <div 
                  className={`relative bg-gray-100 flex p-6 text-white ${config.orientation === 'portrait' ? 'h-[22%] w-full items-end justify-between' : 'w-[25%] h-full flex-col justify-between items-start'}`} 
                  style={imageBgStyle}
                >
                    <div style={overlayStyle}></div>
                    <Watermark />
                    <div className="relative z-10 w-full">
                        <h1 className={`${config.orientation === 'portrait' ? 'text-6xl' : 'text-5xl'} font-bold tracking-tighter mb-2 leading-none drop-shadow-lg`}>{year}</h1>
                        <div className="h-1.5 w-24 bg-white/70 mb-3 rounded-full shadow-sm"></div>
                        <p className="text-sm font-serif italic opacity-95 max-w-sm leading-relaxed drop-shadow-md">"{quote}"</p>
                    </div>
                    {config.orientation === 'landscape' && (
                        <div className="relative z-10 mt-auto pt-8">
                             <div className="uppercase tracking-[0.2em] text-xs font-bold opacity-80 mb-1">Kalender</div>
                             <div className="text-xl font-bold leading-tight">{config.titleText}</div>
                        </div>
                    )}
                </div>

                <div className="flex-1 p-5 overflow-hidden flex flex-col" style={{ backgroundColor: config.bgColor }}>
                    {config.orientation === 'portrait' && (
                         <div className="text-right mb-2 flex justify-end items-center border-b border-gray-100 pb-1">
                            <h2 className="font-bold uppercase tracking-widest text-lg leading-none" style={{ color: effectiveTitleColor }}>{config.titleText}</h2>
                         </div>
                    )}
                    
                    <div className={`grid h-full gap-x-4 gap-y-2 pb-1 ${config.orientation === 'portrait' ? 'grid-cols-3 grid-rows-4' : 'grid-cols-4 grid-rows-3'}`}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <MiniCalendar key={i} monthIndex={i} year={year} config={config} isExporting={isExporting} />
                        ))}
                    </div>
                    
                    {config.showHolidays && (
                        <div className="text-gray-400 text-center flex items-center justify-center gap-2 mt-1" style={{ fontSize: `${0.45 * scale}rem` }}>
                             <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div><span>Hari Libur Nasional</span></div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* ... (Wall, Side, Minimal, Poster, Elegant, Planner layouts remain structurally same) ... */}
        {isWall && (
           <div className="h-full flex flex-col">
              <div 
                className="h-[55%] w-full relative bg-gray-100 flex items-end p-8" 
                style={imageBgStyle}
              >
                 <div style={overlayStyle}></div>
                 <Watermark />
                 <div className="relative z-10 text-white w-full drop-shadow-lg">
                    <h1 className="text-8xl font-serif font-bold tracking-tighter mb-2 leading-none">{MONTH_NAMES[month]}</h1>
                    <div className="flex justify-between items-end border-t border-white/40 pt-4"><span className="text-4xl font-light tracking-wide">{year}</span><p className="text-base italic opacity-90 max-w-md text-right">"{quote}"</p></div>
                 </div>
              </div>
              <div className="flex-1 bg-white p-8 relative flex flex-col justify-center">
                  <DaysHeader customColor="#1f2937" />
                  <div className="flex-1">
                    <Grid />
                  </div>
                  <div className="absolute bottom-4 right-6 text-xs uppercase tracking-widest font-bold opacity-50" style={{ color: effectiveTitleColor }}>{config.titleText}</div>
              </div>
           </div>
        )}

        {isSide && (
           <div className="h-full flex flex-row">
              <div 
                className="w-[40%] h-full relative bg-gray-100 flex flex-col justify-between p-8" 
                style={imageBgStyle}
              >
                  <div style={overlayStyle}></div>
                  <Watermark />
                  <div className="relative z-10 mt-10 drop-shadow-lg">
                    <h1 className="text-6xl font-serif font-bold text-white tracking-wide leading-tight">{MONTH_NAMES[month]}</h1>
                    <span className="text-9xl font-bold text-white/90 block -ml-1 mt-2">{year}</span>
                  </div>
                  <div className="relative z-10 text-white/90 text-base border-l-4 border-white/50 pl-4 italic drop-shadow-md leading-relaxed">{quote}</div>
              </div>
              <div className="flex-1 bg-white p-10 flex flex-col">
                 <div className="mb-8 text-right border-b border-gray-100 pb-4">
                    <h2 className="font-bold uppercase tracking-widest text-xl" style={{ color: effectiveTitleColor }}>{config.titleText}</h2>
                    <div className="text-sm text-gray-500 mt-1">{config.showHijri && 'Hijriah • '} {config.showJavanese && 'Jawa • '} Masehi</div>
                 </div>
                 <DaysHeader customColor="#1f2937" />
                 <div className="flex-1 mt-4"><Grid /></div>
              </div>
           </div>
        )}

        {isMinimal && (
            <div className="h-full flex flex-col p-12 relative bg-white">
                <div className="flex justify-between items-start mb-8">
                     <div>
                        <h1 className="text-8xl font-bold tracking-tighter leading-none text-gray-900" style={{ color: config.titleColor }}>{MONTH_NAMES[month]}</h1>
                        <p className="text-3xl text-gray-400 font-light mt-2 ml-1">{year}</p>
                     </div>
                     <div className="w-40 h-40 relative overflow-hidden rounded-full shadow-inner bg-gray-100 ring-8 ring-gray-50">
                        <div 
                          className="absolute inset-0" 
                          style={imageBgStyle}
                        ></div>
                        <div style={{...overlayStyle, borderRadius: '999px'}}></div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    <DaysHeader customColor="#9ca3af" />
                    <div className="mt-4 flex-1"><Grid /></div>
                </div>
                <div className="text-center text-sm text-gray-400 uppercase tracking-widest mt-8 font-medium">{quote}</div>
            </div>
        )}

        {isPoster && (
            <div className="h-full flex flex-col relative z-10">
               <div className="flex-1 p-12 flex flex-col justify-between relative z-20">
                 <div className="bg-white/20 backdrop-blur-md self-start px-8 py-3 rounded-full text-white text-base font-bold tracking-widest border border-white/20 shadow-lg" style={{ color: config.titleColor || 'white' }}>{config.titleText}</div>
                 <div className="max-w-2xl"><p className="text-5xl text-white font-serif italic leading-tight drop-shadow-lg">"{quote}"</p></div>
              </div>
              <div className={`p-10 rounded-t-[3.5rem] relative z-20 ${boxShadowStyle} min-h-[55%]`} style={{ backgroundColor: effectiveOverlayColor === 'white' ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
                <Header />
                <div className="mt-4"><DaysHeader /></div>
                <div className="mt-2 h-full"><Grid /></div>
              </div>
              <Watermark />
            </div>
        )}

        {(!isWall && !isSide && !isPoster && !isMinimal && !isFullYear) && (
             <div className="h-full w-full relative z-10 flex flex-col p-10 justify-center">
                 <div className="relative z-10 flex flex-col h-full max-h-[90%]">
                    {isElegant ? (
                        <div className={`flex-1 flex flex-col p-10 rounded-[2.5rem] border border-white/30 backdrop-blur-xl ${boxShadowStyle}`} style={{ backgroundColor: effectiveOverlayColor === 'white' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)', borderRadius: config.borderRadius * 2 }}>
                            <Header />
                            <div className="my-4 border-b border-black/5 pb-2"><DaysHeader /></div>
                            <div className="flex-1"><Grid /></div>
                        </div>
                    ) : isPlanner ? (
                        <div className="flex-1 flex flex-col bg-white/95 p-8 shadow-2xl" style={{ borderRadius: config.borderRadius }}>
                            <Header customColor="#1f2937" />
                            <div className="flex flex-1 gap-8 mt-6">
                                <div className="flex-[2] flex flex-col">
                                    <DaysHeader customColor="#1f2937" />
                                    <Grid />
                                </div>
                                <div className={`flex-1 border-l-2 border-dashed border-gray-200 pl-8 flex flex-col`}>
                                    <div className="flex items-center gap-2 mb-6 opacity-80 text-gray-700 border-b border-gray-200 pb-2">
                                        <ListTodo className="w-6 h-6" />
                                        <h3 className="font-bold uppercase tracking-widest text-sm">Notes</h3>
                                    </div>
                                    <div className={`flex-1 rounded-2xl p-6 bg-gray-50/80 shadow-inner space-y-4`}>
                                        {[...Array(12)].map((_, i) => (<div key={i} className={`h-8 border-b border-gray-300`}></div>))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="flex-1 flex flex-col bg-white/95 p-8 shadow-2xl backdrop-blur-sm" style={{ borderRadius: config.borderRadius }}>
                             <Header customColor="#000" />
                             <div className="my-2"><DaysHeader customColor="#000" /></div>
                             <div className="flex-1"><Grid /></div>
                         </div>
                    )}
                 </div>
             </div>
        )}
    </div>
  );

  if (isExporting) {
      return (
        <div className="p-0 font-sans bg-transparent">
            <CalendarCard />
        </div>
      );
  }

  // Calculate scaled dimensions to ensure scrollbars appear
  const scaledWidth = (config.orientation === 'portrait' ? A4_WIDTH_PX : A4_HEIGHT_PX) * zoom;
  const scaledHeight = (config.orientation === 'portrait' ? A4_HEIGHT_PX : A4_WIDTH_PX) * zoom;

  return (
    <div className="flex-1 h-full w-full relative bg-slate-800/90 font-sans overflow-hidden">
        
        {/* Scrollable Viewport */}
        <div ref={containerRef} className="absolute inset-0 overflow-auto flex items-center justify-center p-8 custom-scrollbar">
             <div 
                className="transition-all duration-200 ease-out shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
                style={{ 
                    width: scaledWidth, 
                    height: scaledHeight,
                    // Center vertically if scale is small
                    marginTop: scaledHeight < (containerRef.current?.clientHeight || 0) ? 'auto' : 0,
                    marginBottom: scaledHeight < (containerRef.current?.clientHeight || 0) ? 'auto' : 0,
                    flexShrink: 0
                }}
             >
                 <CalendarCard />
             </div>
        </div>

        {/* Floating Zoom Toolbar */}
        <div className="absolute bottom-28 lg:bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md shadow-xl border border-white/20 rounded-full px-4 py-2 flex items-center gap-4 z-50 text-gray-700 transition-all duration-300">
            <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95" title="Zoom Out">
                <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold font-mono w-12 text-center select-none">
                {(zoom * 100).toFixed(0)}%
            </span>
            <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95" title="Zoom In">
                <ZoomIn className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button onClick={handleResetZoom} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-full transition-colors active:scale-95" title="Fit to Screen">
                <RotateCcw className="w-4 h-4" />
            </button>
        </div>

        {/* Background Grid Pattern for better aesthetics */}
        <div className="absolute inset-0 z-[-1] opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>
    </div>
  );
};

export default CalendarView;