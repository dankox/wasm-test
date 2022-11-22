//go:build js && wasm
// +build js,wasm

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"sync"
	"syscall/js"
)

func main() {
	fmt.Println("============================================")
	fmt.Println("init wasm")
	fmt.Println("============================================")

	// js.Global().Set("base64", encodeWrapper())
	js.Global().Set("HttpGet", HttpGet())
	js.Global().Set("GetStuff", GetStuff())
	// js.Global().Set("MyGoFuncStream", MyGoFuncStream())
	<-make(chan bool)
}

func HttpGet() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		requestUrl := args[0].String()
		handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			resolve := args[0]
			reject := args[1]
			go func() {

				res, err := http.DefaultClient.Get(requestUrl)
				if err != nil {
					errorConstructor := js.Global().Get("Error")
					errorObject := errorConstructor.New(err.Error())
					reject.Invoke(errorObject)
					return
				}
				defer res.Body.Close()

				data, err := ioutil.ReadAll(res.Body)
				if err != nil {
					errorConstructor := js.Global().Get("Error")
					errorObject := errorConstructor.New(err.Error())
					reject.Invoke(errorObject)
					return
				}

				arrayConstructor := js.Global().Get("Uint8Array")
				dataJS := arrayConstructor.New(len(data))
				js.CopyBytesToJS(dataJS, data)

				responseConstructor := js.Global().Get("Response")
				response := responseConstructor.New(dataJS)

				resolve.Invoke(response)
			}()
			return nil
		})
		promiseConstructor := js.Global().Get("Promise")
		return promiseConstructor.New(handler)
	})
}

func GetStuff() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		stuff := args[0]
		getter := args[1]
		handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			resolve := args[0]
			reject := args[1]
			go func() {
				res, err := await(getter.Call("request", stuff))
				if err != nil {
					reject.Invoke(err)
				}
				resolve.Invoke(res)
			}()
			return nil
		})
		promiseConstructor := js.Global().Get("Promise")
		return promiseConstructor.New(handler)
	})
}

func await(awaitable js.Value) ([]js.Value, []js.Value) {
	then := make(chan []js.Value)
	defer close(then)
	thenFunc := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		then <- args
		return nil
	})
	defer thenFunc.Release()

	catch := make(chan []js.Value)
	defer close(catch)
	catchFunc := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		catch <- args
		return nil
	})
	defer catchFunc.Release()

	awaitable.Call("then", thenFunc).Call("catch", catchFunc)

	select {
	case result := <-then:
		return result, nil
	case err := <-catch:
		return nil, err
	}
}

func old_main() {
	// this is try on calling nodejs client
	glob := js.Global()
	http := glob.Get("http")
	// console := glob.Get("console")
	// object := glob.Get("Object")
	// JSON := glob.Get("JSON")
	wg := new(sync.WaitGroup)
	wg.Add(1)

	options := map[string]interface{}{
		"host": "www.google.com",
		"path": "/",
	}
	// end := make(chan struct{})

	callback := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		str := strings.Builder{}
		response := args[0]

		response.Call("on", "data", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			// fmt.Println(convertToJson(args))
			// console.Call("log", "console.log =>", args[0])
			// jobj := JSON.Call("stringify", args[0])
			// console.Call("log", "console.log =>", jobj)
			// keys := object.Call("keys", args[0])
			// console.Call("log", "console.log =>", keys)

			buff := args[0].Call("toString")
			str.WriteString(buff.String())
			// fmt.Println(buff.String())
			// for i := 0; i < keys.Length(); i++ {
			// 	fmt.Println(i, "key", keys.Index(i))
			// }
			return nil
		}))

		response.Call("on", "end", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			// console.Call("log", "console.log =>", str.String())
			// fmt.Println("got end...")
			fmt.Println(str.String(), "danko")
			// close(end)
			fmt.Println("end should be closed now...")
			wg.Done()
			return nil
		}))

		return nil
	})

	jsopts := js.ValueOf(options)
	jscallback := js.ValueOf(callback)

	response := http.Call("request", jsopts, jscallback)
	response.Call("end")

	fmt.Println("NodeJS http called...")
	wg.Wait()
	fmt.Println("wait finished...")
	// <-end
	// <-make(chan struct{})
}

func convertToJson(data interface{}) string {
	sbuf := new(bytes.Buffer)
	smarsh := json.NewEncoder(sbuf)
	smarsh.SetEscapeHTML(false)
	smarsh.SetIndent("", "  ")
	err := smarsh.Encode(data)
	if err != nil {
		return "ERROR: " + err.Error()
	}

	return sbuf.String()
}
