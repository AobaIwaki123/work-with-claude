.PHONY: build commit beer

build:
	node build-styles.js

beer:
	node beer-kentei/generate-glossary.js
	node beer-kentei/generate-textbook.js
	node beer-kentei/generate-quiz.js

commit: build
	git add theme.json build-styles.js styles.css
	git commit -m "Update styles"
	git push origin main
