import React from 'react'

const UserInfo = ({ 
  myUserId, 
  myUsername, 
  showMyId, 
  onToggleShowId, 
  onCopyId, 
  onSetUsername 
}) => {
  const displayName = myUsername || 'Usuário'
  const displayInitial = displayName.charAt(0).toUpperCase()

  return (
    <div className="user-info">
      <div className="user-avatar">
        {displayInitial}
      </div>
      <div className="user-details">
        <h3>{displayName}</h3>
        <div className="user-id">
          {myUserId ? myUserId.substring(0, 8) + '...' : 'Conectando...'}
          <button 
            className="show-id-btn"
            onClick={onToggleShowId}
            title="Mostrar/ocultar ID completo"
          >
            {showMyId ? '👁️' : '👁️‍🗨️'}
          </button>
          {!myUsername && (
            <button 
              className="set-username-btn"
              onClick={onSetUsername}
              title="Definir nome de usuário"
            >
              ✏️
            </button>
          )}
        </div>
        {showMyId && myUserId && (
          <div className="full-user-id">
            <code>{myUserId}</code>
            <button onClick={onCopyId} className="copy-btn">📋</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserInfo 