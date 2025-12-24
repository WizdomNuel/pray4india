
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
  | 'Chinese'
  | 'Pidgin'
  | 'Urdu'
  | 'Korean';

export const LANGUAGES: Language[] = [
  'English',
  'Hindi',
  'French',
  'German',
  'Portuguese',
  'Chinese',
  'Pidgin',
  'Urdu',
  'Korean'
];