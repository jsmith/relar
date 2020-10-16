import AVFoundation
import Foundation
import Capacitor
import CoreAudio
import MediaPlayer
import Cache

extension Dictionary {
    mutating func merge(in dict: [Key: Value]){
        for (k, v) in dict {
            updateValue(v, forKey: k)
        }
    }
}

// Caching system based off this article:
// https://andreygordeev.com/2018/03/31/cache-avplayeritem/

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitor.ionicframework.com/docs/plugins/ios
 */
@objc(NativeAudio)
public class NativeAudio: CAPPlugin, AVAudioPlayerDelegate, AVAssetResourceLoaderDelegate {
    private var aVAudioPlayer: AVPlayer?
    
    let diskConfig = DiskConfig(name: "DiskCache", maxSize: 104857600)
    let memoryConfig = MemoryConfig(expiry: .never, countLimit: 10, totalCostLimit: 10)

    lazy var storage: Cache.Storage<String, Data>? = {
        return try? Cache.Storage(
            diskConfig: diskConfig,
            memoryConfig: memoryConfig,
            transformer: TransformerFactory.forData()
        )
    }()
    
    var asset: AVURLAsset?
    
    public override func load() {
        super.load()
        
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(AVAudioSession.Category.playback)
            try session.setActive(true)
            self.setupRemoveTransportControls()
            
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(self.audioPlayerDidFinishPlaying),
                name: .AVPlayerItemDidPlayToEndTime,
                object: nil
            )
        } catch {
            print("Failed to set AVAudioSession categroy: " + error.localizedDescription)
        }
    }
    
    @objc func preload(_ call: CAPPluginCall) {
        guard let path = call.getString("path") else {
            call.error("path property is missing")
            return
        }

        guard let title = call.getString("title") else {
            call.error("title property is missing")
            return
        }

        guard let artist = call.getString("artist") else {
            call.error("artist property is missing")
            return
        }

        guard let album = call.getString("album") else {
            call.error("album property is missing")
            return
        }
        
        print("GOT ARGS", title, artist, album)
        
        let volume = call.getFloat("volume") ?? 1.0

        self.getQueue().async {
            guard let url = URL(string: path) else {
                call.error("Unable to create URL from " + path)
                return
            }
            
            var playerItem: AVPlayerItem
            do {
                let entry = try self.storage!.entry(forKey: url.absoluteString)
                print("Cache HIT (" + url.absoluteString + ")")
                // This is very important so that we don't cache the previous song
                // when this song is finished
                self.asset = nil
                let temporaryDirectory = FileManager.default.temporaryDirectory
                let fileURL = temporaryDirectory.appendingPathComponent("play.caf")
                try! entry.object.write(to: fileURL)
                print("WROTE \(entry.object.count) TO " + fileURL.absoluteString)
                playerItem = AVPlayerItem(url: fileURL)
            } catch {
                print("Cache MISS (" + url.absoluteString + ")")
                let asset = AVURLAsset(url: url)
                self.asset = asset
                self.asset?.resourceLoader.setDelegate(self, queue: DispatchQueue.main)
                playerItem = AVPlayerItem(asset: asset)
            }

            if self.aVAudioPlayer != nil {
                self.aVAudioPlayer?.pause()
                self.aVAudioPlayer?.replaceCurrentItem(with: playerItem)
            } else {
                self.aVAudioPlayer = AVPlayer(playerItem: playerItem)
                self.aVAudioPlayer?.automaticallyWaitsToMinimizeStalling = false
            }
            
            // CONTROLS
            print("Setting up playing controls")
            
            // Define Now Playing Info
            var nowPlayingInfo = [String : Any]()
            nowPlayingInfo[MPMediaItemPropertyTitle] = title
            nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = album
            nowPlayingInfo[MPMediaItemPropertyArtist] = artist

            nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = self.getCurrentTime()
            nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = self.getDuration()
            nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = 1

            // Set the metadata
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
            
            self.aVAudioPlayer?.addObserver(self, forKeyPath: "timeControlStatus", options: [.old, .new], context: nil)
            self.aVAudioPlayer?.volume = volume
            
            print("Preload completed successfully")
            call.success()
        }
    }
    
    @objc func clearCache(_ call: CAPPluginCall) {
        self.getQueue().async {
            do {
                try self.storage?.removeAll()
                call.resolve()
            } catch {
                call.error("An error occurred while clearning the cache")
            }
        }
    }
    
    @objc func play(_ call: CAPPluginCall) {
        print("PLAY")
       self.getQueue().async {
            self.aVAudioPlayer!.play()
            call.success()
       }
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
            self.aVAudioPlayer?.seek(to: CMTime(seconds: currentTime, preferredTimescale: 600)) { (isComplete) in
                if let player = self.aVAudioPlayer {
                    var nowPlayingInfo = [String : Any]()
                    nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = CMTimeGetSeconds(player.currentTime())
                    self.updateAttributes(with: nowPlayingInfo)
                }
                
            }
        }
    }
    
    @objc func pause(_ call: CAPPluginCall) {
        self.aVAudioPlayer!.pause()
    }

    @objc func stop(_ call: CAPPluginCall) {
        self.aVAudioPlayer!.pause()
        
        // TODO ensure controls are disabled too
        let nowPlayingInfo = [String : Any]()
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo

    }
    
    @objc func setVolume(_ call: CAPPluginCall) {
        let volume = call.getFloat("volume") ?? 1.0
        self.aVAudioPlayer?.volume = volume
        call.success()
    }

    @objc func setAlbumArt(_ call: CAPPluginCall) {
        guard let string = call.getString("url") else {
            call.error("url property is missing")
            return
        }

        // Instructions here -> "https://cdn.arstechnica.net/wp-content/uploads/2018/06/macOS-Mojave-Dynamic-Wallpaper-transition.jpg"
        let url = URL(string: string)! 
        downloadImage(from: url)
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
            self.notifyListeners("play", data: [:])
            return .success
        }
        
        commandCenter.pauseCommand.isEnabled = true
        commandCenter.pauseCommand.addTarget { [unowned self] event in
            self.notifyListeners("pause", data: [:])
            return .success
        }

        commandCenter.nextTrackCommand.isEnabled = true
        commandCenter.nextTrackCommand.addTarget { [unowned self] event in
            self.notifyListeners("next", data: [:])
            return .success
        }


        commandCenter.previousTrackCommand.isEnabled = true
        commandCenter.previousTrackCommand.addTarget { [unowned self] event in
            print("JACOB PREVIOUS")
            self.notifyListeners("previous", data: [:])
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
        var nowPlayingInfo = [String : Any]()
        
        if object is AVPlayer {
            switch self.aVAudioPlayer?.timeControlStatus {
            case .waitingToPlayAtSpecifiedRate, .paused:
                nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = self.getCurrentTime()
                nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = 0
            case .playing:
                nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = self.getCurrentTime()
                nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = 1
            case .none:
                print("NOTHING")
            case .some(_):
                print("SOMETHING NEW")
            }
        }
        
        self.updateAttributes(with: nowPlayingInfo)
    }
    
    private func getData(from url: URL, completion: @escaping (Data?, URLResponse?, Error?) -> ()) {
        URLSession.shared.dataTask(with: url, completionHandler: completion).resume()
    }

    private func downloadImage(from url: URL) {
        print("Image download Started")
        self.getData(from: url) { data, response, error in
            guard let data = data, error == nil else { return }
            print(response?.suggestedFilename ?? url.lastPathComponent)
            print("Image download finished")
            DispatchQueue.main.async() { [weak self] in
                if let image = UIImage(data: data) {
                    self?.updateAttributes(with: [
                        MPMediaItemPropertyArtwork: MPMediaItemArtwork(boundsSize: image.size) { size in
                            return image
                        }
                    ])
                }
            }
        }
    }

    private func updateAttributes(with attributes: [String : Any]) {
        var nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? attributes
        nowPlayingInfo.merge(in: attributes)
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }
    
    // Notifies the "complete" listeners and caches the file
    // Caching based off https://stackoverflow.com/questions/37611488/how-to-stream-a-video-with-avurlasset-and-save-to-disk-the-cached-data
    // And this https://stackoverflow.com/questions/28237412/how-to-convert-avasset-to-nsdata-or-save-it-to-file-manager
    @objc public func audioPlayerDidFinishPlaying(note: NSNotification) {
        print("finished")
        self.notifyListeners("complete", data: [:])
        
        guard let asset = self.asset else {
            return
        }
        
        guard let exporter = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetPassthrough) else {
            print("Exporter initalizatin failed...")
            return
        }
        
        let temporaryDirectory = FileManager.default.temporaryDirectory
        let fileURL = temporaryDirectory.appendingPathComponent("temp.caf")
        
        do {
            // This prevents this error https://stackoverflow.com/questions/45863507/error-nslocalizeddescription-cannot-save
            try FileManager.default.removeItem(at: fileURL)
        } catch {
            // Do nothing is removing the file fails
        }

        print("Setting outputURL to \(fileURL.absoluteString)")
        exporter.outputURL = fileURL
        exporter.outputFileType = AVFileType.caf
        
        exporter.exportAsynchronously(completionHandler: {
            switch exporter.status {
            case .failed:
                print("Export failed!!!", exporter.error as Any)
            case .completed:
                do {
                    print("EXPORTED to \(fileURL.absoluteString)")
                    let data = try Data(contentsOf: fileURL)
                    print("CACHING TO " + asset.url.absoluteString)
                    print("Count -> \(data.count)")
                    // TODO asset.url.absoluteString has token
                    // Create method that extract the parameters and ignores query parameters
                    self.storage?.async.setObject(data, forKey: asset.url.absoluteString, completion: { _ in })
                    print("STORED DATA IN CACHE")
                } catch {
                    print("Could not get data from " + asset.url.absoluteString)

                }
            default:
                print("Export went wrong!! IDK what failed: " + String(exporter.status.rawValue))
            }
        })
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
