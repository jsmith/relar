package com.getcapacitor.community.audio;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.MediaPlayer.OnCompletionListener;
import android.os.Build;
import android.os.Bundle;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.view.KeyEvent;
import android.R;

import androidx.annotation.Nullable;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

// For remote media controls
// https://developer.android.com/reference/android/media/session/MediaSession
// https://developer.android.com/reference/kotlin/android/support/v4/media/session/MediaSessionCompat

// Media controls tutorial
// https://www.youtube.com/watch?v=FBC1FgWe5X4&t=10s

// Another super good post
// https://stackoverflow.com/questions/30942054/media-session-compat-not-showing-lockscreen-controls-on-pre-lollipop

// cordova-plugin-music-controls2 media controls file
// https://github.com/ghenry22/cordova-plugin-music-controls2/blob/master/src/android/MusicControls.java
// https://github.com/ghenry22/cordova-plugin-music-controls2/blob/master/src/android/MusicControlsNotification.java

// TODO
// https://android-developers.googleblog.com/2020/08/playing-nicely-with-media-controls.html
// https://developer.android.com/training/notify-user/expanded#media-style
// https://developer.android.com/training/run-background-service/create-service


@SuppressWarnings("unused")
@NativePlugin(
  permissions = {
    Manifest.permission.MODIFY_AUDIO_SETTINGS,
    Manifest.permission.WRITE_EXTERNAL_STORAGE,
    Manifest.permission.READ_PHONE_STATE,
  }
)
public class NativeAudio extends Plugin implements OnCompletionListener, AudioManager.OnAudioFocusChangeListener {
  private MediaSessionCompat mediaSession;
  private MediaPlayer player = new MediaPlayer();
  private static String CHANNEL_ID = "capacitor-community-native-audio-channel-id";
  private Info info = null;
  private NotificationManager notificationManager = null;

  BroadcastReceiver receiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
      String action = intent.getAction();
      if (action == null) return;

      if (action.equals(android.media.AudioManager.ACTION_AUDIO_BECOMING_NOISY)) {
        pauseLogic();
      } else if (action.equals(Intent.ACTION_MEDIA_BUTTON)) {
        handleIntent(intent);
      }
    }
  };

  MediaSessionCompat.Callback callback = new
    MediaSessionCompat.Callback() {
      @Override
      public void onPlay() {
        playLogic();
      }

      @Override
      public void onPause() {
        pauseLogic();
      }

      @Override
      public void onSkipToNext() {
        nextLogic();
      }

      @Override
      public void onSkipToPrevious() {
        previousLogic();
      }

      @Override
      public boolean onMediaButtonEvent(Intent intent) {
        boolean result = handleIntent(intent);
        return result || super.onMediaButtonEvent(intent);
      }
    };

  @Override
  public void load() {
    super.load();

    this.notificationManager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);

    if (Build.VERSION.SDK_INT >= 26) {
      // The user-visible name of the channel.
      CharSequence name = "Audio Controls";
      // The user-visible description of the channel.
      String description = "Control Playing Audio";

      int importance = NotificationManager.IMPORTANCE_HIGH;
      NotificationChannel channel = new NotificationChannel(NativeAudio.CHANNEL_ID, name, importance);
      channel.setDescription(description);
      this.notificationManager.createNotificationChannel(channel);
    }

    final Context context = this.getContext();
    Intent headsetIntent = new Intent("music-controls-media-button");
    PendingIntent intent = PendingIntent.getBroadcast(context, 0, headsetIntent, PendingIntent.FLAG_UPDATE_CURRENT);
    this.mediaSession = new MediaSessionCompat(context, "capacitor-community-native-audio", null, intent);

    this.mediaSession.setActive(true);
    this.mediaSession.setCallback(this.callback);
    this.player.setOnCompletionListener(this);

    AudioManager audioManager = (AudioManager)
      getContext()
      .getSystemService(Context.AUDIO_SERVICE);

    int result = audioManager.requestAudioFocus(
      this,
      AudioManager.STREAM_MUSIC,
      AudioManager.AUDIOFOCUS_GAIN
    );

    if (result == AudioManager.AUDIOFOCUS_GAIN) {
      System.out.println("Gained audio focus...");
    } else {
      System.out.println("Failed to gain audio focus...");
    }
  }

  @Override
  protected void handleOnPause() {
    super.handleOnPause();
  }

  @Override
  protected void handleOnResume() {
    super.handleOnResume();
  }

  /**
   * This method will load more optimized audio files for background into memory.
   */
  @PluginMethod
  public void preload(final PluginCall call) {
    System.out.println("preload: " + call.getData().toString());

    final String url = call.getString("path");
    if (url == null) {
      call.error("url is required");
      return;
    }

    final String title = call.getString("title", "Unknown Title");
    final String artist = call.getString("artist", "Unknown Artist");
    final String album = call.getString("album", "Unknown Album");
    final String cover = call.getString("cover");
    final double volume = call.getDouble("volume", 1.0);

    this.info = new Info(title, artist, cover, album);

    new Thread(
      new Runnable() {
        @Override
        public void run() {


          try {
            player.setDataSource(url);
            player.prepare();
          } catch (IOException e) {
            e.printStackTrace();
            call.error(e.getMessage());
            return;
          }
          setMediaPlaybackState(PlaybackStateCompat.STATE_PAUSED);

          call.success();
        }
      }
    ).start();
  }

  /**
   * This method will play the loaded audio file if present in the memory.
   */
  @PluginMethod
  public void play(final PluginCall call) {
    this.playLogic();
    call.success();
  }

  /**
   * This method will pause the audio file during playback.
   */
  @PluginMethod
  public void pause(PluginCall call) {
    this.pauseLogic();
    call.success();
  }

  /**
   * This method will return the current time of the audio file
   */
  @PluginMethod
  public void getCurrentTime(final PluginCall call) {
    final double position = this.player.getCurrentPosition();
    call.success(new JSObject().put("currentTime", position / 1000));
  }

  /**
   * This method will return the duration of the audio file
   */
  @PluginMethod
  public void getDuration(final PluginCall call) {
    final double duration = this.player.getDuration();
    call.success(new JSObject().put("duration", duration / 1000));
  }

  /**
   * This method will stop the audio file during playback.
   */
  @PluginMethod
  public void stop(PluginCall call) {
    this.player.stop();
    call.success();
  }

  /**
   * This method will adjust volume to specified value
   */
  @PluginMethod
  public void setVolume(PluginCall call) {
    final float value = call.getFloat("volume", 1.0f);
    this.player.setVolume(value, value);
    call.success();
  }

  @PluginMethod
  public void clearCache(PluginCall call) {
    // Nothing to do yet
    call.success();
  }

  @PluginMethod
  public void setAlbumArt(PluginCall call) {
    // Nothing to do yet
    call.success();
  }

  @PluginMethod
  public void setCurrentTime(PluginCall call) {
    final double currentTime = call.getDouble("currentTime", 0.0);
    // seconds -> milliseconds
    this.player.seekTo((int) currentTime * 1000);
    call.success();
  }

  /** MediaPlayer onCompletion event handler. Method which calls then song playing is complete*/
  @Override
  public void onCompletion(MediaPlayer mp) {
    this.notifyListeners("complete", new JSObject());
  }

  @Override
  public void onAudioFocusChange(int focusChange) {
//    if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {} else if (
//            focusChange == AudioManager.AUDIOFOCUS_GAIN
//    ) {} else if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {}
    System.out.println("Audio focus change state: " + focusChange);
  }

  private void setMediaPlaybackState(int state) {
    System.out.println("setMediaPlaybackState: " + state);
    PlaybackStateCompat.Builder builder = new PlaybackStateCompat.Builder();
    if(state == PlaybackStateCompat.STATE_PLAYING ) {
      builder.setActions(
        PlaybackStateCompat.ACTION_PLAY_PAUSE |
        PlaybackStateCompat.ACTION_PAUSE |
        PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
        PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
      );

      builder.setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f);
    } else {
      builder.setActions(
        PlaybackStateCompat.ACTION_PLAY_PAUSE |
        PlaybackStateCompat.ACTION_PLAY |
        PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
        PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
      );

      builder.setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 0);
    }

    this.mediaSession.setPlaybackState(builder.build());
  }

  private void setNotification(int state) {
    if (this.info == null) return;

    // Swipe to dismiss intent
    Intent dismissIntent = new Intent("music-controls-destroy");
    PendingIntent dismissPendingIntent = PendingIntent.getBroadcast(getContext(), 1, dismissIntent, 0);

    // Tap to open intent
    Intent resultIntent = new Intent(getContext(), getContext().getClass()); // TODO IDK if the second arg is right
    resultIntent.setAction(Intent.ACTION_MAIN);
    resultIntent.addCategory(Intent.CATEGORY_LAUNCHER);
    PendingIntent resultPendingIntent = PendingIntent.getActivity(getContext(), 0, resultIntent, 0);

    Notification.Builder builder = new Notification.Builder(getContext())
            .setStyle(new Notification.MediaStyle().setShowActionsInCompactView(1))
            .setContentTitle(this.info.title)
            .setContentText(this.info.artist + " - " + this.info.album)
            .setWhen(0)
            .setOngoing(false)
            .setDeleteIntent(dismissPendingIntent)
            .setPriority(Notification.PRIORITY_MAX) // Note this is deprecated now
            .setContentIntent(resultPendingIntent);

    if (Build.VERSION.SDK_INT >= 26) {
      builder.setChannelId(NativeAudio.CHANNEL_ID);
    }

    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP){
      builder.setVisibility(Notification.VISIBILITY_PUBLIC);
    }

    Bitmap bitmap = null;
    if (this.info.cover != null) {
      bitmap = getBitmapFromURL(this.info.cover);
      builder.setLargeIcon(bitmap);
    }

    // TODO is playing else
    if (mediaSession.isActive()){
      builder.setSmallIcon(android.R.drawable.ic_media_play);
    } else {
      builder.setSmallIcon(android.R.drawable.ic_media_pause);
    }

    // Previous intent
    Intent previousIntent = new Intent("music-controls-previous");
    PendingIntent previousPendingIntent = PendingIntent.getBroadcast(getContext(), 1, previousIntent, 0);
    builder.addAction(android.R.drawable.ic_media_previous, "Previous", previousPendingIntent);

    Intent pauseIntent = new Intent("music-controls-pause");
    PendingIntent pausePendingIntent = PendingIntent.getBroadcast(getContext(), 1, pauseIntent, 0);
    builder.addAction(android.R.drawable.ic_media_pause, "Pause", pausePendingIntent);

    Intent playIntent = new Intent("music-controls-play");
    PendingIntent playPendingIntent = PendingIntent.getBroadcast(getContext(), 1, playIntent, 0);
    builder.addAction(android.R.drawable.ic_media_play, "Play", playPendingIntent);

    Intent nextIntent = new Intent("music-controls-next");
    PendingIntent nextPendingIntent = PendingIntent.getBroadcast(getContext(), 1, nextIntent, 0);
    builder.addAction(android.R.drawable.ic_media_next, "Next", nextPendingIntent);

    Notification notification = builder.build();
    this.notificationManager.notify(1234, notification);
  }

  private Bitmap getBitmapFromURL(String strURL) {
    try {
      URL url = new URL(strURL);
      HttpURLConnection connection = (HttpURLConnection) url.openConnection();
      connection.setDoInput(true);
      connection.connect();
      InputStream input = connection.getInputStream();
      return BitmapFactory.decodeStream(input);
    } catch (Exception ex) {
      notifyListeners("error", new JSObject().put("message", ex.getMessage()));
      ex.printStackTrace();
      return null;
    }
  }

  private boolean handleIntent(Intent intent) {
    Bundle extras = intent.getExtras();
    if (extras == null) {
      return false;
    }

    final KeyEvent event = (KeyEvent) extras.get(Intent.EXTRA_KEY_EVENT);

    if (event == null) {
      return false;
    }

    if (event.getAction() == KeyEvent.ACTION_DOWN) {
      final int keyCode = event.getKeyCode();
      switch (keyCode) {
        case KeyEvent.KEYCODE_MEDIA_PAUSE:
          notifyListeners("pause", new JSObject());
          break;
        case KeyEvent.KEYCODE_MEDIA_PLAY:
          notifyListeners("play", new JSObject());
          break;
        case KeyEvent.KEYCODE_MEDIA_PREVIOUS:
          this.previousLogic();
          break;
        case KeyEvent.KEYCODE_MEDIA_NEXT:
          this.nextLogic();
          break;
        case KeyEvent.KEYCODE_HEADSETHOOK:
        case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
          // TODO what causes this??
          notifyListeners("play-pause", new JSObject());
          break;
        case KeyEvent.KEYCODE_MEDIA_STOP:
          // TODO what causes this??
          notifyListeners("stop", new JSObject());
          break;
        case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
          // TODO what causes this??
          notifyListeners("fast-forward", new JSObject());
          break;
        case KeyEvent.KEYCODE_MEDIA_REWIND:
          // TODO what causes this??
          notifyListeners("rewind", new JSObject());
          break;
        default:
          // TODO what causes this?
          notifyListeners("unknown", new JSObject());
          return false;
      }
    }

    return true;
  }

  private void pauseLogic() {
    this.player.pause();
    this.setMediaPlaybackState(PlaybackStateCompat.STATE_PAUSED);
    this.setNotification(PlaybackStateCompat.STATE_PAUSED);
  }

  private void playLogic() {
    this.player.start();
    this.setMediaPlaybackState(PlaybackStateCompat.STATE_PLAYING);
    this.setNotification(PlaybackStateCompat.STATE_PLAYING);
  }

  private void previousLogic() {
    notifyListeners("previous", new JSObject());
  }

  private void nextLogic() {
    notifyListeners("next", new JSObject());
  }

  @Override
  protected void handleOnDestroy() {
    super.handleOnDestroy();
  }
}

class Info {
  String title;
  String artist;
  String album;
  @Nullable
  String cover;

  Info(@Nullable String title, @Nullable String artist, @Nullable String cover, @Nullable String album) {
    this.title = title != null ? title :  "Unknown Title";
    this.artist = artist != null ? artist : "Unknown Artist";
    this.album = album != null ? album : "Unknown Album";
    this.cover = cover;
  }
}