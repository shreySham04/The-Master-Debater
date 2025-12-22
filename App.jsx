import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css'; // Ensure you have some basic CSS or remove this line

// Connect to backend (adjust port if your server is not 3000)
const socket = io('http://localhost:3000', { autoConnect: false });

function App() {
  const [mode, setMode] = useState(null); // 'single' or 'multi'
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [roomId, setRoomId] = useState('');
  const [userId] = useState(Math.floor(Math.random() * 10000)); // Random Temp ID
  const [gameResult, setGameResult] = useState(null);

  // --- MULTIPLAYER SETUP ---
  useEffect(() => {
    // Listen for incoming arguments (Multiplayer)
    socket.on('receive_argument', (data) => {
      setMessages((prev) => [...prev, { sender: 'Opponent', text: data.argument }]);
    });

    // Listen for game results (AI Judgment)
    socket.on('game_result', (result) => {
      setGameResult(result);
    });

    return () => {
      socket.off('receive_argument');
      socket.off('game_result');
    };
  }, []);

  // --- START GAME HANDLERS ---
  const startSinglePlayer = () => {
    setMode('single');
    setTopic('Is AI dangerous for humanity?'); // Static topic for demo
    setMessages([{ sender: 'System', text: 'Topic: Is AI dangerous? You are arguing FOR.' }]);
  };

  const startMultiPlayer = () => {
    if (!roomId) return alert("Enter a Room ID (e.g., 'room1')");
    setMode('multi');
    socket.connect();
    socket.emit('join_room', roomId);
    setTopic('Universal Basic Income'); // In real app, sync this via socket
    setMessages([{ sender: 'System', text: `Joined Room: ${roomId}. Waiting for opponent...` }]);
  };

  // --- SUBMIT ARGUMENT HANDLER ---
  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add my message to UI immediately
    const myMsg = { sender: 'Me', text: input };
    setMessages((prev) => [...prev, myMsg]);
    const currentInput = input;
    setInput(''); // Clear input

    if (mode === 'single') {
      try {
        // Call Node Backend for AI Rebuttal
        const response = await axios.post('http://localhost:3000/api/single-player/turn', {
          userId,
          topic,
          argument: currentInput
        });
        
        // Add AI response to UI
        setMessages((prev) => [...prev, { sender: 'AI Opponent', text: response.data.reply }]);
      } catch (error) {
        console.error("Error talking to AI:", error);
      }
    } else {
      // Send via Socket for Multiplayer
      socket.emit('send_argument', {
        roomId,
        userId,
        argument: currentInput,
        topic
      });
    }
  };

  // --- END GAME HANDLER (Multiplayer) ---
  const endMultiplayerGame = () => {
    socket.emit('end_game', { roomId, topic });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Debate AI Arena</h1>

      {/* LOBBY VIEW */}
      {!mode && (
        <div className="lobby">
          <button onClick={startSinglePlayer} style={{ padding: '10px', marginRight: '10px' }}>
            Practice vs AI
          </button>
          
          <hr />
          
          <input 
            placeholder="Enter Room Name (e.g. debate1)" 
            value={roomId} 
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={startMultiPlayer} style={{ padding: '10px', marginLeft: '5px' }}>
            Join Multiplayer Room
          </button>
        </div>
      )}

      {/* ARENA VIEW */}
      {mode && (
        <div className="arena">
          <h2>Topic: {topic}</h2>
          
          {/* Chat Box */}
          <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'scroll', padding: '10px', marginBottom: '10px' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ textAlign: msg.sender === 'Me' ? 'right' : 'left', margin: '5px' }}>
                <strong>{msg.sender}:</strong> {msg.text}
              </div>
            ))}
          </div>

          {/* Input Area */}
          <textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your argument..."
            style={{ width: '100%', height: '60px' }}
          />
          <button onClick={sendMessage} style={{ marginTop: '10px', width: '100%' }}>
            Send Argument
          </button>

          {/* Multiplayer End Game Button */}
          {mode === 'multi' && (
            <button onClick={endMultiplayerGame} style={{ marginTop: '20px', backgroundColor: 'red', color: 'white' }}>
              End Game & Judge
            </button>
          )}

          {/* Judgment Results */}
          {gameResult && (
            <div style={{ marginTop: '20px', border: '2px solid gold', padding: '10px' }}>
              <h3>🏆 AI Verdict</h3>
              <p><strong>Winner:</strong> {gameResult.winner}</p>
              <p><strong>Score P1:</strong> {gameResult.score_p1}</p>
              <p><strong>Score P2:</strong> {gameResult.score_p2}</p>
              <p><em>"{gameResult.reasoning}"</em></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;