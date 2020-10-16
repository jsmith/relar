# App

The RELAR mobile app and website.

## Development

### Web

```
npm run dev-web
```

### Mobile

```
npm run dev-mobile
```

## iOS Preview

There are several methods and tools you can use to run the app on iOS.

### Prerequisites

- You have a mac
- You have Xcode installed
- You have a developer account
- You have your developer account and team configured in Xcode

### Running Once

```
npx cap sync
```

> Tip: Make sure to build first!

### iOS Debugging

Open `Safari` and ensure that `Safari` > `Preferences` > `Advances` > `Show Development menu in menu bar` is checked. After, go to `Develop` > `<SIMULATOR>` > `<TITLE>`. This will open the safari debugging tools!

## Android Preview

Running on Android is very similar to setting up iOS.

### Prerequisites

- You have the Android SDK installed
- You have Android Studio installed
- You have an emulator installed

### Running Once

Like iOS, you need to sync your built assets to the android file. Once this is done, just click the Run button and select the emulator.

```
npx cap sync # or just npx cap copy
```

## Deployment

Deployment uses [`Fastlane`](https://docs.fastlane.tools/).

### Prerequisites

First, make sure `ruby` is installed. Then, install `Fastlane`!

```
bundle install
```
