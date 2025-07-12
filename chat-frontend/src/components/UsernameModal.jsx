import React from 'react'

const UsernameModal = ({ 
  show, 
  usernameInput, 
  onUsernameChange, 
  onSetUsername, 
  onClose 
}) => {
  if (!show) return null

  const savedUsername = localStorage.getItem('chat_username')
  const isExistingUser = usernameInput && savedUsername === usernameInput

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>👤 Definir Nome de Usuário</h3>
          <button 
            className="modal-close-btn"
            onClick={onClose}
            title="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="modal-content">
          <p>
            {isExistingUser 
              ? '🔗 Conectando à conta existente...' 
              : 'Escolha um nome de usuário para se identificar no chat:'}
          </p>
          <input
            type="text"
            placeholder="Digite seu nome de usuário..."
            value={usernameInput}
            onChange={(e) => onUsernameChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSetUsername()}
            maxLength={20}
            autoFocus
          />
          {isExistingUser && (
            <p style={{ color: '#38a169', fontSize: '14px', marginTop: '8px' }}>
              ✅ Este nome já existe! Você será conectado à conta existente.
            </p>
          )}
          <div className="modal-buttons">
            <button onClick={onSetUsername} disabled={!usernameInput.trim()}>
              {isExistingUser ? 'Conectar à Conta' : 'Definir Nome'}
            </button>
            <button 
              className="modal-cancel-btn"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsernameModal 