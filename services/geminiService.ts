import { GoogleGenAI, Type } from "@google/genai";
import { PrayerPoint, Language } from "../types";

const CACHE_KEY_PREFIX = "pray4india_cache_";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for fast access
const memoryCache = new Map<Language, PrayerPoint>();

// Static, high-quality fallbacks for each language
const FALLBACK_PRAYERS: Record<string, PrayerPoint> = {
  'English': {
    region: 'Maharashtra',
    topic: 'Healthcare in Rural Communities',
    scripture: 'Jeremiah 30:17',
    prayerText: 'Lord, we pray for the strengthening of healthcare infrastructure in rural Maharashtra. Grant wisdom to medical professionals and provide healing to those without access to modern clinics.',
    language: 'English'
  },
  'Hindi': {
    region: 'उत्तर प्रदेश',
    topic: 'शिक्षा और युवा',
    scripture: 'नीतिवचन 2:6',
    prayerText: 'प्रभु, हम उत्तर प्रदेश के युवाओं के लिए प्रार्थना करते हैं। उन्हें सही शिक्षा और मार्गदर्शन मिले ताकि वे देश के उज्ज्वल भविष्य में योगदान दे सकें।',
    language: 'Hindi'
  },
  'French': {
    region: 'Pondichéry',
    topic: 'Harmonie Sociale',
    scripture: 'Matthieu 5:9',
    prayerText: 'Seigneur, nous prions pour l\'harmonie et la paix à Pondichéry. Que les communautés vivent ensemble dans le respect et l\'unité.',
    language: 'French'
  },
  'German': {
    region: 'Goa',
    topic: 'Umweltschutz',
    scripture: 'Genesis 2:15',
    prayerText: 'Herr, wir beten für den Schutz der natürlichen Schönheit Goas. Gib den Menschen ein Bewusstsein für die Bewahrung der Schöpfung.',
    language: 'German'
  },
  'Portuguese': {
    region: 'Kerala',
    topic: 'Educação para Todos',
    scripture: 'Salmos 119:105',
    prayerText: 'Senhor, oramos pelo sistema educacional em Kerala. Que cada criança tenha acesso ao conhecimento e ferramentas para um futuro digno.',
    language: 'Portuguese'
  },
  'Spanish': {
    region: 'Tamil Nadu',
    topic: 'Fortaleza Agrícola',
    scripture: 'Gálatas 6:9',
    prayerText: 'Señor, oramos por los agricultores de Tamil Nadu. Bendice sus cosechas y dales paciencia y provisión en tiempos de sequía.',
    language: 'Spanish'
  },
  'Italian': {
    region: 'Delhi',
    topic: 'Protezione Urbana',
    scripture: 'Salmi 121:8',
    prayerText: 'Signore, preghiamo per la sicurezza e il benessere di tutti gli abitanti di Delhi. Proteggi le famiglie e guida i leader cittadini.',
    language: 'Italian'
  },
  'Japanese': {
    region: 'ラージャスターン',
    topic: '水資源の保護',
    scripture: 'イザヤ書 41:18',
    prayerText: '主よ、ラージャスターンの水資源のために祈ります。乾いた地に恵みの雨を降らせ、人々に必要な水が供給されますように।',
    language: 'Japanese'
  },
  'Arabic': {
    region: 'كيرالا',
    topic: 'السلام المجتمعي',
    scripture: 'طوبى لصانعي السلام',
    prayerText: 'يا رب، نصلي من أجل السلام والوئام في كيرالا. بارك العائلات وامنحهم القوة لمواجهة التحديات اليومية.',
    language: 'Arabic'
  },
  'Chinese': {
    region: '旁遮普邦',
    topic: '农业丰收',
    scripture: '诗篇 67:6',
    prayerText: '主啊，我们为旁遮普邦的农民祷告。求你赐下丰沛的雨水，保佑庄稼丰收，让百姓衣食无忧。',
    language: 'Chinese'
  }
};

const getFromStorage = (lang: Language): PrayerPoint | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${lang}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Storage access failed", e);
  }
  return null;
};

const saveToStorage = (lang: Language, data: PrayerPoint) => {
  try {
    localStorage.setItem(
      `${CACHE_KEY_PREFIX}${lang}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (e) {
    console.warn("Storage write failed", e);
  }
};

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, initialDelay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED";
      if (isRateLimit) {
        // If it's a 429, don't keep hammering the API if we've already tried.
        if (i > 0) break;
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

export const generateSamplePrayerPoint = async (language: Language): Promise<PrayerPoint> => {
  // 1. Check memory cache
  if (memoryCache.has(language)) {
    return memoryCache.get(language)!;
  }

  // 2. Check localStorage cache
  const stored = getFromStorage(language);
  if (stored) {
    memoryCache.set(language, stored);
    return stored;
  }

  // 3. Attempt API call
  try {
    return await withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate a modern, impactful daily prayer point for India. 
      The prayer should focus on a specific region or social aspect.
      Include a relevant Bible verse reference. 
      The output MUST be in ${language}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              region: { type: Type.STRING },
              topic: { type: Type.STRING },
              scripture: { type: Type.STRING },
              prayerText: { type: Type.STRING },
              language: { type: Type.STRING }
            },
            required: ["region", "topic", "scripture", "prayerText", "language"]
          }
        }
      });

      const result = JSON.parse(response.text.trim()) as PrayerPoint;
      memoryCache.set(language, result);
      saveToStorage(language, result);
      return result;
    });
  } catch (error) {
    // 4. Return high-quality localized fallback
    const fallback = FALLBACK_PRAYERS[language] || FALLBACK_PRAYERS['English'];
    memoryCache.set(language, fallback);
    return fallback;
  }
};