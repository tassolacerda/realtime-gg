# Chat Encriptado E2E

Um chat com criptografia end-to-end usando Go (backend) e React (frontend).

## Estrutura do Projeto

```
realtime-gg/
├── main.go              # Servidor Go com WebSocket
├── template.html        # Template HTML simples
├── go.mod              # Dependências Go
├── go.sum              # Checksums das dependências
└── chat-frontend/      # Aplicação React
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        └── index.css
```

## Funcionalidades

- ✅ Criptografia end-to-end com libsodium
- ✅ WebSocket para comunicação em tempo real
- ✅ Interface moderna com React
- ✅ Armazenamento local com SQLite
- ✅ Troca automática de chaves públicas
- ✅ Identificação anônima de usuários
- ✅ Mensagens encriptadas no servidor

## Como Executar

### 1. Instalar Node.js

Primeiro, você precisa instalar o Node.js. No macOS:

```bash
# Instalar Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js
brew install node
```

### 2. Executar o Backend (Go)

```bash
# Na pasta raiz do projeto
go run main.go
```

O servidor Go estará rodando em `http://localhost:8080`

### 3. Executar o Frontend (React)

```bash
# Entrar na pasta do frontend
cd chat-frontend

# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev
```

O frontend React estará rodando em `http://localhost:5173`

### 4. Acessar a Aplicação

Abra seu navegador e acesse:
- `http://localhost:8080` - Redireciona para o React
- `http://localhost:5173` - Aplicação React diretamente

## Como Usar

1. **Conectar**: A aplicação se conecta automaticamente ao servidor
2. **Ver Usuários**: Outros usuários online aparecem na sidebar
3. **Selecionar Usuário**: Clique em um usuário para iniciar uma conversa
4. **Troca de Chaves**: As chaves públicas são trocadas automaticamente
5. **Enviar Mensagens**: Digite e envie mensagens encriptadas
6. **Segurança**: Todas as mensagens são encriptadas no seu dispositivo

## Tecnologias Utilizadas

### Backend (Go)
- **Gorilla Mux**: Roteamento HTTP
- **Melody**: WebSocket para comunicação em tempo real
- **UUID**: Geração de IDs únicos

### Frontend (React)
- **React 18**: Framework JavaScript
- **Vite**: Build tool e dev server
- **Libsodium**: Criptografia end-to-end
- **SQL.js**: Banco de dados local

### Criptografia
- **NaCl/Box**: Criptografia assimétrica
- **Chaves Locais**: Geradas no dispositivo do usuário
- **Sem Inspeção**: O servidor nunca vê o conteúdo das mensagens

## Segurança

- 🔒 **End-to-End**: Mensagens encriptadas no dispositivo
- 🔑 **Chaves Locais**: Geradas e armazenadas localmente
- 🚫 **Sem Logs**: Servidor não armazena mensagens
- 🕵️ **Anônimo**: IDs únicos sem identificação pessoal
- 💾 **Local**: Mensagens armazenadas no seu dispositivo

## Desenvolvimento

Para desenvolvimento, você pode:

1. Modificar o backend em `main.go`
2. Modificar o frontend em `chat-frontend/src/`
3. Os estilos estão em `chat-frontend/src/App.css`

## Próximos Passos

- [ ] Persistência de mensagens
- [ ] Grupos de chat
- [ ] Notificações push
- [ ] Verificação de integridade
- [ ] Backup de chaves 