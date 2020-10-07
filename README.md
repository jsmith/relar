# RELAR

The RELAR repository.

## Environment Setup

First, you'll have to make sure you have `Node` and `npm` installed correctly (see `package.json` for version information). If not installed, we recommend the following steps to getting them set up.

1. Install [Node Version Manager (NVM)](https://github.com/creationix/nvm#install-script)
2. Install [Node and npm using NVM](https://github.com/creationix/nvm#usage)

> Although these instructions use `npm`, `yarn` can also be used if desired.

## Installing Dependencies

The following command installs the dependencies in _all_ the repositories.

```
make install
```

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

Deployment is managed by `GitHub Actions` (see below). We run deployment whenever a new tag is pushed!

```
# follow the prompts for this
npm run version
```

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
gsutil cors set storage.json gs://relar-staging.appspot.com # or gs://toga-4e3f5.appspot.com
```

## Resources

- https://medium.com/firebase-developers/the-secrets-of-firestore-fieldvalue-servertimestamp-revealed-29dd7a38a82b
- https://stackoverflow.com/questions/46806860/how-to-query-cloud-firestore-for-non-existing-keys-of-documents
