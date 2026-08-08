// ==========================================
// Cipher6 Django - WebSocket API Connection
// ==========================================

const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
const SERVER_URL = ws_scheme + '://' + window.location.host + '/ws/chat/';
let ws = null;

const apiEvents = {
    onFriendsList: (friends) => {},
    onFriendStatus: (status) => {},
    onChatMessage: (message) => {},
    onIncomingCall: (callInfo) => {},
    onCallAccepted: (data) => {},
    onCallRejected: (data) => {},
    onWebRTCSignal: (type, data) => {},
    onCallHangup: (data) => {}
};

function connectWebSocket() {
    if (ws) ws.close();
    ws = new WebSocket(SERVER_URL);

    ws.onopen = () => {
        console.log("Connected to Django Channels Server");
        sendToServer('FRIEND_LIST'); // Fetch friends on connect
    };

    ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        handleServerMessage(response);
    };

    ws.onclose = () => {
        console.log("Disconnected. Reconnecting in 3s...");
        setTimeout(connectWebSocket, 3000);
    };
}

function sendToServer(type, data = {}) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: type, data: data }));
}

function handleServerMessage(msg) {
    console.log("Received:", msg.type, msg);
    switch (msg.type) {
        case 'FRIEND_LIST_RESPONSE':
            apiEvents.onFriendsList(msg.data.friends);
            break;
        case 'FRIEND_STATUS':
            apiEvents.onFriendStatus(msg.data);
            break;
        case 'CHAT_MESSAGE':
            apiEvents.onChatMessage(msg.data);
            break;
        case 'GROUP_MESSAGE':
            if (apiEvents.onGroupMessage) apiEvents.onGroupMessage(msg.data);
            break;
        case 'TYPING':
            if (apiEvents.onTyping) apiEvents.onTyping(msg.data);
            break;
        case 'GROUP_TYPING':
            if (apiEvents.onGroupTyping) apiEvents.onGroupTyping(msg.data);
            break;
        case 'READ_RECEIPT':
            if (apiEvents.onReadReceipt) apiEvents.onReadReceipt(msg.data);
            break;
        case 'MESSAGE_REACTION':
            if (apiEvents.onMessageReaction) apiEvents.onMessageReaction(msg.data);
            break;
        case 'GROUP_REACTION':
            if (apiEvents.onGroupReaction) apiEvents.onGroupReaction(msg.data);
            break;
        case 'CHAT_STATUS':
            if (apiEvents.onChatStatus) apiEvents.onChatStatus(msg.data);
            break;
        case 'INCOMING_CALL':
            apiEvents.onIncomingCall(msg.data);
            break;
        case 'CALL_ACCEPTED':
            apiEvents.onCallAccepted(msg.data);
            break;
        case 'CALL_REJECTED':
            apiEvents.onCallRejected(msg.data);
            break;
        case 'OFFER':
        case 'ANSWER':
        case 'ICE_CANDIDATE':
            apiEvents.onWebRTCSignal(msg.type, msg.data);
            break;
        case 'HANG_UP':
            apiEvents.onCallHangup(msg.data);
            break;
    }
}

connectWebSocket();
