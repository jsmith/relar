import { WebPlugin } from "@capacitor/core";
import { NativeAudioPlugin, PreloadOptions } from "./definitions";

export class NativeAudioWeb extends WebPlugin implements NativeAudioPlugin {
  // FIXME Fix https://sentry.io/organizations/relar/issues/1976465264/?project=5258806&query=is%3Aunresolved
  // Look at https://stackoverflow.com/questions/36803176/how-to-prevent-the-play-request-was-interrupted-by-a-call-to-pause-error
  // This is super important
  // Opt-in to CORS
  // See https://developers.google.com/web/tools/workbox/guides/advanced-recipes#cached-av
  // crossOrigin="anonymous"
  // preload="metadata"
  private audioElement = document.createElement("audio");

  constructor() {
    super({
      name: "NativeAudio",
      platforms: ["web"],
    });

    document.body.appendChild(this.audioElement);

    this.audioElement.onended = () => {
      this.notifyListeners("complete", {});
    };

    // These are triggered if we call .pause() or if the system pauses the music
    // ie. a user clicks play/pause using their headphones
    this.audioElement.onplay = () => {
      this.notifyListeners("play", {});
    };

    this.audioElement.onpause = () => {
      this.notifyListeners("pause", {});
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
