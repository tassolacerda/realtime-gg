import React from 'react'

const ChatInput = ({ 
  messageInput, 
  onMessageChange, 
  onSendMessage, 
  onKeyDown 
}) => {
  return (
    <div className="chat-input">
      <div className="input-container">
        <textarea 
          className="message-input" 
          value={messageInput}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Digite sua mensagem encriptada..."
          maxLength={1000}
        />
        <button 
          className="send-button" 
          onClick={onSendMessage}
          disabled={!messageInput.trim()}
        >
          Enviar
        </button>
      </div>
    </div>
  )
}

export default ChatInput 