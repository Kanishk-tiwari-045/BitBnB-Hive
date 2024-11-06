// Profile.jsx
import React from "react";

const Profile = ({ username, transactions }) => {
  return (
    <section className="profile-section">
      <h2>Welcome, {username}!</h2>
      <h3>Your Transaction History</h3>
      <ul>
        {transactions.map(([id, tx]) => (
          <li key={id}>
            <strong>Date:</strong> {new Date(tx.timestamp).toLocaleDateString()}
            <br />
            <strong>IPFS Hash:</strong> {JSON.parse(tx.op[1].json).ipfsHash}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Profile;
