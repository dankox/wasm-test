// Copyright 2021 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

"use strict";

if (process.argv.length < 3) {
	console.error("usage: go_js_wasm_exec [wasm binary] [arguments]");
	process.exit(1);
}

globalThis.require = require;
globalThis.fs = require("fs");
globalThis.TextEncoder = require("util").TextEncoder;
globalThis.TextDecoder = require("util").TextDecoder;

globalThis.performance = {
	now() {
		const [sec, nsec] = process.hrtime();
		return sec * 1000 + nsec / 1000000;
	},
};

globalThis.http = require("http")
// const crypto = require("crypto");
// globalThis.crypto = {
// 	getRandomValues(b) {
// 		crypto.randomFillSync(b);
// 	},
// };
// const fetch = require("isomorphic-fetch");
// globalThis.fetch = fetch;

require("./wasm_exec");

const go = new Go();
go.argv = process.argv.slice(2);
go.env = Object.assign({ TMPDIR: require("os").tmpdir() }, process.env);
go.exit = process.exit;
WebAssembly.instantiate(fs.readFileSync(process.argv[2]), go.importObject).then((result) => {
	process.on("exit", (code) => { // Node.js exits if no event handler is pending
		// if (code === 0 && !go.exited) {
		// 	// deadlock, make Go print error and stack traces
		// 	go._pendingEvent = { id: 0 };
		// 	go._resume();
		// }
	});
	process.on("beforeExit", async (code) => { // Node.js exits if no event handler is pending
		// calling Go function which returns promise
		let response = await HttpGet("https://www.google.com");
		let res_str = await response.text();
		console.log("HttpGet:", res_str)
		let getter = require("../http")
		let stuff = await GetStuff("https://www.google.com", getter);
		// let res_str = await response.text();
		console.log("GetStuff:", stuff)
		process.exit(0);
	});
	return go.run(result.instance);
}).catch((err) => {
	console.error(err);
	process.exit(1);
});

// (async function() {
// 	try {
// 		let result = await WebAssembly.instantiate(fs.readFileSync(process.argv[2]), go.importObject);
// 		// process.on("exit", (code) => { // Node.js exits if no event handler is pending
// 		// 	if (code === 0 && !go.exited) {
// 		// 		// deadlock, make Go print error and stack traces
// 		// 		go._pendingEvent = { id: 0 };
// 		// 		go._resume();
// 		// 	}
// 		// });
// 		console.log("starting")
// 		await go.run(result.instance);
// 		console.log("started")
// 		let response = await HttpGet("https://www.google.com")
// 		console.log("HttpGet:", response)
// 	} catch(err) {
// 		console.error(err);
// 		process.exit(1);
// 	};
// })();

