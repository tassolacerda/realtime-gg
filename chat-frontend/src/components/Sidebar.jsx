import React from 'react'
import UserInfo from './UserInfo'
import AddFriendSection from './AddFriendSection'
import FriendsList from './FriendsList'
import FriendRequests from './FriendRequests'

const Sidebar = ({
  myUserId,
  myUsername,
  showMyId,
  onToggleShowId,
  onCopyId,
  onSetUsername,
  showAddFriend,
  friendIdInput,
  onToggleAddFriend,
  onFriendIdChange,
  onAddFriend,
  friends,
  onlineUsers,
  userUsernames,
  selectedUser,
  onSelectUser,
  friendRequests
}) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <UserInfo
          myUserId={myUserId}
          myUsername={myUsername}
          showMyId={showMyId}
          onToggleShowId={onToggleShowId}
          onCopyId={onCopyId}
          onSetUsername={onSetUsername}
        />
        
        <AddFriendSection
          showAddFriend={showAddFriend}
          friendIdInput={friendIdInput}
          onToggleAddFriend={onToggleAddFriend}
          onFriendIdChange={onFriendIdChange}
          onAddFriend={onAddFriend}
        />
      </div>
      
      <FriendsList
        friends={friends}
        onlineUsers={onlineUsers}
        userUsernames={userUsernames}
        selectedUser={selectedUser}
        onSelectUser={onSelectUser}
      />
      
      <FriendRequests friendRequests={friendRequests} />
    </div>
  )
}

export default Sidebar 