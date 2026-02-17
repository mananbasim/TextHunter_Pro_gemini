
export interface SessionRecord {
  id: string;
  result: 'A' | 'B' | 'C';
  winners: number;
  prize: string;
}

export interface TextSnippet {
  id: string;
  content: string;
  timestamp: number;
  title: string;
  type: 'Auto' | 'Manual';
  records?: SessionRecord[];
}

export enum AppView {
  HOME = 'HOME',
  SCAN = 'SCAN',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS',
  SESSION_DETAIL = 'SESSION_DETAIL',
  ORBITAL = 'ORBITAL'
}
