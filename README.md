# 💑 The Newlywed Game - Multiplayer WebSocket Edition

A mobile-friendly multiplayer game for couples to play together via smartphones!

## 🎮 Features

- **Real-time multiplayer** with WebSocket support
- **Mobile-optimized** interface for smartphones
- **Multiple question types**: Multiple choice and free answer
- **Live scoring system**
- **Host controls** for game management
- **25 custom questions** for Jeffrey/Eilene and Nadja/Julian

## 🚀 Quick Start

### Installation

```bash
cd /Users/jeffrey/src/newlywed-game
npm install
```

### Run the Server

**Option 1: Using Node.js directly**
```bash
npm start
```

**Option 2: Using Docker**
```bash
docker build -t newlywed-game .
docker run -p 3000:3000 newlywed-game
```

**Option 3: Using Docker Compose**
```bash
docker-compose up
```

The server will start on `http://localhost:3000`

### How to Play

1. **Start the server** on a computer
2. **Everyone joins** from their smartphones by visiting `http://[your-computer-ip]:3000`
3. **Each player**:
   - Enters their name
   - Selects their role (Jeffrey, Eilene, Nadja, Julian, or Spectator)
   - Clicks "Join Game"
4. **First player becomes the host** and can start the game
5. **Questions appear** one at a time - only the person being asked answers
6. **Host reveals answers** and marks them correct/incorrect
7. **Scores update** in real-time
8. **Winner** is announced at the end!

## 📱 Finding Your Computer's IP Address

To let others join from their phones on the same WiFi:

**On Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```bash
ipconfig
```

Look for your local IP (usually starts with `192.168.` or `10.`)

Then players visit: `http://192.168.x.x:3000` (replace with your IP)

## 🎯 Game Flow

1. **Lobby** - Players join and wait
2. **Questions** - Each player answers when it's their turn
3. **Reveal** - Host reveals all answers
4. **Scoring** - Host marks answers as correct/incorrect
5. **Results** - Final scores and winner announced

## 🛠️ Technical Details

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: Vanilla JavaScript + CSS
- **Communication**: WebSocket for real-time updates
- **No database needed** - all state is in memory

## 📝 Customizing Questions

Edit `questions.json` to add/modify questions. Each question needs:
- `couple`: Which couple it's for
- `askedTo`: Who answers the question
- `about`: Who the question is about
- `questionType`: "multiple_choice" or "free_answer"
- `options`: Array of choices (for multiple choice only)

## 🎨 Customization

- **Colors**: Edit the gradient colors in `public/style.css`
- **Port**: Change `PORT` in `server.js` or set environment variable
- **Questions**: Modify `questions.json`

## 🐛 Troubleshooting

- **Can't connect from phone**: Make sure all devices are on the same WiFi network
- **Port already in use**: Change the PORT in server.js
- **Answers not appearing**: Check browser console for errors (F12)

## 👥 Credits

Created for Jeffrey, Eilene, Nadja, and Julian's game night! 🎉
