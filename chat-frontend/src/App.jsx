import React, { useEffect, useRef, useCallback } from 'react'
import './App.css'
import { UsernameModal, Sidebar, ChatArea } from './components'
import { useKeyExchange, useEncryptedMessaging, useWebSocket, useAppState } from './hooks'

function App() {
  const messagesEndRef = useRef(null)

  // Hooks
  const appState = useAppState()
  const {
    myUserId,
    myUsername,
    selectedUser,
    onlineUsers,
    userUsernames,
    messages,
    messageInput,
    friends,
    friendRequests,
    showAddFriend,
    friendIdInput,
    showMyId,
    showUsernameModal,
    usernameInput,
    setMyUserId,
    setMyUsername,
    setSelectedUser,
    setMessageInput,
    setShowAddFriend,
    setFriendIdInput,
    setShowMyId,
    setShowUsernameModal,
    setUsernameInput,
    updateOnlineStatus,
    updateOnlineUsersList,
    addMessage,
    clearMessages,
    addFriend,
    addFriendRequest,
    removeFriendRequest,
    updateUsernamesList
  } = appState

  // WebSocket hook
  const { isConnected, sendWebSocketMessage, connectWebSocket } = useWebSocket()

  // Key exchange hook
  const keyExchange = useKeyExchange(myUserId, sendWebSocketMessage)
  const { 
    myKeyPair, 
    userPublicKeys, 
    initiateKeyExchange, 
    processReceivedKey 
  } = keyExchange

  // Encrypted messaging hook
  const { processEncryptedMessage, sendEncryptedMessage } = useEncryptedMessaging(myUserId, sendWebSocketMessage, keyExchange)

  // Scroll para o final das mensagens
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Handler de mensagens WebSocket
  const handleWebSocketMessage = useCallback((data) => {
    console.log('🔍 Processando mensagem do tipo:', data.type)
    
    switch (data.type) {
      case 'user_id':
        console.log('👤 ID do usuário recebido:', data.user_id)
        setMyUserId(data.user_id)
        setShowUsernameModal(true)
        break
        
      case 'online_status':
        console.log('🟢 Status online recebido:', data.data)
        updateOnlineStatus(data.data)
        break
        
      case 'online_users_list':
        console.log('📋 Lista de usuários online recebida:', data.data)
        updateOnlineUsersList(data.data)
        break
        
      case 'message':
        console.log('💬 Mensagem encriptada recebida')
        const decryptedMessage = processEncryptedMessage(data)
        if (decryptedMessage) {
          addMessage(decryptedMessage)
        }
        break
        
      case 'key_exchange':
        console.log('🔑 Troca de chaves recebida')
        processReceivedKey(data.from, data.encrypted)
        break
        
      case 'friend_request':
        console.log('👥 Solicitação de amizade recebida:', data)
        handleFriendRequest(data)
        break
        
      case 'friend_request_sent':
        console.log('✅ Solicitação de amizade enviada para:', data.friend_id)
        alert(`Solicitação de amizade enviada para ${data.friend_id.substring(0, 8)}...`)
        break
        
      case 'friend_added':
        console.log('✅ Amigo adicionado - dados completos:', data)
        if (data.friend_id && data.friend_id !== '') {
          addFriend(data.friend_id)
          alert(`Amigo ${data.friend_id.substring(0, 8)}... adicionado com sucesso!`)
          
          // Iniciar troca de chaves automaticamente
          setTimeout(() => {
            initiateKeyExchange(data.friend_id)
          }, 1000)
        } else {
          console.error('❌ friend_id está vazio ou inválido!')
          alert('Erro: ID do amigo inválido. Tente novamente.')
        }
        break
        
      case 'friend_error':
        console.log('❌ Erro ao adicionar amigo:', data.error)
        alert(`Erro: ${data.error}`)
        break
        
      case 'username_ack':
        console.log('✅ Confirmação de username recebida:', data.encrypted)
        break
        
      case 'usernames_list':
        console.log('📋 Lista de usernames recebida:', data.data)
        updateUsernamesList(data.data)
        break
        
      default:
        console.log('❓ Tipo de mensagem desconhecido:', data.type)
    }
  }, [
    setMyUserId, 
    setShowUsernameModal, 
    updateOnlineStatus, 
    updateOnlineUsersList, 
    processEncryptedMessage, 
    addMessage, 
    processReceivedKey, 
    addFriend, 
    initiateKeyExchange, 
    updateUsernamesList
  ])

  // Processar solicitação de amizade recebida
  const handleFriendRequest = useCallback((data) => {
    console.log('👥 Processando solicitação de amizade:', data)
    
    const newRequest = {
      id: crypto.randomUUID(),
      from: data.from,
      timestamp: new Date()
    }
    
    addFriendRequest(newRequest)
    
    const accept = window.confirm(
      `Usuário ${data.from.substring(0, 8)}... quer adicionar você como amigo. Aceitar?`
    )
    
    // Enviar resposta
    const response = {
      id: crypto.randomUUID(),
      from: myUserId,
      to: data.from,
      encrypted: accept ? 'accepted' : 'rejected',
      timestamp: new Date(),
      type: 'friend_request'
    }
    
    console.log('📤 Enviando resposta de amizade:', {
      from: myUserId,
      to: data.from,
      accepted: accept,
      response: response
    })
    
    if (sendWebSocketMessage(response)) {
      if (accept) {
        addFriend(data.from)
      }
      
      // Remover da lista de solicitações
      removeFriendRequest(data.from)
    }
  }, [myUserId, addFriendRequest, addFriend, removeFriendRequest, sendWebSocketMessage])

  // Inicialização
  useEffect(() => {
    const init = async () => {
      try {
        console.log('🚀 Iniciando aplicação...')
        connectWebSocket(handleWebSocketMessage)
        console.log('✅ Aplicação inicializada com sucesso!')
      } catch (error) {
        console.error('❌ Erro na inicialização:', error)
      }
    }
    
    init()
  }, [connectWebSocket, handleWebSocketMessage])

  // Definir nome de usuário
  const setUsername = useCallback(() => {
    const username = usernameInput.trim()
    if (!username) {
      alert('Por favor, insira um nome de usuário')
      return
    }
    
    if (username.length < 3) {
      alert('O nome de usuário deve ter pelo menos 3 caracteres')
      return
    }
    
    if (username.length > 20) {
      alert('O nome de usuário deve ter no máximo 20 caracteres')
      return
    }
    
    // Enviar nome de usuário para o servidor
    const usernameMessage = {
      id: crypto.randomUUID(),
      from: myUserId,
      to: '', // Não aplicável
      encrypted: JSON.stringify({ username }), // Enviar como JSON
      timestamp: new Date(),
      type: 'set_username'
    }
    
    if (sendWebSocketMessage(usernameMessage)) {
      setMyUsername(username)
      localStorage.setItem('chat_username', username)
      setShowUsernameModal(false)
      console.log('✅ Nome de usuário definido:', username)
    }
  }, [usernameInput, myUserId, sendWebSocketMessage, setMyUsername, setShowUsernameModal])

  // Selecionar usuário para conversar
  const selectUser = useCallback(async (userId) => {
    console.log('👤 Selecionando usuário para conversar:', userId)
    setSelectedUser(userId)
    clearMessages()
    
    // Iniciar troca de chaves se necessário
    await initiateKeyExchange(userId)
  }, [setSelectedUser, clearMessages, initiateKeyExchange])

  // Adicionar amigo por ID
  const handleAddFriend = useCallback(() => {
    const friendId = friendIdInput.trim()
    if (!friendId) {
      alert('Por favor, insira um ID válido')
      return
    }
    
    if (friendId === myUserId) {
      alert('Você não pode adicionar a si mesmo como amigo')
      return
    }
    
    if (friends.has(friendId)) {
      alert('Este usuário já é seu amigo')
      return
    }
    
    // Enviar solicitação de amizade
    const addFriendMessage = {
      id: crypto.randomUUID(),
      from: myUserId,
      to: friendId, // Será ignorado pelo servidor
      encrypted: friendId, // Campo usado para passar o ID do amigo
      timestamp: new Date(),
      type: 'add_friend'
    }
    
    if (sendWebSocketMessage(addFriendMessage)) {
      setFriendIdInput('')
      setShowAddFriend(false)
    }
  }, [friendIdInput, myUserId, friends, sendWebSocketMessage, setFriendIdInput, setShowAddFriend])

  // Enviar mensagem encriptada
  const sendMessage = useCallback(async () => {
    if (!selectedUser) {
      alert('Selecione um usuário para conversar')
      return
    }
    
    const content = messageInput.trim()
    if (!content) return
    
    try {
      const message = await sendEncryptedMessage(selectedUser, content)
      
      // Adicionar à interface
      const newMessage = {
        id: message.id,
        content,
        sent: true,
        timestamp: new Date()
      }
      addMessage(newMessage)
      
      // Limpar input
      setMessageInput('')
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error)
      alert(error.message)
    }
  }, [selectedUser, messageInput, sendEncryptedMessage, addMessage, setMessageInput])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  // Copiar ID para clipboard
  const copyMyId = useCallback(() => {
    navigator.clipboard.writeText(myUserId)
    alert('Seu ID foi copiado para a área de transferência!')
  }, [myUserId])

  return (
    <div className="chat-container">
      <div className="security-indicator">
        End-to-End Encriptado
      </div>

      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
      </div>

      <UsernameModal
        show={showUsernameModal}
        usernameInput={usernameInput}
        onUsernameChange={setUsernameInput}
        onSetUsername={setUsername}
        onClose={() => setShowUsernameModal(false)}
      />

      <Sidebar
        myUserId={myUserId}
        myUsername={myUsername}
        showMyId={showMyId}
        onToggleShowId={() => setShowMyId(!showMyId)}
        onCopyId={copyMyId}
        onSetUsername={() => setShowUsernameModal(true)}
        showAddFriend={showAddFriend}
        friendIdInput={friendIdInput}
        onToggleAddFriend={() => setShowAddFriend(!showAddFriend)}
        onFriendIdChange={setFriendIdInput}
        onAddFriend={handleAddFriend}
        friends={friends}
        onlineUsers={onlineUsers}
        userUsernames={userUsernames}
        selectedUser={selectedUser}
        onSelectUser={selectUser}
        friendRequests={friendRequests}
      />
      
      <div className="main-chat">
        <ChatArea
          selectedUser={selectedUser}
          userUsernames={userUsernames}
          messages={messages}
          myUsername={myUsername}
          myUserId={myUserId}
          messagesEndRef={messagesEndRef}
          messageInput={messageInput}
          onMessageChange={setMessageInput}
          onSendMessage={sendMessage}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  )
}

export default App 