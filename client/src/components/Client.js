import React from 'react';
import Avatar from 'react-avatar';
import './Client.css'; // Import the CSS file

function Client({ username }) {
  return (
    <div className="client-container">
      <Avatar 
        name={username.toString()} 
        size={50} 
        round="14px" 
        className="client-avatar" 
      />
    </div>
  );
}

export default Client;
