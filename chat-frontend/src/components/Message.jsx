import React from 'react'

const Message = ({ message, myUsername, myUserId, selectedUser, userUsernames }) => {
  const escapeHtml = (text) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const getSenderName = () => {
    if (message.sent) {
      return myUsername || myUserId
    } else {
      return userUsernames.get(selectedUser) || selectedUser
    }
  }

  const senderName = getSenderName()
  const senderInitial = senderName.charAt(0).toUpperCase()

  return (
    <div className={`message ${message.sent ? 'sent' : ''} ${message.isError ? 'error' : ''}`}>
      <div className="message-avatar">
        {senderInitial}
      </div>
      <div className="message-content">
        <div className="message-text" dangerouslySetInnerHTML={{ __html: escapeHtml(message.content) }} />
        <div className="message-time">
          {message.timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
}

export default Message 