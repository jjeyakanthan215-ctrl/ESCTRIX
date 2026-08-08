// ==========================================
// Cipher6 - WebRTC Calling Logic
// ==========================================

let peerConnection = null;
let localStream = null;
let remoteStream = null;
let currentCallPeer = null;

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
    
    // Show UI
    document.getElementById('call-peer-name').innerText = currentCallPeer;
    document.getElementById('call-status').innerText = 'Calling...';
    callModal.classList.remove('hidden');

    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: type === 'video',
            audio: true
        });
        localVideoEl.srcObject = localStream;
        
        // Request call from server
        sendToServer('CALL_REQUEST', { target_username: currentCallPeer });
    } catch (e) {
        console.error("Media access denied:", e);
        endCall(true);
        alert("Microphone/Camera access required");
    }
}

// 2. Incoming Call from Server
apiEvents.onIncomingCall = (data) => {
    currentCallPeer = data.caller_username;
    document.getElementById('incoming-name').innerText = data.caller_username;
    incomingModal.classList.remove('hidden');
};

function acceptCall() {
    incomingModal.classList.add('hidden');
    
    document.getElementById('call-peer-name').innerText = currentCallPeer;
    document.getElementById('call-status').innerText = 'Connecting...';
    callModal.classList.remove('hidden');

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
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
    document.getElementById('call-status').innerText = 'Connected';
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
    alert(`${data.target_username} rejected the call.`);
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
}

// 4. Handle WebRTC Signaling from Server
apiEvents.onWebRTCSignal = async (type, data) => {
    if (type === 'OFFER') {
        setupPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        sendToServer('ANSWER', {
            target_username: currentCallPeer,
            sdp: answer.sdp
        });
    } 
    else if (type === 'ANSWER') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
    } 
    else if (type === 'ICE_CANDIDATE') {
        if (peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    }
};

// 5. Hang Up
function endCall(isLocal = false) {
    if (!isLocal && currentCallPeer) {
        sendToServer('HANG_UP', { target_username: currentCallPeer });
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
    callModal.classList.add('hidden');
    incomingModal.classList.add('hidden');
}

apiEvents.onCallHangup = (data) => {
    endCall(true); // Remote user hung up
};

window.addEventListener('DOMContentLoaded', initWebRTC);
