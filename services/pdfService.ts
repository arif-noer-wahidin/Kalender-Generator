import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CalendarConfig } from '../types';

export const generateSinglePDF = async (
  element: HTMLElement, 
  config: CalendarConfig, 
  monthName: string, 
  year: number
): Promise<void> => {
    // 1. Clone elemen agar tidak mengganggu tampilan asli
    const clone = element.cloneNode(true) as HTMLElement;
    
    // 2. Reset transformasi (scale) pada clone agar ukurannya murni A4 (794px / 1123px)
    clone.style.transform = 'none';
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.zIndex = '-9999';
    clone.style.margin = '0';
    
    // Paksa ukuran sesuai config pixel A4
    clone.style.width = element.style.width;
    clone.style.height = element.style.height;

    document.body.appendChild(clone);

    // Tunggu sebentar agar font/gambar di clone merender sempurna
    await new Promise(r => setTimeout(r, 100));

    try {
        const canvas = await html2canvas(clone, {
            scale: 2, // Kualitas tinggi
            useCORS: true,
            allowTaint: true,
            backgroundColor: config.bgColor,
            logging: false,
            windowWidth: clone.scrollWidth,
            windowHeight: clone.scrollHeight
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

    } catch (error) {
        console.error("PDF Generation Error:", error);
        throw error;
    } finally {
        // 3. Hapus clone
        if (document.body.contains(clone)) {
            document.body.removeChild(clone);
        }
    }
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

        // Clone setiap halaman
        const clone = card.cloneNode(true) as HTMLElement;
        clone.style.transform = 'none';
        clone.style.position = 'fixed';
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.zIndex = '-9999';
        clone.style.width = card.style.width;
        clone.style.height = card.style.height;

        document.body.appendChild(clone);
        
        // Wait for rendering
        await new Promise(r => setTimeout(r, 50));

        try {
            const canvas = await html2canvas(clone, {
                scale: 2, 
                useCORS: true,
                allowTaint: true, 
                backgroundColor: config.bgColor,
                logging: false,
                windowWidth: clone.scrollWidth,
                windowHeight: clone.scrollHeight
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        } finally {
            if (document.body.contains(clone)) {
                document.body.removeChild(clone);
            }
        }
    }

    pdf.save(`Kalender_Lengkap_${year}.pdf`);
};