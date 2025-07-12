import React from 'react'
import Message from './Message'

const ChatMessages = ({ 
  messages, 
  myUsername, 
  myUserId, 
  selectedUser, 
  userUsernames, 
  messagesEndRef 
}) => {
  return (
    <div className="chat-messages">
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          myUsername={myUsername}
          myUserId={myUserId}
          selectedUser={selectedUser}
          userUsernames={userUsernames}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}

export default ChatMessages 