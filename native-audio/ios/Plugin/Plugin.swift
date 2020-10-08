import AVFoundation
import Foundation
import Capacitor
import CoreAudio
import MediaPlayer


/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitor.ionicframework.com/docs/plugins/ios
 */
@objc(NativeAudio)
public class NativeAudio: CAPPlugin, AVAudioPlayerDelegate {
    private var aVAudioPlayer: AVPlayer?
    private var hasPlayed = false
    
    public override func load() {
        super.load()
        
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(AVAudioSession.Category.playback)
            try session.setActive(true)
        } catch {
            print("Failed to set AVAudioSession categroy: " + error.localizedDescription)
        }
    }
    
    @objc func preload(_ call: CAPPluginCall) {
        guard let path = call.getString("path") else {
            call.error("path property is missing")
            return
        }
        
        let volume = call.getFloat("volume") ?? 1.0

        self.getQueue().async {
            guard let url = URL(string: path) else {
                call.error("Unable to create URL from " + path)
                return
            }

            if !FileManager.default.fileExists(atPath: url.path) {
                call.error(url.path + " does not exist")
                return
            }

            let item = AVPlayerItem(url: url)
            
            NotificationCenter.default.addObserver(item, selector: #selector(self.audioPlayerDidFinishPlaying(note:)), name: .AVPlayerItemDidPlayToEndTime, object: nil)

            if self.aVAudioPlayer != nil {
                self.aVAudioPlayer?.replaceCurrentItem(with: item)
            } else {
                self.aVAudioPlayer = AVPlayer(playerItem: item)
            }
            
            self.aVAudioPlayer?.volume = volume
            call.success()
        }
    }
    
    @objc func play(_ call: CAPPluginCall) {
        print("PLAY")
//        self.getQueue().async {
            self.aVAudioPlayer?.play()
            if !self.hasPlayed {
                self.setUpPlayingInfo()
                self.setupRemoveTransportControls()
                self.hasPlayed = true
            }
            call.success()
//        }
    }
    
    @objc func getDuration(_ call: CAPPluginCall) {
        call.resolve([
            "duration": self.getDuration() as Any
        ])
    }
    
    @objc func getCurrentTime(_ call: CAPPluginCall) {
        call.resolve([
            "currentTime": self.getCurrentTime() as Any
        ])
    }
    
    @objc func setCurrentTime(_ call: CAPPluginCall) {
        if let currentTime = call.getDouble("currentTime") {
            self.aVAudioPlayer?.seek(to: CMTime(seconds: currentTime, preferredTimescale: 600))
        }
    }
    
    @objc func pause(_ call: CAPPluginCall) {
        self.aVAudioPlayer?.pause()
//        var nowPlayingInfo = [String : Any]()
//        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = 0.0
//        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }
    
    @objc func setVolume(_ call: CAPPluginCall) {
        let volume = call.getFloat("volume") ?? 1.0
        self.aVAudioPlayer?.volume = volume
        call.success()
    }
    
    func getQueue() -> DispatchQueue {
        return DispatchQueue(label: "com.getcapacitor.community.audio.complex.queue", qos: .userInitiated)
    }
    
    private func setUpPlayingInfo() {
        print("Setting up playing controls")
        
        // Define Now Playing Info
        var nowPlayingInfo = [String : Any]()
        nowPlayingInfo[MPMediaItemPropertyTitle] = "Title"
        nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = "Album"
        nowPlayingInfo[MPMediaItemPropertyArtist] = "Artist"

        if let image = UIImage(named: "lockscreen") {
            nowPlayingInfo[MPMediaItemPropertyArtwork] =
                MPMediaItemArtwork(boundsSize: image.size) { size in
                    return image
            }
        }
        nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = self.getCurrentTime()
        nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = self.getDuration()
        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = 1

        // Set the metadata
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
        
        self.aVAudioPlayer?.addObserver(self, forKeyPath: "timeControlStatus", options: [.old, .new], context: nil)
    }
    
    private func setupRemoveTransportControls() {
        print("Setting up transport controls...")
        let commandCenter = MPRemoteCommandCenter.shared();
        commandCenter.playCommand.isEnabled = true
        commandCenter.playCommand.addTarget { [unowned self] event in
            self.aVAudioPlayer?.play()
            return .success
        }
        
        commandCenter.pauseCommand.isEnabled = true
        commandCenter.pauseCommand.addTarget { [unowned self] event in
            self.aVAudioPlayer?.pause()
            return .success
        }
    }
    
    private func getDuration() -> Double {
        if let item = self.aVAudioPlayer?.currentItem?.asset {
            return CMTimeGetSeconds(item.duration)
        } else {
            return 0
        }
    }
    
    private func getCurrentTime() -> Double {
        if let time = self.aVAudioPlayer?.currentTime() {
            return CMTimeGetSeconds(time)
        } else {
            return 0
        }
    }
    
    override public func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        print("OBSERVED")
        var nowPlayingInfo = [String : Any]()
        nowPlayingInfo[MPMediaItemPropertyTitle] = "Title"
        nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = "Album"
        nowPlayingInfo[MPMediaItemPropertyArtist] = "Artist"

        if let image = UIImage(named: "lockscreen") {
            nowPlayingInfo[MPMediaItemPropertyArtwork] =
                MPMediaItemArtwork(boundsSize: image.size) { size in
                    return image
            }
        }
        nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = self.getDuration()
        
        self.setupRemoveTransportControls()
        
        if object is AVPlayer {
            switch self.aVAudioPlayer?.timeControlStatus {
            case .waitingToPlayAtSpecifiedRate, .paused:
                nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = self.getCurrentTime()
                nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = 0
                MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
            case .playing:
                nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = self.getCurrentTime()
                nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = 1
                MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
            case .none:
                print("NOTHING")
            case .some(_):
                print("SOMETHING NEW")
            }
        }
    }
    
    
    @objc public func audioPlayerDidFinishPlaying(note: NSNotification) {
        self.notifyListeners("complete", data: [:])
        print("finished") // It is not working, not printing "finished"
    }
}
