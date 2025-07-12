import React from 'react'

const FriendsList = ({ 
  friends, 
  onlineUsers, 
  userUsernames, 
  selectedUser, 
  onSelectUser 
}) => {
  const onlineFriendsCount = Array.from(friends).filter(friend => onlineUsers.has(friend)).length

  return (
    <div className="online-users">
      <div className="section-title">
        Amigos Online ({onlineFriendsCount})
      </div>
      <div className="online-users-list">
        {Array.from(friends).map(friendId => {
          const isOnline = onlineUsers.has(friendId)
          const friendUsername = userUsernames.get(friendId) || friendId.substring(0, 8) + '...'
          return (
            <div 
              key={friendId} 
              className={`user-item ${selectedUser === friendId ? 'active' : ''} ${isOnline ? 'online' : 'offline'}`}
              onClick={() => isOnline && onSelectUser(friendId)}
            >
              <div className="user-item-avatar">
                {friendUsername.charAt(0).toUpperCase()}
              </div>
              <div className="user-item-info">
                <div className="user-item-name">{friendUsername}</div>
                <div className="user-item-status">
                  {isOnline ? '🟢 Online' : '🔴 Offline'}
                </div>
              </div>
            </div>
          )
        })}
        {friends.size === 0 && (
          <div style={{ color: '#a0aec0', fontSize: '14px', padding: '10px' }}>
            Nenhum amigo adicionado ainda.
            <br />
            Use o botão "Adicionar Amigo" para começar!
          </div>
        )}
      </div>
    </div>
  )
}

export default FriendsList 