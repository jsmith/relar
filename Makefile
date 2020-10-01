install:
	npm install
	cd packages/functions && npm install
	cd native-audio && npm install

install-ci:
	npm ci
	cd packages/functions && npm ci
	cd native-audio && npm ci

patch:
	npx patch-package

checks:
	cd packages/app && npm run check:formatting && npm run check:lint && npm run check:types && npm run test
	cd packages/mobile && npm run check:formatting && npm run check:lint && npm run check:types && npm run test
	cd packages/functions && npm run check:formatting && npm run check:lint && npm run check:types && npm run test
