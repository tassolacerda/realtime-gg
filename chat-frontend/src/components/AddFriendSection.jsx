import React from 'react'

const AddFriendSection = ({ 
  showAddFriend, 
  friendIdInput, 
  onToggleAddFriend, 
  onFriendIdChange, 
  onAddFriend 
}) => {
  return (
    <div className="add-friend-section">
      <button 
        className="add-friend-btn"
        onClick={onToggleAddFriend}
      >
        {showAddFriend ? '❌' : '👥'} Adicionar Amigo
      </button>
      
      {showAddFriend && (
        <div className="add-friend-form">
          <input
            type="text"
            placeholder="Digite o ID do amigo..."
            value={friendIdInput}
            onChange={(e) => onFriendIdChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddFriend()}
          />
          <button onClick={onAddFriend}>Adicionar</button>
        </div>
      )}
    </div>
  )
}

export default AddFriendSection 