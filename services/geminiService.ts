// This service no longer uses Google GenAI to avoid Quota limits.
// It uses a Bing Proxy for images and local static data for quotes.

// Function to search for REAL images from the web using a search proxy.
export const generateBackgroundImage = async (prompt: string): Promise<string> => {
  // Simulate network delay for "search" feel
  await new Promise(resolve => setTimeout(resolve, 500));

  // If the user inputs a URL directly, use it.
  if (prompt.startsWith('http')) {
      return prompt;
  }

  // Randomize cache buster
  const randomId = Math.floor(Math.random() * 10000);

  // We use a search proxy that retrieves real images from the web (Bing Image Search backend).
  const query = encodeURIComponent(`${prompt} wallpaper aesthetic`);
  
  // Parameters:
  // q: query
  // w: width (1200px for high quality)
  // rs: resample (1 for better quality)
  // pid: ImgDetMain (Main image detail view)
  const seed = new Date().getTime() + randomId; 
  
  return `https://tse2.mm.bing.net/th?q=${query}&w=1200&rs=1&pid=ImgDetMain&dt=${seed}`;
};

const STATIC_QUOTES: Record<string, string[]> = {
  default: [
    "Rencanakan hari esok, syukuri hari ini.",
    "Jadikan setiap hari bermakna.",
    "Semangat baru, harapan baru.",
    "Mimpi besar dimulai dari langkah kecil.",
    "Kebahagiaan sederhana adalah kuncinya."
  ],
  Januari: ["Awal baru, semangat baru.", "Tulislah cerita indah tahun ini."],
  Februari: ["Cinta dan kasih sayang untuk semua.", "Bulan penuh harapan manis."],
  Maret: ["Teruslah tumbuh dan berkembang.", "Mekarlah seperti bunga di musim semi."],
  April: ["Hujan membawa pelangi kehidupan.", "Tetap tenang dan terus berkarya."],
  Mei: ["Kerja keras membuahkan hasil.", "Wujudkan mimpimu bulan ini."],
  Juni: ["Nikmati hangatnya matahari.", "Jadilah sinar bagi sekitarmu."],
  Juli: ["Pertengahan tahun, semangat tetap membara.", "Fokus pada tujuanmu."],
  Agustus: ["Merdeka dalam berkarya.", "Semangat juang tak pernah padam."],
  September: ["Perubahan membawa kebaikan.", "Sambut musim baru dengan senyum."],
  Oktober: ["Ketenangan jiwa adalah kekuatan.", "Warna warni kehidupan itu indah."],
  November: ["Bersyukur atas segala nikmat.", "Hargai setiap proses perjalanan."],
  Desember: ["Akhiri dengan indah, mulai dengan harapan.", "Kenangan manis penutup tahun."]
};

export const generateMotivationalQuote = async (month: string): Promise<string> => {
   // Return a random quote based on the month (Static, no API call)
   const quotes = STATIC_QUOTES[month] || STATIC_QUOTES['default'];
   const randomIndex = Math.floor(Math.random() * quotes.length);
   return quotes[randomIndex];
};