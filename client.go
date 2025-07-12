package main

import (
	"bufio"
	"fmt"
	"net"
	"os"
)

func main() {
	conn, err := net.Dial("tcp", "localhost:8080")
	if err != nil {
		fmt.Println("Error connecting to server:", err)
		return
	}
	defer conn.Close()

	fmt.Println("Connected to server. Type your messages:")

	go receiveMessages(conn)

	reader := bufio.NewReader(os.Stdin)

	for {
		input, _ := reader.ReadString('\n')
		_, err := conn.Write([]byte(input))
		if err != nil {
			fmt.Println("Error sending message:", err)
			return
		}
	}
}

func receiveMessages(conn net.Conn) {
	reader := bufio.NewReader(conn)
	for {
		message, err := reader.ReadString('\n')
		if err != nil {
			fmt.Println("Server disconnected:", err)
			conn.Close()
			return
		}
		fmt.Print("Received: ", message)
	}
}