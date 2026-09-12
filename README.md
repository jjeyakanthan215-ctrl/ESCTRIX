# ESCTRIX Quantum — Futuristic Telegram-Style P2P Messenger & AI Suite

[![Render Deployment](https://img.shields.io/badge/Render-Deployed-brightgreen)](https://esctrix.onrender.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Security: Zero--Knowledge](https://img.shields.io/badge/Security-Zero--Knowledge%20E2EE-blueviolet)](https://github.com/jjeyakanthan215-ctrl/ESCTRIX)

**ESCTRIX Quantum** is a next-generation decentralized communication platform combining the familiar ease of **Telegram** with **futuristic Cyber-Glass aesthetics**, **Zero-Knowledge client-side end-to-end encryption (E2EE)**, and an integrated **Neural AI Suite (Aura AI)**.

---

## ⚡ Key Highlights

### 1. Futuristic Telegram-Style Interface (Cyber-Glass)
- **Responsive 2-Pane Architecture**: Left sidebar (Search, Category Folders, Pinned Bots, Chat List) + Right main chat stream.
- **Telegram Message Bubbles**: Outgoing/incoming bubble tails, timestamps, and read checkmarks (`✓✓`).
- **Interactive Voice Note Waveform**: Dynamic SVG audio visualizer with variable playback speed selector (`1.0x`, `1.5x`, `2.0x`).
- **Web Audio Synthesizer**: Subtle sci-fi sound feedback (send chirps, receive chimes, call pulses) — toggleable in settings.
- **Interactive Command Palette**: Press `Ctrl+K` or type `/` in the chat input for instant action shortcuts (`/ai`, `/polish`, `/translate`, `/summarize`, `/call`, `/burn`, `/vanish`, `/export`).

### 2. Permanent Account Identity & Digital Cards
- **Permanent Account ID**: Every user is assigned a permanent unique public ID (e.g. `ESC-849201`) with a 1-click copy badge.
- **Public Handle & Profile**: Unique `@username`, customizable Display Name, Bio, and dynamic holographic avatar themes.
- **Persistent Sessions**: Auto-login via stored credentials so you never get logged out on page reloads.
- **Direct User Search**: Search registered peers across the network by `@username` or Account ID.

### 3. Advanced Neural AI Suite (Aura AI)
- **Aura AI Companion Bot**: Pinned conversational neural partner directly inside your chat list for coding help, explanations, brainstorming, and daily assistance.
- **Real-Time Vibe & Sentiment Analyzer**: Analyzes emotional resonance in active chats (*High Urgency*, *Positive & Energetic*, *Technical & Analytical*, *Relaxed*) with an animated glowing aura pill.
- **Contextual Smart Replies**: 3 intelligent 1-click suggested reply pills above the message bar.
- **AI Tone Polisher / Rewriter**: Transform draft messages into *Cyberpunk*, *Executive*, *Friendly*, or *Concise* tone.
- **Polyglot Translator**: Real-time translation between 12+ world languages (*Spanish, French, German, Tamil, Hindi, Japanese, Chinese, Arabic, Russian, Portuguese, Italian, English*).
- **Neural Chat Summarizer**: 1-click bullet-point recap of long conversations.
- **Hybrid AI Engine**: Operates 100% offline out-of-the-box with intelligent built-in heuristics, and seamlessly connects to **Google Gemini 1.5 Flash** when `GEMINI_API_KEY` is provided.

### 4. Zero-Knowledge E2EE & P2P Media
- **Client-Side Web Crypto**: AES-GCM 256-bit encryption. Even when deployed on free third-party cloud hosts like Render, the server and databases only ever store unreadable ciphertext.
- **WebRTC Mesh Video & Voice Calling**: HD audio/video calling, screen sharing, camera flipping, and in-call chat.
- **Vanish Mode & Burn Space**: 10-second self-destructing messages or complete cryptographic room purging.
- **Saved Messages**: Your personal encrypted cloud vault for bookmarking links, files, and notes.

---

## 🛠️ Technology Stack

- **Backend**: FastAPI (Python 3.10–3.13+), SQLite / Firebase Cloud Firestore adapter, WebSockets.
- **Frontend**: Vanilla JavaScript (ES6+), WebRTC (DataChannel & MediaStream), Web Audio API, Vanilla CSS3 (Glassmorphism & Cyber-Glass).
- **Security**: Bcrypt password hashing, Web Crypto API (AES-GCM 256), DTLS/SRTP WebRTC encryption.
- **Cloud Deployment**: Production-ready for Render.com.

---

## 💻 Local Setup & Execution

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jjeyakanthan215-ctrl/ESCTRIX.git
   cd "P2P SMS"
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the server**:
   ```bash
   python main.py
   ```
   Or using Uvicorn directly:
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8006
   ```

---

## 🌐 Render Cloud Deployment

The project includes `render.yaml` and `Procfile` ready for 1-click deployment on [Render](https://render.com):

1. Connect your GitHub repository to Render as a **Web Service**.
2. Settings:
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT --workers 1 --ws websockets`
3. Environment Variables (Optional):
   - `DB_PATH`: `users.db` (or persistent disk path e.g. `/data/users.db`)
   - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key to upgrade Aura AI to Gemini 1.5 Flash.
   - `FIREBASE_PROJECT_ID`: *(Optional)* Your Firebase project ID for persistent cloud syncing.
   - `ADMIN_USERS`: `ESCTRIX_Admin,Gayathri`

---

## 🔒 Security Architecture Note

ESCTRIX Quantum operates under a **Zero-Knowledge Architecture**. Peer-to-peer data and media flow directly between client browsers via WebRTC. When offline messages or saved messages are synchronized, the client encrypts the payloads prior to transit. The signaling server and third-party hosting infrastructure have zero ability to decrypt your private communications.

---
*Created with ❤️ by the ESCTRIX Team | Jeyakanthan*
