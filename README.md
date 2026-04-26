# 🎨 Pict.io

A real-time multiplayer drawing and guessing game, inspired by Skribbl.io. Gather your friends, unleash your creativity, and compete to see who is the ultimate artist and guesser!

## ✨ Features

- **Real-Time Multiplayer**: Instant synchronization across all connected players using Socket.io.
- **Advanced Drawing Tools**: Standard brush strokes, a custom-built Flood Fill (Paint Bucket) tool, and full Undo/Redo/Reset history syncing.
- **Intelligent Guess Detection**: Uses Levenshtein distance algorithm to detect typos and award "Close Guess" hints to players in the chat.
- **Host Controls**: The room creator can customize the number of rounds, draw time, max players, and even inject custom words!
- **Dynamic Word Bank**: Integrates a massive official dictionary of over 2,700 easy-to-draw nouns and verbs to keep the game fresh, while intelligently guaranteeing at least one universally simple word per turn.
- **Responsive & Mobile Friendly**: Fully optimized UI that looks and plays beautifully on desktop, tablets, and mobile devices.
- **Beautiful UI/UX**: Features a sleek glassmorphic design, dynamic animations, and a beautiful animated Podium system for the final winners.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Lucide-React
- **Backend**: Node.js, Express, Socket.io
- **Deployment/Tooling**: pnpm, ESLint

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and `pnpm` installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AlphaCosmicCoder/Pict.io.git
   cd Pict.io
   ```

2. Install dependencies for both the frontend and backend:
   ```bash
   cd backend
   pnpm install
   cd ../frontend
   pnpm install
   ```

### Running the App Locally

You will need to run both the backend server and the frontend client simultaneously.

**1. Start the Backend:**
```bash
cd backend
pnpm dev
```
*The backend server will run on `http://localhost:5000`.*

**2. Start the Frontend:**
```bash
cd frontend
pnpm dev --host
```
*The frontend client will run on `http://localhost:5173`. The `--host` flag allows you to test the app on mobile devices connected to your local network.*

## 🎮 How to Play

1. **Create a Room**: Enter your nickname, choose an avatar, and hit "Create Room".
2. **Invite Friends**: Share the generated 6-character Room Code with your friends.
3. **Customize**: The host can adjust game settings in the lobby before starting the game.
4. **Draw & Guess**: 
   - If it's your turn, pick a word from the 3 choices and draw it on the canvas.
   - If someone else is drawing, type your guesses into the chat box. Guess quickly to earn more points!
5. **Win**: The player with the most points at the end of all rounds takes the gold medal on the podium!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
