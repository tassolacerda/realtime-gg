import { useCallback } from 'react'
import sodium from 'libsodium-wrappers'

export const useEncryptedMessaging = (myUserId, sendWebSocketMessage, keyExchange) => {
  const {
    myKeyPair,
    userPublicKeys,
    areKeysReady,
    queueMessage,
    getQueuedMessages,
    clearQueue,
    initiateKeyExchange
  } = keyExchange

  // Encriptar mensagem de forma segura
  const encryptMessage = useCallback((content, recipientPublicKey) => {
    try {
      // Usar crypto_box_seal para encriptação anônima
      const encrypted = sodium.crypto_box_seal(content, recipientPublicKey)
      
      // Codificar em base64 de forma segura
      const string = String.fromCharCode.apply(null, encrypted)
      return btoa(string)
    } catch (error) {
      console.error('❌ Erro ao encriptar mensagem:', error)
      throw error
    }
  }, [])

  // Desencriptar mensagem de forma segura
  const decryptMessage = useCallback((encryptedBase64, senderPublicKey) => {
    try {
      // Decodificar de base64
      const string = atob(encryptedBase64)
      const encrypted = new Uint8Array(string.split('').map(char => char.charCodeAt(0)))
      
      // Desencriptar usando crypto_box_seal_open
      const decrypted = sodium.crypto_box_seal_open(encrypted, myKeyPair.publicKey, myKeyPair.privateKey)
      
      // Converter para string
      return new TextDecoder().decode(decrypted)
    } catch (error) {
      console.error('❌ Erro ao desencriptar mensagem:', error)
      throw error
    }
  }, [myKeyPair])

  // Enviar mensagem encriptada
  const sendEncryptedMessage = useCallback(async (recipientId, content) => {
    console.log('📤 Tentando enviar mensagem encriptada para:', recipientId)

    // Verificar se as chaves estão prontas
    if (!areKeysReady(recipientId)) {
      console.log('🔑 Chaves não prontas para:', recipientId, '- iniciando troca...')
      
      // Iniciar troca de chaves
      const keyExchangeSuccess = await initiateKeyExchange(recipientId)
      if (!keyExchangeSuccess) {
        console.error('❌ Falha na troca de chaves com:', recipientId)
        throw new Error('Não foi possível estabelecer comunicação segura')
      }

      // Aguardar um pouco para a troca de chaves
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verificar novamente
      if (!areKeysReady(recipientId)) {
        console.log('📨 Chaves ainda não prontas, adicionando à fila...')
        queueMessage(recipientId, { content, timestamp: new Date() })
        throw new Error('Aguardando troca de chaves. Mensagem será enviada automaticamente.')
      }
    }

    try {
      // Obter chave pública do destinatário
      const recipientPublicKey = userPublicKeys.get(recipientId)
      if (!recipientPublicKey) {
        throw new Error('Chave pública do destinatário não encontrada')
      }

      // Encriptar mensagem
      const encryptedContent = encryptMessage(content, recipientPublicKey)

      // Criar mensagem
      const message = {
        id: crypto.randomUUID(),
        from: myUserId,
        to: recipientId,
        encrypted: encryptedContent,
        timestamp: new Date(),
        type: 'message'
      }

      // Enviar via WebSocket
      const success = sendWebSocketMessage(message)
      if (!success) {
        throw new Error('Falha ao enviar mensagem via WebSocket')
      }

      console.log('✅ Mensagem encriptada enviada para:', recipientId)
      return message

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem encriptada:', error)
      throw error
    }
  }, [myUserId, areKeysReady, initiateKeyExchange, queueMessage, userPublicKeys, encryptMessage, sendWebSocketMessage])

  // Processar mensagem encriptada recebida
  const processEncryptedMessage = useCallback((messageData) => {
    console.log('📨 Processando mensagem encriptada de:', messageData.from)

    try {
      // Verificar se temos as chaves necessárias
      if (!myKeyPair || !myKeyPair.publicKey || !myKeyPair.privateKey) {
        console.warn('⚠️ Chaves não disponíveis para desencriptar mensagem')
        throw new Error('Chaves de criptografia não disponíveis')
      }

      // Desencriptar mensagem
      const decryptedContent = decryptMessage(messageData.encrypted, myKeyPair.publicKey)

      console.log('✅ Mensagem desencriptada com sucesso')
      
      return {
        id: messageData.id,
        content: decryptedContent,
        sent: false,
        timestamp: new Date(messageData.timestamp),
        from: messageData.from
      }

    } catch (error) {
      console.error('❌ Erro ao processar mensagem encriptada:', error)
      
      return {
        id: `error-${messageData.id}-${Date.now()}`,
        content: '🔒 Erro ao desencriptar mensagem',
        sent: false,
        timestamp: new Date(messageData.timestamp),
        isError: true,
        from: messageData.from
      }
    }
  }, [myKeyPair, decryptMessage])

  // Processar mensagens na fila quando chaves ficam disponíveis
  const processQueuedMessages = useCallback(async (userId) => {
    const queuedMessages = getQueuedMessages(userId)
    if (queuedMessages.length === 0) return

    console.log('📨 Processando', queuedMessages.length, 'mensagens na fila para:', userId)

    for (const queuedMessage of queuedMessages) {
      try {
        await sendEncryptedMessage(userId, queuedMessage.content)
        console.log('✅ Mensagem da fila enviada para:', userId)
      } catch (error) {
        console.error('❌ Erro ao enviar mensagem da fila:', error)
      }
    }

    // Limpar fila
    clearQueue(userId)
  }, [getQueuedMessages, sendEncryptedMessage, clearQueue])

  return {
    sendEncryptedMessage,
    processEncryptedMessage,
    processQueuedMessages,
    encryptMessage,
    decryptMessage
  }
} 