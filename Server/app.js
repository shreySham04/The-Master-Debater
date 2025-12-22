require('dotenv').config(); // Line 1

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors'); // <--- IMPORT CORS
const db = require('./db');
const { generateRebuttal, judgeDebate } = require('./aiService');

const app = express();

// --- ENABLE CORS (Allow Frontend to talk to Backend) ---
app.use(cors()); // <--- CRITICAL LINE FOR SINGLE PLAYER
app.use(express.json());

const server = http.createServer(app);

// Configure Socket.io CORS as well
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from any frontend
    methods: ["GET", "POST"]
  }
});

// --- SINGLE PLAYER ROUTE ---
app.post('/api/single-player/turn', async (req, res) => {
  const { userId, topic, argument } = req.body;

  try {
    // 1. Save User Turn
    await db.query('INSERT INTO turns (player_id, content, type) VALUES (?, ?, ?)', [userId, argument, 'human']);

    // 2. Get AI Rebuttal
    const aiResponse = await generateRebuttal(topic, argument);

    // 3. Save AI Turn
    await db.query('INSERT INTO turns (player_id, content, type) VALUES (?, ?, ?)', [0, aiResponse, 'ai']);

    res.json({ reply: aiResponse });
  } catch (error) {
    console.error("Error in single player turn:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// --- TWO PLAYER SOCKET LOGIC ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send_argument', async (data) => {
    const { roomId, userId, argument, topic } = data;
    socket.to(roomId).emit('receive_argument', { userId, argument });
    
    // Save to DB
    try {
        await db.query('INSERT INTO turns (game_id, player_id, content) VALUES (?, ?, ?)', [roomId, userId, argument]);
    } catch (err) {
        console.error("Database save error:", err);
    }
  });

  socket.on('end_game', async ({ roomId, topic }) => {
    try {
        const [rows] = await db.query('SELECT * FROM turns WHERE game_id = ? ORDER BY created_at ASC', [roomId]);
        const verdict = await judgeDebate(topic, rows);
        io.in(roomId).emit('game_result', verdict);
    } catch (err) {
        console.error("Error ending game:", err);
    }
  });
});

// Start Server on Port 5000
server.listen(5000, () => {
  console.log('Server running on port 5000');
});