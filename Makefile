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

emulator:
	firebase emulators:start --only firestore
