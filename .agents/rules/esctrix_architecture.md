# ESCTRIX Quantum Architecture & Design Patterns

## Core Tenets
1. **Zero-Knowledge Privacy**: Plaintext content is never processed or stored on the server.
2. **Permanent Persistence**: Supabase PostgreSQL is the primary cloud database on Render (`SUPABASE_DB_URL`). Accounts are never auto-pruned.
3. **WebRTC Track Replacement**: Camera switching uses `RTCRtpSender.replaceTrack()` without renegotiation or ringing modals.
4. **Symmetrical Call Teardown**: Calling signals must handle `call_ended` and `direct_call_end` without bouncing duplicate signals.
5. **Backpressure Flow Control**: 64KB chunked file transfers must monitor `bufferedAmount` before sending subsequent chunks.
