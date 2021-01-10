install:
	npm install
	cd app && npm install
	cd functions && npm install
	cd native-audio && npm install

emulator:
	firebase emulators:start --only firestore
