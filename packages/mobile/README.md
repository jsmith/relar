# Mobile

The RELAR mobile app!

## Setup

```
# if you don't have the CLI installed
npm install -g @ionic/cli
npm i
```

## Development

See [previewing](https://ionicframework.com/docs/developing/previewing) document from the Ionic team.

```
npm start
```

## iOS Preview

There are several methods and tools you can use to run the app on iOS.

### Prerequisites

- You have a mac
- You have Xcode installed
- You have a developer account
- You have your developer account and team configured in Xcode

See the [Xcode Setup](https://ionicframework.com/docs/developing/ios#xcode-setup) docs.

### Running Once

Previewing on the device requires the app to be built to web assets and synced to the iOS project. Once this is done, just push the run button in Xcode. See the docs [Running on Xcode](https://ionicframework.com/docs/developing/ios#running-with-xcode).

```
ionic capacitor copy ios
```

> Tip: Make sure to build first!

### iOS Hot Reload

After this command is run, just select the target in Xcode and press play =) Alternatively, you can run the following command before running the Xcode project to create a hot-reload server.

```
ionic capacitor run ios -l --external
```

### iOS Debugging

Open `Safari` and ensure that `Safari` > `Preferences` > `Advances` > `Show Development menu in menu bar` is checked. After, go to `Develop` > `<SIMULATOR>` > `<TITLE>`. This will open the safari debugging tools!

## Android Preview

Running on Android is very similar to setting up iOS.

### Prerequisites

- You have the Android SDK installed
- You have Android Studio installed
- You have an emulator installed

See the [Ionic Android Studio](https://ionicframework.com/docs/developing/android#android-studio) docs.

### Running Once

Like iOS, you need to sync your built assets to the android file. Once this is done, just click the Run button and select the emulator.

```
ionic capacitor copy android
```

### Android Hot Reload

Just run an almost identical command to the iOS hot reload server. Once you run the following command, just the app on the emulator using Android Studio.

```
ionic capacitor run android -l --external
```

### Android Debugging

You can you Chrome DevTools to debug an app running on Android, neat! Check out the docs [here](https://ionicframework.com/docs/developing/android#using-chrome-devtools).

## Deployment

Deployment uses [`Fastlane`](https://docs.fastlane.tools/).

### Prerequisites

First, make sure `ruby` is installed. Then, install `Fastlane`!

```
bundle install
```
