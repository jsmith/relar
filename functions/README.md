# Functions

The Relar cloud functions.

## Testing Setup

If you want to be able to run the tests, you will need to create a local `runtimeconfig.json` file. To run this command though, you will need to login first.

```
firebase functions:config:get > .runtimeconfig.json
```

## Testing

```
npm run test
```

## Project Setup

Run this to set the project configuration.

```
firebase functions:config:set mail.sendgrid_api_key="API_KEY" mail.notification_email="jsmith@hey.com" environment.project=PROJECT --project PROJECT
```
