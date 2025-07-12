import { useState, useCallback, useRef } from 'react'
import sodium from 'libsodium-wrappers'

export const useKeyExchange = (myUserId, sendWebSocketMessage) => {
  const [userPublicKeys, setUserPublicKeys] = useState(new Map())
  const [keyExchangeStatus, setKeyExchangeStatus] = useState(new Map()) // 'pending', 'completed', 'failed'
  const [myKeyPair, setMyKeyPair] = useState(null)
  const keyExchangeQueue = useRef(new Map()) // userID -> array of pending messages
  const isGeneratingKeys = useRef(false)

  // Gerar par de chaves de forma segura
  const generateKeyPair = useCallback(async () => {
    if (isGeneratingKeys.current) {
      console.log('🔑 Geração de chaves já em andamento...')
      return null
    }

    if (myKeyPair && myKeyPair.publicKey && myKeyPair.privateKey) {
      console.log('🔑 Chaves já existem')
      return myKeyPair
    }

    try {
      isGeneratingKeys.current = true
      console.log('🔑 Iniciando geração de par de chaves...')
      
      await sodium.ready
      const keyPair = sodium.crypto_box_keypair()
      
      if (!keyPair || !keyPair.publicKey || !keyPair.privateKey) {
        throw new Error('Falha na geração das chaves')
      }

      console.log('🔑 Chaves geradas com sucesso:', {
        publicKeyLength: keyPair.publicKey.length,
        privateKeyLength: keyPair.privateKey.length
      })

      setMyKeyPair(keyPair)
      return keyPair
    } catch (error) {
      console.error('❌ Erro ao gerar par de chaves:', error)
      throw error
    } finally {
      isGeneratingKeys.current = false
    }
  }, [myKeyPair])

  // Codificar chave pública em base64 de forma segura
  const encodePublicKey = useCallback((publicKey) => {
    try {
      // Converter Uint8Array para string e codificar em base64
      const string = String.fromCharCode.apply(null, publicKey)
      return btoa(string)
    } catch (error) {
      console.error('❌ Erro ao codificar chave pública:', error)
      throw error
    }
  }, [])

  // Decodificar chave pública de base64 de forma segura
  const decodePublicKey = useCallback((base64Key) => {
    try {
      // Decodificar base64 para string e converter para Uint8Array
      const string = atob(base64Key)
      return new Uint8Array(string.split('').map(char => char.charCodeAt(0)))
    } catch (error) {
      console.error('❌ Erro ao decodificar chave pública:', error)
      throw error
    }
  }, [])

  // Iniciar troca de chaves com um usuário
  const initiateKeyExchange = useCallback(async (userId) => {
    console.log('🔑 Iniciando troca de chaves com:', userId)

    // Verificar se já temos a chave
    if (userPublicKeys.has(userId)) {
      console.log('🔑 Chave já disponível para:', userId)
      return true
    }

    // Verificar se já está em andamento
    if (keyExchangeStatus.get(userId) === 'pending') {
      console.log('🔑 Troca de chaves já em andamento para:', userId)
      return false
    }

    // Marcar como pendente
    setKeyExchangeStatus(prev => new Map(prev).set(userId, 'pending'))

    try {
      // Garantir que temos nossas chaves
      const keyPair = await generateKeyPair()
      if (!keyPair) {
        throw new Error('Não foi possível gerar chaves')
      }

      // Codificar chave pública
      const encodedPublicKey = encodePublicKey(keyPair.publicKey)

      // Enviar chave pública
      const keyExchange = {
        id: crypto.randomUUID(),
        from: myUserId,
        to: userId,
        encrypted: encodedPublicKey,
        timestamp: new Date(),
        type: 'key_exchange'
      }

      const success = sendWebSocketMessage(keyExchange)
      if (!success) {
        throw new Error('Falha ao enviar chave pública')
      }

      console.log('✅ Chave pública enviada para:', userId)
      return true

    } catch (error) {
      console.error('❌ Erro na troca de chaves com:', userId, error)
      setKeyExchangeStatus(prev => new Map(prev).set(userId, 'failed'))
      return false
    }
  }, [myUserId, userPublicKeys, keyExchangeStatus, generateKeyPair, encodePublicKey, sendWebSocketMessage])

  // Processar chave pública recebida
  const processReceivedKey = useCallback((fromUserId, encodedPublicKey) => {
    console.log('🔑 Processando chave recebida de:', fromUserId)

    try {
      // Decodificar chave pública
      const publicKey = decodePublicKey(encodedPublicKey)

      // Validar chave
      if (publicKey.length !== 32) {
        throw new Error('Chave pública inválida')
      }

      // Armazenar chave
      setUserPublicKeys(prev => {
        const newMap = new Map(prev)
        newMap.set(fromUserId, publicKey)
        return newMap
      })

      // Marcar como concluída
      setKeyExchangeStatus(prev => new Map(prev).set(fromUserId, 'completed'))

      console.log('✅ Chave pública armazenada para:', fromUserId)

      // Processar mensagens na fila
      const queuedMessages = keyExchangeQueue.current.get(fromUserId) || []
      if (queuedMessages.length > 0) {
        console.log('📨 Processando', queuedMessages.length, 'mensagens na fila para:', fromUserId)
        keyExchangeQueue.current.delete(fromUserId)
        // As mensagens serão processadas automaticamente pelo componente pai
      }

      return true

    } catch (error) {
      console.error('❌ Erro ao processar chave de:', fromUserId, error)
      setKeyExchangeStatus(prev => new Map(prev).set(fromUserId, 'failed'))
      return false
    }
  }, [decodePublicKey])

  // Verificar se as chaves estão prontas para um usuário
  const areKeysReady = useCallback((userId) => {
    return userPublicKeys.has(userId) && 
           myKeyPair && 
           myKeyPair.publicKey && 
           myKeyPair.privateKey
  }, [userPublicKeys, myKeyPair])

  // Adicionar mensagem à fila de espera
  const queueMessage = useCallback((userId, message) => {
    console.log('📨 Adicionando mensagem à fila para:', userId)
    const queue = keyExchangeQueue.current.get(userId) || []
    queue.push(message)
    keyExchangeQueue.current.set(userId, queue)
  }, [])

  // Obter mensagens na fila
  const getQueuedMessages = useCallback((userId) => {
    return keyExchangeQueue.current.get(userId) || []
  }, [])

  // Limpar fila de mensagens
  const clearQueue = useCallback((userId) => {
    keyExchangeQueue.current.delete(userId)
  }, [])

  return {
    myKeyPair,
    userPublicKeys,
    keyExchangeStatus,
    generateKeyPair,
    initiateKeyExchange,
    processReceivedKey,
    areKeysReady,
    queueMessage,
    getQueuedMessages,
    clearQueue,
    encodePublicKey,
    decodePublicKey
  }
} 