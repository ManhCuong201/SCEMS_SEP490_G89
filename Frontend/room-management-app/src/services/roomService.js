const API_BASE_URL = 'http://localhost:5000/api';

const apiCall = async (endpoint, method = 'GET', data = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling API ${endpoint}:`, error);
    throw error;
  }
};

export const roomService = {
  getAllRooms: () => apiCall('/rooms'),
  getRoomById: (id) => apiCall(`/rooms/${id}`),
  createRoom: (room) => apiCall('/rooms', 'POST', room),
  updateRoom: (id, room) => apiCall(`/rooms/${id}`, 'PUT', room),
  deleteRoom: (id) => apiCall(`/rooms/${id}`, 'DELETE'),
};
