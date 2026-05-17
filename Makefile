.PHONY: build commit

build:
	node build-styles.js

commit: build
	git add theme.json build-styles.js styles.css
	git commit -m "Update styles"
	git push origin main
