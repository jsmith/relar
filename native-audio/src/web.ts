import { WebPlugin } from "@capacitor/core";
import { NativeAudioPlugin } from "./definitions";

// TODO move chrome media logic here
export class NativeAudioWeb extends WebPlugin implements NativeAudioPlugin {
  constructor() {
    super({
      name: "NativeAudio",
      platforms: ["web"],
    });
  }

  async pause(): Promise<void> {
    // Nothing do to here!
  }

  async preload(): Promise<void> {
    // Nothing to do here!
  }

  async stop() {
    // Nothing to do here!
  }

  async play() {
    // Nothing to do here!
  }
}

const NativeAudio = new NativeAudioWeb();

export { NativeAudio };

import { registerWebPlugin } from "@capacitor/core";
registerWebPlugin(NativeAudio);
