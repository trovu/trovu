make fill-and-submit.user.js:
	browserify fill-and-submit.user.src.js > fill-and-submit.user.js
make clean:
	rm fill-and-submit.user.js
