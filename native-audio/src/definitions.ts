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
   * Play the currently loaded song.
   */
  play(): Promise<void>;
  /**
   * Pause the currently loaded song.
   */
  pause(): Promise<void>;
  /**
   * Pause the music and remove all data from the info center.
   */
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
    eventName: "play" | "pause" | "next" | "previous" | "stop",
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
  title: string;
  artist: string;
  album: string;
  /**
   * An https URL to your cover photo.
   */
  cover?: string;
}
