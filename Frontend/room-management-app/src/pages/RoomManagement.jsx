import React, { useState, useEffect } from 'react';
import RoomForm from '../components/RoomForm';
import RoomTable from '../components/RoomTable';
import { roomService } from '../services/roomService';
import './RoomManagement.css';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch all rooms on component mount
  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await roomService.getAllRooms();
      setRooms(data);
    } catch (error) {
      setErrorMessage('Failed to load rooms. Please try again.');
      console.error('Error loading rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (formData) => {
    try {
      const newRoom = await roomService.createRoom(formData);
      setRooms((prev) => [...prev, newRoom]);
      setShowForm(false);
      setSuccessMessage('Room created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to create room. Please try again.');
      console.error('Error creating room:', error);
    }
  };

  const handleUpdateRoom = async (formData) => {
    try {
      const updatedRoom = await roomService.updateRoom(editingRoom.id, formData);
      setRooms((prev) =>
        prev.map((room) => (room.id === updatedRoom.id ? updatedRoom : room))
      );
      setEditingRoom(null);
      setShowForm(false);
      setSuccessMessage('Room updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to update room. Please try again.');
      console.error('Error updating room:', error);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await roomService.deleteRoom(id);
        setRooms((prev) => prev.filter((room) => room.id !== id));
        setSuccessMessage('Room deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        setErrorMessage('Failed to delete room. Please try again.');
        console.error('Error deleting room:', error);
      }
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingRoom(null);
  };

  const handleCreateNew = () => {
    setEditingRoom(null);
    setShowForm(true);
  };

  return (
    <div className="room-management">
      <div className="header">
        <h1>Room Management</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={handleCreateNew}>
            + Create New Room
          </button>
        )}
      </div>

      {errorMessage && <div className="message error">{errorMessage}</div>}
      {successMessage && <div className="message success">{successMessage}</div>}

      {showForm && (
        <div className="form-container">
          <h2>{editingRoom ? 'Edit Room' : 'Create New Room'}</h2>
          <RoomForm
            room={editingRoom}
            onSubmit={editingRoom ? handleUpdateRoom : handleCreateRoom}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      <RoomTable
        rooms={rooms}
        onEdit={handleEditRoom}
        onDelete={handleDeleteRoom}
        isLoading={isLoading}
      />
    </div>
  );
};

export default RoomManagement;
