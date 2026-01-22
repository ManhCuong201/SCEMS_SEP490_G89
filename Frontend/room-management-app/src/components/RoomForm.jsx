import React, { useState } from 'react';
import './RoomForm.css';

const RoomForm = ({ room, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(
    room || {
      roomName: '',
      roomNumber: '',
      capacity: '',
      location: '',
      status: 'Available',
    }
  );

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || '' : value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.roomName.trim()) {
      newErrors.roomName = 'Room name is required';
    }

    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = 'Room number is required';
    }

    if (!formData.capacity || formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <form className="room-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="roomName">Room Name</label>
        <input
          type="text"
          id="roomName"
          name="roomName"
          value={formData.roomName}
          onChange={handleChange}
          className={errors.roomName ? 'error' : ''}
        />
        {errors.roomName && <span className="error-message">{errors.roomName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="roomNumber">Room Number</label>
        <input
          type="text"
          id="roomNumber"
          name="roomNumber"
          value={formData.roomNumber}
          onChange={handleChange}
          className={errors.roomNumber ? 'error' : ''}
        />
        {errors.roomNumber && <span className="error-message">{errors.roomNumber}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="capacity">Capacity</label>
        <input
          type="number"
          id="capacity"
          name="capacity"
          value={formData.capacity}
          onChange={handleChange}
          className={errors.capacity ? 'error' : ''}
        />
        {errors.capacity && <span className="error-message">{errors.capacity}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="location">Location</label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className={errors.location ? 'error' : ''}
        />
        {errors.location && <span className="error-message">{errors.location}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="Available">Available</option>
          <option value="Occupied">Occupied</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {room ? 'Update Room' : 'Create Room'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default RoomForm;
