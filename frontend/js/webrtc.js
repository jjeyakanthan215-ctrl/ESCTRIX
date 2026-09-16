/**
 * ESCTRIX — Mesh P2P Connection Manager
 * Supports up to 4 simultaneous peers via WebRTC Mesh topology.
 * Each remote peer gets its own RTCPeerConnection + DataChannel.
 */
class P2PConnection {
    constructor(onMessage, onConnectionStateChange, onTrack, onCallSignal) {
        this.ws             = null;
        this.clientId       = this.generateId();
        this.myUsername     = '';
        this.peerName       = '';    // legacy: first peer name (for 1-to-1 compat)

        // Mesh: Map<remotePeerId, { pc: RTCPeerConnection, dc: RTCDataChannel, username: string }>
        this.peers = new Map();

        this.onMessage              = onMessage;
        this.onConnectionStateChange = onConnectionStateChange;
        this.onTrack                = onTrack;
        this.onCallSignal           = onCallSignal;

        // Auth fail reason (for UI)
        this.authReason = null;

        // ICE configuration with STUN and TURN relays for NAT/Firewall traversal
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun.cloudflare.com:3478' },
                { urls: 'stun:global.stun.twilio.com:3478' },
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelay',
                    credential: 'openrelay'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelay',
                    credential: 'openrelay'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                    username: 'openrelay',
                    credential: 'openrelay'
                }
            ],
            iceCandidatePoolSize: 10
        };
    }

    generateId() {
        return Math.random().toString(36).substring(2, 15);
    }

    // ── Signaling ──────────────────────────────────────────────────────────────

    connectSignaling(serverIp, pin, myUsername, hostUsername) {
        this.myUsername = myUsername;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host     = window.location.host;
        const wsUrl    = `${protocol}//${host}/ws/${this.clientId}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('[Signaling] Connected');
            this.sendSignalingMessage('auth', {
                pin,
                username: myUsername,
                host_username: hostUsername
            });
        };

        this.ws.onmessage = async (event) => {
            const msg = JSON.parse(event.data);
            await this._handleSignalingMessage(msg, myUsername, hostUsername);
        };

        this.ws.onerror = (err) => {
            console.error('[Signaling] Error:', err);
            this.onConnectionStateChange('disconnected');
        };

        this.ws.onclose = () => {
            console.log('[Signaling] Closed');
            this.onConnectionStateChange('disconnected');
        };
    }

    async _handleSignalingMessage(msg, myUsername, hostUsername) {
        switch (msg.type) {

            case 'auth_success': {
                console.log('[Auth] Success. Existing peers:', msg.existing_peers);
                this.myClientId = msg.your_client_id || this.clientId;

                // For each already-connected peer, we (the new joiner) create the offer
                if (msg.existing_peers && msg.existing_peers.length > 0) {
                    for (const peer of msg.existing_peers) {
                        this.peerName = peer.username || 'Peer';
                        const pc = this._createPeerConnection(peer.client_id, peer.username, true);
                    }
                } else {
                    // First in the room (the host) — just wait for peers to arrive
                    console.log('[Auth] Waiting for peers to join...');
                }
                break;
            }

            case 'auth_fail': {
                console.error('[Auth] Failed:', msg.reason, msg.message);
                this.authReason = msg.reason;
                this.authMessage = msg.message || '';
                this.onConnectionStateChange('failed_auth');
                break;
            }

            case 'kicked': {
                console.warn('[Signaling] Kicked:', msg.message);
                this.kickMessage = msg.message || 'You have been removed by the administrator.';
                this.onConnectionStateChange('kicked');
                break;
            }

            case 'peer_joined': {
                const clientId = msg.client_id || msg.clientId;
                const username = msg.username || 'Peer';
                console.log('[Mesh] Peer joined:', username, clientId);
                this.peerName = username;
                // Notify UI
                if (this.onConnectionStateChange) {
                    this.onConnectionStateChange('peer_joining', { clientId, username });
                }
                
                // Wait for the new peer to send us an offer.
                // The offer case will handle creating the PeerConnection and DataChannel.
                break;
            }

            case 'peer_disconnected': {
                const peerId = msg.peer_id;
                console.log('[Mesh] Peer disconnected:', peerId);
                this._removePeer(peerId);
                // If no peers left → disconnected
                if (this.peers.size === 0) {
                    this.onConnectionStateChange('disconnected');
                } else {
                    this.onConnectionStateChange('peer_left', { clientId: peerId });
                }
                break;
            }

            case 'offer': {
                const senderId = msg.sender;
                const offerPayload = msg.data || {};
                const remoteSdp = offerPayload.sdp || msg.data; // fallback for backwards compatibility
                const remoteUsername = offerPayload.username || '';
                
                console.log('[Mesh] Received offer from', senderId, remoteUsername);
                
                // Create PC for this sender if not exists
                if (!this.peers.has(senderId)) {
                    this._createPeerConnection(senderId, remoteUsername, false);
                } else if (remoteUsername) {
                    // Update username if it was previously empty
                    this.peers.get(senderId).username = remoteUsername;
                }
                
                const peerObj = this.peers.get(senderId);
                await peerObj.pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));

                // Drain queued ICE candidates
                if (peerObj.queuedCandidates && peerObj.queuedCandidates.length > 0) {
                    while (peerObj.queuedCandidates.length > 0) {
                        const cand = peerObj.queuedCandidates.shift();
                        try {
                            await peerObj.pc.addIceCandidate(new RTCIceCandidate(cand));
                        } catch (e) {
                            console.warn('[ICE] Queued candidate error:', e);
                        }
                    }
                }

                const answer = await peerObj.pc.createAnswer();
                await peerObj.pc.setLocalDescription(answer);
                this.sendSignalingMessage('answer', answer, senderId);
                break;
            }

            case 'answer': {
                const senderId = msg.sender;
                console.log('[Mesh] Received answer from', senderId);
                const peerObj = this.peers.get(senderId);
                if (peerObj) {
                    await peerObj.pc.setRemoteDescription(new RTCSessionDescription(msg.data));
                    // Drain queued ICE candidates
                    if (peerObj.queuedCandidates && peerObj.queuedCandidates.length > 0) {
                        while (peerObj.queuedCandidates.length > 0) {
                            const cand = peerObj.queuedCandidates.shift();
                            try {
                                await peerObj.pc.addIceCandidate(new RTCIceCandidate(cand));
                            } catch (e) {
                                console.warn('[ICE] Queued candidate error:', e);
                            }
                        }
                    }
                }
                break;
            }

            case 'candidate': {
                const senderId = msg.sender;
                const peerObj = this.peers.get(senderId);
                if (peerObj && msg.data) {
                    try {
                        if (peerObj.pc.remoteDescription && peerObj.pc.remoteDescription.type) {
                            await peerObj.pc.addIceCandidate(new RTCIceCandidate(msg.data));
                        } else {
                            if (!peerObj.queuedCandidates) peerObj.queuedCandidates = [];
                            peerObj.queuedCandidates.push(msg.data);
                        }
                    } catch (e) {
                        console.warn('[ICE] Candidate error:', e);
                    }
                }
                break;
            }

            case 'call_request':
            case 'call_accepted':
            case 'call_declined':
            case 'call_ended': {
                if (this.onCallSignal) {
                    this.onCallSignal({
                        type: msg.type,
                        sender: msg.sender,
                        data: msg.data || {}
                    });
                }
                break;
            }

            case 'quantum_chat': {
                if (this.onMessage && msg.data) {
                    const chatMsg = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
                    chatMsg._fromPeerId = msg.sender;
                    this.onMessage(chatMsg);
                }
                break;
            }

            case 'admin_broadcast': {
                this.onConnectionStateChange('admin_broadcast', { message: msg.message });
                break;
            }

            case 'host_disconnected': {
                this.onConnectionStateChange('disconnected');
                break;
            }
        }
    }

    // ── Peer Connection Management ─────────────────────────────────────────────

    _createPeerConnection(remotePeerId, remoteUsername, isInitiator = false) {
        const pc = new RTCPeerConnection(this.configuration);
        this.peers.set(remotePeerId, { pc, dc: null, username: remoteUsername });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignalingMessage('candidate', event.candidate, remotePeerId);
            }
        };

        if (isInitiator) {
            const dc = pc.createDataChannel('p2p-chat');
            this._setupDataChannel(dc, remotePeerId);
            this.peers.get(remotePeerId).dc = dc;
            
            pc.createOffer().then(offer => {
                return pc.setLocalDescription(offer).then(() => offer);
            }).then(offer => {
                this.sendSignalingMessage('offer', { sdp: offer, username: this.myUsername }, remotePeerId);
            }).catch(e => console.error('[Mesh] Manual offer error:', e));
        }

        pc.ontrack = (event) => {
            if (this.onTrack && event.streams && event.streams[0]) {
                this.onTrack(event.streams[0], remotePeerId, remoteUsername);
            }
        };

        pc.ondatachannel = (event) => {
            const dc = event.channel;
            this._setupDataChannel(dc, remotePeerId);
            this.peers.get(remotePeerId).dc = dc;
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            console.log(`[Mesh] Peer ${remotePeerId} state: ${state}`);
            if (state === 'connected') {
                this.onConnectionStateChange('connected', { clientId: remotePeerId, username: remoteUsername });
            } else if (state === 'failed' || state === 'closed') {
                this._removePeer(remotePeerId);
                if (this.peers.size === 0) {
                    this.onConnectionStateChange('disconnected');
                } else {
                    this.onConnectionStateChange('peer_left', { clientId: remotePeerId });
                }
            }
        };

        return pc;
    }

    _setupDataChannel(dc, remotePeerId) {
        dc.binaryType = 'arraybuffer';

        dc.onopen = () => {
            console.log(`[DataChannel] Open with ${remotePeerId}`);
            const peerObj = this.peers.get(remotePeerId);
            if (peerObj) {
                this.onConnectionStateChange('connected', {
                    clientId: remotePeerId,
                    username: peerObj.username
                });
            }
        };

        dc.onmessage = (event) => {
            if (typeof event.data === 'string') {
                try {
                    const message = JSON.parse(event.data);
                    message._fromPeerId = remotePeerId;
                    this.onMessage(message);
                } catch (e) {
                    console.error('[DataChannel] JSON parse error:', e);
                }
            } else {
                this.onMessage({ type: 'file_data', data: event.data, _fromPeerId: remotePeerId });
            }
        };

        dc.onclose = () => {
            console.log(`[DataChannel] Closed with ${remotePeerId}`);
        };
    }

    _removePeer(remotePeerId) {
        const peerObj = this.peers.get(remotePeerId);
        if (peerObj) {
            try {
                if (peerObj.dc) peerObj.dc.close();
                peerObj.pc.close();
            } catch (e) { /* ignore */ }
            this.peers.delete(remotePeerId);
            console.log(`[Mesh] Removed peer ${remotePeerId}. Remaining:`, this.peers.size);
        }
    }

    // ── Sending ────────────────────────────────────────────────────────────────

    sendSignalingMessage(type, data, target = null) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, target, data }));
        }
    }

    /**
     * Send a JSON message to ALL connected peers via their data channels.
     * If data channels are not open yet, fallback to signaling room relay.
     */
    send(message) {
        const payload = JSON.stringify(message);
        let sent = 0;
        for (const [peerId, peerObj] of this.peers) {
            if (peerObj.dc && peerObj.dc.readyState === 'open') {
                peerObj.dc.send(payload);
                sent++;
            }
        }
        if (sent === 0) {
            console.warn('[DataChannel] No open channels yet, falling back to Quantum room relay');
            this.sendSignalingMessage('quantum_chat', message);
        }
    }

    /**
     * Alias for send(message) to match app.js caller convention.
     */
    sendData(message) {
        return this.send(message);
    }

    /**
     * Send a call signaling event (call_request, call_accepted, call_declined) to peers.
     */
    sendCallSignal(type, data = {}) {
        this.sendSignalingMessage(type, data);
    }

    /**
     * Attach a local audio or video track to all active peer connections.
     */
    addTrack(track, stream) {
        for (const [, peerObj] of this.peers) {
            try {
                peerObj.pc.addTrack(track, stream);
            } catch (e) {
                console.warn('[Mesh] addTrack error:', e);
            }
        }
    }

    /**
     * Send a JSON message to a specific peer only.
     */
    sendToPeer(peerId, message) {
        const peerObj = this.peers.get(peerId);
        if (peerObj && peerObj.dc && peerObj.dc.readyState === 'open') {
            peerObj.dc.send(JSON.stringify(message));
        } else {
            this.sendSignalingMessage('quantum_chat', message, peerId);
        }
    }

    sendFileMetadata(fileMeta) {
        this.send({ type: 'file_meta', ...fileMeta });
    }

    sendFileData(arrayBuffer) {
        for (const [peerId, peerObj] of this.peers) {
            if (peerObj.dc && peerObj.dc.readyState === 'open') {
                peerObj.dc.send(arrayBuffer);
            }
        }
    }

    /**
     * Slices large video, image, or document files into 64KB chunks and sends with flow control.
     */
    async sendFileChunked(file, { vanish = false, onProgress = null, chunkSize = 64 * 1024 } = {}) {
        const totalChunks = Math.ceil(file.size / chunkSize);
        const transferId = 'xfr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        const isVideo = file.type && file.type.startsWith('video/');
        const isImg = file.type && file.type.startsWith('image/');
        const isAudio = file.type && file.type.startsWith('audio/');
        const msgType = isVideo ? 'video' : (isImg ? 'image' : (isAudio ? 'voice' : 'file'));
        const sizeStr = file.size > 1024 * 1024 
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
            : `${(file.size / 1024).toFixed(1)} KB`;

        const meta = {
            type: 'file_chunk_meta',
            transferId,
            fileName: file.name,
            fileSize: file.size,
            fileSizeStr: sizeStr,
            mimeType: file.type || 'application/octet-stream',
            msgType,
            totalChunks,
            vanish,
            senderName: this.myUsername
        };

        this.sendData(meta);

        let offset = 0;
        const startTime = Date.now();

        for (let i = 0; i < totalChunks; i++) {
            const slice = file.slice(offset, offset + chunkSize);
            const arrayBuffer = await slice.arrayBuffer();

            // Convert to base64 chunk
            let binary = '';
            const bytes = new Uint8Array(arrayBuffer);
            const len = bytes.byteLength;
            for (let b = 0; b < len; b += 8192) {
                binary += String.fromCharCode.apply(null, bytes.subarray(b, Math.min(b + 8192, len)));
            }
            const base64Chunk = btoa(binary);

            // Flow control check across peer DCs
            for (const [, peerObj] of this.peers) {
                if (peerObj.dc && peerObj.dc.readyState === 'open' && peerObj.dc.bufferedAmount > 262144) {
                    await new Promise(res => {
                        const lowHandler = () => {
                            peerObj.dc.removeEventListener('bufferedamountlow', lowHandler);
                            res();
                        };
                        peerObj.dc.addEventListener('bufferedamountlow', lowHandler);
                        setTimeout(res, 80);
                    });
                }
            }

            this.sendData({
                type: 'file_chunk_data',
                transferId,
                chunkIndex: i,
                totalChunks,
                data: base64Chunk
            });

            offset += chunkSize;
            const transferred = Math.min(offset, file.size);
            const pct = Math.round((transferred / file.size) * 100);
            const elapsed = Math.max((Date.now() - startTime) / 1000, 0.05);
            const speedKBps = (transferred / 1024) / elapsed;
            const speedStr = speedKBps > 1024 ? `${(speedKBps / 1024).toFixed(1)} MB/s` : `${Math.round(speedKBps)} KB/s`;

            if (onProgress) {
                onProgress({ transferId, transferred, total: file.size, percent: pct, speed: speedStr, fileName: file.name });
            }
        }

        this.sendData({
            type: 'file_chunk_complete',
            transferId,
            fileName: file.name,
            fileSize: file.size,
            fileSizeStr: sizeStr,
            msgType,
            vanish
        });

        return { transferId, meta };
    }

    /**
     * Get the first open data channel (for bufferedAmount checks during file send).
     */
    get dataChannel() {
        for (const [, peerObj] of this.peers) {
            if (peerObj.dc) return peerObj.dc;
        }
        return null;
    }

    // ── Media (Group Call) ─────────────────────────────────────────────────────

    /**
     * Add a local media stream to ALL peer connections and renegotiate.
     */
    async startMedia(stream, negotiate = true) {
        const offers = [];
        for (const [peerId, peerObj] of this.peers) {
            // Remove old senders first
            peerObj.pc.getSenders().forEach(s => peerObj.pc.removeTrack(s));
            stream.getTracks().forEach(track => peerObj.pc.addTrack(track, stream));
            if (negotiate) {
                const offer = await peerObj.pc.createOffer();
                await peerObj.pc.setLocalDescription(offer);
                this.sendSignalingMessage('offer', { sdp: offer, username: this.myUsername }, peerId);
                offers.push(peerId);
            }
        }
        return offers.length > 0;
    }

    /**
     * Stop all local media tracks and renegotiate.
     */
    async stopMedia() {
        for (const [peerId, peerObj] of this.peers) {
            peerObj.pc.getSenders().forEach(s => {
                if (s.track) s.track.stop();
                peerObj.pc.removeTrack(s);
            });
            const offer = await peerObj.pc.createOffer();
            await peerObj.pc.setLocalDescription(offer);
            this.sendSignalingMessage('offer', { sdp: offer, username: this.myUsername }, peerId);
        }
    }

    // Legacy aliases so existing app.js call sites still work
    async startAudio(stream) { return this.startMedia(stream); }
    async stopAudio(stream) {
        if (stream) stream.getTracks().forEach(t => t.stop());
        return this.stopMedia();
    }
    async startVideo(stream) { return this.startMedia(stream); }
    stopVideo() {
        for (const [, peerObj] of this.peers) {
            peerObj.pc.getSenders().forEach(s => {
                if (s.track) s.track.stop();
                peerObj.pc.removeTrack(s);
            });
        }
    }

    async replaceVideoTrack(newTrack) {
        for (const [peerId, peerObj] of this.peers) {
            const sender = peerObj.pc.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
                await sender.replaceTrack(newTrack);
            } else {
                peerObj.pc.addTrack(newTrack);
                const offer = await peerObj.pc.createOffer();
                await peerObj.pc.setLocalDescription(offer);
                this.sendSignalingMessage('offer', { sdp: offer, username: this.myUsername }, peerId);
            }
        }
    }

    // ── Utility ────────────────────────────────────────────────────────────────

    /**
     * Returns true if at least one data channel is open (legacy compatibility).
     */
    isConnected() {
        for (const [, peerObj] of this.peers) {
            if (peerObj.dc && peerObj.dc.readyState === 'open') return true;
        }
        return false;
    }

    getPeerCount() {
        return this.peers.size;
    }

    getPeerList() {
        return [...this.peers.entries()].map(([id, obj]) => ({
            clientId: id,
            username: obj.username
        }));
    }

    disconnect() {
        for (const [id] of this.peers) {
            this._removePeer(id);
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
