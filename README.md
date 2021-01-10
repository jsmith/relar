⚠ Looking for a contributor to help with new features and bug fixes ⚠

# Relar

Relar is a cloud music hosting and streaming service for your personal audio file collection. See it running at [https://relar.app](https://relar.app).

## Project Setup

These steps will get the project set up on [Firebase](https://firebase.google.com/). Once everything is set up, you'll be able to run the app locally and deploy it to your environment. There are a lot of steps but I don't think anything is too complex. If you get stuck or think I can improvements, please feel free to make an issue or pull request.

> Before starting, make sure you have this repository cloned locally 💻

### 1. Node & npm

First, you'll have to make sure you have `node` v12 and `npm` installed correctly. If not installed, we recommend the following steps to getting them set up.

1. Install [Node Version Manager (NVM)](https://github.com/creationix/nvm#install-script)
2. Install [Node and npm using NVM](https://github.com/creationix/nvm#usage)

> Although these instructions use `npm`, `yarn` can also be used if desired.

### 2. Dependency Installation

You can install all dependencies in one go using the following command.

```
npm run bootstrap
```

This runs `npm install` in the root the repository and the `app`, `functions` and `native-audio` folders.

> We install [`firebase-tools`](https://firebase.google.com/docs/cli) during this process. This Firebase CLI will be used in future steps so definitely check out the documentation.

### 2. Firebase Project Creation

The first step is to create a new project in the Firebase console. Head to the [console](https://console.firebase.google.com/), sign into your Google account, click the "Add project" button, give your project a name and then click "Continue". On the next page, choose whether you want to enable analytics and continue with the setup. Once you're done, click the "Create project" button and let Firebase do it's thing :) Once the project is ready, click "Continue".

### 3. Firebase Authentication

From the Firebase console, head to the "Authentication" tab (on the left) and then click "Get started". It should then take you to the "Sign-in method" tab. Click the "Email/password" row, turn on the first toggle (not the "Email link (passwordless sign-in)" toggle) and then click "Save".

> Don't create any users now, there is a script that does this instead.

### 4. Firebase Cloud Firestore

Head to the "Cloud Firestore" tab and click "Create database". Select "Start in test mode", "Next", select your desired region (the default value is probably fine) and finally click "Enable".

### 6. Firebase Functions

In the "Functions" tab, click "Upgrade project". If you haven't set up a google cloud billing account before, there is lots of information online. Once you have a one set up, click "Purchase" in the modal. I recommend setting up a budget by clicking the "Set a budget alert". Once you've set your budget, click "Close".

### 7. App Configuration

Click on the gear icon next to "Project Overview" > "Project settings". In the "General" tab, go down to the "Your apps" (it should say "There are no apps in your project") section and click on the web icon. Give your app a nickname and then click "Register app". Your web app configuration will show up on the next section. Copy these values and paste them in the `app/.env` file in the placeholders. Each property (e.g. `apiKey`) has a corresponding placeholder in the `.env` file (e.g. `SNOWPACK_PUBLIC_API_KEY`).

### 8. Retrieving App ID

In the firebase console, click the gear icon again > "Project settings" and then find your "Project ID". Copy this down since you'll need it for future steps :)

### 9. Downloading Service Account File

This repository supports both staging and production environments. The `scripts` folder contains admin scripts that can be used to do routine operations such as creating user accounts. Each script can be configured to run with either environment (more details in `scripts/README.md`) but you'll need a service account first.

Click the hear icon again > "Project settings" and then select the "Service accounts" tab on the top. Next, make sure "Firebase Admin SDK" is selected and then click "Generate new private key" > "Generate Key". Store this file in the root of the repository as `serviceAccountKey.relar-production.json` or `serviceAccountKey.relar-staging.json`. You'll use this file later!

### 8. Google Cloud CLI Installation

Next, install the `gcloud` and the `gsutil` Google Cloud CLI utilities. You'll use these to configure Google Cloud Storage settings.

```
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

This installs both `gcloud` _and_ `gsutil`. You'll have to login to this CLI utility as well (make sure to login to the same Google account).

```
gcloud init
```

> See the official gsutil installation documentation [here](https://cloud.google.com/sdk/docs/downloads-interactive).

### 9. CORS

Now that you have `gsutil` installed and configured, you can deploy CORS configuration to your storage bucket. First, add `https://<PROJECT_ID>.web.app` to the `origin` property in `storage.json` and remove any values that aren't needed. Next, deploy this configuration to your storage bucket.

```
gsutil cors set storage.json gs://<PROJECT_ID>.appspot.com
```

### 8. Sentry (Optional)

<!-- TODO remove .env and add dotenv support for functions -->

If you want to turn on [Sentry](https://sentry.io/), replace the value of `SNOWPACK_PUBLIC_FIREBASE_DSN` in `app/.env` with your own [Sentry DSN](https://docs.sentry.io/product/sentry-basics/dsn-explainer/) value. This DSN will look something like `https://abcd1234@123abc.ingest.sentry.io/1234567`. If you don't want to turn on `Sentry` just yet, use an empty string instead.

### 9. SendGrid API Key

[Send Grid](https://sendgrid.com) is an email service that Relar uses to send emails to users. You will need an API key to send out a few emails. Here is some [documentation](https://sendgrid.com/docs/for-developers/sending-email/api-getting-started) that explains how to get an API key.

Once you have the API key,

### 10. Functions Configuration

You'll need to set a few functions configuration options before it can run.

```
firebase functions:config:set --project PROJECT \
  env.sendgrid_api_key="<SEND_GRID_API_KEY>" \
  env.notification_email="<YOUR_EMAIL>" \
  env.sentry_dsn="<SENTRY_DSN>"
```

> Setting the `notification_email` is optional. This email will be used to notify you when a new user signs up or you receive feedback.

### 10. Building

To get things deployed, you'll have to build them first. Run the following set of commands to build the `functions`, `native-audio` and `app` folders.

```
# in native-audio/
npm run build

# in functions/
npm run build

# in app/
npm run build:web-production
```

> Note that this builds the _web_ app for production. Another section below will detail how to build the mobile app.

### 11. Firebase CLI Login

You'll have to login using the same Google account that you created your project under before you can deploy anything.

```
npx firebase-tools login
```

### 12. Deployment

This is the last step, hooray!! Just run the `deploy` command with the correct project ID.

```
# <PROJECT_ID> should be replaced with the value you just copied
npx firebase-tools deploy --project <PROJECT_ID>
```

If everything goes well, Relar should be running at `https://<PROJECT_ID>.web.app`.

### 13. Creating an Account

<!-- TODO add signup flow and remove beta account signup -->

## Structure

As you can see, this is a monorepo. All packages are located in different folders and all contain their own `package.json` file.

### app

This is the web application deployed at [https://relar.app](https://relar.app) _and_ the mobile app that is yet to be deployed to App Stores. [`snowpack`](https://www.snowpack.dev/) along with [`Capacitor`](https://capacitorjs.com/) are used for the Dev environment and to package the app into iOS and Android formats.

### functions

These are the [cloud functions](https://firebase.google.com/docs/functions) deployed in Google Cloud. There is a mixture of functions that run when things happen (e.g. when a new DB entry is created/deleted) and classic backend express [servers](https://expressjs.com/). Instead of running these like a normal backend, you can test them and deploy them to the staging server when you're ready.

### scripts

This is where admin scripts can be found (ie. sending out a beta invitation, performing data migrations/fixes).

### shared

This folder contains all of the shared code between `app`, `functions`, and `scripts`. Within this folder, the shared code is further divided into `node` (code that can only run in `NodeJS`), `web` (code that can only be run on the web), and `universal` (code that can be run in both environments). This code is symlinked (using relative symlinks) into each of the four folders listed above.

### \*

The other files/folders in this repo are a mixture of documentation and configuration.

## Development

### Web App Development

I find

<!-- TODO -->

## Testing

Before you can start testing the `functions`, you'll need to create a test Firebase project using the instructions above. This test project will be used within the test suite to avoid messing the production data. Use the instructions above to create a service account the file called `serviceAccountKey.relar-test.json` at the root of the repository. Eventually, once there is a storage emulator (see this [issue](https://github.com/firebase/firebase-tools/issues/1738)), we won't need a test project.

Next, you will need to create a local `runtimeconfig.json` file with the firebase functions config that you set above using `firebase functions:config:set`. This file is loaded during testing automatically (more information [here](https://firebase.google.com/docs/functions/local-emulator)).

```
firebase functions:config:get --project <PROJECT_ID> > .runtimeconfig.json
```

> Make sure to use the project ID from your real firebase project and not your test project.

Now, both the `app` and `functions` directories have their own test suite that uses [`esbuild-register`](https://github.com/egoist/esbuild-register) and [`uvu`](https://github.com/lukeed/uvu) to run the tests. In either of the directories, just run the `test` command to kick off the test suite.

```
npm run test
```

## Deployment

1. Make sure you've added release notes to `app/src/pages/ReleaseNotes.tsx`.
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

## References

- Logo made by [bqlqn](https://www.flaticon.com/authors/bqlqn) from [Flaticon](https://www.flaticon.com)
