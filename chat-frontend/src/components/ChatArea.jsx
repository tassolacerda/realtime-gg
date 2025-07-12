import React from 'react'
import WelcomeScreen from './WelcomeScreen'
import ChatHeader from './ChatHeader'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'

const ChatArea = ({
  selectedUser,
  userUsernames,
  messages,
  myUsername,
  myUserId,
  messagesEndRef,
  messageInput,
  onMessageChange,
  onSendMessage,
  onKeyDown
}) => {
  if (!selectedUser) {
    return <WelcomeScreen />
  }

  return (
    <>
      <ChatHeader selectedUser={selectedUser} userUsernames={userUsernames} />
      
      <ChatMessages
        messages={messages}
        myUsername={myUsername}
        myUserId={myUserId}
        selectedUser={selectedUser}
        userUsernames={userUsernames}
        messagesEndRef={messagesEndRef}
      />
      
      <ChatInput
        messageInput={messageInput}
        onMessageChange={onMessageChange}
        onSendMessage={onSendMessage}
        onKeyDown={onKeyDown}
      />
    </>
  )
}

export default ChatArea 