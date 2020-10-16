import { PluginListenerHandle } from "@capacitor/core";

declare module "@capacitor/core" {
  interface PluginRegistry {
    NativeAudio: NativeAudioPlugin;
  }
}

export interface NativeAudioPlugin {
  /**
   * Load a file so that it is ready to play. This wipes away all previous info center information.
   */
  preload(options: PreloadOptions): Promise<void>;
  /**
   * Set the album art of the currently playing song.
   */
  setAlbumArt(options: { url: string }): Promise<void>;
  /**
   * Play the currently loaded song.
   */
  play(): Promise<void>;
  /**
   * Pause the currently loaded song.
   */
  pause(): Promise<void>;
  /**
   * Set the volume of the currently loaded song.
   */
  setVolume(options: { volume: number }): Promise<void>;
  /**
   * Get the time of the currently loaded song.
   */
  getCurrentTime(): Promise<{ currentTime: number }>;
  /**
   * Set the time of the currently loaded song.
   */
  setCurrentTime(opts: { currentTime: number }): Promise<void>;
  /**
   * Get the duration of the currently loaded song.
   */
  getDuration(): Promise<{ duration: number }>;
  /**
   * Pause the music and remove all data from the info center.
   */
  clearCache(): Promise<void>;
  stop(): Promise<void>;

  /**
   * Add a listener for one of the various events.
   *
   * complete -> the current song is complete
   * play -> the song should play
   * pause -> the song should pause
   * next -> the song should go to the next song
   * previous -> the song should go to the previous song
   * stop -> the song should stop playing and all state should be reset
   */
  addListener(
    eventName: "complete" | "play" | "pause" | "next" | "previous" | "stop",
    listenerFunc: () => void
  ): PluginListenerHandle;

  // TODO add iOS and client support
  /**
   * Add a listener for one of the various events.
   */
  addListener(
    eventName: "error",
    listenerFunc: (data: { message: string }) => void
  ): PluginListenerHandle;
}

export interface PreloadOptions {
  path: string;
  title: string;
  artist: string;
  album: string;
  // TODO add support to iOS
  /**
   * An https URL to your cover photo.
   */
  cover?: string;
  volume?: number;
}
