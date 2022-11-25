// Copyright 2021 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

"use strict";

if (Deno.args.length < 1) {
	console.error("usage: deno run --allow-all ./wasm_exec_deno.ts [wasm binary]");
	Deno.exit(1);
}

import Go from "https://deno.land/x/godeno@v0.6.2/mod.ts"

const go = new Go();
console.log(Deno.args)
const f = await Deno.open(Deno.args[0])
// const buf = await Deno.readAll(f);
import * as conv from "https://deno.land/std@0.165.0/streams/conversion.ts"
const buf = await conv.readAll(f);
const inst = await WebAssembly.instantiate(buf, go.importObject);
let promise = go.run(inst.instance);
// await go.run(inst.instance);
console.log("go.run done!")
const gomod = go.exports

// console.log(await(await gomod.HttpGet("https://www.google.com")).text())

const getter = {
	fetch: fetch,
}
// console.log(await fetch("https://www.google.com"));
const stuff = await gomod.GetStuff("https://www.google.com", getter);
console.log("GetStuff:", await stuff.text())
