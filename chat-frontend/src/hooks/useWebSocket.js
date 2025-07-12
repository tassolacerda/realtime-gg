import { useState, useCallback, useRef, useEffect } from 'react'

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // 'connecting', 'connected', 'disconnected', 'error'
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000
  const onMessageRef = useRef(null)

  // Função para verificar se WebSocket está pronto
  const isWebSocketReady = useCallback(() => {
    const websocket = wsRef.current
    const ready = websocket && websocket.readyState === WebSocket.OPEN
    console.log('🔍 Verificando WebSocket:', {
      websocket: !!websocket,
      readyState: websocket ? websocket.readyState : 'null',
      ready: ready,
      isConnected: isConnected
    })
    return ready
  }, [isConnected])

  // Função para enviar mensagem com verificação
  const sendWebSocketMessage = useCallback((message) => {
    console.log('📤 Tentando enviar mensagem:', message.type)
    
    if (!isWebSocketReady()) {
      console.error('❌ WebSocket não está conectado')
      return false
    }
    
    try {
      const messageStr = JSON.stringify(message)
      console.log('📤 Enviando mensagem:', messageStr)
      wsRef.current.send(messageStr)
      console.log('✅ Mensagem enviada com sucesso')
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via WebSocket:', error)
      return false
    }
  }, [isWebSocketReady])

  // Função para conectar WebSocket
  const connectWebSocket = useCallback((onMessage) => {
    console.log('🔌 Tentando conectar WebSocket...')
    
    // Salvar callback de mensagem
    if (onMessage) {
      onMessageRef.current = onMessage
    }
    
    // Verificar se já existe uma conexão
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket já está conectado')
      return
    }
    
    // Fechar conexão anterior se existir
    if (wsRef.current) {
      console.log('🔄 Fechando conexão anterior...')
      wsRef.current.close()
    }
    
    // Limpar timeout de reconexão anterior
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setConnectionStatus('connecting')
    
    const websocket = new WebSocket('ws://localhost:8080/ws')
    
    websocket.onopen = function(event) {
      console.log('✅ WebSocket conectado com sucesso!', event)
      setIsConnected(true)
      setConnectionStatus('connected')
      wsRef.current = websocket
      reconnectAttempts.current = 0 // Reset tentativas de reconexão
      console.log('📊 Estado da conexão:', websocket.readyState)
    }
    
    websocket.onmessage = function(event) {
      console.log('📨 Mensagem recebida:', event.data)
      try {
        const data = JSON.parse(event.data)
        if (onMessageRef.current) {
          onMessageRef.current(data)
        }
      } catch (error) {
        console.error('❌ Erro ao parsear mensagem:', error)
      }
    }
    
    websocket.onclose = function(event) {
      console.log('❌ WebSocket desconectado:', event.code, event.reason)
      console.log('📊 Estado da conexão:', websocket.readyState)
      setIsConnected(false)
      setConnectionStatus('disconnected')
      wsRef.current = null
      
      // Tentar reconectar se não foi fechamento intencional
      if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++
        console.log(`🔄 Tentativa de reconexão ${reconnectAttempts.current}/${maxReconnectAttempts} em ${reconnectDelay}ms...`)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Tentando reconectar...')
          connectWebSocket()
        }, reconnectDelay)
      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('❌ Máximo de tentativas de reconexão atingido')
        setConnectionStatus('error')
      }
    }
    
    websocket.onerror = function(error) {
      console.error('❌ Erro WebSocket:', error)
      console.log('📊 Estado da conexão:', websocket.readyState)
      setConnectionStatus('error')
    }

    console.log('🔌 WebSocket configurado, aguardando conexão...')
  }, [])

  // Função para desconectar WebSocket
  const disconnectWebSocket = useCallback(() => {
    console.log('🔌 Desconectando WebSocket...')
    
    // Limpar timeout de reconexão
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    // Fechar conexão
    if (wsRef.current) {
      wsRef.current.close(1000, 'Desconexão intencional')
      wsRef.current = null
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
    reconnectAttempts.current = 0
  }, [])

  // Função para forçar reconexão
  const forceReconnect = useCallback(() => {
    console.log('🔄 Forçando reconexão...')
    reconnectAttempts.current = 0
    disconnectWebSocket()
    
    setTimeout(() => {
      connectWebSocket()
    }, 1000)
  }, [disconnectWebSocket, connectWebSocket])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return {
    isConnected,
    connectionStatus,
    isWebSocketReady,
    sendWebSocketMessage,
    connectWebSocket,
    disconnectWebSocket,
    forceReconnect
  }
} 