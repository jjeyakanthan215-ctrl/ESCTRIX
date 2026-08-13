// ==========================================
// Cipher6 - WebRTC Calling Logic
// ==========================================

let peerConnection = null;
let localStream = null;
let remoteStream = null;
let currentCallPeer = null;
let currentCallType = 'video';
let iceCandidateQueue = [];
let callStartTime = null;
let callTimerInterval = null;

// ── Call History ──────────────────────────────────────
function getCallHistory() {
    try { return JSON.parse(localStorage.getItem('esctrix_call_history') || '[]'); } catch { return []; }
}

function addCallHistoryEntry(peer, type, direction, status, duration = 0) {
    const history = getCallHistory();
    const entry = {
        id: Date.now(),
        peer,
        type,        // 'voice' | 'video'
        direction,   // 'outgoing' | 'incoming'
        status,      // 'connected' | 'missed' | 'declined'
        duration,    // seconds
        ts: new Date().toISOString()
    };
    history.unshift(entry); // newest first
    if (history.length > 100) history.length = 100;
    localStorage.setItem('esctrix_call_history', JSON.stringify(history));
    renderCallHistoryUI();
    showCallsBadge();
}

function showCallsBadge() {
    const badge = document.getElementById('calls-badge');
    if (badge) badge.classList.remove('hidden');
}

function clearCallHistory() {
    localStorage.removeItem('esctrix_call_history');
    renderCallHistoryUI();
    const badge = document.getElementById('calls-badge');
    if (badge) badge.classList.add('hidden');
}

function renderCallHistoryUI() {
    const history = getCallHistory();
    const containers = [
        document.getElementById('call-history-list'),
        document.getElementById('notifications-call-history')
    ];
    containers.forEach(container => {
        if (!container) return;
        container.innerHTML = '';
        if (history.length === 0) {
            container.innerHTML = '<p class="empty-placeholder" style="font-size:0.8rem;">No recent calls</p>';
            return;
        }
        history.slice(0, 30).forEach(entry => {
            const div = document.createElement('div');
            div.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid var(--border-color);';
            const dirIcon = entry.direction === 'outgoing' ? 'fa-arrow-up-right-from-square' : 'fa-arrow-down-left-from-square';
            const dirColor = entry.direction === 'outgoing' ? '#7c3aed' : '#22c55e';
            const statusColor = entry.status === 'connected' ? '#22c55e' : entry.status === 'declined' ? '#ef4444' : '#f59e0b';
            const callIcon = entry.type === 'video' ? 'fa-video' : 'fa-phone';
            const dur = entry.status === 'connected' && entry.duration > 0 ? ` • ${Math.floor(entry.duration/60)}m ${entry.duration%60}s` : '';
            const timeAgo = new Date(entry.ts).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
            div.innerHTML = `
                <i class="fa-solid ${callIcon}" style="color:${dirColor};font-size:0.9rem;width:18px;text-align:center;"></i>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:0.85rem;color:var(--text-primary);">@${entry.peer}</div>
                    <div style="font-size:0.72rem;color:var(--text-secondary);">
                        <i class="fa-solid ${dirIcon}" style="color:${dirColor};margin-right:3px;"></i>
                        ${entry.direction} ${entry.type} call
                        <span style="color:${statusColor};margin-left:4px;">${entry.status}</span>${dur}
                    </div>
                </div>
                <div style="font-size:0.7rem;color:var(--text-secondary);text-align:right;white-space:nowrap;">${timeAgo}</div>
                <button onclick="openChatByUsername('${entry.peer}')" style="background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);color:#a78bfa;border-radius:6px;padding:4px 8px;font-size:0.72rem;cursor:pointer;" title="Open Chat">
                    <i class="fa-regular fa-paper-plane"></i>
                </button>
            `;
            container.appendChild(div);
        });
    });
}

const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// UI Elements (populated in main.js)
let localVideoEl, remoteVideoEl, callModal, incomingModal;

function initWebRTC() {
    localVideoEl = document.getElementById('local-video');
    remoteVideoEl = document.getElementById('remote-video');
    callModal = document.getElementById('call-modal');
    incomingModal = document.getElementById('incoming-call-modal');
}

// 1. Start a call
async function startCall(type) {
    if (!currentActiveChatUser) return;
    currentCallPeer = currentActiveChatUser;
    currentCallType = type;
    
    // Show UI
    document.getElementById('call-peer-name').innerText = currentCallPeer;
    document.getElementById('call-status').innerText = 'Calling...';
    
    const videoGrid = document.getElementById('video-grid');
    const avatarImg = document.getElementById('call-peer-avatar');
    if (type === 'video') {
        videoGrid.classList.remove('hidden');
        avatarImg.classList.add('hidden');
    } else {
        videoGrid.classList.add('hidden');
        avatarImg.classList.remove('hidden');
    }
    
    callModal.classList.remove('hidden');

    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: type === 'video',
            audio: true
        });
        localVideoEl.srcObject = localStream;
        
        // Request call from server
        sendToServer('CALL_REQUEST', { target_username: currentCallPeer, call_type: type });
    } catch (e) {
        console.error("Media access denied:", e);
        endCall(true);
        showToast('Call Error', 'Microphone/Camera access required', 'error');
        addCallHistoryEntry(currentCallPeer, currentCallType, 'outgoing', 'missed');
    }
}

// 2. Incoming Call from Server
apiEvents.onIncomingCall = (data) => {
    if (typeof isUserCallMuted === 'function' && isUserCallMuted(data.caller_username)) {
        console.log(`Incoming call from @${data.caller_username} muted.`);
        try { sendToServer('CALL_REJECT', { caller_username: data.caller_username }); } catch(e){}
        return;
    }
    currentCallPeer = data.caller_username;
    currentCallType = data.call_type || 'video';
    document.getElementById('incoming-name').innerText = data.caller_username;
    
    const incomingText = document.querySelector('#incoming-call-modal p');
    if (incomingText) {
        incomingText.innerText = `Incoming ${currentCallType} call...`;
    }
    
    incomingModal.classList.remove('hidden');
};


function acceptCall() {
    incomingModal.classList.add('hidden');
    
    document.getElementById('call-peer-name').innerText = currentCallPeer;
    document.getElementById('call-status').innerText = 'Connecting...';
    
    const videoGrid = document.getElementById('video-grid');
    const avatarImg = document.getElementById('call-peer-avatar');
    if (currentCallType === 'video') {
        videoGrid.classList.remove('hidden');
        avatarImg.classList.add('hidden');
    } else {
        videoGrid.classList.add('hidden');
        avatarImg.classList.remove('hidden');
    }
    
    callModal.classList.remove('hidden');

    const isVideo = currentCallType === 'video';
    navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true }).then(stream => {
        localStream = stream;
        localVideoEl.srcObject = stream;
        sendToServer('CALL_ACCEPT', { caller_username: currentCallPeer });
    }).catch(e => {
        console.error(e);
        rejectCall();
    });
}

function rejectCall() {
    incomingModal.classList.add('hidden');
    if (currentCallPeer) {
        sendToServer('CALL_REJECT', { caller_username: currentCallPeer });
    }
    currentCallPeer = null;
}

// 3. Setup Peer Connection when accepted
apiEvents.onCallAccepted = async (data) => {
    document.getElementById('call-status').innerText = 'Negotiating...';
    
    setupPeerConnection();
    
    // Caller creates the offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    sendToServer('OFFER', {
        target_username: currentCallPeer,
        sdp: offer.sdp
    });
};

apiEvents.onCallRejected = (data) => {
    showToast('Call Declined', `${data.target_username} rejected the call.`, 'info');
    addCallHistoryEntry(currentCallPeer, currentCallType, 'outgoing', 'declined');
    endCall(true);
};

function setupPeerConnection() {
    peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Add local tracks
    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
        if (!remoteStream) {
            remoteStream = new MediaStream();
            remoteVideoEl.srcObject = remoteStream;
        }
        remoteStream.addTrack(event.track);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            sendToServer('ICE_CANDIDATE', {
                target_username: currentCallPeer,
                candidate: {
                    candidate: event.candidate.candidate,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex
                }
            });
        }
    };

    // Track connection state for robust UI updates
    peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE State:", peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed') {
            document.getElementById('call-status').innerText = 'Connected';
            
            if (!callStartTime) {
                callStartTime = Date.now();
                const timerEl = document.getElementById('call-timer');
                if (timerEl) {
                    timerEl.classList.remove('hidden');
                    timerEl.innerText = '00:00';
                    if (callTimerInterval) clearInterval(callTimerInterval);
                    callTimerInterval = setInterval(() => {
                        const diff = Math.floor((Date.now() - callStartTime) / 1000);
                        const m = String(Math.floor(diff / 60)).padStart(2, '0');
                        const s = String(diff % 60).padStart(2, '0');
                        timerEl.innerText = `${m}:${s}`;
                    }, 1000);
                }
            }
        } else if (peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'failed') {
            endCall(true);
        }
    };
}

// 4. Handle WebRTC Signaling from Server
apiEvents.onWebRTCSignal = async (type, data) => {
    if (type === 'OFFER') {
        setupPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
        
        // Flush early ICE candidates
        while(iceCandidateQueue.length > 0) {
            const candidate = iceCandidateQueue.shift();
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        sendToServer('ANSWER', {
            target_username: currentCallPeer,
            sdp: answer.sdp
        });
    } 
    else if (type === 'ANSWER') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
        
        // Flush early ICE candidates
        while(iceCandidateQueue.length > 0) {
            const candidate = iceCandidateQueue.shift();
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    } 
    else if (type === 'ICE_CANDIDATE') {
        if (peerConnection && peerConnection.remoteDescription) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else {
            iceCandidateQueue.push(data.candidate);
        }
    }
};

// 5. Hang Up
function endCall(isLocal = false) {
    const duration = callStartTime ? Math.round((Date.now() - callStartTime) / 1000) : 0;
    const wasConnected = callStartTime !== null;
    
    if (!isLocal && currentCallPeer) {
        sendToServer('HANG_UP', { target_username: currentCallPeer });
    }
    
    if (wasConnected && currentCallPeer) {
        const direction = isLocal ? 'outgoing' : 'incoming';
        addCallHistoryEntry(currentCallPeer, currentCallType, direction, 'connected', duration);
    }
    
    callStartTime = null;
    if (callTimerInterval) {
        clearInterval(callTimerInterval);
        callTimerInterval = null;
    }
    
    const timerEl = document.getElementById('call-timer');
    if (timerEl) {
        timerEl.classList.add('hidden');
        timerEl.innerText = '00:00';
    }
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        localStream = null;
    }
    
    if (remoteVideoEl) remoteVideoEl.srcObject = null;
    if (localVideoEl) localVideoEl.srcObject = null;
    
    currentCallPeer = null;
    iceCandidateQueue = [];
    callModal.classList.add('hidden');
    incomingModal.classList.add('hidden');
}

apiEvents.onCallHangup = (data) => {
    endCall(true); // Remote user hung up
};

// --- CALL CONTROLS: MUTE, CAMERA, SCREEN SHARE ---
let isMicMuted = false;
let isCameraOff = false;
let isScreenSharing = false;

function toggleMuteMic() {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        isMicMuted = !audioTrack.enabled;
        const btn = document.getElementById('call-btn-mute');
        if (btn) {
            btn.classList.toggle('active', isMicMuted);
            btn.innerHTML = isMicMuted ? '<i class="fa-solid fa-microphone-slash"></i>' : '<i class="fa-solid fa-microphone"></i>';
        }
        showToast('Call Control', isMicMuted ? 'Microphone Muted' : 'Microphone Unmuted', 'info');
    }
}

function toggleVideoCamera() {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        isCameraOff = !videoTrack.enabled;
        const btn = document.getElementById('call-btn-cam');
        if (btn) {
            btn.classList.toggle('active', isCameraOff);
            btn.innerHTML = isCameraOff ? '<i class="fa-solid fa-video-slash"></i>' : '<i class="fa-solid fa-video"></i>';
        }
        showToast('Call Control', isCameraOff ? 'Camera Disabled' : 'Camera Enabled', 'info');
    }
}

async function shareScreenStream() {
    if (!peerConnection) return;
    try {
        if (!isScreenSharing) {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];
            
            const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
                sender.replaceTrack(screenTrack);
            }
            if (localVideoEl) localVideoEl.srcObject = screenStream;
            isScreenSharing = true;
            
            screenTrack.onended = () => {
                stopScreenShare();
            };
            showToast('Screen Share', 'Screen sharing started', 'info');
        } else {
            stopScreenShare();
        }
    } catch (e) {
        console.error("Screen share error", e);
    }
}

function stopScreenShare() {
    if (!peerConnection || !localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
    if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
    }
    if (localVideoEl) localVideoEl.srcObject = localStream;
    isScreenSharing = false;
    showToast('Screen Share', 'Screen sharing stopped', 'info');
}

window.addEventListener('DOMContentLoaded', () => {
    initWebRTC();
    renderCallHistoryUI();
});
