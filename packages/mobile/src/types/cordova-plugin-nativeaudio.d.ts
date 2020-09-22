declare module "cordova-plugin-nativeaudio/www/nativeaudio" {
  class NativeAudio {
    setOptions: (options, successCallback, errorCallback) => void;
    preloadSimple: (id, assetPath, successCallback, errorCallback) => void;
    preloadComplex: (id, assetPath, volume, voices, delay, successCallback, errorCallback) => void;
    play: (id, successCallback, errorCallback, completeCallback) => void;
    stop: (id, successCallback, errorCallback) => void;
    loop: (id, successCallback, errorCallback) => void;
    unload: (id, successCallback, errorCallback) => void;
    setVolumeForComplexAsset: (id, volume, successCallback, errorCallback) => void;
  }

  const nativeAudio: NativeAudio;
  export default nativeAudio;
}
