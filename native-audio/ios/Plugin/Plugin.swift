import AVFoundation
import Foundation
import Capacitor
import CoreAudio

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitor.ionicframework.com/docs/plugins/ios
 */
@objc(NativeAudio)
public class NativeAudio: CAPPlugin, AVAudioPlayerDelegate {
    var aVAudioPlayer: AVAudioPlayer?
    
    public override func load() {
        super.load()
        
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(AVAudioSession.Category.playback)
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

            if let player = self.aVAudioPlayer {
                player.stop()
                self.aVAudioPlayer = nil
            }

            do {
                try self.aVAudioPlayer = AVAudioPlayer(contentsOf: url)
                self.aVAudioPlayer?.delegate = self
                self.aVAudioPlayer?.volume = volume
                call.success()
            } catch {
                call.error(error.localizedDescription, error, ["path": path])
            }

        }
    }
    
    @objc func play(_ call: CAPPluginCall) {
        self.getQueue().async {
            self.aVAudioPlayer?.play()
            call.success()
        }
    }
    
    @objc func getDuration(_ call: CAPPluginCall) {
        call.resolve([
            "duration": self.aVAudioPlayer?.duration as Any
        ])
    }
    
    @objc func getCurrentTime(_ call: CAPPluginCall) {
        call.resolve([
            "currentTime": self.aVAudioPlayer?.currentTime as Any
        ])
    }
    
    @objc func setCurrentTime(_ call: CAPPluginCall) {
        if let currentTime = call.getDouble("currentTime") {
            self.aVAudioPlayer?.currentTime = currentTime
        }
    }
    
    @objc func pause(_ call: CAPPluginCall) {
        self.aVAudioPlayer?.pause()
    }
    
    @objc func stop(_ call: CAPPluginCall) {
        self.getQueue().async {
            self.aVAudioPlayer?.stop()
            call.resolve()
        }
    }
    
    @objc func setVolume(_ call: CAPPluginCall) {
        let volume = call.getFloat("volume") ?? 1.0
        self.aVAudioPlayer?.volume = volume
        call.success()
    }
    
    func getQueue() -> DispatchQueue {
        return DispatchQueue(label: "com.getcapacitor.community.audio.complex.queue", qos: .userInitiated)
    }
    
    
    public func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        self.notifyListeners("complete", data: [:])
        print("finished") // It is not working, not printing "finished"
    }
}
