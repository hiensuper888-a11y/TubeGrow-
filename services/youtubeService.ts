import { ChannelStats, YouTubeVideo } from "../types";

// This file now interacts with the Real YouTube Data API v3

/**
 * Fetches the authenticated user's channel statistics.
 * Requires a valid OAuth 2.0 Access Token with 'https://www.googleapis.com/auth/youtube.readonly' scope.
 */
export const getRealChannelStats = async (accessToken: string): Promise<ChannelStats> => {
  try {
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch channel');
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('No YouTube channel found for this Google account.');
    }

    const item = data.items[0];
    
    // Format numbers
    const formatCount = (numStr: string) => {
        const num = parseInt(numStr);
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return numStr;
    };

    return {
      name: item.snippet.title,
      subscriberCount: formatCount(item.statistics.subscriberCount),
      viewCount: formatCount(item.statistics.viewCount),
      videoCount: item.statistics.videoCount,
      avatar: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
    };

  } catch (error) {
    console.error("YouTube API Error (Channel):", error);
    throw error;
  }
};

/**
 * Fetches the latest videos from the user's channel.
 */
export const getRealChannelVideos = async (accessToken: string): Promise<YouTubeVideo[]> => {
  try {
    // 1. We search for videos "forMine" (owned by the authenticated user)
    // Order by date to get recent ones.
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=8&order=date',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) throw new Error('Failed to fetch videos');

    const data = await response.json();
    
    if (!data.items) return [];

    // The search endpoint doesn't return view counts. 
    // We need to fetch details for these video IDs to get statistics.
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    
    if(!videoIds) return [];

    const statsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}`,
        {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
        }
    );
    
    const statsData = await statsResponse.json();
    const statsMap = new Map();
    if(statsData.items) {
        statsData.items.forEach((item: any) => {
            statsMap.set(item.id, item.statistics);
        });
    }

    // Map response to our App Type
    return data.items.map((item: any) => {
      const stats = statsMap.get(item.id.videoId) || {};
      
      const formatCount = (num: string) => {
        if(!num) return '0';
        const n = parseInt(num);
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return num;
      };

      // Calculate relative time
      const date = new Date(item.snippet.publishedAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      let timeString = `${diffDays} days ago`;
      if(diffDays > 30) timeString = `${Math.floor(diffDays/30)} months ago`;
      if(diffDays === 1) timeString = `Yesterday`;
      if(diffDays === 0) timeString = `Today`;

      return {
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        views: formatCount(stats.viewCount) + ' views',
        likes: formatCount(stats.likeCount),
        publishedAt: timeString,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      };
    });

  } catch (error) {
    console.error("YouTube API Error (Videos):", error);
    return []; // Return empty array on error to prevent app crash
  }
};

// Deprecated Mock functions (kept for fallback if needed, but not used in new flow)
export const connectChannel = async (): Promise<ChannelStats> => { return {} as any; };
export const getChannelVideos = async (): Promise<YouTubeVideo[]> => { return []; };
