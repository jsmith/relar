install-ci:
	cd packages/app && npm ci
	cd packages/functions && npm ci
	cd packages/mobile && npm ci

patch:
	cd packages/app && npx patch-package
	cd packages/functions && npx patch-package

checks:
	# cd packages/app && npm run check:formatting && npm run check:lint && npm run check:types && npm run test
	cd packages/mobile && npm run check:formatting && npm run check:lint && npm run check:types && npm run test
	cd packages/functions && npm run check:formatting && npm run check:lint && npm run check:types && npm run test
