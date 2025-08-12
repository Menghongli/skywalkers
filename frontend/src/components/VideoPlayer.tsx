import React, { useState } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title, className = '' }) => {
  const [error, setError] = useState<string | null>(null);

  // Function to extract video ID from various YouTube URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Function to check if URL is a YouTube URL
  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Function to check if URL is a direct video file
  const isDirectVideoUrl = (url: string): boolean => {
    return /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(url);
  };

  const renderVideoPlayer = () => {
    if (isYouTubeUrl(videoUrl)) {
      const videoId = getYouTubeVideoId(videoUrl);
      if (!videoId) {
        return (
          <div className="video-error">
            Invalid YouTube URL format
          </div>
        );
      }
      
      return (
        <div className="video-container">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={title || 'Game Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={() => setError('Failed to load YouTube video')}
          ></iframe>
        </div>
      );
    } else if (isDirectVideoUrl(videoUrl)) {
      return (
        <div className="video-container">
          <video 
            controls 
            preload="metadata"
            onError={() => setError('Failed to load video file')}
          >
            <source src={videoUrl} type="video/mp4" />
            <source src={videoUrl} type="video/webm" />
            <source src={videoUrl} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else {
      return (
        <div className="video-link-container">
          <p>External video link:</p>
          <a 
            href={videoUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="video-external-link"
          >
            Open Video in New Tab
          </a>
        </div>
      );
    }
  };

  if (error) {
    return (
      <div className="video-error-container">
        <div className="video-error">{error}</div>
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="video-fallback-link"
        >
          Open Video Link
        </a>
      </div>
    );
  }

  return (
    <div className={`video-player ${className}`}>
      <div className="video-expanded">
        {renderVideoPlayer()}
      </div>
    </div>
  );
};

export default VideoPlayer;