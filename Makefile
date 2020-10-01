install:
	npm install
	cd functions && npm install
	cd native-audio && npm install

install-ci:
	npm ci
	cd functions && npm ci
	cd native-audio && npm ci

patch:
	npx patch-package

checks:
	cd app && npm run check:formatting && npm run check:lint && npm run check:types && npm run test
	cd mobile && npm run check:formatting && npm run check:lint && npm run check:types && npm run test
	cd functions && npm run check:formatting && npm run check:lint && npm run check:types && npm run test
