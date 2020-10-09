import { WebPlugin } from "@capacitor/core";
import { NativeAudioPlugin, PreloadOptions } from "./definitions";

export class NativeAudioWeb extends WebPlugin implements NativeAudioPlugin {
  private audioElement = document.createElement("audio");

  constructor() {
    super({
      name: "NativeAudio",
      platforms: ["web"],
    });
  }

  load() {
    super.load();
    document.body.appendChild(this.audioElement);

    this.audioElement.onended = () => {
      this.notifyListeners("complete", {});
    };
  }

  async pause(): Promise<void> {
    this.audioElement.pause();
  }

  async preload(options: PreloadOptions): Promise<void> {
    this.audioElement.src = options.path;
    this.setVolume({ volume: options.volume ?? 1.0 });
  }

  async setAlbumArt() {
    // Nothing to do
  }

  play(): Promise<void> {
    return this.audioElement.play();
  }

  async setVolume({ volume }: { volume: number }): Promise<void> {
    this.audioElement.volume = volume;
  }

  async getCurrentTime(): Promise<{ currentTime: number }> {
    return {
      currentTime: this.audioElement.currentTime,
    };
  }

  async getDuration(): Promise<{ duration: number }> {
    return {
      duration: this.audioElement.duration,
    };
  }

  async setCurrentTime({ currentTime }: { currentTime: number }) {
    this.audioElement.currentTime = currentTime;
  }
}

const NativeAudio = new NativeAudioWeb();

export { NativeAudio };

import { registerWebPlugin } from "@capacitor/core";
registerWebPlugin(NativeAudio);
