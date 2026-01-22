import React from 'react';
import './RoomTable.css';

const RoomTable = ({ rooms, onEdit, onDelete, isLoading }) => {
  if (isLoading) {
    return <div className="loading">Loading rooms...</div>;
  }

  if (rooms.length === 0) {
    return <div className="empty-state">No rooms found. Create one to get started!</div>;
  }

  return (
    <div className="table-container">
      <table className="room-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Room Name</th>
            <th>Room Number</th>
            <th>Capacity</th>
            <th>Location</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id}>
              <td>{room.id}</td>
              <td>{room.roomName}</td>
              <td>{room.roomNumber}</td>
              <td>{room.capacity}</td>
              <td>{room.location}</td>
              <td>
                <span className={`status status-${room.status.toLowerCase()}`}>
                  {room.status}
                </span>
              </td>
              <td>
                <div className="actions">
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => onEdit(room)}
                    title="Edit room"
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => onDelete(room.id)}
                    title="Delete room"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoomTable;
