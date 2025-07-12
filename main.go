package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/olahol/melody"
)

type Message struct {
	Username string    `json:"username"`
	Content  string    `json:"content"`
	Time     time.Time `json:"time"`
	Type     string    `json:"type"`
}

func main() {
	r := mux.NewRouter()
	m := melody.New()

	// Configurar o template HTML
	tmpl := template.Must(template.New("chat").Parse(htmlTemplate))

	// Rota principal que serve a interface HTML
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		tmpl.Execute(w, nil)
	})

	// Rota WebSocket para comunicação em tempo real
	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		m.HandleRequest(w, r)
	})

	// Configurar handlers do Melody
	m.HandleMessage(func(s *melody.Session, msg []byte) {
		var message Message
		if err := json.Unmarshal(msg, &message); err != nil {
			log.Printf("Erro ao decodificar mensagem: %v", err)
			return
		}

		// Adicionar timestamp se não fornecido
		if message.Time.IsZero() {
			message.Time = time.Now()
		}

		// Broadcast da mensagem para todos os clientes
		messageBytes, _ := json.Marshal(message)
		m.Broadcast(messageBytes)
	})

	m.HandleConnect(func(s *melody.Session) {
		log.Printf("Novo cliente conectado: %s", s.Request.RemoteAddr)

		// Enviar mensagem de sistema
		welcomeMsg := Message{
			Username: "Sistema",
			Content:  "Bem-vindo ao chat!",
			Time:     time.Now(),
			Type:     "system",
		}
		welcomeBytes, _ := json.Marshal(welcomeMsg)
		s.Write(welcomeBytes)
	})

	m.HandleDisconnect(func(s *melody.Session) {
		log.Printf("Cliente desconectado: %s", s.Request.RemoteAddr)
	})

	// Servir arquivos estáticos (CSS, JS)
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	fmt.Println("Servidor iniciado em http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat em Tempo Real</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .chat-container {
            width: 90%;
            max-width: 800px;
            height: 80vh;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .chat-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 1.5em;
            font-weight: 600;
        }

        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: #f8f9fa;
        }

        .message {
            margin-bottom: 15px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
            animation: fadeIn 0.3s ease-in;
        }

        .message.user {
            flex-direction: row-reverse;
        }

        .message.system {
            justify-content: center;
        }

        .message-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 14px;
        }

        .message.user .message-avatar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .message.other .message-avatar {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .message.system .message-avatar {
            background: #6c757d;
            width: 30px;
            height: 30px;
            font-size: 12px;
        }

        .message-content {
            max-width: 70%;
            padding: 12px 16px;
            border-radius: 18px;
            position: relative;
            word-wrap: break-word;
        }

        .message.user .message-content {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-bottom-right-radius: 4px;
        }

        .message.other .message-content {
            background: white;
            color: #333;
            border: 1px solid #e9ecef;
            border-bottom-left-radius: 4px;
        }

        .message.system .message-content {
            background: #e9ecef;
            color: #6c757d;
            border-radius: 20px;
            font-style: italic;
            text-align: center;
        }

        .message-time {
            font-size: 0.75em;
            opacity: 0.7;
            margin-top: 4px;
            text-align: right;
        }

        .message.user .message-time {
            text-align: left;
        }

        .message.system .message-time {
            text-align: center;
        }

        .chat-input-container {
            padding: 20px;
            background: white;
            border-top: 1px solid #e9ecef;
        }

        .chat-input-form {
            display: flex;
            gap: 10px;
            align-items: flex-end;
        }

        .username-input {
            flex: 0 0 120px;
            padding: 10px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 14px;
            transition: border-color 0.3s;
        }

        .username-input:focus {
            outline: none;
            border-color: #667eea;
        }

        .message-input {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid #e9ecef;
            border-radius: 25px;
            font-size: 16px;
            resize: none;
            min-height: 50px;
            max-height: 120px;
            transition: border-color 0.3s;
        }

        .message-input:focus {
            outline: none;
            border-color: #667eea;
        }

        .send-button {
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .send-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .send-button:active {
            transform: translateY(0);
        }

        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 25px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            transition: all 0.3s;
        }

        .connection-status.connected {
            background: #28a745;
        }

        .connection-status.disconnected {
            background: #dc3545;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .typing-indicator {
            display: none;
            padding: 10px 20px;
            color: #6c757d;
            font-style: italic;
        }

        .typing-indicator.show {
            display: block;
        }

        @media (max-width: 768px) {
            .chat-container {
                width: 95%;
                height: 90vh;
            }
            
            .message-content {
                max-width: 85%;
            }
            
            .username-input {
                flex: 0 0 100px;
            }
        }
    </style>
</head>
<body>
    <div class="connection-status disconnected" id="connectionStatus">
        Desconectado
    </div>

    <div class="chat-container">
        <div class="chat-header">
            💬 Chat em Tempo Real
        </div>
        
        <div class="chat-messages" id="chatMessages">
            <!-- Mensagens aparecerão aqui -->
        </div>
        
        <div class="typing-indicator" id="typingIndicator">
            Alguém está digitando...
        </div>
        
        <div class="chat-input-container">
            <form class="chat-input-form" id="chatForm">
                <input type="text" class="username-input" id="usernameInput" placeholder="Seu nome" maxlength="20" required>
                <textarea class="message-input" id="messageInput" placeholder="Digite sua mensagem..." maxlength="500" required></textarea>
                <button type="submit" class="send-button">Enviar</button>
            </form>
        </div>
    </div>

    <script>
        let ws;
        let username = '';
        let isConnected = false;

        function connect() {
            ws = new WebSocket('ws://' + window.location.host + '/ws');
            
            ws.onopen = function() {
                isConnected = true;
                updateConnectionStatus(true);
                console.log('Conectado ao servidor');
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                displayMessage(message);
            };
            
            ws.onclose = function() {
                isConnected = false;
                updateConnectionStatus(false);
                console.log('Desconectado do servidor');
                // Tentar reconectar após 3 segundos
                setTimeout(connect, 3000);
            };
            
            ws.onerror = function(error) {
                console.error('Erro WebSocket:', error);
            };
        }

        function updateConnectionStatus(connected) {
            const status = document.getElementById('connectionStatus');
            if (connected) {
                status.textContent = 'Conectado';
                status.className = 'connection-status connected';
            } else {
                status.textContent = 'Desconectado';
                status.className = 'connection-status disconnected';
            }
        }

        function displayMessage(message) {
            const chatMessages = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            
            let messageClass = 'message other';
            if (message.username === username) {
                messageClass = 'message user';
            } else if (message.type === 'system') {
                messageClass = 'message system';
            }
            
            const time = new Date(message.time).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            let avatarText = message.username.charAt(0).toUpperCase();
            if (message.type === 'system') {
                avatarText = '🔔';
            }
            
            messageDiv.className = messageClass;
            messageDiv.innerHTML = '<div class="message-avatar">' + avatarText + '</div>' +
                '<div class="message-content">' +
                '<div>' + message.content + '</div>' +
                '<div class="message-time">' + time + '</div>' +
                '</div>';
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function sendMessage(content) {
            if (!isConnected || !content.trim()) return;
            
            const message = {
                username: username,
                content: content.trim(),
                time: new Date(),
                type: 'message'
            };
            
            ws.send(JSON.stringify(message));
        }

        // Event listeners
        document.getElementById('chatForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const usernameInput = document.getElementById('usernameInput');
            const messageInput = document.getElementById('messageInput');
            
            if (!usernameInput.value.trim()) {
                alert('Por favor, digite seu nome!');
                usernameInput.focus();
                return;
            }
            
            if (!messageInput.value.trim()) return;
            
            username = usernameInput.value.trim();
            sendMessage(messageInput.value);
            messageInput.value = '';
            messageInput.focus();
        });

        // Auto-resize textarea
        document.getElementById('messageInput').addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Enter para enviar, Shift+Enter para nova linha
        document.getElementById('messageInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('chatForm').dispatchEvent(new Event('submit'));
            }
        });

        // Conectar ao carregar a página
        connect();
    </script>
</body>
</html>`
