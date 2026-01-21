import React, { useState, useEffect } from 'react';
import { CalendarConfig, DayData } from './types';
import ControlPanel from './components/ControlPanel';
import CalendarView from './components/CalendarView';
import { generateCalendarGrid } from './services/calendarUtils';
import { generateBackgroundImage, generateMotivationalQuote } from './services/geminiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Loader2, PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Logic: If currently Oct, Nov, or Dec, default to next year. Otherwise current year.
const now = new Date();
const DEFAULT_YEAR = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();

// Default Image URL for Miko Layno's Dutch Style Aquascape (Updated)
export const DEFAULT_BG_URL = 'https://i.ytimg.com/vi/1Sa6t_Gz9Dg/maxresdefault.jpg';

const DEFAULT_CONFIG: CalendarConfig = {
  bgColor: '#ffffff',
  bgImages: {
    'default': DEFAULT_BG_URL
  }, 
  textColor: '#000000', // Hitam
  titleColor: '#000000', // Hitam
  fontFamily: 'sans', // Changed to sans as requested
  layout: 'fullyear', 
  orientation: 'portrait',
  overlayOpacity: 0, // 0 as requested
  overlayColor: 'white',
  showHijri: true,
  showJavanese: true,
  showChinese: true,
  showHolidays: true,
  titleText: `Kalender ${DEFAULT_YEAR}`,
  imagePosition: 'center', // Rata Tengah (Updated)
  imageFit: 'cover', // Penuh
  borderRadius: 0, // 0
  gridGap: 0, // 0
  shadowIntensity: 0, // 0
  fontScale: 0.85 // 85%
};

// Optimized keywords for Pinterest Search
const MONTHLY_THEMES = [
  "Winter aesthetic snow mountain minimalist wallpaper", // Jan
  "Soft pink flowers valentine aesthetic wallpaper", // Feb
  "Fresh green nature spring aesthetic wallpaper", // Mar
  "Cherry blossom japanese aesthetic wallpaper", // Apr
  "Dark green forest nature aesthetic wallpaper", // May
  "Blue ocean beach summer aesthetic wallpaper", // Jun
  "Golden hour sunset hills aesthetic wallpaper", // Jul
  "Tropical monstera leaves minimalist wallpaper", // Aug
  "Autumn vibes orange leaves aesthetic wallpaper", // Sep
  "Moody dark forest fog halloween aesthetic wallpaper", // Oct
  "Cozy rain window autumn aesthetic wallpaper", // Nov
  "Christmas lights festive red gold aesthetic wallpaper" // Dec
];

const App: React.FC = () => {
  // Initialize with DEFAULT_YEAR calculated above
  const [currentDate, setCurrentDate] = useState(new Date(DEFAULT_YEAR, 0, 1));
  const [days, setDays] = useState<DayData[]>([]);
  const [config, setConfig] = useState<CalendarConfig>(DEFAULT_CONFIG);
  const [quote, setQuote] = useState("Loading quote...");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{current: number, total: number} | null>(null);
  
  // Layout States
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Bottom Drawer State
  
  // Full PDF Generation State
  const [isDownloadingFull, setIsDownloadingFull] = useState(false);
  const [fullYearData, setFullYearData] = useState<{month: number, days: DayData[], quote: string}[] | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // --- DYNAMIC SEO UPDATE ---
  useEffect(() => {
    // Update Document Title
    document.title = `Kalender ${year} Lengkap - Generator Kalender Indonesia & Jawa`;

    // Update Meta Description dynamically
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', `Buat dan download kalender ${year} lengkap dengan tanggal merah, libur nasional, Hijriyah dan Jawa (Weton). Generator kalender ${year} otomatis siap cetak PDF.`);
    }

    // Update Meta Keywords dynamically
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', `kalender ${year}, kalender ${year} lengkap, kalender ${year} pdf, kalender jawa ${year}, libur nasional ${year}, cetak kalender ${year}`);
    }
  }, [year]);

  // Initialize and Sync Logic
  useEffect(() => {
    // Generate grid
    const grid = generateCalendarGrid(year, month);
    setDays(grid);

    // Fetch quote
    const fetchQuote = async () => {
        const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(currentDate);
        const q = await generateMotivationalQuote(monthName);
        setQuote(q);
    };
    fetchQuote();

  }, [year, month]);

  // Update title automatically if user hasn't customized it drastically
  useEffect(() => {
     // Check if title contains a year that is NOT the current selected year (regex for 20xx)
     const titleYearMatch = config.titleText.match(/20\d\d/);
     if (titleYearMatch && titleYearMatch[0] !== year.toString()) {
        setConfig(prev => ({
            ...prev,
            titleText: prev.titleText.replace(titleYearMatch[0], year.toString())
        }));
     } else if (!titleYearMatch && config.titleText.includes('Kalender')) {
        // Fallback if user deleted the year but kept 'Kalender'
         setConfig(prev => ({
            ...prev,
            titleText: `Kalender ${year}`
        }));
     }
  }, [year]);

  const handleMonthChange = (delta: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
  };

  const handleYearChange = (newYear: number) => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setFullYear(newYear);
        return newDate;
    });
  };

  const updateConfigWithImage = (imageData: string) => {
      setConfig(prev => {
        // Determine if text overlaps image based on layout
        const isOverlayLayout = prev.layout !== 'wall' && prev.layout !== 'side' && prev.layout !== 'minimal';
        
        return {
          ...prev,
          bgImages: {
            ...prev.bgImages,
            [month]: imageData
          },
          // Adjust defaults based on layout nature
          overlayOpacity: isOverlayLayout ? 0.4 : 0.2, 
          overlayColor: 'black',
          textColor: isOverlayLayout ? '#ffffff' : '#1f2937',
          titleColor: isOverlayLayout ? '#ffffff' : '#1f2937'
        };
      });
  };

  const handleGenerateAIBackground = async (prompt: string) => {
    if (!prompt) return;
    setIsGeneratingAI(true);
    try {
      const base64Image = await generateBackgroundImage(prompt);
      updateConfigWithImage(base64Image);
    } catch (error) {
      alert("Gagal mencari gambar. Coba lagi.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleUploadImage = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        updateConfigWithImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateYear = async () => {
    setIsGeneratingAI(true);
    setGenerationProgress({ current: 0, total: 12 });
    
    // Switch to a layout that looks good with images immediately
    setConfig(prev => ({
       ...prev,
       layout: 'wall',
       orientation: 'portrait',
       textColor: '#1f2937',
       titleColor: '#1f2937',
       overlayOpacity: 0.2
    }));

    try {
      for (let i = 0; i < 12; i++) {
        setGenerationProgress({ current: i + 1, total: 12 });
        // Generate image for month i
        const prompt = MONTHLY_THEMES[i];
        const base64Image = await generateBackgroundImage(prompt);
        
        // Update state incrementally so user sees progress
        setConfig(prev => ({
          ...prev,
          bgImages: {
            ...prev.bgImages,
            [i]: base64Image
          }
        }));
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat generate massal.");
    } finally {
      setIsGeneratingAI(false);
      setGenerationProgress(null);
    }
  };

  const handleRemoveImage = () => {
    setConfig(prev => {
        const newImages = { ...prev.bgImages };
        delete newImages[month];
        return { ...prev, bgImages: newImages };
    });
  };

  // --- FULL PDF GENERATION LOGIC ---

  const handleDownloadFull = async () => {
     setIsDownloadingFull(true);
     
     // 1. Prepare data for all 12 months
     const allMonthsData: {month: number, days: DayData[], quote: string}[] = [];
     
     try {
        for(let i=0; i<12; i++) {
            const grid = generateCalendarGrid(year, i);
            const quoteText = await generateMotivationalQuote(MONTH_NAMES[i]);
            allMonthsData.push({ month: i, days: grid, quote: quoteText });
        }
        
        // 2. Trigger render of hidden views by setting state
        setFullYearData(allMonthsData);
        // The useEffect below will detect this change and start the capture process
     } catch (e) {
         console.error(e);
         setIsDownloadingFull(false);
         alert("Gagal menyiapkan data PDF.");
     }
  };

  // Watch for fullYearData to populate, then capture PDF
  useEffect(() => {
    if (fullYearData && fullYearData.length === 12) {
        // Wait a brief moment for the hidden DOM to fully render images/fonts
        const capture = async () => {
            try {
                const pdf = new jsPDF({
                    orientation: config.orientation,
                    unit: 'mm',
                    format: 'a4'
                });

                const container = document.getElementById('hidden-full-year-container');
                if (!container) throw new Error("Container not found");

                const monthWrappers = container.children;
                
                for (let i = 0; i < monthWrappers.length; i++) {
                    const wrapper = monthWrappers[i] as HTMLElement;
                    // CRITICAL FIX: Target the inner card, not the wrapper, because wrapper has no bg or size constraints
                    const card = wrapper.querySelector('.calendar-card') as HTMLElement;
                    
                    if (!card) continue;

                    // Capture
                    const canvas = await html2canvas(card, {
                        scale: 2, // High res
                        useCORS: true,
                        allowTaint: true, // Allow external images (might taint canvas but better than blank)
                        backgroundColor: config.bgColor,
                        logging: false,
                        // Fix for scrolling/offscreen issues
                        windowWidth: card.scrollWidth,
                        windowHeight: card.scrollHeight,
                        x: 0,
                        y: 0
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 0.85);
                    
                    // Calculate sizing
                    const imgProps = pdf.getImageProperties(imgData);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                    // Add page (except for first page which is default)
                    if (i > 0) pdf.addPage();
                    
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                }

                // Save
                pdf.save(`Kalender_Lengkap_${year}.pdf`);

            } catch (error) {
                console.error("PDF Full Generation Error", error);
                alert("Gagal membuat PDF Lengkap. Pastikan gambar sudah termuat.");
            } finally {
                // Reset states
                setIsDownloadingFull(false);
                setFullYearData(null);
            }
        };

        // Delay 1.5s to ensure images inside the hidden div are painted
        setTimeout(capture, 1500);
    }
  }, [fullYearData, config]);


  return (
    // Main Container with Split Layout for Desktop
    <div className="flex h-screen w-full overflow-hidden font-sans bg-gray-100 app-container relative">
      
      {/* 1. Desktop Sidebar (Hidden on Mobile) */}
      <aside 
        className={`
            hidden lg:block h-full bg-white transition-all duration-300 ease-in-out shadow-xl border-r z-40 relative
            ${isDesktopSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}
        `}
      >
        <ControlPanel 
            config={config} 
            setConfig={setConfig} 
            currentMonth={month}
            currentYear={year}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
            onGenerateAIBackground={handleGenerateAIBackground}
            onGenerateYear={handleGenerateYear}
            onRemoveImage={handleRemoveImage}
            onUploadImage={handleUploadImage}
            isGeneratingAI={isGeneratingAI}
            generationProgress={generationProgress}
            quote={quote}
            onQuoteChange={setQuote}
            onDownloadFull={handleDownloadFull}
            isDownloadingFull={isDownloadingFull}
        />
      </aside>

      {/* Desktop Sidebar Toggle Button */}
      <button 
        onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
        className={`
          hidden lg:flex items-center justify-center
          absolute top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all
          ${isDesktopSidebarOpen ? 'translate-x-[320px]' : 'translate-x-0'}
        `}
        title={isDesktopSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
      >
         {isDesktopSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
      </button>

      {/* 2. Main Preview Area */}
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative bg-gray-200">
          <CalendarView 
            year={year} 
            month={month} 
            days={days} 
            config={config} 
            quote={quote}
            onMonthChange={handleMonthChange}
            defaultBgUrl={DEFAULT_BG_URL}
          />

          {/* 3. Mobile Bottom Navigation Bar (Hidden on Desktop) */}
          <div className="lg:hidden absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 pb-6 z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
             <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
                 {/* Prev */}
                 <button 
                   onClick={() => handleMonthChange(-1)}
                   className="p-3 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-700 transition-colors"
                 >
                    <ChevronLeft className="w-6 h-6" />
                 </button>

                 {/* Edit / Main Action */}
                 <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                 >
                    <Settings2 className="w-5 h-5" />
                    <span className="font-bold text-sm">Edit Kalender {year}</span>
                 </button>

                 {/* Next */}
                 <button 
                    onClick={() => handleMonthChange(1)}
                    className="p-3 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-700 transition-colors"
                 >
                    <ChevronRight className="w-6 h-6" />
                 </button>
             </div>
          </div>
      </main>

      {/* 4. Mobile Bottom Sheet / Drawer (Overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            
            {/* Drawer Content */}
            <div className="relative bg-white w-full h-[85vh] rounded-t-[2rem] shadow-2xl flex flex-col animate-slide-up overflow-hidden">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>
                <ControlPanel 
                    config={config} 
                    setConfig={setConfig} 
                    currentMonth={month}
                    currentYear={year}
                    onMonthChange={handleMonthChange}
                    onYearChange={handleYearChange}
                    onGenerateAIBackground={handleGenerateAIBackground}
                    onGenerateYear={handleGenerateYear}
                    onRemoveImage={handleRemoveImage}
                    onUploadImage={handleUploadImage}
                    isGeneratingAI={isGeneratingAI}
                    generationProgress={generationProgress}
                    quote={quote}
                    onQuoteChange={setQuote}
                    onDownloadFull={handleDownloadFull}
                    isDownloadingFull={isDownloadingFull}
                    onCloseMobile={() => setIsMobileMenuOpen(false)}
                />
            </div>
        </div>
      )}

      {/* Hidden Container for Full PDF Generation */}
      {isDownloadingFull && fullYearData && (
        <div 
            id="hidden-full-year-container" 
            style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0,
                width: '100%', 
                zIndex: -50, // Behind the main app background
                pointerEvents: 'none'
            }}
        >
             {fullYearData.map((data, index) => (
                // Wrapper with bottom margin just in case
                <div key={index} style={{ marginBottom: '50px' }}>
                    <CalendarView 
                        year={year}
                        month={data.month}
                        days={data.days}
                        config={config}
                        quote={data.quote}
                        onMonthChange={() => {}} // No-op
                        isExporting={true} // Enable export mode for clean layout
                        defaultBgUrl={DEFAULT_BG_URL}
                    />
                </div>
             ))}
        </div>
      )}

      {/* Global Loader Overlay */}
      {isDownloadingFull && (
          <div className="absolute inset-0 bg-black/50 z-[100] flex flex-col items-center justify-center text-white backdrop-blur-sm">
             <Loader2 className="w-12 h-12 animate-spin mb-4" />
             <h2 className="text-2xl font-bold">Sedang Membuat PDF...</h2>
          </div>
      )}

      <style>{`
        @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        .animate-slide-up {
            animation: slide-up 0.3s ease-out forwards;
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;