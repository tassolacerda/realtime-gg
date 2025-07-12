package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/olahol/melody"
)

type EncryptedMessage struct {
	ID        string    `json:"id"`
	From      string    `json:"from"`
	To        string    `json:"to"`
	Encrypted string    `json:"encrypted"`
	Timestamp time.Time `json:"timestamp"`
	Type      string    `json:"type"`
}

type UsernameRequest struct {
	Username string `json:"username"`
}

var (
	activeConnections = make(map[string]*melody.Session)
	userSessions      = make(map[string]string)          // userID -> sessionID
	userFriends       = make(map[string]map[string]bool) // userID -> map[friendID]bool
	usernames         = make(map[string]string)          // userID -> username
	usernameToUserID  = make(map[string]string)          // username -> userID
	mutex             sync.RWMutex
)

func generateUserID(username string) string {
	hash := sha256.Sum256([]byte(username))
	return hex.EncodeToString(hash[:])[:16]
}

func getShortName(text string) string {
	if len(text) == 0 {
		return "unknown"
	}
	if len(text) <= 8 {
		return text
	}
	return text[:8] + "..."
}

func cleanupOrphanedData() {
	mutex.Lock()
	defer mutex.Unlock()

	for userID, sessionID := range userSessions {
		if _, exists := activeConnections[sessionID]; !exists {
			log.Printf("🧹 Limpando sessão órfã: %s -> %s", getShortName(userID), getShortName(sessionID))
			delete(userSessions, userID)
		}
	}

	for sessionID, session := range activeConnections {
		if userID, ok := session.Get("userID"); ok {
			if userIDStr, ok := userID.(string); ok {
				if _, exists := userSessions[userIDStr]; !exists {
					log.Printf("🧹 Limpando conexão órfã: %s", getShortName(sessionID))
					delete(activeConnections, sessionID)
				}
			}
		}
	}

	for userID, friends := range userFriends {
		if len(friends) == 0 {
			log.Printf("🧹 Limpando usuário sem amigos: %s", getShortName(userID))
			delete(userFriends, userID)
		}
	}
}

func broadcastOnlineStatus(userID string, online bool) {
	status := map[string]interface{}{
		"type": "online_status",
		"data": map[string]interface{}{
			"user_id": userID,
			"online":  online,
		},
	}

	statusBytes, _ := json.Marshal(status)

	log.Printf("📡 Enviando status online: %s = %v", userID, online)

	mutex.RLock()
	count := 0
	for _, session := range activeConnections {
		// Não enviar para a própria sessão do usuário
		if currentUserID, ok := session.Get("userID"); ok {
			if currentUserIDStr, ok := currentUserID.(string); ok {
				if currentUserIDStr == userID {
					log.Printf("📡 Pulando envio para própria sessão: %s", getShortName(userID))
					continue
				}
			}
		}

		session.Write(statusBytes)
		count++
	}
	mutex.RUnlock()

	log.Printf("📡 Status enviado para %d conexões (excluindo própria sessão)", count)
}

func sendOnlineUsersList(session *melody.Session) {
	mutex.RLock()
	onlineUsers := make([]map[string]interface{}, 0)

	for _, session := range activeConnections {
		if userID, ok := session.Get("userID"); ok {
			if userIDStr, ok := userID.(string); ok {
				username := usernames[userIDStr]
				if username == "" {
					username = "Sem nome"
				}
				onlineUsers = append(onlineUsers, map[string]interface{}{
					"user_id":  userIDStr,
					"username": username,
				})
			}
		}
	}
	mutex.RUnlock()

	response := map[string]interface{}{
		"type": "online_users_list",
		"data": onlineUsers,
	}

	responseBytes, _ := json.Marshal(response)
	session.Write(responseBytes)

	log.Printf("📡 Lista de %d usuários online enviada para nova conexão", len(onlineUsers))
}

// Enviar lista de usernames para todos os usuários conectados
func broadcastUsernames() {
	mutex.RLock()
	usernameList := make([]map[string]interface{}, 0)

	for userID, username := range usernames {
		if username != "" {
			usernameList = append(usernameList, map[string]interface{}{
				"user_id":  userID,
				"username": username,
			})
		}
	}
	mutex.RUnlock()

	if len(usernameList) > 0 {
		response := map[string]interface{}{
			"type": "usernames_list",
			"data": usernameList,
		}
		responseBytes, _ := json.Marshal(response)

		mutex.RLock()
		for _, session := range activeConnections {
			session.Write(responseBytes)
		}
		mutex.RUnlock()

		log.Printf("📡 Lista de %d usernames enviada para todos os usuários", len(usernameList))
	}
}

func printUserStatus() {
	mutex.RLock()
	defer mutex.RUnlock()

	fmt.Println("\n" + strings.Repeat("=", 50))
	fmt.Println("📊 STATUS ATUAL DOS USUÁRIOS")
	fmt.Println(strings.Repeat("=", 50))
	fmt.Printf("👥 Total de conexões ativas: %d\n", len(activeConnections))

	if len(activeConnections) > 0 {
		fmt.Println("\n🔗 Usuários conectados:")
		for sessionID, session := range activeConnections {
			if userID, ok := session.Get("userID"); ok {
				if userIDStr, ok := userID.(string); ok {
					username := usernames[userIDStr]
					if username == "" {
						username = "Sem nome"
					}
					fmt.Printf("  • %s (%s) - session: %s\n", username, getShortName(userIDStr), getShortName(sessionID))
				}
			}
		}
	} else {
		fmt.Println("  (nenhum usuário conectado)")
	}

	fmt.Printf("\n💾 Total de sessões de usuário: %d\n", len(userSessions))
	if len(userSessions) > 0 {
		fmt.Println("\n👤 Usuários registrados:")
		for userID := range userSessions {
			username := usernames[userID]
			if username == "" {
				username = "Sem nome"
			}
			fmt.Printf("  • %s (%s)\n", username, getShortName(userID))
		}
	}

	fmt.Printf("\n🤝 Total de usuários com amigos: %d\n", len(userFriends))
	if len(userFriends) > 0 {
		fmt.Println("\n👥 Relacionamentos de amizade:")
		for userID, friends := range userFriends {
			if len(friends) > 0 {
				username := usernames[userID]
				if username == "" {
					username = "Sem nome"
				}
				friendList := make([]string, 0, len(friends))
				for friendID := range friends {
					friendUsername := usernames[friendID]
					if friendUsername == "" {
						friendUsername = "Sem nome"
					}
					friendList = append(friendList, friendUsername)
				}
				fmt.Printf("  • %s tem %d amigos: %s\n", username, len(friends), strings.Join(friendList, ", "))
			}
		}
	}

	fmt.Println(strings.Repeat("=", 50) + "\n")
}

func main() {
	r := mux.NewRouter()
	m := melody.New()

	// CORS
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	})

	// WebSocket handler
	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		m.HandleRequest(w, r)
	})

	// Melody connection handlers
	m.HandleConnect(func(s *melody.Session) {
		log.Printf("🔌 Nova conexão WebSocket estabelecida")
	})

	m.HandleDisconnect(func(s *melody.Session) {
		userID, _ := s.Get("userID")
		sessionID, _ := s.Get("sessionID")

		if userIDStr, ok := userID.(string); ok {
			log.Printf("❌ Cliente desconectando: %s", getShortName(userIDStr))

			mutex.Lock()
			delete(userSessions, userIDStr)
			if sessionIDStr, ok := sessionID.(string); ok {
				delete(activeConnections, sessionIDStr)
			}
			mutex.Unlock()

			log.Printf("❌ Cliente desconectado: %s", getShortName(userIDStr))

			// Notificar outros usuários sobre a desconexão
			broadcastOnlineStatus(userIDStr, false)
		}
	})

	// Melody message handler
	m.HandleMessage(func(s *melody.Session, msg []byte) {
		var mData EncryptedMessage
		if err := json.Unmarshal(msg, &mData); err != nil {
			log.Println("Erro ao parsear mensagem:", err)
			return
		}

		switch mData.Type {
		case "set_username":
			var req UsernameRequest
			// Tentar parsear como JSON primeiro
			if err := json.Unmarshal([]byte(mData.Encrypted), &req); err != nil {
				// Se falhar, tratar como string simples
				req.Username = mData.Encrypted
			}

			userID := generateUserID(req.Username)
			sessionID := uuid.New().String()

			mutex.Lock()
			usernames[userID] = req.Username
			usernameToUserID[req.Username] = userID
			userSessions[userID] = sessionID
			activeConnections[sessionID] = s
			mutex.Unlock()

			s.Set("userID", userID)
			s.Set("sessionID", sessionID)

			log.Printf("🔐 %s vinculado ao ID %s (session: %s)", req.Username, getShortName(userID), getShortName(sessionID))
			log.Printf("📝 Username '%s' salvo para userID %s", req.Username, getShortName(userID))

			// Enviar ID do usuário
			response := map[string]interface{}{
				"type":    "user_id",
				"user_id": userID,
			}
			responseBytes, _ := json.Marshal(response)
			s.Write(responseBytes)

			ack := EncryptedMessage{
				ID:        uuid.NewString(),
				Type:      "username_ack",
				Timestamp: time.Now(),
				From:      "server",
				To:        userID,
				Encrypted: fmt.Sprintf("Usuário %s vinculado com sucesso!", req.Username),
			}
			b, _ := json.Marshal(ack)
			s.Write(b)

			// Notificar outros usuários sobre a nova conexão
			broadcastOnlineStatus(userID, true)

			// Enviar lista de usuários online para o novo usuário
			sendOnlineUsersList(s)

			// Enviar lista de usernames para todos os usuários (incluindo o novo)
			broadcastUsernames()

		case "message":
			// Forward da mensagem encriptada para o destinatário
			forwardEncryptedMessage(mData)

		case "key_exchange":
			// Forward da troca de chaves
			forwardEncryptedMessage(mData)

		case "add_friend":
			// Processar solicitação de amizade
			handleAddFriend(mData)

		case "friend_request":
			// Processar resposta de solicitação de amizade
			handleFriendRequest(mData)

		default:
			log.Printf("❓ Tipo de mensagem desconhecido: %s", mData.Type)
		}
	})

	// Monitoramento (opcional)
	go func() {
		for {
			time.Sleep(10 * time.Second)
			printUserStatus()
			cleanupOrphanedData()
		}
	}()

	// Template HTML (opcional)
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		tmpl := template.Must(template.ParseFiles("template.html"))
		tmpl.Execute(w, nil)
	})

	http.Handle("/", r)
	log.Println("🚀 Servidor iniciado em :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func forwardEncryptedMessage(message EncryptedMessage) {
	mutex.RLock()
	sessionID, exists := userSessions[message.To]
	mutex.RUnlock()

	if !exists {
		log.Printf("Destinatário não encontrado: %s", message.To)
		return
	}

	mutex.RLock()
	session, exists := activeConnections[sessionID]
	mutex.RUnlock()

	if !exists {
		log.Printf("Sessão não encontrada para: %s", message.To)
		return
	}

	messageBytes, _ := json.Marshal(message)
	session.Write(messageBytes)
}

func handleAddFriend(message EncryptedMessage) {
	friendID := message.Encrypted

	log.Printf("📝 Solicitação de amizade: %s quer adicionar %s", message.From, friendID)
	log.Printf("🔍 Detalhes da solicitação: From='%s', Encrypted='%s'", message.From, friendID)

	// Verificar se os IDs são válidos
	if message.From == "" {
		log.Printf("❌ ID do remetente está vazio na solicitação de amizade")
		return
	}

	if friendID == "" {
		log.Printf("❌ ID do amigo está vazio na solicitação de amizade")
		return
	}

	mutex.RLock()
	_, friendExists := userSessions[friendID]
	mutex.RUnlock()

	if !friendExists {
		log.Printf("❌ Usuário %s não encontrado ou offline", getShortName(friendID))
		response := map[string]interface{}{
			"type":      "friend_error",
			"error":     "Usuário não encontrado ou offline",
			"friend_id": friendID,
		}
		responseBytes, _ := json.Marshal(response)

		mutex.RLock()
		sessionID, exists := userSessions[message.From]
		if exists {
			if session, ok := activeConnections[sessionID]; ok {
				session.Write(responseBytes)
				log.Printf("📤 Erro enviado para %s: usuário %s não encontrado", getShortName(message.From), getShortName(friendID))
			}
		}
		mutex.RUnlock()
		return
	}

	friendRequest := map[string]interface{}{
		"type":     "friend_request",
		"from":     message.From,
		"to":       friendID,
		"accepted": false,
	}
	friendRequestBytes, _ := json.Marshal(friendRequest)

	mutex.RLock()
	sessionID, exists := userSessions[friendID]
	if exists {
		if session, ok := activeConnections[sessionID]; ok {
			session.Write(friendRequestBytes)
		}
	}
	mutex.RUnlock()

	response := map[string]interface{}{
		"type":      "friend_request_sent",
		"friend_id": friendID,
	}
	responseBytes, _ := json.Marshal(response)

	mutex.RLock()
	sessionID, exists = userSessions[message.From]
	if exists {
		if session, ok := activeConnections[sessionID]; ok {
			session.Write(responseBytes)
		}
	}
	mutex.RUnlock()
}

func handleFriendRequest(message EncryptedMessage) {
	accepted := message.Encrypted == "accepted"

	log.Printf("📝 Resposta de amizade: %s %s a solicitação de %s",
		message.From,
		map[bool]string{true: "aceitou", false: "recusou"}[accepted],
		message.To)

	log.Printf("🔍 Detalhes da mensagem: From='%s', To='%s', Encrypted='%s', Accepted=%v",
		message.From, message.To, message.Encrypted, accepted)

	if accepted {
		// Verificar se os IDs são válidos
		if message.From == "" || message.To == "" {
			log.Printf("❌ IDs inválidos na resposta de amizade: From='%s', To='%s'", message.From, message.To)
			return
		}

		mutex.Lock()
		if userFriends[message.From] == nil {
			userFriends[message.From] = make(map[string]bool)
		}
		if userFriends[message.To] == nil {
			userFriends[message.To] = make(map[string]bool)
		}
		userFriends[message.From][message.To] = true
		userFriends[message.To][message.From] = true
		mutex.Unlock()

		log.Printf("✅ Amizade estabelecida entre %s e %s", getShortName(message.From), getShortName(message.To))

		// Enviar confirmação para quem aceitou (message.From)
		response1 := map[string]interface{}{
			"type":      "friend_added",
			"friend_id": message.To, // ID de quem foi aceito
		}
		responseBytes1, _ := json.Marshal(response1)
		log.Printf("📤 Preparando confirmação 1: %s -> %s (friend_id: %s)", getShortName(message.From), getShortName(message.To), getShortName(message.To))

		mutex.RLock()
		sessionID, exists := userSessions[message.From]
		if exists {
			if session, ok := activeConnections[sessionID]; ok {
				session.Write(responseBytes1)
				log.Printf("📤 Confirmação enviada para %s: amigo %s adicionado", getShortName(message.From), getShortName(message.To))
			} else {
				log.Printf("❌ Sessão não encontrada para %s", getShortName(message.From))
			}
		} else {
			log.Printf("❌ Usuário %s não encontrado nas sessões", getShortName(message.From))
		}
		mutex.RUnlock()

		// Enviar confirmação para quem foi aceito (message.To)
		response2 := map[string]interface{}{
			"type":      "friend_added",
			"friend_id": message.From, // ID de quem aceitou
		}
		responseBytes2, _ := json.Marshal(response2)
		log.Printf("📤 Preparando confirmação 2: %s -> %s (friend_id: %s)", getShortName(message.To), getShortName(message.From), getShortName(message.From))

		mutex.RLock()
		sessionID, exists = userSessions[message.To]
		if exists {
			if session, ok := activeConnections[sessionID]; ok {
				session.Write(responseBytes2)
				log.Printf("📤 Confirmação enviada para %s: amigo %s adicionado", getShortName(message.To), getShortName(message.From))
			} else {
				log.Printf("❌ Sessão não encontrada para %s", getShortName(message.To))
			}
		} else {
			log.Printf("❌ Usuário %s não encontrado nas sessões", getShortName(message.To))
		}
		mutex.RUnlock()
	}
}
