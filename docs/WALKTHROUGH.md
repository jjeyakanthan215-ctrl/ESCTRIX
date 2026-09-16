# Walkthrough: Supabase Cloud Persistence, Account Retention & WebRTC Calling Fixes

This update addresses the user account loss on Render, connects **Supabase PostgreSQL** cloud storage for permanent data retention, disables account auto-pruning, and completely fixes the WebRTC camera switching and call termination bugs.

---

## 1. Why Accounts Were Getting Deleted on Render & How It Was Fixed

### Root Causes
1. **Render Free-Tier Ephemeral Filesystem**:
   - Render's free tier spins down web services when there is no active traffic.
   - Any local disk file (such as `users.db` SQLite) is wiped clean whenever the container spins down, restarts, or deploys new code.
2. **Aggressive Auto-Pruning in Code**:
   - `server.py` was executing `prune_inactive_users(7)` on startup and every 6 hours.
   - Hardcoded deletion queries in `database.py` removed certain usernames.

### The Fix
1. **Supabase PostgreSQL Cloud Storage Connection**:
   - Updated `database.py` with a dual-engine adapter using `psycopg2` and `ThreadedConnectionPool`.
   - When `SUPABASE_DB_URL` (or standard `DATABASE_URL`) is supplied, the app connects directly to Supabase cloud PostgreSQL.
   - All user logins, profiles, contacts, direct chat histories, passkeys, and vaults persist permanently across container spin-downs, restarts, and redeployments.
   - If no cloud URL is supplied, the system seamlessly falls back to SQLite for local development.
2. **Disabled Auto-Pruning by Default**:
   - Both `database.py` and `server.py` now guard pruning behind `ENABLE_ACCOUNT_PRUNING=true`.
   - By default, account pruning is **OFF**. User accounts will never be automatically deleted.
   - Removed obsolete hardcoded user deletions.

---

## 2. WebRTC Video Call Fixes

### Bug A: Camera Switching Causing Incoming Call Popups
- **Cause**: In `frontend/js/app.js`, `flipCamera()` called `this.initiate('video')`, which generated a new WebRTC offer and sent a call invitation to the peer, ringing them mid-call!
- **Fix**: Replaced `flipCamera()` with standard WebRTC track replacement using `RTCRtpSender.replaceTrack(newVideoTrack)` on active peer connections (`s.directCallPC` and mesh peers in `s.p2p.peers`). The video track switches in real time with zero call interruption, renegotiation, or fake incoming call popups.

### Bug B: Call Teardown Desynchronization
- **Cause**:
  1. Room signaling in `server.py` and `frontend/js/webrtc.js` dropped `call_ended` signals.
  2. In direct 1-on-1 calls, `this.call.end()` lacked a `sendSignal` parameter, causing echo signals to bounce back and forth.
- **Fix**:
  1. Added `call_ended` to the allowed room signaling types in `server.py` and `frontend/js/webrtc.js`.
  2. Updated `this.call.end(sendSignal = true)` in `frontend/js/app.js`. When a peer receives `direct_call_end`, `direct_call_declined`, or `call_ended`, it calls `end(false)` to cleanly tear down local streams, remote elements, timers, and overlays without echoing signals back.

---

## 3. How to Connect Supabase to Render (Step-by-Step)

1. Open your project on [Supabase](https://supabase.com).
2. Go to **SQL Editor** in the left sidebar and run the script in `supabase_schema.sql`.
3. Go to **Project Settings -> Database -> Connection String (URI)** and copy the connection URI:
   ```
   postgresql://postgres.[your-project-ref]:[your-password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. Open your [Render Dashboard](https://dashboard.render.com).
5. Select your **esctrix** web service -> **Environment** -> **Add Environment Variable**:
   - **Key**: `SUPABASE_DB_URL`
   - **Value**: *(Paste your Supabase connection URI from Step 3)*
6. Click **Save Changes**. Render will redeploy automatically, and all user accounts will be permanently stored in your Supabase PostgreSQL cloud database!

---

## 4. Verification & Testing Results

| Test Case | Command / Method | Status |
|---|---|---|
| **Backend Initialization** | `python -c "import server, database; database.init_db()"` | **PASSED** (0 errors) |
| **API Test Suite** | `python scratch/test_api.py` (Health, Passkeys, Auth) | **PASSED** (All endpoints 200 OK) |
| **JS Syntax Validation** | `node -c "frontend/js/app.js"; node -c "frontend/js/webrtc.js"` | **PASSED** (Valid syntax) |
| **Pruning Guard** | Verify `ENABLE_ACCOUNT_PRUNING=false` prevents deletion | **PASSED** (Skips deletion) |
| **Supabase Schema** | Validated PostgreSQL DDL in `supabase_schema.sql` | **PASSED** (Full schema ready) |
