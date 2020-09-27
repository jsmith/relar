declare module "cordova-plugin-music-controls2/www/MusicControls" {
  export interface MusicControlsCreateOptions {
    artist?: string;
    track?: string;
    album?: string;
    cover?: string;
    ticker?: string;
    duration?: number;
    elapsed?: number;
    isPlaying?: boolean;
    hasPrev?: boolean;
    hasNext?: boolean;
    hasSkipForward?: boolean;
    hasSkipBackward?: boolean;
    hasScrubbing?: boolean;
    skipForwardInterval?: number;
    skipBackwardInterval?: number;
    hasClose?: boolean;
    dismissable?: boolean;
    playIcon?: string;
    pauseIcon?: string;
    prevIcon?: string;
    nextIcon?: string;
    closeIcon?: string;
    notificationIcon?: string;
  }

  interface MusicControls {
    create: (options: MusicControlsCreateOptions) => void;
  }

  export default MusicControls;
}
