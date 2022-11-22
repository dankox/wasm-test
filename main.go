package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	fmt.Println("Hello dankox!")

	// f, err := ioutil.ReadFile("index.html")
	// if err != nil {
	// 	fmt.Println("error:", err)
	// }
	// fmt.Println("file:", f)

	req, err := http.NewRequest("GET", "http://usildamd.lvn.broadcom.net:50004/EndevorService/api/v2/", nil)
	if err != nil {
		fmt.Println("http error:", err)
	}
	client := http.Client{}
	res, err := client.Do(req)
	if err != nil {
		fmt.Println("http response error:", err)
	} else {
		if body, err := ioutil.ReadAll(res.Body); err != nil {
			fmt.Println("error while reading body of the response:", err)
		} else {
			fmt.Println("response:", string(body))
		}
	}
}
