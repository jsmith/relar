install:
	npm install
	cd app && npm install
	cd functions && npm install
	cd native-audio && npm install

install-ci:
	npm ci
	cd app && npm ci
	cd functions && npm ci
	cd native-audio && npm ci

checks:
	cd app && npm run check:formatting && npm run check:lint && npm run check:types && npm run test
	cd functions && npm run check:formatting && npm run check:lint && npm run check:types && firebase emulators:exec --only firestore "npm run test"

emulator:
	firebase emulators:start --only firestore
