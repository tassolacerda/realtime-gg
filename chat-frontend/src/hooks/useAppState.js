import { useState, useCallback, useEffect } from 'react'

export const useAppState = () => {
  const [myUserId, setMyUserId] = useState('')
  const [myUsername, setMyUsername] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Map())
  const [userUsernames, setUserUsernames] = useState(new Map())
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  
  // Estados para sistema de amigos
  const [friends, setFriends] = useState(new Set())
  const [friendRequests, setFriendRequests] = useState([])
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [friendIdInput, setFriendIdInput] = useState('')
  const [showMyId, setShowMyId] = useState(false)
  
  // Estados para nome de usuário
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')

  // Carregar username do localStorage
  const loadUsername = useCallback(() => {
    const savedUsername = localStorage.getItem('chat_username')
    if (savedUsername) {
      setUsernameInput(savedUsername)
    }
  }, [])

  // Salvar username no localStorage
  const saveUsername = useCallback((username) => {
    localStorage.setItem('chat_username', username)
  }, [])

  // Atualizar status online
  const updateOnlineStatus = useCallback((status) => {
    console.log('🔄 Atualizando status online:', status)
    setOnlineUsers(prev => {
      const newMap = new Map(prev)
      if (status.online) {
        newMap.set(status.user_id, true)
        console.log('➕ Usuário online adicionado:', status.user_id)
      } else {
        newMap.delete(status.user_id)
        console.log('➖ Usuário offline removido:', status.user_id)
      }
      console.log('📊 Total de usuários online:', newMap.size)
      return newMap
    })
  }, [])

  // Atualizar lista completa de usuários online
  const updateOnlineUsersList = useCallback((usersList) => {
    console.log('🔄 Atualizando lista completa de usuários online:', usersList)
    setOnlineUsers(prev => {
      const newMap = new Map()
      
      // Adicionar todos os usuários da lista
      usersList.forEach(user => {
        if (user.user_id !== myUserId) { // Não incluir a si mesmo
          newMap.set(user.user_id, true)
          // Também atualizar usernames
          setUserUsernames(prevUsernames => {
            const newUsernames = new Map(prevUsernames)
            newUsernames.set(user.user_id, user.username)
            return newUsernames
          })
        }
      })
      
      console.log('📊 Lista atualizada com', newMap.size, 'usuários online')
      return newMap
    })
  }, [myUserId])

  // Adicionar mensagem à lista
  const addMessage = useCallback((message) => {
    setMessages(prev => {
      // Verificar se já existe uma mensagem com este ID
      const exists = prev.some(msg => msg.id === message.id)
      if (exists) {
        console.warn('⚠️ Mensagem duplicada ignorada:', message.id)
        return prev
      }
      return [...prev, message]
    })
  }, [])

  // Limpar mensagens
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // Adicionar amigo
  const addFriend = useCallback((friendId) => {
    setFriends(prev => new Set([...prev, friendId]))
  }, [])

  // Remover amigo
  const removeFriend = useCallback((friendId) => {
    setFriends(prev => {
      const newSet = new Set(prev)
      newSet.delete(friendId)
      return newSet
    })
  }, [])

  // Adicionar solicitação de amizade
  const addFriendRequest = useCallback((request) => {
    setFriendRequests(prev => [...prev, request])
  }, [])

  // Remover solicitação de amizade
  const removeFriendRequest = useCallback((fromUserId) => {
    setFriendRequests(prev => prev.filter(req => req.from !== fromUserId))
  }, [])

  // Atualizar username de um usuário
  const updateUserUsername = useCallback((userId, username) => {
    setUserUsernames(prev => {
      const newMap = new Map(prev)
      newMap.set(userId, username)
      return newMap
    })
  }, [])

  // Atualizar lista de usernames
  const updateUsernamesList = useCallback((usersList) => {
    setUserUsernames(prev => {
      const newMap = new Map(prev)
      usersList.forEach(user => {
        newMap.set(user.user_id, user.username)
      })
      return newMap
    })
  }, [])

  // Carregar username salvo na inicialização
  useEffect(() => {
    loadUsername()
  }, [loadUsername])

  // Logs para debug
  useEffect(() => {
    console.log('🔄 Estado myUserId mudou para:', myUserId)
  }, [myUserId])

  useEffect(() => {
    console.log('🔄 Estado myUsername mudou para:', myUsername)
  }, [myUsername])

  useEffect(() => {
    console.log('🔄 Estado onlineUsers mudou:', Array.from(onlineUsers.keys()))
  }, [onlineUsers])

  useEffect(() => {
    console.log('🔄 Estado friends mudou:', Array.from(friends))
  }, [friends])

  return {
    // Estados
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

    // Setters
    setMyUserId,
    setMyUsername,
    setSelectedUser,
    setMessageInput,
    setShowAddFriend,
    setFriendIdInput,
    setShowMyId,
    setShowUsernameModal,
    setUsernameInput,

    // Funções
    saveUsername,
    updateOnlineStatus,
    updateOnlineUsersList,
    addMessage,
    clearMessages,
    addFriend,
    removeFriend,
    addFriendRequest,
    removeFriendRequest,
    updateUserUsername,
    updateUsernamesList
  }
} 