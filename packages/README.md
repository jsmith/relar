# Firebase

Just some instructions about deployment.

## Setup

### firebase

```
npm install -g firebase-tools
```

### gcloud

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
```

### CORS

```
gsutil cors set storage.json gs://relar-staging.appspot.com # or gs://toga-4e3f5.appspot.com
```
