import { WebPlugin } from "@capacitor/core";
import { NativeAudioPlugin, PreloadOptions } from "./definitions";

export class NativeAudioWeb extends WebPlugin implements NativeAudioPlugin {
  private audioElement = document.createElement("audio");

  constructor() {
    super({
      name: "NativeAudio",
      platforms: ["web"],
    });

    document.body.appendChild(this.audioElement);

    this.audioElement.onended = () => {
      console.log("ON ENDED");
      this.notifyListeners("complete", {});
    };
  }

  load() {
    // I used to have logic here but... "load" is never actually called wtf
    // Anyway I'm leaving this here since... it should be called... right?
    super.load();
  }

  async clearCache() {
    // Nothing to do
  }

  async pause(): Promise<void> {
    this.audioElement.pause();
  }

  async preload(options: PreloadOptions): Promise<void> {
    this.audioElement.src = options.path;
    this.setVolume({ volume: options.volume ?? 1.0 });
  }

  async stop() {
    this.audioElement.pause();
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