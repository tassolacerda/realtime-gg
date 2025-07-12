// Script de teste para verificar o sistema de amigos
console.log('🧪 Testando sistema de amigos...')

// Simular WebSocket para teste
const mockWebSocket = {
  readyState: 1, // WebSocket.OPEN
  send: (data) => {
    console.log('📤 Mensagem enviada:', JSON.parse(data))
    return true
  }
}

// Testar função isWebSocketReady
const isWebSocketReady = (ws) => {
  return ws && ws.readyState === 1 // WebSocket.OPEN
}

// Testar função sendWebSocketMessage
const sendWebSocketMessage = (ws, message) => {
  if (!isWebSocketReady(ws)) {
    console.error('❌ WebSocket não está conectado')
    return false
  }
  
  try {
    ws.send(JSON.stringify(message))
    return true
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error)
    return false
  }
}

// Testes
console.log('✅ WebSocket está pronto:', isWebSocketReady(mockWebSocket))

const testMessage = {
  id: 'test-123',
  from: 'user-1',
  to: 'user-2',
  encrypted: 'test-data',
  timestamp: new Date(),
  type: 'add_friend'
}

console.log('✅ Enviando mensagem de teste:', sendWebSocketMessage(mockWebSocket, testMessage))

// Testar com WebSocket null
console.log('✅ Teste com WebSocket null:', isWebSocketReady(null))
console.log('✅ Teste com WebSocket null:', sendWebSocketMessage(null, testMessage))

console.log('🎉 Testes concluídos!') 