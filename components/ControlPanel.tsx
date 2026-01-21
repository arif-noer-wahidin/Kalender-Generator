import React, { useState } from 'react';
import { CalendarConfig } from '../types';
import { Palette, Layout, Calendar as CalendarIcon, Type, Search, Download, SlidersHorizontal, ImageMinus, RectangleHorizontal, RectangleVertical, Sparkles, ALargeSmall, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, AlignVerticalJustifyCenter, Upload, ExternalLink, Link as LinkIcon, Globe, CircleDashed, Grid3x3, Scan, Quote, Loader2, FileCheck, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ControlPanelProps {
  config: CalendarConfig;
  setConfig: React.Dispatch<React.SetStateAction<CalendarConfig>>;
  currentMonth: number;
  currentYear: number;
  onMonthChange: (delta: number) => void;
  onYearChange: (year: number) => void;
  onGenerateAIBackground: (prompt: string) => void;
  onGenerateYear: () => void;
  onRemoveImage: () => void;
  onUploadImage: (file: File) => void;
  isGeneratingAI: boolean;
  generationProgress: { current: number, total: number } | null;
  quote: string;
  onQuoteChange: (text: string) => void;
  onDownloadFull: () => void;
  isDownloadingFull: boolean;
  onCloseMobile?: () => void; // New prop for closing mobile drawer
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const ControlPanel: React.FC<ControlPanelProps> = ({ config, setConfig, currentMonth, currentYear, onMonthChange, onYearChange, onGenerateAIBackground, onGenerateYear, onRemoveImage, onUploadImage, isGeneratingAI, generationProgress, quote, onQuoteChange, onDownloadFull, isDownloadingFull, onCloseMobile }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [isDownloadingSingle, setIsDownloadingSingle] = useState(false);

  const handleChange = <K extends keyof CalendarConfig>(key: K, value: CalendarConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleDownloadSinglePDF = async () => {
    const element = document.querySelector('.calendar-card') as HTMLElement;
    if (!element) {
        alert("Element kalender tidak ditemukan.");
        return;
    }

    setIsDownloadingSingle(true);

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: config.bgColor,
            logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF({
            orientation: config.orientation,
            unit: 'mm',
            format: 'a4'
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        const fileName = `Kalender_${config.layout === 'fullyear' ? 'Full' : MONTH_NAMES[currentMonth]}_${currentYear}.pdf`;
        pdf.save(fileName);

    } catch (error) {
        console.error("Gagal membuat PDF:", error);
        alert("Terjadi kesalahan saat membuat PDF.");
    } finally {
        setIsDownloadingSingle(false);
    }
  };

  const handleOpenGoogleSearch = () => {
    if (!searchKeyword) return;
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchKeyword)}`;
    window.open(url, '_blank');
  };

  const handleApplyUrl = () => {
    if (directUrl) {
        onGenerateAIBackground(directUrl);
        setDirectUrl('');
    }
  };

  const currentBgImage = config.bgImages[currentMonth] || config.bgImages['default'];

  return (
    <div className="w-full h-full bg-white flex flex-col no-print">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg shadow-md shadow-indigo-200">
            <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight leading-none">Editor</h1>
            <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase mt-0.5">Kalender {currentYear}</p>
            </div>
        </div>
        
        {/* Close Button for Mobile Drawer */}
        {onCloseMobile && (
            <button 
                onClick={onCloseMobile}
                className="lg:hidden p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 pb-24 lg:pb-5">
        
        {/* Date Navigation - Only show on Desktop here, mobile has it in bottom bar */}
        <div className="space-y-2 hidden lg:block">
            {/* Year Selector */}
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200">
                <button 
                onClick={() => onYearChange(currentYear - 1)}
                className="p-1 hover:bg-white rounded text-gray-600"
                >
                <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-gray-700">{currentYear}</span>
                <button 
                onClick={() => onYearChange(currentYear + 1)}
                className="p-1 hover:bg-white rounded text-gray-600"
                >
                <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Month Navigation */}
            <div className={`flex items-center justify-between bg-indigo-50/50 p-2 rounded-xl border border-indigo-100 ${config.layout === 'fullyear' ? 'opacity-50 pointer-events-none' : ''}`}>
            <button 
                onClick={() => onMonthChange(-1)} 
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-indigo-900"
                title="Bulan Sebelumnya"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-indigo-900 uppercase tracking-wide">
                {config.layout === 'fullyear' ? 'Semua Bulan' : MONTH_NAMES[currentMonth]}
            </span>
            <button 
                onClick={() => onMonthChange(1)} 
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-indigo-900"
                title="Bulan Berikutnya"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
            </div>
        </div>

        {/* Main Actions */}
        <div className="space-y-3">
            {/* Full Download Button */}
            <button 
                onClick={onDownloadFull}
                disabled={isDownloadingFull || isDownloadingSingle || config.layout === 'fullyear'}
                className={`w-full flex items-center justify-between gap-2 py-3 px-4 rounded-xl transition-all shadow-md text-sm font-bold transform hover:-translate-y-0.5 active:translate-y-0 ${isDownloadingFull || config.layout === 'fullyear' ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-200'}`}
            >
                <div className="flex items-center gap-2">
                    {isDownloadingFull ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5" />}
                    <div className="text-left">
                        <div className="leading-none">Download Full PDF</div>
                        <div className="text-[9px] font-normal opacity-90 mt-1">
                            {config.layout === 'fullyear' ? 'Mode 1 Tahun Aktif' : 'Gabung 12 Bulan'}
                        </div>
                    </div>
                </div>
            </button>

            {/* Single Download Button */}
            <button 
                onClick={handleDownloadSinglePDF}
                disabled={isDownloadingFull || isDownloadingSingle}
                className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all border text-xs font-semibold ${isDownloadingSingle ? 'bg-gray-100 text-gray-400' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
                {isDownloadingSingle ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                {config.layout === 'fullyear' ? 'Download PDF 1 Tahun' : 'Download Bulan Ini'}
            </button>
        </div>

        {/* Layout Selection */}
        <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Layout className="w-3.5 h-3.5" /> Tata Letak
            </h2>
            
            {/* Orientation Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-2">
                <button 
                onClick={() => handleChange('orientation', 'portrait')}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold transition-all border ${config.orientation === 'portrait' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-100 text-gray-500'}`}
                >
                <RectangleVertical className="w-3 h-3" /> Potrait
                </button>
                <button 
                onClick={() => handleChange('orientation', 'landscape')}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold transition-all border ${config.orientation === 'landscape' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-100 text-gray-500'}`}
                >
                <RectangleHorizontal className="w-3 h-3" /> Landscape
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
            {[
                { id: 'fullyear', label: '1 Tahun', desc: '1 Lembar A4' },
                { id: 'wall', label: 'Dinding', desc: 'Gambar Atas' },
                { id: 'side', label: 'Samping', desc: 'Gambar Kiri' },
                { id: 'minimal', label: 'Minimalis', desc: 'Clean Modern' },
                { id: 'elegant', label: 'Elegan', desc: 'Kartu Kaca' },
                { id: 'poster', label: 'Poster', desc: 'Tipografi' },
            ].map((layout) => (
                <button
                key={layout.id}
                onClick={() => handleChange('layout', layout.id as any)}
                className={`p-2.5 rounded-lg border text-left transition-all relative overflow-hidden ${
                    config.layout === layout.id 
                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' 
                    : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                }`}
                >
                <div className={`text-xs font-bold relative z-10 ${config.layout === layout.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {layout.label}
                </div>
                <div className="text-[9px] text-gray-400 relative z-10">{layout.desc}</div>
                </button>
            ))}
            </div>
        </div>

        {/* Automation Section */}
        <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" /> Background AI
            </h2>
            
            {isGeneratingAI && generationProgress ? (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-blue-800">Generate 12 Bulan...</span>
                    <span className="text-xs text-blue-600 font-mono">{generationProgress.current}/{generationProgress.total}</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                    <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                    ></div>
                </div>
            </div>
            ) : (
            <button 
                onClick={onGenerateYear}
                disabled={isGeneratingAI}
                className="w-full flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-200 group"
            >
                <div className="text-left">
                <div className="text-xs font-bold flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Generate 12 Bulan
                </div>
                <div className="text-[10px] text-blue-100 opacity-90">Auto-Search Gambar Estetik</div>
                </div>
                <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                <Sparkles className="w-4 h-4" />
                </div>
            </button>
            )}
        </div>

        {/* Customize Sliders */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Kustomisasi
            </h2>
            
            {/* Font Scale Slider */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                    <span className="flex items-center gap-1"><Type className="w-3 h-3" /> Skala Font</span>
                    <span>{(config.fontScale * 100).toFixed(0)}%</span>
                </div>
                <input 
                type="range" 
                min="0.5" 
                max="1.5" 
                step="0.05"
                value={config.fontScale || 1}
                onChange={(e) => handleChange('fontScale', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
            </div>

            {/* Radius Slider */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                    <span className="flex items-center gap-1"><CircleDashed className="w-3 h-3" /> Radius Sudut</span>
                    <span>{config.borderRadius}px</span>
                </div>
                <input 
                type="range" 
                min="0" 
                max="24" 
                step="2"
                value={config.borderRadius}
                onChange={(e) => handleChange('borderRadius', parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
            </div>

            {/* Grid Gap Slider */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                    <span className="flex items-center gap-1"><Grid3x3 className="w-3 h-3" /> Jarak Grid</span>
                    <span>{config.gridGap}px</span>
                </div>
                <input 
                type="range" 
                min="0" 
                max="12" 
                step="1"
                value={config.gridGap}
                onChange={(e) => handleChange('gridGap', parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
            </div>

            {/* Shadow Slider */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                    <span className="flex items-center gap-1"><Scan className="w-3 h-3" /> Bayangan</span>
                    <span>{(config.shadowIntensity * 100).toFixed(0)}%</span>
                </div>
                <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={config.shadowIntensity}
                onChange={(e) => handleChange('shadowIntensity', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
            </div>
        </div>

        {/* Text & Styling */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <ALargeSmall className="w-3.5 h-3.5" /> Teks & Warna
            </h2>
            
            {/* Title Input */}
            <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500">Judul Utama</label>
            <input 
                type="text"
                value={config.titleText}
                onChange={(e) => handleChange('titleText', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            </div>

            {/* Quote Input */}
            <div className="space-y-1">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-500">Kutipan / Quote</label>
                <Quote className="w-3 h-3 text-gray-400" />
            </div>
            <textarea 
                value={quote}
                onChange={(e) => onQuoteChange(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none min-h-[60px] resize-y"
                placeholder="Masukkan kutipan..."
            />
            </div>

            {/* Font Family */}
            <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500">Jenis Font</label>
            <div className="grid grid-cols-3 gap-1">
                <button 
                    onClick={() => handleChange('fontFamily', 'serif')}
                    className={`text-[10px] py-1 border rounded ${config.fontFamily === 'serif' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600'}`}
                >Serif</button>
                <button 
                    onClick={() => handleChange('fontFamily', 'sans')}
                    className={`text-[10px] py-1 border rounded ${config.fontFamily === 'sans' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600'}`}
                >Sans</button>
                <button 
                    onClick={() => handleChange('fontFamily', 'mono')}
                    className={`text-[10px] py-1 border rounded ${config.fontFamily === 'mono' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600'}`}
                >Mono</button>
            </div>
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">Warna Teks</label>
                <div className="flex items-center gap-2">
                    <input 
                    type="color" 
                    value={config.textColor}
                    onChange={(e) => handleChange('textColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-[10px] text-gray-400 font-mono">{config.textColor}</span>
                </div>
                </div>
                <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">Warna Judul</label>
                <div className="flex items-center gap-2">
                    <input 
                    type="color" 
                    value={config.titleColor || config.textColor}
                    onChange={(e) => handleChange('titleColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-[10px] text-gray-400 font-mono">{config.titleColor || config.textColor}</span>
                </div>
                </div>
            </div>

            {/* Overlay Controls */}
            <div className="space-y-2 mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-500">Warna Overlay</label>
                <div className="flex bg-gray-100 rounded-md p-0.5">
                    <button 
                    onClick={() => handleChange('overlayColor', 'white')}
                    className={`px-2 py-0.5 rounded text-[10px] ${config.overlayColor === 'white' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                    >Putih</button>
                    <button 
                    onClick={() => handleChange('overlayColor', 'black')}
                    className={`px-2 py-0.5 rounded text-[10px] ${config.overlayColor === 'black' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                    >Hitam</button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3 h-3 text-gray-400" />
                <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={config.overlayOpacity}
                onChange={(e) => handleChange('overlayOpacity', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                title="Transparansi Overlay"
                />
            </div>
            </div>
        </div>

        {/* Manual Customization */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Palette className="w-3.5 h-3.5" /> Gambar Manual
            </h2>
            
            {/* Upload Button */}
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-500">Upload dari Perangkat</label>
            <label className="flex items-center justify-center gap-2 bg-white border border-dashed border-gray-300 hover:border-indigo-500 hover:text-indigo-600 text-gray-500 p-2.5 rounded-lg cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span className="text-xs font-bold">Pilih File Gambar</span>
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                            if(e.target.files && e.target.files[0]) {
                                onUploadImage(e.target.files[0]);
                            }
                        }}
                    />
            </label>
            </div>
            
            {/* Web Search Section */}
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-500">Cari di Web / Google</label>
            
            <input 
                type="text" 
                placeholder="1. Ketik kata kunci..." 
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onGenerateAIBackground(searchKeyword)}
            />

            <div className="grid grid-cols-2 gap-2">
                {/* Auto Proxy Search */}
                <button 
                    onClick={() => onGenerateAIBackground(searchKeyword)}
                    disabled={isGeneratingAI || !searchKeyword}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-1.5 rounded transition-colors text-xs font-semibold flex items-center justify-center gap-1"
                    title="Cari gambar otomatis menggunakan proxy"
                >
                    {isGeneratingAI && !generationProgress ? <span className="animate-spin text-xs">⌛</span> : <Search className="w-3 h-3" />}
                    Cari Auto
                </button>

                {/* Open Google Images */}
                <button 
                    onClick={handleOpenGoogleSearch}
                    disabled={!searchKeyword}
                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 p-1.5 rounded transition-colors text-xs font-semibold flex items-center justify-center gap-1"
                    title="Buka tab baru ke Google Images"
                >
                    <ExternalLink className="w-3 h-3" />
                    Buka Google
                </button>
            </div>
            
            {/* Paste URL Section */}
            <div className="mt-2 pt-2 border-t border-gray-200">
                <label className="text-[9px] text-gray-400 mb-1 block">2. Atau paste link gambar</label>
                <div className="flex gap-1">
                    <input 
                        type="text" 
                        placeholder="https://..." 
                        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        value={directUrl}
                        onChange={(e) => setDirectUrl(e.target.value)}
                    />
                    <button 
                        onClick={handleApplyUrl}
                        disabled={!directUrl}
                        className="bg-gray-800 hover:bg-black text-white p-1.5 rounded transition-colors disabled:opacity-50"
                    >
                        <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {currentBgImage && (
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-200">
                    <span className="text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">Gambar Aktif</span>
                    <button 
                    onClick={onRemoveImage}
                    className="text-xs text-red-500 hover:underline flex items-center gap-1"
                    >
                    <ImageMinus className="w-3 h-3" /> Hapus
                    </button>
                </div>
            )}
            </div>

            {/* Image Position & Fit */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500">Posisi & Ukuran Gambar</label>
                <div className="grid grid-cols-2 gap-2">
                    {/* Position Controls */}
                    <div className="bg-gray-100 p-1 rounded-md flex justify-center gap-1">
                        <button 
                            onClick={() => handleChange('imagePosition', 'top')}
                            className={`p-1 rounded hover:bg-white ${config.imagePosition === 'top' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                            title="Rata Atas"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleChange('imagePosition', 'center')}
                            className={`p-1 rounded hover:bg-white ${config.imagePosition === 'center' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                            title="Rata Tengah"
                        >
                            <AlignVerticalJustifyCenter className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleChange('imagePosition', 'bottom')}
                            className={`p-1 rounded hover:bg-white ${config.imagePosition === 'bottom' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                            title="Rata Bawah"
                        >
                            <ArrowDown className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Fit Controls */}
                    <div className="bg-gray-100 p-1 rounded-md flex justify-center gap-1">
                        <button 
                            onClick={() => handleChange('imageFit', 'cover')}
                            className={`flex-1 flex items-center justify-center p-1 rounded hover:bg-white text-[10px] font-bold ${config.imageFit === 'cover' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                            title="Penuh"
                        >
                            Penuh
                        </button>
                        <button 
                            onClick={() => handleChange('imageFit', 'contain')}
                            className={`flex-1 flex items-center justify-center p-1 rounded hover:bg-white text-[10px] font-bold ${config.imageFit === 'contain' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                            title="Utuh"
                        >
                            Utuh
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;