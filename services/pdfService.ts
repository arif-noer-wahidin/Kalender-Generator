import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CalendarConfig } from '../types';

export const generateSinglePDF = async (
  element: HTMLElement, 
  config: CalendarConfig, 
  monthName: string, 
  year: number
): Promise<void> => {
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
    
    const fileName = `Kalender_${config.layout === 'fullyear' ? 'Full' : monthName}_${year}.pdf`;
    pdf.save(fileName);
};

export const generateFullYearPDF = async (
  containerId: string,
  config: CalendarConfig,
  year: number
): Promise<void> => {
    const pdf = new jsPDF({
        orientation: config.orientation,
        unit: 'mm',
        format: 'a4'
    });

    const container = document.getElementById(containerId);
    if (!container) throw new Error("Container elemen PDF tidak ditemukan");

    const monthWrappers = container.children;
    
    for (let i = 0; i < monthWrappers.length; i++) {
        const wrapper = monthWrappers[i] as HTMLElement;
        const card = wrapper.querySelector('.calendar-card') as HTMLElement;
        
        if (!card) continue;

        const canvas = await html2canvas(card, {
            scale: 2, 
            useCORS: true,
            allowTaint: true, 
            backgroundColor: config.bgColor,
            logging: false,
            windowWidth: card.scrollWidth,
            windowHeight: card.scrollHeight,
            x: 0,
            y: 0
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (i > 0) pdf.addPage();
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(`Kalender_Lengkap_${year}.pdf`);
};