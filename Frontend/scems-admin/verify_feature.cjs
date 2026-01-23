const axios = require('axios');
const https = require('https');

const client = axios.create({
    baseURL: 'http://localhost:5000/api',
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    validateStatus: () => true
});

async function runTest() {
    console.log('--- Starting Feature Verification ---');

    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await client.post('/auth/login', {
        email: 'admin@scems.com',
        password: 'Admin123!'
    });

    if (loginRes.status !== 200) {
        console.error('Login failed:', loginRes.data);
        return;
    }

    const { token, id, role } = loginRes.data;
    console.log('Login successful.');
    console.log('User ID:', id);
    console.log('Role:', role);
    console.log('Token (start):', token.substring(0, 20) + '...');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Get Rooms to find one
    console.log('2. Fetching Rooms...');
    const roomsRes = await client.get('/admin/rooms', { headers: authHeaders });
    console.log('GetRooms Status:', roomsRes.status);
    console.log('GetRooms Data:', JSON.stringify(roomsRes.data, null, 2));
    
    if (!roomsRes.data.items || roomsRes.data.items.length === 0) {
        console.log('No rooms found. Creating one...');
        // Create a room if none exist
        const createRes = await client.post('/admin/rooms', {
             roomCode: 'TEST-001',
             roomName: 'Test Room',
             capacity: 10
        }, { headers: authHeaders });
        if (createRes.status === 201) {
            roomsRes.data.items = [createRes.data];
        } else {
            console.log('Failed to create room.');
            return;
        }
    }
    
    const room = roomsRes.data.items[0];
    if (!room) {
        console.log('No rooms found to test booking.');
        return;
    }
    console.log(`Using Room: ${room.roomName} (${room.id})`);

    // 3. Create a Booking (if not exists)
    // We'll pick a time far in future to avoid conflict with previous tests
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setHours(10, 0, 0, 0);
    const timeSlot = tomorrow.toISOString().slice(0, 19);

    console.log(`Creating booking for ${timeSlot}...`);
    const bookingRes = await client.post('/booking', {
        roomId: room.id,
        timeSlot: timeSlot,
        duration: 1,
        reason: "Feature Test Booking"
    }, { headers: authHeaders });

    if (bookingRes.status !== 200 && bookingRes.status !== 201) {
        console.log('Booking creation failed (might already exist):', bookingRes.data.message);
    } else {
        console.log('Booking created.');
    }

    // 4. Check Schedule
    const start = new Date(tomorrow);
    start.setHours(0,0,0,0);
    const end = new Date(tomorrow);
    end.setHours(23,59,59,999);
    
    console.log('Fetching Room Schedule...');
    const scheduleRes = await client.get(`/booking/room/${room.id}/schedule`, {
        params: { startDate: start.toISOString(), endDate: end.toISOString() },
        headers: authHeaders
    });

    const myBooking = scheduleRes.data.find(b => b.timeSlot.startsWith(timeSlot.slice(0, 13))); // Match YYYY-MM-DDTHH
    
    if (myBooking) {
        console.log('Found Booking in Schedule:');
        console.log(`- Booking ID: ${myBooking.id}`);
        console.log(`- RequestedBy: ${myBooking.requestedBy}`);
        console.log(`- My User ID:  ${id}`);
        
        if (myBooking.requestedBy === id) {
             console.log('SUCCESS: RequestedBy matches User ID.');
        } else {
             console.log('ERROR: RequestedBy does NOT match User ID.');
        }
    } else {
        console.log('Booking not found in schedule (unexpected).');
    }
}

runTest();
