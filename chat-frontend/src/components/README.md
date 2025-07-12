# Componentes do Chat

Esta pasta contém todos os componentes React organizados de forma modular para facilitar a manutenção e reutilização.

## Estrutura dos Componentes

### 🎯 **Componentes Principais**

#### `App.jsx`
- Componente raiz que gerencia o estado global
- Coordena a comunicação WebSocket e criptografia
- Renderiza os componentes principais

#### `Sidebar.jsx`
- Container principal da barra lateral
- Organiza informações do usuário, lista de amigos e solicitações

#### `ChatArea.jsx`
- Container principal da área de chat
- Gerencia a exibição da tela de boas-vindas ou chat ativo

### 👤 **Componentes de Usuário**

#### `UsernameModal.jsx`
- Modal para definir/editar nome de usuário
- Validação de entrada e persistência no localStorage

#### `UserInfo.jsx`
- Exibe informações do usuário atual
- Botões para mostrar ID e definir username

#### `AddFriendSection.jsx`
- Interface para adicionar novos amigos
- Formulário com validação

### 👥 **Componentes de Amizade**

#### `FriendsList.jsx`
- Lista de amigos com status online/offline
- Seleção de usuário para conversa

#### `FriendRequests.jsx`
- Lista de solicitações de amizade pendentes
- Interface para aceitar/recusar solicitações

### 💬 **Componentes de Chat**

#### `WelcomeScreen.jsx`
- Tela de boas-vindas com instruções
- Informações sobre recursos de segurança

#### `ChatHeader.jsx`
- Cabeçalho do chat com informações do destinatário
- Indicador de criptografia E2E

#### `ChatMessages.jsx`
- Container da lista de mensagens
- Scroll automático para última mensagem

#### `Message.jsx`
- Componente individual de mensagem
- Suporte a mensagens enviadas/recebidas/erro

#### `ChatInput.jsx`
- Interface de entrada de mensagens
- Validação e envio com Enter

## 🔧 **Benefícios da Componentização**

### ✅ **Reutilização**
- Componentes podem ser reutilizados em diferentes contextos
- Lógica isolada e testável

### ✅ **Manutenibilidade**
- Código organizado e fácil de entender
- Mudanças isoladas em componentes específicos

### ✅ **Performance**
- Re-renderização otimizada por componente
- Memoização possível em componentes específicos

### ✅ **Testabilidade**
- Componentes isolados facilitam testes unitários
- Props bem definidas para mock de dados

## 📁 **Organização de Arquivos**

```
components/
├── index.js              # Exportações centralizadas
├── README.md             # Esta documentação
├── UsernameModal.jsx     # Modal de username
├── UserInfo.jsx          # Info do usuário
├── AddFriendSection.jsx  # Adicionar amigos
├── FriendsList.jsx       # Lista de amigos
├── FriendRequests.jsx    # Solicitações
├── Sidebar.jsx           # Container da sidebar
├── WelcomeScreen.jsx     # Tela de boas-vindas
├── ChatHeader.jsx        # Cabeçalho do chat
├── Message.jsx           # Mensagem individual
├── ChatMessages.jsx      # Lista de mensagens
├── ChatInput.jsx         # Input de mensagem
└── ChatArea.jsx          # Container do chat
```

## 🚀 **Como Usar**

```jsx
// Importação individual
import UsernameModal from './components/UsernameModal'

// Importação múltipla
import { UsernameModal, Sidebar, ChatArea } from './components'

// Uso do componente
<UsernameModal
  show={showModal}
  usernameInput={username}
  onUsernameChange={setUsername}
  onSetUsername={handleSetUsername}
  onClose={() => setShowModal(false)}
/>
```

## 🔄 **Fluxo de Dados**

1. **Estado Global** → `App.jsx`
2. **Props** → Componentes filhos
3. **Eventos** → Callbacks → `App.jsx`
4. **Atualização de Estado** → Re-renderização dos componentes afetados

## 🎨 **Estilos**

Todos os componentes usam as classes CSS definidas em `App.css`. A estrutura de classes segue o padrão BEM (Block Element Modifier) para facilitar a manutenção. 