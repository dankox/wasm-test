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

globalThis.http = require("http");
// const crypto = require("crypto");
// globalThis.crypto = {
// 	getRandomValues(b) {
// 		crypto.randomFillSync(b);
// 	},
// };
// const fetch = require("isomorphic-fetch");
// globalThis.fetch = fetch;

(async function() {

	require("./wasm_exec");
	
	try {
		const go = new Go();
		go.argv = process.argv.slice(2);
		go.env = Object.assign({ TMPDIR: require("os").tmpdir() }, process.env);
		go.exit = process.exit;
		const buf = fs.readFileSync(process.argv[2])
		const inst = await WebAssembly.instantiate(buf, go.importObject)
		let promise = go.run(inst.instance)
		// console.log(promise)
		// await go.run(inst.instance);
		console.log("go.run done!")
		const gomod = go.exports
		
		// console.log(await(await gomod.HttpGet("https://www.google.com")).text())
		
		const getter = {
			// fetch: fetch,
			fetch: () => new Promise(null),
			// fetch: () => new Promise((res)=>res()),
		}

		const err = false;
		let test = new Promise((resolve, reject) => {
			if (!err) resolve("done!");
			else reject("error!");
		});
		console.log(await test);

		setTimeout(async ()=>{
			console.log(gomod);
			try {
				const stuff = await gomod.GetStuff("https://www.abagoogle.com", getter);
				console.log("GetStuff:", await stuff.text())
			} catch (e) {
				console.log("getstuff error:", e)
			}
		}, 100);

		setTimeout(() => console.log("hello danko"), 2000);

		// console.log(await fetch("https://www.google.com"));
		// process.on("beforeExit", async(code) => {
		// 	console.log(gomod);
		// 	const stuff = await gomod.GetStuff("https://www.google.com", getter);
		// 	// const stuff = await GetStuff("https://www.google.com", getter);
		// 	console.log("GetStuff:", await stuff.text())
		// 	process.exit(0);
		// })
		
	} catch (err) {
		console.error("catched error:", err);
		process.exit(1);
	}
})()
