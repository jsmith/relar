# RELAR

The RELAR repository. See folders in `packages/` for more information.

## Deployment

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
