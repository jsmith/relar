# RELAR

The RELAR repository.

## Environment Setup

First, you'll have to make sure you have `Node` and `npm` installed correctly (see `package.json` for version information). If not installed, we recommend the following steps to getting them set up.

1. Install [Node Version Manager (NVM)](https://github.com/creationix/nvm#install-script)
2. Install [Node and npm using NVM](https://github.com/creationix/nvm#usage)

> Although these instructions use `npm`, `yarn` can also be used if desired.

## Installing Dependencies

First, install [`lerna`](https://github.com/lerna/lerna)!

```
npm i --no-package-lock
```

Next, install all of the actual dependencies using `lerna`. This installs _everything_ for the entire repository.

```
npm run bootstrap
```

## Structure

As you saw above, we use `lerna` to manage this monorepo. All packages are located in `packages/` and all contain their own `package.json` file (`packages/` also contains lots of other useful files/folders).

### packages/app

This is the web application deployed at [https://relar.app](https://relar.app). [`vite`](https://github.com/vitejs/vite) is used for the dev environment and to build the app for deployment.

### packages/mobile

This is the mobile application that's yet to be deployed to the Android and iOS app stores. [`snowpack`](https://www.snowpack.dev/) along with [`Capacitor`](https://capacitorjs.com/) are used for the Dev environment and to package the app into iOS and Android formats.

### packages/functions

These are the [cloud functions](https://firebase.google.com/docs/functions) deployed in Google Cloud. There is a mixture of functions that run when things happen (e.g. when a new DB entry is created/deleted) and classic backend express [servers](https://expressjs.com/). Instead of running these like a normal backend, you can test them and deploy them to the staging server when you're ready.

### packages/scripts

This is where admin scripts can be found (ie. sending out a beta invitation, performing data migrations/fixes).

### packages/shared

This folder contains all of the shared code between `packages/app`, `packages/mobile`, `packages/functions`, and `packages/scripts`. Within this folder, the shared code is further divided into `node` (code that can only run in `NodeJS`), `web` (code that can only be run on the web), and `universal` (code that can be run in both environments). This code is symlinked (using relative symlinks) into each of the four folders listed above.

### \*

The other files/folders in `packages/` are a mixture of documentation and configuration.

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
