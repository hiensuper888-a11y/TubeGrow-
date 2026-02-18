
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  OPTIMIZER = 'OPTIMIZER',
  SCRIPT_WRITER = 'SCRIPT_WRITER',
  TREND_HUNTER = 'TREND_HUNTER',
  THUMBNAIL_RATER = 'THUMBNAIL_RATER',
  THUMBNAIL_MAKER = 'THUMBNAIL_MAKER',
  VIDEO_AUDIT = 'VIDEO_AUDIT',
  VIRAL_STRATEGY = 'VIRAL_STRATEGY',
  CHANNEL_MANAGER = 'CHANNEL_MANAGER',
  CHAT_ASSISTANT = 'CHAT_ASSISTANT',
  AI_STUDIO = 'AI_STUDIO'
}

export type Language = 'en' | 'vi' | 'zh' | 'ja';

export interface GeneratedContent {
  title?: string;
  content: string;
  type: 'text' | 'markdown' | 'json';
  meta?: any;
}

export interface ToolProps {
  isActive: boolean;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  likes: string;
  publishedAt: string;
  url: string;
}

export interface ChannelStats {
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  avatar: string;
  name: string;
}