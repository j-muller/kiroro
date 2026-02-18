const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static('public'));

// Game state
let gameState = {
  phase: 'lobby', // 'lobby', 'question', 'answers', 'reveal', 'results'
  currentQuestion: null,
  currentQuestionIndex: -1,
  players: {},
  answers: {},
  scores: {},
  host: null
};

// Load questions from JSON
const gameData = require('./questions.json');

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Send current game state to newly connected player
  socket.emit('gameState', gameState);

  // Player joins
  socket.on('join', (playerData) => {
    gameState.players[socket.id] = {
      id: socket.id,
      name: playerData.name,
      couple: playerData.couple,
      role: playerData.role // 'Jeffrey', 'Eilene', 'Nadja', 'Julian'
    };

    // Jeffrey is always the host
    if (playerData.role === 'Jeffrey') {
      gameState.host = socket.id;
      socket.emit('hostStatus', true);
    }

    console.log(`${playerData.name} joined as ${playerData.role}`);
    io.emit('playerJoined', gameState.players[socket.id]);
    io.emit('gameState', gameState);
  });

  // Host starts the game
  socket.on('startGame', () => {
    if (socket.id === gameState.host) {
      gameState.phase = 'question';
      gameState.currentQuestionIndex = 0;
      gameState.currentQuestion = gameData.questions[0];
      gameState.answers = {};
      
      // Initialize scores
      Object.keys(gameState.players).forEach(playerId => {
        gameState.scores[playerId] = 0;
      });

      io.emit('gameState', gameState);
      io.emit('newQuestion', gameState.currentQuestion);
    }
  });

  // Player submits answer
  socket.on('submitAnswer', (answer) => {
    if (gameState.phase === 'question') {
      gameState.answers[socket.id] = {
        playerId: socket.id,
        playerName: gameState.players[socket.id].name,
        answer: answer,
        timestamp: Date.now()
      };

      // Notify host that answer was received
      io.to(gameState.host).emit('answerReceived', {
        playerId: socket.id,
        playerName: gameState.players[socket.id].name
      });

      // Check if all required players have answered
      const currentQ = gameState.currentQuestion;
      const requiredPlayers = Object.values(gameState.players).filter(p => 
        p.couple === currentQ.couple && p.role === currentQ.askedTo
      );

      const answeredPlayers = Object.keys(gameState.answers);
      const allAnswered = requiredPlayers.every(p => answeredPlayers.includes(p.id));

      if (allAnswered) {
        gameState.phase = 'answers';
        io.emit('allAnswered');
      }
    }
  });

  // Host reveals answers
  socket.on('revealAnswers', () => {
    if (socket.id === gameState.host) {
      gameState.phase = 'reveal';
      io.emit('gameState', gameState);
      io.emit('showAnswers', gameState.answers);
    }
  });

  // Host marks correct answer and updates score
  socket.on('scoreAnswer', (data) => {
    if (socket.id === gameState.host) {
      const { playerId, correct } = data;
      if (correct && gameState.scores[playerId] !== undefined) {
        gameState.scores[playerId] += 10;
      }
      io.emit('scoreUpdate', gameState.scores);
    }
  });

  // Host skips current question
  socket.on('skipQuestion', () => {
    if (socket.id === gameState.host && gameState.phase === 'question') {
      gameState.currentQuestionIndex++;
      
      if (gameState.currentQuestionIndex < gameData.questions.length) {
        gameState.currentQuestion = gameData.questions[gameState.currentQuestionIndex];
        gameState.answers = {};
        
        io.emit('gameState', gameState);
        io.emit('newQuestion', gameState.currentQuestion);
      } else {
        // Game over
        gameState.phase = 'results';
        io.emit('gameState', gameState);
        io.emit('gameOver', gameState.scores);
      }
    }
  });

  // Host moves to next question
  socket.on('nextQuestion', () => {
    if (socket.id === gameState.host) {
      gameState.currentQuestionIndex++;
      
      if (gameState.currentQuestionIndex < gameData.questions.length) {
        gameState.phase = 'question';
        gameState.currentQuestion = gameData.questions[gameState.currentQuestionIndex];
        gameState.answers = {};
        
        io.emit('gameState', gameState);
        io.emit('newQuestion', gameState.currentQuestion);
      } else {
        // Game over
        gameState.phase = 'results';
        io.emit('gameState', gameState);
        io.emit('gameOver', gameState.scores);
      }
    }
  });

  // Reset game
  socket.on('resetGame', () => {
    if (socket.id === gameState.host) {
      gameState.phase = 'lobby';
      gameState.currentQuestion = null;
      gameState.currentQuestionIndex = -1;
      gameState.answers = {};
      gameState.scores = {};
      
      io.emit('gameState', gameState);
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    if (gameState.players[socket.id]) {
      const playerName = gameState.players[socket.id].name;
      delete gameState.players[socket.id];
      delete gameState.scores[socket.id];
      
      io.emit('playerLeft', { id: socket.id, name: playerName });
      
      // Assign new host if current host (Jeffrey) left
      if (socket.id === gameState.host) {
        // Try to find Jeffrey again (in case someone else joined as Jeffrey)
        const jeffreyPlayer = Object.entries(gameState.players).find(([id, player]) => player.role === 'Jeffrey');
        gameState.host = jeffreyPlayer ? jeffreyPlayer[0] : null;
        if (gameState.host) {
          io.to(gameState.host).emit('hostStatus', true);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 8555;
httpServer.listen(PORT, () => {
  console.log(`🎮 Newlywed Game Server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} on your smartphones to play!`);
});
