# Relar

Relar is a cloud music hosting and streaming service for your personal audio file collection. See it running at [relar.app](https://relar.app).

## Project Setup

These steps will get the project set up on [Firebase](https://firebase.google.com/). Once everything is set up, you'll be able to run the app locally and deploy it to your environment.

> Before starting, make sure you have this repository cloned locally 💻

### 1. Firebase Project Creation

The first step is to create the project in Firebase console. Head to the [console](https://console.firebase.google.com/), sign into your Google account, click the "Add project" button, give your project a name and then click "Continue". On the next page, choose whether you want to enable analytics and continue with the setup. Once you're done, click the "Create project" button and let Firebase do it's thing :) Once the project is ready, click "Continue".

### 2. Firebase Authentication

From the Firebase console, head to the "Authentication" tab (on the left) and then click "Get started". It should then take you to the "Sign-in method" tab. Click the "Email/password" row, turn on the first toggle (not the "Email link (passwordless sign-in)" toggle) and then click "Save".

> Don't create any users now, there is a script that does this instead.

### 3. Firebase Cloud Firestore

Head to the "Cloud Firestore" tab and click "Create database". Select "Start in test mode", "Next", select your desired region (the default value is probably fine) and finally click "Enable".

### 4. Firebase Hosting

In the "Hosting" tab, click "Get started" and then follow the steps to install [`firebase-tools`](http://npmjs.com/package/firebase-tools) & login. Note that you _don't_ need to run `firebase init` or `firebase deploy` (you'll deploy things later).

### 5. Firebase Functions

In the "Functions" tab, click "Upgrade project". If you haven't set up a google cloud billing account before, there is lots of information online. Once you have a one set up, click "Purchase" in the modal. I recommend setting up a budget by clicking the "Set a budget alert". Once you've set your budget, click "Close". Then, you can click "Get started". Click through the modal. You should already have `firebase-tools` installed from the preview step and you don't need to deploy just yet.

#### Node & npm

First, you'll have to make sure you have `Node` and `npm` installed correctly (see `package.json` for version information). If not installed, we recommend the following steps to getting them set up.

1. Install [Node Version Manager (NVM)](https://github.com/creationix/nvm#install-script)
2. Install [Node and npm using NVM](https://github.com/creationix/nvm#usage)

> Although these instructions use `npm`, `yarn` can also be used if desired.

### Installing Dependencies

The following command installs the dependencies in _all_ the repositories.

```
npm run bootstrap
```

### Development

## Structure

As you can see, this is a monorepo. All packages are located in different folders and all contain their own `package.json` file. Note that the `app` and `mobile` projects share a common `package.json` in the root of the repository.

### app

This is the web application deployed at [https://relar.app](https://relar.app) _and_ the mobile app that is yet to be deployed to App Stores. [`snowpack`](https://www.snowpack.dev/) along with [`Capacitor`](https://capacitorjs.com/) are used for the Dev environment and to package the app into iOS and Android formats.

### functions

These are the [cloud functions](https://firebase.google.com/docs/functions) deployed in Google Cloud. There is a mixture of functions that run when things happen (e.g. when a new DB entry is created/deleted) and classic backend express [servers](https://expressjs.com/). Instead of running these like a normal backend, you can test them and deploy them to the staging server when you're ready.

### scripts

This is where admin scripts can be found (ie. sending out a beta invitation, performing data migrations/fixes).

### shared

This folder contains all of the shared code between `app`, `mobile`, `functions`, and `scripts`. Within this folder, the shared code is further divided into `node` (code that can only run in `NodeJS`), `web` (code that can only be run on the web), and `universal` (code that can be run in both environments). This code is symlinked (using relative symlinks) into each of the four folders listed above.

### \*

The other files/folders in this repo are a mixture of documentation and configuration.

## Deployment

<!-- Deployment is managed by `GitHub Actions` (see below). We run deployment whenever a new tag is pushed!

```
# follow the prompts for this
npm run version
``` -->

1. Make sure you've added release notes
1. Run `node version.js versions|versions-n-build VERSION`
1. Run the build commands (`npm run build` in `functions` and `npm run build:web-production` in `app`)
1. Run `firebase deploy --project production`
1. Commit and tag and push

## GitHub Actions

We use `GitHub Actions` for deployment and testing automation. The `yml` files are pretty easy to read but it's quite hard to actually to make modifications to these files as they are hard to test. Here is how you can test them locally.

Install [act](https://github.com/nektos/act) on your local machine and then use the following command.

```
GITHUB_TOKEN=<GITHUB_TOKEN>  act -s FIREBASE_TOKEN=<FIREBASE_TOKEN>
```

Before you run this command though, you should probably also change `--project production` to `--project production` in `.github/workflows/deploy.yml`. Additionally, `- uses: c-hive/gha-npm-cache@v1` will probably fail to comment out this line.

## Deployment

### Setup

First, to run any kind of deployment, you'll need to install `firebase-tools`.

```
npm install -g firebase-tools
```

> Make sure you run `firebase login` after installation!

Next, if you need to deploy the `storage.json` file, you need to run the following commands to install the `gloud` CLI.

```
# See https://cloud.google.com/storage/docs/gsutil_install
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### Functions

```
firebase deploy --only functions
```

### Hosting

```
firebase deploy --only hosting
```

### Rules

```
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### CORS

```
gsutil cors set storage.json gs://relar-staging.appspot.com # or gs://relar-production.appspot.com
```

### Cache Control

This is set automatically but if you want to batch update... it's kinda slow though!

```
gsutil setmeta -r -h "Cache-control: private, max-age=86400" gs://relar-staging.appspot.com # or gs://relar-production.appspot.com
```

## Resources

- https://medium.com/firebase-developers/the-secrets-of-firestore-fieldvalue-servertimestamp-revealed-29dd7a38a82b
- https://stackoverflow.com/questions/46806860/how-to-query-cloud-firestore-for-non-existing-keys-of-documents
- https://medium.com/@varundudeja/showing-media-player-system-controls-on-notification-screen-in-ios-swift-4e27fbf73575

## References

Icons made by <a href="https://www.flaticon.com/authors/bqlqn" title="bqlqn">bqlqn</a> from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>
