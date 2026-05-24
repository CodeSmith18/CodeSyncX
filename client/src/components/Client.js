import React from 'react';
import Avatar from 'react-avatar';
import './Client.css'; // Import the CSS file

function Client({ username }) {
  return (
    <div className="client-container">
      <Avatar 
        name={username.toString()} 
        size={34}
        round="8px"
        className="client-avatar"
      />
      <span className="client-username">{username}</span>
    </div>
  );
}

export default Client;
