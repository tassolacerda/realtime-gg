import React from 'react'

const FriendRequests = ({ friendRequests }) => {
  if (friendRequests.length === 0) return null

  return (
    <div className="friend-requests">
      <div className="section-title">
        Solicitações de Amizade ({friendRequests.length})
      </div>
      <div className="friend-requests-list">
        {friendRequests.map(request => (
          <div key={request.id} className="friend-request-item">
            <div className="request-info">
              <div className="request-name">{request.from.substring(0, 8)}...</div>
              <div className="request-time">
                {request.timestamp.toLocaleTimeString('pt-BR')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FriendRequests 