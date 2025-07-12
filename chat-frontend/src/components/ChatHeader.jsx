import React from 'react'

const ChatHeader = ({ selectedUser, userUsernames }) => {
  const displayName = userUsernames.get(selectedUser) || selectedUser.substring(0, 8) + '...'
  const displayInitial = displayName.charAt(0).toUpperCase()

  return (
    <div className="chat-header">
      <div className="chat-avatar">
        {displayInitial}
      </div>
      <div className="chat-info">
        <h3>{displayName}</h3>
        <div className="chat-status">Encriptado E2E</div>
      </div>
    </div>
  )
}

export default ChatHeader 