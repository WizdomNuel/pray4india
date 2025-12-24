
export interface PrayerPoint {
  region: string;
  topic: string;
  scripture: string;
  prayerText: string;
  language: string;
}

export type Language = 
  | 'English' 
  | 'Hindi' 
  | 'French' 
  | 'German' 
  | 'Portuguese' 
  | 'Spanish'
  | 'Italian'
  | 'Japanese'
  | 'Arabic'
  | 'Chinese';

export const LANGUAGES: Language[] = [
  'English', 
  'Hindi', 
  'French', 
  'German', 
  'Portuguese', 
  'Spanish', 
  'Italian', 
  'Japanese', 
  'Arabic', 
  'Chinese'
];