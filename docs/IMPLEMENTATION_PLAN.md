# Implementation Plan: Supabase PostgreSQL Persistence, Account Retention & WebRTC Calling Architecture Overhaul

This update resolves the persistent user account deletion issue on Render, connects **Supabase PostgreSQL** cloud storage for permanent login and profile retention, and completely fixes the WebRTC calling bugs (camera flipping and call termination synchronization).

---

## User Review Required

> [!IMPORTANT]
> **Account Persistence on Render (Supabase Cloud Storage)**:
> - Render free-tier containers have ephemeral filesystems. Any local SQLite database (`users.db`) is wiped whenever Render spins down from inactivity, restarts, or deploys new code.
> - In addition, the codebase had an aggressive `prune_inactive_users(7)` routine executing on startup and every 6 hours.
> - **Resolution**:
>   1. We implement dual-engine persistence in `database.py`. When `SUPABASE_DB_URL` (or `DATABASE_URL`) is supplied, the app automatically connects to Supabase PostgreSQL using connection pooling (`psycopg2`), guaranteeing permanent data retention.
>   2. If no cloud URL is set, it falls back seamlessly to SQLite for local offline development.
>   3. Auto-pruning is **disabled by default** (`ENABLE_ACCOUNT_PRUNING=false`), preventing user accounts from ever being deleted automatically.
>   4. Users simply copy their Supabase PostgreSQL connection string into their Render dashboard environment variables as `SUPABASE_DB_URL`.

> [!IMPORTANT]
> **WebRTC Calling Engine Fixes**:
> 1. **Camera Switch / Flip Bug**:
>    - Currently, `flipCamera()` calls `this.initiate('video')`, which generated a brand-new call offer and sent `direct_call_offer` to the remote peer, ringing them with a second incoming call modal!
>    - **Fix**: Replace `flipCamera()` with standard WebRTC track replacement using `RTCRtpSender.replaceTrack(newVideoTrack)` on active peer connections (`s.directCallPC` and mesh peers). The remote video seamlessly switches without any interruption, renegotiation, or incoming call popups.
> 2. **Call Teardown Synchronization**:
>    - Add `call_ended` message routing in `server.py`, `frontend/js/webrtc.js`, and `frontend/js/app.js`.
>    - Update `end(sendSignal = true)` so that when a call is terminated on one side, the remote party cleanly stops all media tracks, hides the call overlay, removes remote video/audio elements, and clears timers without bouncing redundant signals.

---

## Proposed Changes

### 1. Database Architecture & Supabase PostgreSQL Adapter

#### `database.py`
- Detect `SUPABASE_DB_URL` or `DATABASE_URL`.
- Initialize `ThreadedConnectionPool` for PostgreSQL when configured, or SQLite connection when running locally.
- Implement unified query execution helper `_execute(query, params, fetch, returning_id)`:
  - Automatically translates `?` parameter syntax to `%s` for PostgreSQL.
  - Appends `RETURNING id` for PostgreSQL inserts to return generated IDs cleanly.
  - Formats dictionaries with identical keys in both PostgreSQL (`RealDictCursor`) and SQLite (`sqlite3.Row`).
  - Adapts timestamp operations (`NOW() - INTERVAL '...'` vs `datetime('now', '...')`).
- Ensure all tables exist in Supabase (`users`, `contacts`, `offline_messages`, `saved_messages`, `direct_messages`, `passkey_credentials`).
- Update `prune_inactive_users` so it is strictly disabled unless `ENABLE_ACCOUNT_PRUNING=true` is explicitly configured.
- Remove obsolete hardcoded user deletions.

#### `server.py`
- In the `lifespan` handler, only trigger `prune_inactive_users` if `ENABLE_ACCOUNT_PRUNING` is set to `'true'`. Otherwise skip pruning entirely.
- Allow `"call_ended"` in room WebSocket message dispatcher (`server.py:884-889`).

#### `supabase_schema.sql`
- Add missing `direct_messages` table definition with indexes.
- Add missing `passkey_credentials` table definition with indexes.
- Ensure `last_login_at` and `avatar_photo` are in the `users` table definition.

#### `render.yaml`
- Add `SUPABASE_DB_URL` environment variable definition with clear documentation.

---

### 2. WebRTC Calling & Media Module Fixes

#### `frontend/js/app.js`
- **Rewrite `flipCamera()`**:
  - Acquire new video stream via `navigator.mediaDevices.getUserMedia({ video: { facingMode: nextMode }, audio: false })`.
  - Use `sender.replaceTrack(newTrack)` on `directCallPC` and mesh peers in `p2p.peers`.
  - Stop the old video track and update `localVideo.srcObject`.
  - Never call `initiate('video')` or create renegotiation offers.
- **Fix `call.end(sendSignal = true)`**:
  - If `sendSignal` is true, send `direct_call_end` (for direct calls) or `p2p.sendCallSignal('call_ended')` (for room calls).
  - Stop all local video, audio, and screen-sharing tracks.
  - Close and nullify `directCallPC`.
  - Remove `#remote-video-stream`, `#audio-call-indicator-card`, and any remote video elements.
  - Reset timer interval, reset timer display to `00:00`, close modals, hide `videoOverlay`.
- **Handle incoming `direct_call_end` and `direct_call_declined`**:
  - Invoke `this.call.end(false)` so signals are not echoed back.
- **Handle `call_ended` in `call.handleSignal(signal)`**:
  - Add `else if (signal.type === 'call_ended') { this.end(false); }`.

#### `frontend/js/webrtc.js`
- Include `'call_ended'` in `_handleSignalingMessage` under the `case 'call_request': case 'call_accepted': case 'call_declined': case 'call_ended':` switch block.

---

## Verification Plan

### Automated Tests
1. **Database & API Integration**:
   - Run API test suite:
     ```powershell
     python scratch/test_api.py
     ```
   - Verify SQLite fallback works seamlessly without PostgreSQL credentials.
   - Test mock PostgreSQL connection parameter handling and SQL syntax translation.

2. **Frontend Syntax Validation**:
   - Verify JavaScript syntax with Node:
     ```powershell
     node -c "frontend/js/app.js"
     node -c "frontend/js/webrtc.js"
     ```

### Manual Verification
1. **Account Retention & Supabase**:
   - Verify that user accounts are never purged during startup or periodic intervals.
   - Verify `supabase_schema.sql` can be executed cleanly on Supabase SQL editor.
2. **WebRTC Camera Flipping**:
   - In a video call, click "Flip Camera".
   - Confirm that the camera switches smoothly on the local preview and replaces the track for the peer, with zero incoming call rings.
3. **Call End Synchronization**:
   - In both 1-on-1 direct calls and space calls, end the call from one side.
   - Confirm that the other party's call screen closes immediately, all audio/video stops, and no hanging or orphaned call overlays remain.
