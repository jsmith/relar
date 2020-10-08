import { PluginListenerHandle } from "@capacitor/core";

declare module "@capacitor/core" {
  interface PluginRegistry {
    NativeAudio: NativeAudioPlugin;
  }
}

export interface NativeAudioPlugin {
  preload(options: PreloadOptions): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  setVolume(options: { volume: number }): Promise<void>;
  getCurrentTime(): Promise<{ currentTime: number }>;
  setCurrentTime(opts: { currentTime: number }): Promise<void>;
  getDuration(): Promise<{ duration: number }>;
  addListener(
    eventName: "complete",
    listenerFunc: () => void
  ): PluginListenerHandle;
}

export interface PreloadOptions {
  path: string;
  volume?: number;
}
