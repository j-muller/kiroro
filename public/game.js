const socket = io();

// Game state
let currentPlayer = null;
let isHost = false;
let selectedRole = null;
let selectedCouple = null;
let currentAnswer = null;
let gameState = null;

// DOM elements
const screens = {
  lobby: document.getElementById('lobby'),
  question: document.getElementById('questionScreen'),
  reveal: document.getElementById('revealScreen'),
  results: document.getElementById('resultsScreen')
};

const playersList = document.getElementById('playersList');
const startGameBtn = document.getElementById('startGameBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

function setupEventListeners() {
  // Player join buttons
  document.querySelectorAll('.player-join-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRole = btn.dataset.role;
      selectedCouple = btn.dataset.couple;
      joinGame();
    });
  });

  // Start game (host only)
  startGameBtn.addEventListener('click', () => {
    socket.emit('startGame');
  });

  // Submit answer
  document.getElementById('submitAnswerBtn').addEventListener('click', submitAnswer);

  // Skip question (host only)
  document.getElementById('skipQuestionBtn').addEventListener('click', () => {
    if (confirm('Skip this question?')) {
      socket.emit('skipQuestion');
    }
  });

  // Next question (host only)
  document.getElementById('nextQuestionBtn').addEventListener('click', () => {
    socket.emit('nextQuestion');
  });

  // Play again (host only)
  document.getElementById('playAgainBtn').addEventListener('click', () => {
    socket.emit('resetGame');
  });

  // Multiple choice options
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('option-btn')) {
      document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
      });
      e.target.classList.add('selected');
      currentAnswer = e.target.dataset.key;
      document.getElementById('submitAnswerBtn').disabled = false;
    }
  });

  // Free answer input
  document.getElementById('freeAnswerInput').addEventListener('input', (e) => {
    currentAnswer = e.target.value.trim();
    document.getElementById('submitAnswerBtn').disabled = currentAnswer.length === 0;
  });
}

function joinGame() {
  // Use the role name as the player name
  const playerName = selectedRole;
  
  socket.emit('join', {
    name: playerName,
    role: selectedRole,
    couple: selectedCouple
  });

  currentPlayer = {
    name: playerName,
    role: selectedRole,
    couple: selectedCouple
  };
}

// Socket event handlers
socket.on('gameState', (state) => {
  gameState = state;
  updateScreen(state.phase);
  updateScores(state.scores);
});

socket.on('hostStatus', (status) => {
  isHost = status;
  document.getElementById('hostControls').style.display = isHost ? 'block' : 'none';
  document.getElementById('hostQuestionControls').style.display = isHost ? 'block' : 'none';
  document.getElementById('hostRevealControls').style.display = isHost ? 'block' : 'none';
  document.getElementById('hostResultControls').style.display = isHost ? 'block' : 'none';
});

socket.on('playerJoined', (player) => {
  updatePlayersList();
});

socket.on('playerLeft', (data) => {
  updatePlayersList();
});

socket.on('newQuestion', (question) => {
  displayQuestion(question);
  currentAnswer = null;
});

socket.on('answerReceived', (data) => {
  if (isHost) {
    updateAnswersReceived();
  }
});

socket.on('allAnswered', () => {
  if (isHost) {
    // Auto-reveal answers when everyone has answered
    setTimeout(() => {
      socket.emit('revealAnswers');
    }, 1000);
  }
});

socket.on('showAnswers', (answers) => {
  displayAnswers(answers);
});

socket.on('scoreUpdate', (scores) => {
  updateScores(scores);
});

socket.on('gameOver', (scores) => {
  displayFinalScores(scores);
});

function updateScreen(phase) {
  Object.values(screens).forEach(screen => screen.classList.remove('active'));
  
  switch (phase) {
    case 'lobby':
      screens.lobby.classList.add('active');
      updatePlayersList();
      break;
    case 'question':
      screens.question.classList.add('active');
      break;
    case 'reveal':
      screens.reveal.classList.add('active');
      break;
    case 'results':
      screens.results.classList.add('active');
      break;
  }
}

function updatePlayersList() {
  if (!gameState || !gameState.players) return;
  
  const players = Object.values(gameState.players);
  playersList.innerHTML = players.map(player => `
    <div class="player-item">
      <span class="player-name">${player.name}</span>
      <span class="player-role">${player.role}</span>
    </div>
  `).join('');
}

function displayQuestion(question) {
  document.getElementById('questionNumber').textContent = 
    `Question ${gameState.currentQuestionIndex + 1}/25`;
  
  document.getElementById('askedTo').textContent = question.askedTo;
  document.getElementById('aboutWho').textContent = question.about;
  document.getElementById('questionText').textContent = question.questionText;
  
  // Reset answer UI
  document.getElementById('waitingMessage').style.display = 'none';
  document.getElementById('submitAnswerBtn').style.display = 'block';
  document.getElementById('submitAnswerBtn').disabled = true;
  
  // Check if this player should answer this question
  const shouldAnswer = currentPlayer && 
    currentPlayer.couple === question.couple && 
    currentPlayer.role === question.askedTo;
  
  if (question.questionType === 'multiple_choice') {
    document.getElementById('optionsContainer').style.display = 'flex';
    document.getElementById('freeAnswerContainer').style.display = 'none';
    
    document.getElementById('optionsContainer').innerHTML = question.options.map(option => `
      <button class="option-btn" data-key="${option.key}">
        <span class="option-key">${option.key}</span>
        ${option.text}
      </button>
    `).join('');
  } else {
    document.getElementById('optionsContainer').style.display = 'none';
    document.getElementById('freeAnswerContainer').style.display = 'block';
    document.getElementById('freeAnswerInput').value = '';
  }
  
  // Disable input if player shouldn't answer
  if (!shouldAnswer) {
    document.getElementById('submitAnswerBtn').style.display = 'none';
    document.getElementById('waitingMessage').style.display = 'block';
    document.getElementById('waitingMessage').innerHTML = 
      '<p class="waiting-text">This question is for ' + question.askedTo + '</p>';
  }
}

function submitAnswer() {
  if (!currentAnswer) return;
  
  socket.emit('submitAnswer', currentAnswer);
  
  document.getElementById('submitAnswerBtn').style.display = 'none';
  document.getElementById('waitingMessage').style.display = 'block';
  
  // Disable all inputs
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.disabled = true;
  });
  document.getElementById('freeAnswerInput').disabled = true;
}

function updateAnswersReceived() {
  if (!gameState || !gameState.answers) return;
  
  const answersDiv = document.getElementById('answersReceived');
  const answers = Object.values(gameState.answers);
  
  answersDiv.innerHTML = `
    <p>Answers received: ${answers.length}</p>
    ${answers.map(a => `
      <div class="answer-status">✓ ${a.playerName}</div>
    `).join('')}
  `;
}

function displayAnswers(answers) {
  const answersDiv = document.getElementById('answersDisplay');
  const answersList = Object.values(answers);
  
  answersDiv.innerHTML = answersList.map(answer => `
    <div class="answer-item">
      <div class="answer-player">${answer.playerName}</div>
      <div class="answer-text">${answer.answer}</div>
      ${isHost ? `
        <div class="score-buttons">
          <button class="score-btn correct" onclick="scoreAnswer('${answer.playerId}', true)">
            ✓ Correct
          </button>
          <button class="score-btn incorrect" onclick="scoreAnswer('${answer.playerId}', false)">
            ✗ Incorrect
          </button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function scoreAnswer(playerId, correct) {
  socket.emit('scoreAnswer', { playerId, correct });
  
  // Visual feedback
  event.target.style.opacity = '0.5';
  event.target.disabled = true;
}

function updateScores(scores) {
  if (!currentPlayer || !scores) return;
  
  const myScore = scores[socket.id] || 0;
  const scoreElement = document.getElementById('yourScore');
  if (scoreElement) {
    scoreElement.textContent = `Your Score: ${myScore}`;
  }
}

function displayFinalScores(scores) {
  const scoresDiv = document.getElementById('finalScores');
  const sortedScores = Object.entries(scores)
    .map(([id, score]) => ({
      id,
      name: gameState.players[id]?.name || 'Unknown',
      score
    }))
    .sort((a, b) => b.score - a.score);
  
  const maxScore = sortedScores[0]?.score || 0;
  
  scoresDiv.innerHTML = sortedScores.map((player, index) => `
    <div class="score-item ${player.score === maxScore ? 'winner' : ''}">
      <span>${index === 0 ? '🏆' : ''} ${player.name}</span>
      <span class="score-value">${player.score}</span>
    </div>
  `).join('');
}

// Make scoreAnswer available globally for onclick handlers
window.scoreAnswer = scoreAnswer;
