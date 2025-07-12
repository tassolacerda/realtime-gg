package main

import (
	"bufio"
	"fmt"
	"net"
	"sync"
)

var (
	clients = make(map[net.Conn]bool)
	mutex   sync.Mutex
)

func handleConnection(conn net.Conn) {
	defer conn.Close()

	mutex.Lock()
	clients[conn] = true
	mutex.Unlock()

	reader := bufio.NewReader(conn)

	for {
		message, err := reader.ReadString('\n')
		if err != nil {
			fmt.Printf("Client disconnected: %s\n", conn.RemoteAddr())
			mutex.Lock()
			delete(clients, conn)
			mutex.Unlock()
			return
		}

		fmt.Printf("Received from %s: %s", conn.RemoteAddr(), message)
		broadcastMessage(conn, message)
	}
}

func broadcastMessage(sender net.Conn, message string) {
	mutex.Lock()
	defer mutex.Unlock()

	for conn := range clients {
		if conn != sender {
			_, err := conn.Write([]byte(message))
			if err != nil {
				fmt.Printf("Error broadcasting message to %s: %s\n", conn.RemoteAddr(), err)
				conn.Close()
				delete(clients, conn)
			}
		}
	}
}

func main() {
	listener, err := net.Listen("tcp", ":8080")
	if err != nil {
		fmt.Println("Error starting server:", err)
		return
	}
	defer listener.Close()

	fmt.Println("Server listening on :8080")

	for {
		conn, err := listener.Accept()
		if err != nil {
			fmt.Println("Error accepting connection:", err)
			continue
		}

		fmt.Printf("New client connected: %s\n", conn.RemoteAddr())
		go handleConnection(conn)
	}
}