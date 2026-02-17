import { ChannelStats, YouTubeVideo } from "../types";

// NOTE: In a production environment, you would use the Google API Client Library (gapi)
// or the YouTube Data API v3 endpoints directly with an OAuth2 token.
// Since we are client-side only without a backend for secure token exchange,
// we are mocking this service to demonstrate the UI/UX flow.

export const connectChannel = async (): Promise<ChannelStats> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: "Mr. Creator's Studio",
        subscriberCount: "12.5K",
        viewCount: "1,204,500",
        videoCount: "48",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
      });
    }, 1500); // Simulate network delay
  });
};

export const getChannelVideos = async (): Promise<YouTubeVideo[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "1",
          title: "How to Grow Your YouTube Channel in 2024 (Zero to Hero)",
          thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop",
          views: "45.2K",
          likes: "2.1K",
          publishedAt: "2 days ago",
          url: "https://www.youtube.com/watch?v=mock_id_1"
        },
        {
          id: "2",
          title: "Stop Making These 5 Thumbnail Mistakes!",
          thumbnail: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?q=80&w=1000&auto=format&fit=crop",
          views: "12.8K",
          likes: "850",
          publishedAt: "1 week ago",
          url: "https://www.youtube.com/watch?v=mock_id_2"
        },
        {
          id: "3",
          title: "I Tried AI for 30 Days - Here's What Happened",
          thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
          views: "89.1K",
          likes: "5.4K",
          publishedAt: "2 weeks ago",
          url: "https://www.youtube.com/watch?v=mock_id_3"
        },
        {
          id: "4",
          title: "Best Camera Settings for Cinematic Video",
          thumbnail: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop",
          views: "5.6K",
          likes: "320",
          publishedAt: "3 weeks ago",
          url: "https://www.youtube.com/watch?v=mock_id_4"
        }
      ]);
    }, 1000);
  });
};