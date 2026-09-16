# ESCTRIX Quantum — Session Communications & Chat Transcript Log

**Date:** September 16, 2026  
**Session ID:** `0644b581-2e23-4d77-9773-a4c7ab6c11a6`  
**Application:** ESCTRIX Quantum (Decentralized E2EE Messaging, Calling & Media Suite)  
**Repositories:**
- Primary: [https://github.com/jjeyakanthan215-ctrl/ESCTRIX.git](https://github.com/jjeyakanthan215-ctrl/ESCTRIX.git)
- Secondary: [https://github.com/jjeyakanthan215-ctrl/habib.git](https://github.com/jjeyakanthan215-ctrl/habib.git)
- Render Deployment: [https://esctrix.onrender.com/](https://esctrix.onrender.com/)

---

## 1. Overview of Communications & User Requests

### Request 1: Resume & Advance Project Roadmap
- **User Prompt:** `continue`
- **Objective:** Complete the high-priority capabilities outlined in `PROJECT_STATUS_UPDATE.txt`.
- **Delivered Solutions:**
  1. **E2EE Chunked File Transfer Engine**:
     - Slices video, image, audio, and documents into 64KB chunks (`CHUNK_SIZE = 64 * 1024`).
     - Transfers directly over WebRTC `RTCDataChannel` for Space rooms with backpressure flow control (`dc.bufferedAmount` threshold).
     - Relays via WebSocket for direct 1-on-1 messages with flow control acknowledgements (`direct_file_meta`, `direct_file_chunk`, `direct_file_ack`, `direct_file_complete`).
     - Animated transfer progress bar HUD displaying filename, percentage, and real-time speed.
  2. **In-Chat Glassmorphic Video Player**:
     - Embedded player for `msg.type === 'video'` with custom neon play/pause overlay, duration metadata, download button, and fullscreen lightbox viewer.
  3. **Multi-Tier Vanish Timer & View-Once Secrecy Cards**:
     - Upgraded vanishing messages from a fixed 10s toggle to an interactive selector: `Off`, `5s`, `10s`, `30s`, and `View-Once (1-View 🔒)`.
     - For View-Once media: displays an encrypted blurred thumbnail with "Tap to View Once". Once tapped and closed, it is permanently wiped from the DOM and memory.
  4. **FIDO2 / WebAuthn Biometric Passkey Authentication**:
     - Hardware-backed biometric authentication (FaceID, TouchID, Windows Hello).
     - "Register Passkey / Biometrics" in Settings Suite and "Sign In with Passkey" button on the login screen.

---

### Request 2: Academic Abstract & Comprehensive Project Explanation
- **User Prompt:** `can you make a 1 page abstract about the project and explantation and advantages of the project as a separate project files`
- **Delivered Documents:**
  1. [ABSTRACT.md](file:///d:/Projects/P2P%20SMS/ABSTRACT.md): A formal 1-page publication-ready abstract detailing the architectural problem, hybrid WebRTC/WebSocket methodology, zero-knowledge cryptographic model, empirical benchmarks, and security implications.
  2. [PROJECT_EXPLANATION_AND_ADVANTAGES.md](file:///d:/Projects/P2P%20SMS/PROJECT_EXPLANATION_AND_ADVANTAGES.md): Complete technical breakdown covering core modules, data flow diagrams, enterprise advantages over legacy messaging systems (WhatsApp/Telegram/Signal), and operational guidelines.

---

### Request 3: Fix Render Account Deletion, Supabase Integration & Calling Bugs
- **User Prompt:** 
  > *"why the previous user login accont are deleted every time the render applicaiton loads on the browser is any to stop the autodeleteing the user account details and need to update and we are using the superbase for the storage update can you make that to connect the data of the login details from the user to user is need to save evertime theat on call option in the web application to connect with the app ithe calling function if i try to call its come if the call is end the other party call should not be ended and if i try to switch a cam in video call the call is coming again not the same call video switches during the calling ffuntion its have too much of bugs and error on that can you fix it fully"*

- **Detailed Diagnosis & Technical Breakdown:**
  1. **Account Deletion on Render**:
     - *Cause 1:* Render free-tier containers have ephemeral filesystems; whenever the app sleeps due to inactivity or restarts, the local SQLite database (`users.db`) was destroyed.
     - *Cause 2:* In [server.py](file:///d:/Projects/P2P%20SMS/server.py), `prune_inactive_users(7)` was executing on startup and every 6 hours, purging accounts older than 7 days.
     - *Cause 3:* Hardcoded deletions in `init_db()` removed test/admin usernames.
     - *Solution:* Implemented a dual-engine adapter in [database.py](file:///d:/Projects/P2P%20SMS/database.py) supporting **Supabase PostgreSQL** via `psycopg2` connection pooling (`SUPABASE_DB_URL` / `DATABASE_URL`) with automatic SQLite fallback for local development. Disabled auto-pruning by default (`ENABLE_ACCOUNT_PRUNING=false`) to guarantee user accounts never get deleted.
     - *Schema:* Updated [supabase_schema.sql](file:///d:/Projects/P2P%20SMS/supabase_schema.sql) with full tables for `users`, `contacts`, `offline_messages`, `saved_messages`, `direct_messages`, and `passkey_credentials`.
  2. **Camera Flipping Mid-Call Bug**:
     - *Cause:* In [frontend/js/app.js](file:///d:/Projects/P2P%20SMS/frontend/js/app.js), `flipCamera()` was calling `this.initiate('video')`, which generated a new WebRTC offer and rang the remote party with a brand-new incoming call modal mid-call.
     - *Solution:* Re-engineered `flipCamera()` using `RTCRtpSender.replaceTrack(newVideoTrack)` on active peer connections (`directCallPC` and mesh peers). The video stream switches smoothly in real time without renegotiation or ringing the peer.
  3. **Call Teardown Synchronization**:
     - *Cause:* Room signaling dropped `call_ended` messages, and direct calls lacked a non-echoing teardown flag, causing desynchronization or recursive signal bouncing.
     - *Solution:* Added `call_ended` message routing in [server.py](file:///d:/Projects/P2P%20SMS/server.py), [webrtc.js](file:///d:/Projects/P2P%20SMS/frontend/js/webrtc.js), and [app.js](file:///d:/Projects/P2P%20SMS/frontend/js/app.js). Configured `this.call.end(sendSignal = true)` so that receiving an end signal cleanly terminates all media, remote video elements, timers, and overlays without bouncing signals.

---

### Request 4: Deploy & Push to GitHub and Render
- **User Prompt:** `can you push it into github and render`
- **Execution:**
  - Staged all modified files and untracked documents (`git add -A`).
  - Created commit: `feat: Supabase PostgreSQL cloud persistence, disable account pruning, camera flip replaceTrack fix, and call teardown synchronization` (`638cc13`).
  - Pushed to `origin main` ([https://github.com/jjeyakanthan215-ctrl/ESCTRIX.git](https://github.com/jjeyakanthan215-ctrl/ESCTRIX.git)).
  - Pushed to `habib main` ([https://github.com/jjeyakanthan215-ctrl/habib.git](https://github.com/jjeyakanthan215-ctrl/habib.git)).
  - Render automatically detected the commit push and triggered a live deployment build for [https://esctrix.onrender.com/](https://esctrix.onrender.com/).

---

### Request 5: Archive Communications, Chat, and Files in Folder & Antigravity
- **User Prompt:** `save the communicaitions and chat and files on the folder and antigravity`
- **Execution:**
  - Created `docs/` directory housing the full session communications log, implementation plans, verification walkthroughs, and Supabase deployment guides.
  - Created `AGENTS.md` and `.agents/rules/esctrix_architecture.md` to permanently preserve project context, database rules, and coding standards within Antigravity.

---

## 2. Key Architecture Decisions & Reference Rules

| Component | Technical Implementation | Purpose |
|---|---|---|
| **Database** | Dual Engine (`psycopg2` for Supabase Postgres + `sqlite3` fallback) | Permanent cloud persistence on Render with zero-setup local dev |
| **Account Retention** | `ENABLE_ACCOUNT_PRUNING=false` default guard | Prevents user accounts from ever being deleted automatically |
| **Calling** | WebRTC `RTCRtpSender.replaceTrack` | Seamless camera switching without renegotiation or ringing popups |
| **Call Teardown** | Symmetrical `call_ended` / `direct_call_end` with non-echo flag | Clean termination of media, overlays, and timers on both sides |
| **Media Transfer** | 64KB chunking with `dc.bufferedAmount` backpressure | Multi-megabyte video & document transfer without memory leaks |
| **Authentication** | Password (bcrypt) + FIDO2 / WebAuthn Biometric Passkeys | Cryptographic authentication via FaceID / TouchID / Windows Hello |
