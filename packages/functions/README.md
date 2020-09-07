# Functions
The RELAR cloud functions.

## Setup
```
firebase functions:config:set mail.sendgrid_api_key="API_KEY" mail.notification_email="jsmith@hey.com" environment.project=PROJECT --project PROJECT
```

## Testing Setup
```
firebase functions:config:get > .runtimeconfig.json
```
