// ==========================================================================
// ESCTRIX (Instagram & Telegram Hybrid Redesign) - MAIN FRONTEND ENGINE
// ==========================================================================

let currentActiveChatUser = null;
let currentActiveGroupId = null;
let notifiedRequests = new Set();
let isInitialLoad = true;
let acceptedFriends = [];

let chatMessages = {}; // Local history for 1-on-1: {username: [{from, text, timestamp}]}
let groupMessages = {}; // Local history for groups: {group_id: [{from, text, timestamp}]}

// Retrieve CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

// --- E2EE CRYPTOGRAPHY ---

// Shared key derivation for 1-on-1
async function getSharedKey(peerUsername) {
    const sorted = [CURRENT_USER.username, peerUsername].sort().join(':');
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(sorted + "Cipher6MasterKey!"),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("Cipher6Salt"),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

// Shared key derivation for Groups (dynamic per group)
async function getGroupSharedKey(groupId) {
    const saltString = `ESCTRIX_GROUP_${groupId}_KEY_MATERIAL`;
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(saltString),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("EsctrixGroupSalt"),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

// Helper to encrypt text using AES-GCM
async function encryptData(text, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoded
    );
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode.apply(null, combined));
}

// Helper to decrypt base64 using AES-GCM
async function decryptData(base64Str, key) {
    const binaryStr = atob(base64Str);
    const combined = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        combined[i] = binaryStr.charCodeAt(i);
    }
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
    );
    return new TextDecoder().decode(decrypted);
}

// --- INSTAGRAM LAYOUT & NAVIGATION CONTROLS ---

function switchTab(tabId) {
    // Desktop Nav Items State
    document.querySelectorAll('.ig-nav-item').forEach(btn => btn.classList.remove('active'));
    // Mobile bottom nav items state
    document.querySelectorAll('.mob-nav-item').forEach(btn => btn.classList.remove('active'));

    // Highlight active tab buttons (matches text label or index)
    if (tabId === 'chats-tab') {
        const item = document.querySelector('button[onclick="switchTab(\'chats-tab\')"]');
        if (item) item.classList.add('active');
        const mob = document.querySelector('.mob-nav-item[onclick="switchTab(\'chats-tab\')"]');
        if (mob) mob.classList.add('active');
    } else if (tabId === 'groups-tab') {
        const item = document.querySelector('button[onclick="switchTab(\'groups-tab\')"]');
        if (item) item.classList.add('active');
        const mob = document.querySelector('.mob-nav-item[onclick="switchTab(\'groups-tab\')"]');
        if (mob) mob.classList.add('active');
        loadGroupList();
    } else if (tabId === 'search-tab') {
        const item = document.querySelector('button[onclick="switchTab(\'search-tab\')"]');
        if (item) item.classList.add('active');
        const mob = document.querySelector('.mob-nav-item[onclick="switchTab(\'search-tab\')"]');
        if (mob) mob.classList.add('active');
    } else if (tabId === 'notifications-tab') {
        const item = document.querySelector('button[onclick="switchTab(\'notifications-tab\')"]');
        if (item) item.classList.add('active');
        const mob = document.querySelector('.mob-nav-item[onclick="switchTab(\'notifications-tab\')"]');
        if (mob) mob.classList.add('active');
        loadPendingRequests();
        renderNotificationsTab();
    } else if (tabId === 'settings-tab') {
        const item = document.querySelector('button[onclick="switchTab(\'settings-tab\')"]');
        if (item) item.classList.add('active');
        const mob = document.querySelector('.mob-nav-item[onclick="switchTab(\'settings-tab\')"]');
        if (mob) mob.classList.add('active');
        switchSettingOption('set-avatar');
    } else if (tabId === 'profile-tab') {
        const item = document.querySelector('button[onclick="switchTab(\'profile-tab\')"]');
        if (item) item.classList.add('active');
        const mob = document.querySelector('.mob-nav-item[onclick="switchTab(\'profile-tab\')"]');
        if (mob) mob.classList.add('active');
    }

    // Toggle sub-panel tab content visibility
    document.querySelectorAll('.ig-tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(tabId);
    if (target) target.classList.remove('hidden');

    // Handle main panel display when switching main tabs
    const displayPanel = document.getElementById('settings-display-panel');
    if (tabId !== 'settings-tab') {
        if (displayPanel) {
            displayPanel.classList.add('hidden');
            displayPanel.style.display = 'none';
        }
        if (currentActiveChatUser || currentActiveGroupId) {
            document.getElementById('chat-panel').classList.remove('hidden');
            document.getElementById('chat-placeholder').classList.add('hidden');
        } else {
            document.getElementById('chat-panel').classList.add('hidden');
            document.getElementById('chat-placeholder').classList.remove('hidden');
        }
    }

    // On mobile, show sub-panel and hide main content
    const sub = document.querySelector('.ig-sub-panel');
    if (sub) sub.classList.remove('mobile-hidden');
    const main = document.querySelector('.ig-main-content');
    if (main) main.classList.remove('mobile-active');
}

function switchSettingOption(optionId) {
    // Highlight setting tab button
    document.querySelectorAll('.setting-nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`button[onclick="switchSettingOption('${optionId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Hide chat box, show setting display forms
    document.getElementById('chat-panel').classList.add('hidden');
    document.getElementById('chat-placeholder').classList.add('hidden');
    
    const displayPanel = document.getElementById('settings-display-panel');
    if (displayPanel) {
        displayPanel.classList.remove('hidden');
        displayPanel.style.display = 'block';
    }

    document.querySelectorAll('.setting-form-pane').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
        el.style.display = 'none';
    });
    const targetPane = document.getElementById(optionId);
    if (targetPane) {
        targetPane.classList.remove('hidden');
        targetPane.classList.add('active');
        targetPane.style.display = 'flex';
    }

    // Load dynamic content for setting options
    if (optionId === 'set-avatar') {
        renderAvatarPresetGrid();
    } else if (optionId === 'set-blocklist') {
        loadBlockList();
    } else if (optionId === 'set-help') {
        loadHelpTickets();
    } else if (optionId === 'set-theme') {
        const currentTheme = localStorage.getItem('esctrix_theme') || 'default';
        document.querySelectorAll('.theme-card').forEach(card => {
            card.style.border = '1px solid var(--border-color)';
        });
        const activeCard = document.getElementById(`theme-card-${currentTheme}`);
        if (activeCard) {
            activeCard.style.border = '2px solid var(--accent)';
        }
    }

    // On mobile, transition pane view
    const sub = document.querySelector('.ig-sub-panel');
    if (sub) sub.classList.add('mobile-hidden');
    const main = document.querySelector('.ig-main-content');
    if (main) main.classList.add('mobile-active');
}

function mobileBackToSettingsNav() {
    const sub = document.querySelector('.ig-sub-panel');
    if (sub) sub.classList.remove('mobile-hidden');
    const main = document.querySelector('.ig-main-content');
    if (main) main.classList.remove('mobile-active');
}

// --- LOGOUT ---
async function handleLogout() {
    try {
        await fetch('/api/logout/', {
            method: 'POST',
            headers: {'X-CSRFToken': csrftoken}
        });
        window.location.href = '/auth/';
    } catch (e) {
        console.error(e);
    }
}

// --- CONTACTS RENDERING ---
apiEvents.onFriendsList = (friends) => {
    acceptedFriends = friends;
    const storiesEl = document.getElementById('stories-bar');
    const offlineEl = document.getElementById('feed-offline');
    
    storiesEl.innerHTML = '';
    offlineEl.innerHTML = '';
    
    let onlineCount = 0;
    
    friends.forEach(f => {
        if (f.is_online) {
            onlineCount++;
            const story = document.createElement('div');
            story.className = 'story-circle';
            story.onclick = () => openChat(f);
            story.innerHTML = `
                <div class="story-avatar">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${f.avatar_index}">
                </div>
                <div class="story-name">${f.username}</div>
            `;
            storiesEl.appendChild(story);
        }

        const li = document.createElement('div');
        li.className = 'list-item';
        li.onclick = () => openChat(f);
        
        const statusBadge = f.is_online 
            ? `<span style="font-size:0.65rem; background:rgba(34,197,94,0.15); color:#22c55e; border:1px solid rgba(34,197,94,0.3); padding:2px 8px; border-radius:10px; font-weight:600;">Online</span>`
            : `<span style="font-size:0.65rem; background:rgba(255,255,255,0.05); color:var(--text-secondary); padding:2px 8px; border-radius:10px;">Offline</span>`;

        li.innerHTML = `
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${f.avatar_index}">
            <div class="list-item-info">
                <div class="list-item-title">${f.display_name}</div>
                <div class="list-item-subtitle">@${f.username}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                ${statusBadge}
                <button class="btn-small ${f.is_online ? 'btn-success' : 'btn-secondary'}">Chat</button>
            </div>
        `;
        offlineEl.appendChild(li);
    });

    if (onlineCount === 0) {
        storiesEl.innerHTML = '<p class="empty-placeholder">No friends active now</p>';
    }
};

apiEvents.onFriendStatus = (status) => {
    sendToServer('FRIEND_LIST'); 
};

// --- CHAT WINDOWS MANAGEMENT ---

function closeChat() {
    document.getElementById('chat-panel').classList.add('hidden');
    document.getElementById('settings-display-panel').classList.add('hidden');
    
    const placeholder = document.getElementById('chat-placeholder');
    if (placeholder) placeholder.classList.remove('hidden');

    currentActiveChatUser = null;
    currentActiveGroupId = null;

    // Mobile layout restore
    const sub = document.querySelector('.ig-sub-panel');
    if (sub) sub.classList.remove('mobile-hidden');
    const main = document.querySelector('.ig-main-content');
    if (main) main.classList.remove('mobile-active');
}

// --- TYPING INDICATOR STATE ---
let typingTimeout = null;
let lastTypingSent = 0;

function handleTypingIndicator() {
    const now = Date.now();
    if (now - lastTypingSent > 1000) {
        lastTypingSent = now;
        if (currentActiveChatUser) {
            sendToServer('TYPING', { target_username: currentActiveChatUser, is_typing: true });
        } else if (currentActiveGroupId) {
            sendToServer('TYPING', { group_id: currentActiveGroupId, is_typing: true });
        }
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        if (currentActiveChatUser) {
            sendToServer('TYPING', { target_username: currentActiveChatUser, is_typing: false });
        } else if (currentActiveGroupId) {
            sendToServer('TYPING', { group_id: currentActiveGroupId, is_typing: false });
        }
        lastTypingSent = 0;
    }, 1500);
}

// --- FILE ATTACHMENTS ---
function triggerFileInput() {
    document.getElementById('chat-file-input').click();
}

async function uploadAndSendFile() {
    const fileInput = document.getElementById('chat-file-input');
    if (fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    fileInput.value = ''; // Reset input
    
    // Show uploading placeholder in chat
    const tempMsgId = 'temp_' + Date.now();
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'message msg-sent';
    div.id = tempMsgId;
    div.innerHTML = `Uploading file: ${file.name}...`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/media/upload/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken
            },
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            // Remove temp upload message
            div.remove();
            
            // Format media content
            const mediaContent = `[MEDIA:${data.mime_type}:${data.url}]`;
            
            // Encrypt and send
            if (currentActiveChatUser) {
                const key = await getSharedKey(currentActiveChatUser);
                const base64Encrypted = await encryptData(mediaContent, key);
                
                const expiresSelect = document.getElementById('chat-expires-select');
                const expiresVal = expiresSelect.value;
                
                sendToServer('CHAT_MESSAGE', {
                    target_username: currentActiveChatUser,
                    encrypted_content: base64Encrypted,
                    expires_in: expiresVal || null
                });
                
                // Add locally
                if (!chatMessages[currentActiveChatUser]) chatMessages[currentActiveChatUser] = [];
                const tempId = Date.now();
                chatMessages[currentActiveChatUser].push({
                    id: tempId,
                    from: CURRENT_USER.username,
                    text: mediaContent,
                    timestamp: new Date().toISOString(),
                    is_read: false
                });
                renderChatHistory();
            } else if (currentActiveGroupId) {
                const key = await getGroupSharedKey(currentActiveGroupId);
                const base64Encrypted = await encryptData(mediaContent, key);
                
                sendToServer('GROUP_MESSAGE', {
                    group_id: currentActiveGroupId,
                    encrypted_content: base64Encrypted
                });
                
                if (!groupMessages[currentActiveGroupId]) groupMessages[currentActiveGroupId] = [];
                const tempId = Date.now();
                groupMessages[currentActiveGroupId].push({
                    id: tempId,
                    from: CURRENT_USER.username,
                    text: mediaContent,
                    timestamp: new Date().toISOString()
                });
                renderChatHistory();
            }
        } else {
            div.innerHTML = `Upload failed: ${data.error}`;
            setTimeout(() => div.remove(), 3000);
        }
    } catch (err) {
        console.error(err);
        div.innerHTML = 'Upload failed due to network error';
        setTimeout(() => div.remove(), 3000);
    }
}

// --- REACTIONS ---
async function reactToMessage(messageId, msgType, emoji) {
    if (!messageId) return;
    
    // Save locally
    const msgs = msgType === 'direct' ? chatMessages[currentActiveChatUser] : groupMessages[currentActiveGroupId];
    const msg = msgs.find(m => m.id === messageId);
    if (msg) {
        if (!msg.reactions) msg.reactions = [];
        const existing = msg.reactions.find(r => r.username === CURRENT_USER.username);
        if (existing) {
            existing.emoji = emoji;
        } else {
            msg.reactions.push({ username: CURRENT_USER.username, emoji: emoji });
        }
        renderChatHistory();
    }
    
    // Send to server
    sendToServer('MESSAGE_REACTION', {
        message_id: messageId,
        message_type: msgType,
        emoji: emoji,
        target_username: currentActiveChatUser || null,
        group_id: currentActiveGroupId || null
    });
}

async function openChatByUsername(targetUsername) {
    switchTab('chats-tab');
    let f = acceptedFriends.find(u => u.username === targetUsername);
    if (!f) {
        f = { username: targetUsername, display_name: targetUsername, avatar_index: 0, is_online: true };
    }
    openChat(f);
}

// --- OPEN CHAT (1-ON-1) ---
async function openChat(friend) {
    currentActiveChatUser = friend.username;
    currentActiveGroupId = null;
    
    const callBtns = document.querySelectorAll('.chat-header-actions .btn-call-action');
    callBtns.forEach(b => b.style.display = 'flex');
    
    document.getElementById('session-name').innerText = friend.display_name;
    document.getElementById('session-avatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.avatar_index}`;
    
    const statusEl = document.getElementById('session-status');
    if (friend.is_online) {
        statusEl.innerText = 'Active now';
        statusEl.style.color = 'var(--success)';
    } else {
        statusEl.innerText = 'Offline';
        statusEl.style.color = 'var(--text-secondary)';
    }

    // Reset self-destruct select
    document.getElementById('chat-expires-select').value = '';

    // Fetch history from database
    try {
        const response = await fetch(`/api/chat/history/?target_username=${encodeURIComponent(friend.username)}`);
        const data = await response.json();
        if (data.success) {
            chatMessages[friend.username] = [];
            const key = await getSharedKey(friend.username);
            for (const m of data.messages) {
                try {
                    const text = await decryptData(m.encrypted_content, key);
                    chatMessages[friend.username].push({
                        id: m.id,
                        from: m.from_username,
                        text: text,
                        timestamp: m.timestamp,
                        is_read: m.is_read,
                        expires_at: m.expires_at,
                        reactions: m.reactions
                    });
                } catch (decErr) {
                    console.error("Failed to decrypt history message", decErr);
                }
            }
        }
    } catch (err) {
        console.error("Failed to load chat history", err);
    }

    renderChatHistory();
    
    // Hide placeholders & display panels
    document.getElementById('chat-placeholder').classList.add('hidden');
    document.getElementById('settings-display-panel').classList.add('hidden');
    document.getElementById('chat-panel').classList.remove('hidden');

    // On mobile, show chat full width
    const sub = document.querySelector('.ig-sub-panel');
    if (sub) sub.classList.add('mobile-hidden');
    const main = document.querySelector('.ig-main-content');
    if (main) main.classList.add('mobile-active');
}

// --- RENDER CHAT BUBBLES ---
function renderChatHistory() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    
    const activeUser = currentActiveChatUser;
    const activeGroupId = currentActiveGroupId;
    
    const msgs = activeUser ? (chatMessages[activeUser] || []) : (groupMessages[activeGroupId] || []);
    
    msgs.forEach(m => {
        const isMe = m.from === CURRENT_USER.username;
        const div = document.createElement('div');
        div.className = `message-wrapper ${isMe ? 'msg-sent-wrap' : 'msg-recv-wrap'}`;
        
        // Timer countdown for disappearing messages
        let timerHTML = '';
        if (m.expires_at) {
            const timeRemaining = Math.max(0, Math.floor((new Date(m.expires_at) - new Date()) / 1000));
            if (timeRemaining <= 0) {
                // Expired
                return;
            }
            timerHTML = `<span class="msg-timer" id="timer-${m.id}"><i class="fa-solid fa-clock"></i> ${timeRemaining}s</span>`;
            
            // Schedule DOM removal
            setTimeout(() => {
                const el = document.getElementById(`msg-wrap-${m.id}`);
                if (el) el.remove();
                if (activeUser) {
                    chatMessages[activeUser] = chatMessages[activeUser].filter(item => item.id !== m.id);
                } else if (activeGroupId) {
                    groupMessages[activeGroupId] = groupMessages[activeGroupId].filter(item => item.id !== m.id);
                }
            }, timeRemaining * 1000);
        }
        
        // Parse Media URL vs plain text
        let contentHTML = '';
        if (m.text && m.text.startsWith('[MEDIA:')) {
            const parts = m.text.slice(7, -1).split(':');
            const mime = parts[0];
            const url = parts.slice(1).join(':');
            
            if (mime.startsWith('image/')) {
                contentHTML = `<img src="${url}" class="chat-media-image" onclick="window.open('${url}')" style="max-width: 250px; border-radius: 8px; cursor: pointer;">`;
            } else if (mime.startsWith('video/')) {
                contentHTML = `<video src="${url}" controls class="chat-media-video" style="max-width: 250px; border-radius: 8px;"></video>`;
            } else {
                contentHTML = `<a href="${url}" target="_blank" class="chat-media-file" style="color: var(--primary-light); text-decoration: underline;"><i class="fa-solid fa-file"></i> Download Attachment</a>`;
            }
        } else {
            contentHTML = m.text;
        }
        
        // Read Receipt Ticks (Direct message from Me)
        let ticksHTML = '';
        if (activeUser && isMe && m.id && !m.id.toString().startsWith('temp_')) {
            if (m.is_read) {
                ticksHTML = '<span class="ticks-read" title="Read"><i class="fa-solid fa-check-double"></i></span>';
            } else {
                ticksHTML = '<span class="ticks-sent" title="Sent"><i class="fa-solid fa-check"></i></span>';
            }
        }
        
        // Reactions rendering
        let reactionsHTML = '';
        if (m.reactions && m.reactions.length > 0) {
            reactionsHTML = `<div class="bubble-reactions">`;
            m.reactions.forEach(r => {
                reactionsHTML += `<span class="reaction-badge" title="Reacted by @${r.username}">${r.emoji}</span>`;
            });
            reactionsHTML += `</div>`;
        }
        
        div.id = `msg-wrap-${m.id}`;
        div.innerHTML = `
            <div class="message ${isMe ? 'msg-sent' : 'msg-recv'}">
                ${activeGroupId && !isMe ? `<div class="msg-sender-name">@${m.from}</div>` : ''}
                <div class="msg-content-text">${contentHTML}</div>
                <div class="msg-meta-row">
                    ${timerHTML}
                    <span class="msg-time">${new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    ${ticksHTML}
                </div>
                ${reactionsHTML}
                
                <!-- Emoji Reaction Hover Bar -->
                <div class="hover-reaction-picker">
                    <span onclick="reactToMessage(${m.id}, '${activeUser ? 'direct' : 'group'}', '❤️')">❤️</span>
                    <span onclick="reactToMessage(${m.id}, '${activeUser ? 'direct' : 'group'}', '👍')">👍</span>
                    <span onclick="reactToMessage(${m.id}, '${activeUser ? 'direct' : 'group'}', '😂')">😂</span>
                    <span onclick="reactToMessage(${m.id}, '${activeUser ? 'direct' : 'group'}', '😮')">😮</span>
                    <span onclick="reactToMessage(${m.id}, '${activeUser ? 'direct' : 'group'}', '😢')">😢</span>
                </div>
            </div>
        `;
        
        container.appendChild(div);
        
        // Auto-send read receipt if message is from peer and currently unread
        if (!isMe && activeUser && !m.is_read && m.id && !m.id.toString().startsWith('temp_')) {
            sendToServer('READ_RECEIPT', {
                message_id: m.id,
                message_type: 'direct',
                target_username: activeUser
            });
            m.is_read = true; // Mark read locally
        }
    });
    
    container.scrollTop = container.scrollHeight;
}

// --- SEND MESSAGE ---
async function sendChatMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    input.value = '';

    const expiresSelect = document.getElementById('chat-expires-select');
    const expiresVal = expiresSelect.value;

    if (currentActiveChatUser) {
        const key = await getSharedKey(currentActiveChatUser);
        const base64Encrypted = await encryptData(text, key);
        
        sendToServer('CHAT_MESSAGE', {
            target_username: currentActiveChatUser,
            encrypted_content: base64Encrypted,
            expires_in: expiresVal || null
        });
        
        if (!chatMessages[currentActiveChatUser]) chatMessages[currentActiveChatUser] = [];
        const tempId = 'temp_' + Date.now();
        chatMessages[currentActiveChatUser].push({
            id: tempId,
            from: CURRENT_USER.username,
            text: text,
            timestamp: new Date().toISOString(),
            is_read: false
        });
        renderChatHistory();
        
    } else if (currentActiveGroupId) {
        const key = await getGroupSharedKey(currentActiveGroupId);
        const base64Encrypted = await encryptData(text, key);
        
        sendToServer('GROUP_MESSAGE', {
            group_id: currentActiveGroupId,
            encrypted_content: base64Encrypted,
            expires_in: expiresVal || null
        });
        
        if (!groupMessages[currentActiveGroupId]) groupMessages[currentActiveGroupId] = [];
        const tempId = 'temp_' + Date.now();
        groupMessages[currentActiveGroupId].push({
            id: tempId,
            from: CURRENT_USER.username,
            text: text,
            timestamp: new Date().toISOString()
        });
        renderChatHistory();
    }
}

// --- WEBSOCKET INCOMING CALLBACKS ---

// Incoming Direct Messages
apiEvents.onChatMessage = async (msg) => {
    const sender = msg.from_username;
    const base64 = msg.encrypted_content;
    
    try {
        const key = await getSharedKey(sender);
        const text = await decryptData(base64, key);
        
        if (!chatMessages[sender]) chatMessages[sender] = [];
        chatMessages[sender].push({
            id: msg.id,
            from: sender,
            text: text,
            timestamp: msg.timestamp || new Date().toISOString(),
            is_read: false,
            expires_at: msg.expires_at
        });
        
        if (currentActiveChatUser === sender) {
            renderChatHistory();
        } else {
            playUiSound('received');
            const friendObj = acceptedFriends.find(f => f.username === sender);
            const avatarSeed = friendObj ? friendObj.avatar_index : 0;
            const displayName = friendObj ? friendObj.display_name : sender;
            const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
            
            showToast(displayName, text.length > 50 ? text.substring(0, 48) + '...' : text, 'info', 5000, () => openChatByUsername(sender), avatarUrl);
        }
    } catch (e) {
        console.error("Failed to decrypt message", e);
    }
};

// Incoming Group Messages
apiEvents.onGroupMessage = async (msg) => {
    const groupId = msg.group_id;
    const sender = msg.from_username;
    const base64 = msg.encrypted_content;

    try {
        const key = await getGroupSharedKey(groupId);
        const text = await decryptData(base64, key);

        if (!groupMessages[groupId]) groupMessages[groupId] = [];
        groupMessages[groupId].push({
            id: msg.id,
            from: sender,
            text: text,
            timestamp: msg.timestamp || new Date().toISOString(),
            expires_at: msg.expires_at
        });

        if (currentActiveGroupId === groupId) {
            renderChatHistory();
        }
    } catch (e) {
        console.error("Failed to decrypt group message", e);
    }
};

// Typing Indicators
apiEvents.onTyping = (data) => {
    if (currentActiveChatUser === data.from_username) {
        const statusEl = document.getElementById('session-status');
        if (data.is_typing) {
            statusEl.innerText = 'typing...';
            statusEl.style.color = 'var(--success)';
        } else {
            statusEl.innerText = 'Active now';
            statusEl.style.color = 'var(--success)';
        }
    }
};

apiEvents.onGroupTyping = (data) => {
    if (currentActiveGroupId === data.group_id) {
        const statusEl = document.getElementById('session-status');
        if (data.is_typing) {
            statusEl.innerText = `@${data.from_username} is typing...`;
            statusEl.style.color = 'var(--success)';
        } else {
            statusEl.innerText = 'Group Chat';
            statusEl.style.color = 'var(--text-secondary)';
        }
    }
};

// Read Receipts
apiEvents.onReadReceipt = (data) => {
    const activeUser = currentActiveChatUser;
    if (activeUser && data.reader === activeUser) {
        const msgs = chatMessages[activeUser] || [];
        const msg = msgs.find(m => m.id === data.message_id || (m.id && m.id.toString() === 'temp_' + data.message_id));
        if (msg) {
            msg.is_read = true;
            renderChatHistory();
        } else {
            // Also fallback to search last sent message to mark read
            const lastMsg = msgs.filter(m => m.from === CURRENT_USER.username).pop();
            if (lastMsg) {
                lastMsg.is_read = true;
                renderChatHistory();
            }
        }
    }
};

// Message Reactions (Direct)
apiEvents.onMessageReaction = (data) => {
    const sender = data.from_username;
    if (currentActiveChatUser === sender || sender === CURRENT_USER.username) {
        const msgs = chatMessages[sender] || [];
        const msg = msgs.find(m => m.id === data.message_id);
        if (msg) {
            if (!msg.reactions) msg.reactions = [];
            const existing = msg.reactions.find(r => r.username === sender);
            if (existing) {
                existing.emoji = data.emoji;
            } else {
                msg.reactions.push({ username: sender, emoji: data.emoji });
            }
            renderChatHistory();
        }
    }
};

// Message Reactions (Group)
apiEvents.onGroupReaction = (data) => {
    const groupId = data.group_id;
    if (currentActiveGroupId === groupId) {
        const msgs = groupMessages[groupId] || [];
        const msg = msgs.find(m => m.id === data.message_id);
        if (msg) {
            if (!msg.reactions) msg.reactions = [];
            const existing = msg.reactions.find(r => r.username === data.from_username);
            if (existing) {
                existing.emoji = data.emoji;
            } else {
                msg.reactions.push({ username: data.from_username, emoji: data.emoji });
            }
            renderChatHistory();
        }
    }
};

// Direct message delivery receipt update
apiEvents.onChatStatus = (data) => {
    if (currentActiveChatUser) {
        const msgs = chatMessages[currentActiveChatUser] || [];
        // Replace temp ID with real ID if sent
        const tempMsg = msgs.find(m => m.id === 'temp_' + data.id || m.id.toString().startsWith('temp_'));
        if (tempMsg) {
            tempMsg.id = data.id;
            if (data.status === 'delivered') {
                tempMsg.is_read = false; // Ticks will update
            }
            renderChatHistory();
        }
    }
};

// --- PROFILE EDITS & SETTINGS SUB-FORMS ---

function previewSettingAvatar(val) {
    if (!val) val = 0;
    document.getElementById('setting-avatar-preview').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${val}`;
}

async function updateProfile(e) {
    e.preventDefault();
    const u = document.getElementById('edit-username').value;
    const d = document.getElementById('edit-displayname').value;
    const b = document.getElementById('edit-bio').value;
    const dob = document.getElementById('edit-dob').value;
    
    try {
        const response = await fetch('/api/profile/update/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                username: u,
                display_name: d,
                bio: b,
                date_of_birth: dob || null
            })
        });
        const data = await response.json();
        if (data.success) {
            showToast('Profile Updated', 'Profile updated successfully!', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast('Profile Error', data.error || 'Failed to update profile', 'error');
        }
    } catch (err) {
        showToast('Profile Error', 'Failed to update profile', 'error');
    }
}

async function saveAvatarSeedOnly() {
    const a = document.getElementById('edit-avatar').value;
    try {
        const response = await fetch('/api/profile/update/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ avatar_index: a })
        });
        const data = await response.json();
        if (data.success) {
            CURRENT_USER.avatar_index = a;
            const profilePreview = document.getElementById('profile-avatar-preview');
            if (profilePreview) profilePreview.src = `https://api.dicebear.com/7.x/${currentAvatarStyle}/svg?seed=${a}`;
            showToast('Avatar Saved', 'Your new profile avatar has been saved!', 'success');
            saveNotification('Avatar Updated', 'Your profile avatar has been updated.', 'info', 'fa-image');
        } else {
            showToast('Avatar Error', data.error || 'Failed to update avatar', 'error');
        }
    } catch (err) {
        showToast('Avatar Error', 'Failed to update avatar', 'error');
    }
}

async function changePassword(e) {
    e.preventDefault();
    const oldP = document.getElementById('old-password').value;
    const newP = document.getElementById('new-password').value;
    const confirmP = document.getElementById('confirm-password') ? document.getElementById('confirm-password').value : newP;
    const status = document.getElementById('password-status');
    
    if (newP !== confirmP) {
        status.innerText = 'New passwords do not match.';
        status.style.color = 'var(--danger)';
        showToast('Password Error', 'New passwords do not match.', 'error');
        return;
    }

    if (!newP || newP.length < 8) {
        status.innerText = 'New password must be at least 8 characters long.';
        status.style.color = 'var(--danger)';
        showToast('Password Error', 'New password must be at least 8 characters long.', 'error');
        return;
    }

    status.innerText = 'Updating password...';
    status.style.color = 'var(--text-primary)';
    
    try {
        const response = await fetch('/api/profile/change-password/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({old_password: oldP, new_password: newP})
        });
        const data = await response.json();
        if (data.success) {
            status.innerText = 'Password changed successfully!';
            status.style.color = 'var(--success)';
            showToast('Password Changed', 'Your password was updated successfully!', 'success');
            saveNotification('Password Changed', 'Your account password was updated successfully.', 'security', 'fa-shield-halved');
            document.getElementById('password-form').reset();
        } else {
            status.innerText = data.error || 'Failed to change password.';
            status.style.color = 'var(--danger)';
            showToast('Password Error', data.error || 'Failed to change password.', 'error');
        }
    } catch (err) {
        status.innerText = 'Error connecting to server';
        status.style.color = 'var(--danger)';
        showToast('Network Error', 'Error connecting to server.', 'error');
    }
}

// --- BLOCK LIST APIs ---
async function loadBlockList() {
    const list = document.getElementById('block-list-items');
    list.innerHTML = '<p class="empty-placeholder">Loading block list...</p>';
    try {
        const response = await fetch('/api/block/list/');
        const data = await response.json();
        if (data.success) {
            list.innerHTML = '';
            if (data.blocks.length === 0) {
                list.innerHTML = '<p class="empty-placeholder">No blocked users</p>';
                return;
            }
            data.blocks.forEach(b => {
                const row = document.createElement('div');
                row.className = 'list-item';
                row.innerHTML = `
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${b.avatar_index}">
                    <div class="list-item-info">
                        <div class="list-item-title">${b.display_name}</div>
                        <div class="list-item-subtitle">@${b.username}</div>
                    </div>
                    <button class="btn-small btn-secondary" onclick="unblockUser('${b.username}')">Unblock</button>
                `;
                list.appendChild(row);
            });
        }
    } catch (e) {
        list.innerHTML = '<p class="empty-placeholder text-danger">Error loading block list</p>';
    }
}

async function unblockUser(username) {
    try {
        const response = await fetch('/api/block/remove/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ target_username: username })
        });
        const data = await response.json();
        if (data.success) {
            showToast('Privacy', `User @${username} unblocked!`, 'info');
            loadBlockList();
        } else {
            showToast('Privacy Error', data.error || 'Failed to unblock user', 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

// --- GROUP CHATS MANAGEMENT ---
async function loadGroupList() {
    const list = document.getElementById('group-list');
    list.innerHTML = '<p class="empty-placeholder">Loading groups...</p>';
    try {
        const response = await fetch('/api/group/list/');
        const data = await response.json();
        if (data.success) {
            list.innerHTML = '';
            if (data.groups.length === 0) {
                list.innerHTML = '<p class="empty-placeholder">You belong to no groups</p>';
                return;
            }
            data.groups.forEach(g => {
                const item = document.createElement('div');
                item.className = 'list-item';
                item.onclick = () => openGroupChat(g);
                item.innerHTML = `
                    <div style="background-color: var(--bg-hover); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; margin-right: 12px; border: 1px solid var(--border-color)">
                        <i class="fa-solid fa-users"></i>
                    </div>
                    <div class="list-item-info">
                        <div class="list-item-title">${g.name}</div>
                        <div class="list-item-subtitle">Group Chat Room</div>
                    </div>
                    <button class="btn-small btn-secondary">Enter</button>
                `;
                list.appendChild(item);
            });
        }
    } catch (e) {
        list.innerHTML = '<p class="empty-placeholder text-danger">Error loading groups</p>';
    }
}

async function openGroupChat(group) {
    currentActiveGroupId = group.id;
    currentActiveChatUser = null;

    document.getElementById('session-name').innerText = group.name;
    document.getElementById('session-avatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=group_${group.id}`;
    document.getElementById('session-status').innerText = 'Group Chat';
    document.getElementById('session-status').style.color = 'var(--text-secondary)';

    // Reset self-destruct select
    document.getElementById('chat-expires-select').value = '';

    // Fetch group history from database
    try {
        const response = await fetch(`/api/group/history/?group_id=${group.id}`);
        const data = await response.json();
        if (data.success) {
            groupMessages[group.id] = [];
            const key = await getGroupSharedKey(group.id);
            for (const m of data.messages) {
                try {
                    const text = await decryptData(m.encrypted_content, key);
                    groupMessages[group.id].push({
                        id: m.id,
                        from: m.from_username,
                        text: text,
                        timestamp: m.timestamp,
                        expires_at: m.expires_at,
                        reactions: m.reactions
                    });
                } catch (decErr) {
                    console.error("Failed to decrypt group history message", decErr);
                }
            }
        }
    } catch (err) {
        console.error("Failed to load group history", err);
    }

    renderChatHistory();

    document.getElementById('chat-placeholder').classList.add('hidden');
    document.getElementById('settings-display-panel').classList.add('hidden');
    document.getElementById('chat-panel').classList.remove('hidden');

    // On mobile, show chat full width
    const sub = document.querySelector('.ig-sub-panel');
    if (sub) sub.classList.add('mobile-hidden');
    const main = document.querySelector('.ig-main-content');
    if (main) main.classList.add('mobile-active');
}

// Modal handling
function openCreateGroupModal() {
    // Populate friends checklist
    const list = document.getElementById('group-friends-list');
    list.innerHTML = '<p class="empty-placeholder">Loading friends...</p>';
    
    // We fetch friends lists from server or by reading the UI contacts list elements
    const offlineContacts = document.getElementById('feed-offline').querySelectorAll('.list-item');
    const onlineStories = document.getElementById('stories-bar').querySelectorAll('.story-circle');
    
    list.innerHTML = '';
    let hasFriends = false;

    // Read unique friends currently loaded in UI
    const uniqueUname = new Set();
    const addCheckItem = (uname, dname, avatarIndex) => {
        if (uniqueUname.has(uname)) return;
        uniqueUname.add(uname);
        hasFriends = true;

        const row = document.createElement('label');
        row.className = 'friend-check-item';
        row.innerHTML = `
            <input type="checkbox" name="group-members" value="${uname}">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarIndex}">
            <span>${dname} (@${uname})</span>
        `;
        list.appendChild(row);
    };

    // Parse online
    onlineStories.forEach(el => {
        const name = el.querySelector('.story-name').innerText;
        const src = el.querySelector('img').src;
        const avatarSeed = new URL(src).searchParams.get('seed') || 0;
        addCheckItem(name, name, avatarSeed);
    });

    // Parse offline
    offlineContacts.forEach(el => {
        const dname = el.querySelector('.list-item-title').innerText;
        const sub = el.querySelector('.list-item-subtitle').innerText;
        const uname = sub.split(' ')[0].replace('@', '');
        const src = el.querySelector('img').src;
        const avatarSeed = new URL(src).searchParams.get('seed') || 0;
        addCheckItem(uname, dname, avatarSeed);
    });

    if (!hasFriends) {
        list.innerHTML = '<p class="empty-placeholder">Add friends before forming a group</p>';
    }

    document.getElementById('create-group-modal').classList.remove('hidden');
}

function closeCreateGroupModal() {
    document.getElementById('create-group-modal').classList.add('hidden');
}

async function submitCreateGroup() {
    const nameInput = document.getElementById('new-group-name');
    const name = nameInput.value.trim();
    if (!name) {
        showToast('Group Error', 'Please specify a group name.', 'error');
        return;
    }

    const checkboxes = document.querySelectorAll('input[name="group-members"]:checked');
    const members = Array.from(checkboxes).map(cb => cb.value);

    try {
        const response = await fetch('/api/group/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ name, members })
        });
        const data = await response.json();
        if (data.success) {
            showToast('Group Created', `Group "${name}" created successfully!`, 'success');
            nameInput.value = '';
            closeCreateGroupModal();
            // Notify WebSocket to join group room dynamically
            sendToServer('JOIN_GROUP', { group_id: data.group_id });
            loadGroupList();
        } else {
            showToast('Group Error', data.error, 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

// --- VIEW PARTICIPANT PROFILE POPUP ---
let modalProfileUsername = null;

async function viewChatParticipantProfile() {
    if (currentActiveChatUser) {
        viewUserProfile(currentActiveChatUser);
    } else {
        // ESCTRIX Official Channel Verified Profile Modal
        const avatarEl = document.getElementById('modal-avatar');
        if (avatarEl) {
            avatarEl.src = '/static/img/logo.png?v=5';
            avatarEl.style.objectFit = 'cover';
            avatarEl.style.background = '#000';
            avatarEl.style.padding = '0px';
        }
        document.getElementById('modal-displayname').innerHTML = `ESCTRIX <i class="fa-solid fa-circle-check" style="color:#0066ff;" title="Verified Channel"></i>`;
        document.getElementById('modal-username').innerText = '@esctrix_official';
        document.getElementById('modal-bio').innerText = 'Official ESCTRIX platform channel for security alerts, release notes, and system announcements.';
        document.getElementById('modal-friends-count').innerText = 'Verified';
        document.getElementById('modal-mutual-text').innerText = 'Official Channel';
        document.getElementById('modal-birthday').innerHTML = `<i class="fa-solid fa-shield-halved" style="color:var(--accent);"></i> Platform Verified Service`;

        const blockBtn = document.getElementById('modal-block-btn');
        if (blockBtn) blockBtn.style.display = 'none';

        const actionWrap = document.getElementById('modal-friend-action-btn-wrap');
        if (actionWrap) {
            actionWrap.innerHTML = `
                <button type="button" class="btn-modal-action" style="background: rgba(0,102,255,0.2); border: 1px solid #0066ff; color: #fff; cursor: default;">
                    <i class="fa-solid fa-check"></i> Subscribed Channel
                </button>
            `;
        }
        document.getElementById('user-profile-modal').classList.remove('hidden');
    }
}

async function viewUserProfile(username) {
    const blockBtn = document.getElementById('modal-block-btn');
    if (blockBtn) blockBtn.style.display = 'block';
    modalProfileUsername = username;
    
    // Set loading preview state
    document.getElementById('modal-displayname').innerText = 'Loading...';
    document.getElementById('modal-username').innerText = `@${username}`;
    document.getElementById('modal-bio').innerText = '';
    document.getElementById('modal-birthday').innerHTML = '';
    
    document.getElementById('user-profile-modal').classList.remove('hidden');

    try {
        const response = await fetch(`/api/profile/get/?username=${encodeURIComponent(username)}`);
        const data = await response.json();
        if (data.success) {
            document.getElementById('modal-avatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.avatar_index}`;
            document.getElementById('modal-displayname').innerText = data.user.display_name;
            document.getElementById('modal-bio').innerText = data.user.bio || 'No bio description provided.';
            
            // Stats mock row
            document.getElementById('modal-friends-count').innerText = data.is_friend ? '1' : '0';
            document.getElementById('modal-mutual-text').innerText = data.is_friend ? 'Mutual connection' : 'None';
            
            // Birthday
            if (data.user.date_of_birth) {
                const date = new Date(data.user.date_of_birth);
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                document.getElementById('modal-birthday').innerHTML = `<i class="fa-solid fa-cake-candles"></i> Birthday: ${date.toLocaleDateString('en-US', options)}`;
            } else {
                document.getElementById('modal-birthday').innerHTML = `<i class="fa-solid fa-cake-candles"></i> Birthday: Not updated`;
            }

            // Friend status buttons
            const actionWrap = document.getElementById('modal-friend-action-btn-wrap');
            actionWrap.innerHTML = '';
            const friendBtn = document.createElement('button');
            
            if (data.is_friend) {
                const messageBtn = document.createElement('button');
                messageBtn.innerText = 'Message';
                messageBtn.className = 'btn-modal-action btn-success';
                messageBtn.style.marginRight = '8px';
                messageBtn.onclick = () => {
                    closeUserProfileModal();
                    openChatByUsername(username);
                };
                actionWrap.appendChild(messageBtn);

                friendBtn.innerText = 'Unfriend';
                friendBtn.className = 'btn-modal-action btn-danger';
                friendBtn.onclick = () => {
                    removeFriend(username);
                    closeUserProfileModal();
                };
                actionWrap.appendChild(friendBtn);
            } else if (data.is_request_sent) {
                friendBtn.innerText = 'Cancel Request';
                friendBtn.className = 'btn-modal-action btn-secondary';
                friendBtn.onclick = () => {
                    cancelFriendRequest(username);
                    closeUserProfileModal();
                };
                actionWrap.appendChild(friendBtn);
            } else if (data.is_request_received) {
                friendBtn.innerText = 'Accept Request';
                friendBtn.className = 'btn-modal-action btn-success';
                friendBtn.onclick = () => {
                    acceptFriendRequest(username);
                    closeUserProfileModal();
                };
                actionWrap.appendChild(friendBtn);
            } else {
                friendBtn.innerText = 'Add Friend';
                friendBtn.className = 'btn-modal-action btn-primary';
                friendBtn.onclick = () => {
                    sendFriendRequest(username);
                    closeUserProfileModal();
                };
                actionWrap.appendChild(friendBtn);
            }

            // Block status button
            const blockBtn = document.getElementById('modal-block-btn');
            if (data.is_blocked) {
                blockBtn.innerText = 'Unblock User';
                blockBtn.className = 'btn-modal-action btn-success';
            } else {
                blockBtn.innerText = 'Block User';
                blockBtn.className = 'btn-modal-action btn-danger';
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function closeUserProfileModal() {
    document.getElementById('user-profile-modal').classList.add('hidden');
    modalProfileUsername = null;
}

async function toggleBlockFromProfileModal() {
    if (!modalProfileUsername) return;
    const btn = document.getElementById('modal-block-btn');
    const isUnblockAction = btn.innerText === 'Unblock User';
    
    const url = isUnblockAction ? '/api/block/remove/' : '/api/block/add/';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ target_username: modalProfileUsername })
        });
        const data = await response.json();
        if (data.success) {
            showToast('Privacy', isUnblockAction ? `User @${modalProfileUsername} unblocked!` : `User @${modalProfileUsername} blocked successfully!`, 'info');
            closeUserProfileModal();
            sendToServer('FRIEND_LIST'); // Refresh list
            closeChat();
        } else {
            showToast('Privacy Error', data.error, 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

// --- SOCIAL SEARCH & FRIEND REQUESTS ---
let searchTimeout = null;

function debounceSearch() {
    clearTimeout(searchTimeout);
    const query = document.getElementById('search-input').value.trim();
    searchTimeout = setTimeout(() => {
        searchUsers(query);
    }, 300);
}

async function searchUsers(query) {
    const container = document.getElementById('search-results');
    if (!query) {
        container.innerHTML = '<p class="empty-placeholder">Find friends by username</p>';
        return;
    }
    
    try {
        const response = await fetch(`/api/search/?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
            container.innerHTML = '';
            if (data.results.length === 0) {
                container.innerHTML = '<p class="empty-placeholder">No users found</p>';
                return;
            }
            
            data.results.forEach(u => {
                const div = document.createElement('div');
                div.className = 'list-item';
                
                let buttonHTML = '';
                if (u.status === 'none') {
                    buttonHTML = `<button class="btn-small" onclick="sendFriendRequest('${u.username}')">Add</button>`;
                } else if (u.status === 'sent') {
                    buttonHTML = `<button class="btn-small btn-secondary" onclick="cancelFriendRequest('${u.username}')" title="Cancel Request">Cancel</button>`;
                } else if (u.status === 'received') {
                    buttonHTML = `<button class="btn-small" onclick="acceptFriendRequest('${u.username}')">Accept</button>`;
                } else if (u.status === 'friends') {
                    buttonHTML = `
                        <div style="display:flex; gap:4px;">
                            <button class="btn-small btn-secondary" onclick="viewUserProfile('${u.username}')">Profile</button>
                            <button class="btn-small btn-danger" onclick="removeFriend('${u.username}')" title="Unfriend"><i class="fa-solid fa-user-minus"></i></button>
                        </div>
                    `;
                }
                
                div.innerHTML = `
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${u.avatar_index}" onclick="viewUserProfile('${u.username}')" style="cursor:pointer">
                    <div class="list-item-info" onclick="viewUserProfile('${u.username}')" style="cursor:pointer">
                        <div class="list-item-title">${u.display_name}</div>
                        <div class="list-item-subtitle">@${u.username}</div>
                    </div>
                    ${buttonHTML}
                `;
                container.appendChild(div);
            });
        }
    } catch (err) {
        console.error("Search error", err);
    }
}

async function sendFriendRequest(targetUsername) {
    try {
        const response = await fetch('/api/friend-request/send/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ target_username: targetUsername })
        });
        const data = await response.json();
        if (data.success) {
            showToast('Friend Request', `Friend request sent to @${targetUsername}!`, 'success');
            saveNotification('Friend Request Sent', `Sent a friend request to @${targetUsername}`, 'info', 'fa-paper-plane');
            debounceSearch();
        } else {
            showToast('Friend Request Error', data.error, 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

async function cancelFriendRequest(targetUsername) {
    try {
        const response = await fetch('/api/friend-request/cancel/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ target_username: targetUsername })
        });
        const data = await response.json();
        if (data.success) {
            showToast('Friend Request', `Friend request to @${targetUsername} cancelled.`, 'info');
            saveNotification('Request Cancelled', `Cancelled friend request to @${targetUsername}`, 'info', 'fa-user-xmark');
            debounceSearch();
            sendToServer('FRIEND_LIST');
        } else {
            showToast('Friend Request Error', data.error || 'Failed to cancel request', 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

async function removeFriend(targetUsername) {
    try {
        const response = await fetch('/api/friend/remove/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ target_username: targetUsername })
        });
        const data = await response.json();
        if (data.success) {
            showToast('Friend Removed', `Removed @${targetUsername} from your friends list.`, 'info');
            saveNotification('Friend Removed', `Removed @${targetUsername} from friends list`, 'info', 'fa-user-minus');
            debounceSearch();
            sendToServer('FRIEND_LIST');
            if (currentActiveChatUser === targetUsername) {
                closeChat();
            }
        } else {
            showToast('Friendship Error', data.error || 'Failed to remove friend', 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

async function acceptFriendRequest(senderUsername) {
    try {
        const response = await fetch('/api/friend-request/accept/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ sender_username: senderUsername })
        });
        const data = await response.json();
        if (data.success) {
            showToast('Friend Request', `Friend request from @${senderUsername} accepted!`, 'success');
            saveNotification('Friend Request Accepted', `Accepted friend request from @${senderUsername}`, 'success', 'fa-user-check');
            loadPendingRequests();
            sendToServer('FRIEND_LIST');
        } else {
            showToast('Friend Request Error', data.error, 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

async function declineFriendRequest(senderUsername) {
    try {
        const response = await fetch('/api/friend-request/decline/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ sender_username: senderUsername })
        });
        const data = await response.json();
        if (data.success) {
            showToast('Friend Request', `Friend request from @${senderUsername} declined.`, 'info');
            loadPendingRequests();
        } else {
            showToast('Friend Request Error', data.error, 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadPendingRequests() {
    const listEl = document.getElementById('request-list');
    const badge = document.getElementById('activity-badge');
    if (!listEl) return;
    
    try {
        const response = await fetch('/api/friend-requests/pending/');
        const data = await response.json();
        
        if (data.success) {
            listEl.innerHTML = '';
            
            if (data.requests.length > 0) {
                if (badge) badge.classList.remove('hidden');
            } else {
                if (badge) badge.classList.add('hidden');
                listEl.innerHTML = '<p class="empty-placeholder">No new notifications</p>';
                return;
            }
            
            data.requests.forEach(r => {
                if (!notifiedRequests.has(r.username)) {
                    notifiedRequests.add(r.username);
                    if (!isInitialLoad) {
                        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.avatar_index}`;
                        showToast('New Friend Request', `${r.display_name} (@${r.username}) sent you a friend request!`, 'info', 6000, () => switchTab('notifications-tab'), avatarUrl);
                        playUiSound('received');
                    }
                }

                const div = document.createElement('div');
                div.className = 'list-item';
                div.innerHTML = `
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${r.avatar_index}">
                    <div class="list-item-info">
                        <div class="list-item-title">${r.display_name} sent a friend request</div>
                        <div class="list-item-subtitle">@${r.username}</div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="btn-small" onclick="acceptFriendRequest('${r.username}')">Accept</button>
                        <button class="btn-small btn-secondary" onclick="declineFriendRequest('${r.username}')">Delete</button>
                    </div>
                `;
                listEl.appendChild(div);
            });
            isInitialLoad = false;
        }
    } catch (err) {
        console.error("Error loading pending requests", err);
    }
}



// --- HELP DESK SUPPORT SYSTEM ---
async function submitHelpTicket(e) {
    e.preventDefault();
    const subject = document.getElementById('help-subject').value;
    const message = document.getElementById('help-message').value;
    const statusText = document.getElementById('help-status');

    statusText.innerText = "Submitting ticket...";
    statusText.style.color = "var(--text-secondary)";

    try {
        const response = await fetch('/api/help/submit/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ subject: subject, message: message })
        });
        const data = await response.json();
        if (data.success) {
            statusText.innerText = "Help request submitted successfully!";
            statusText.style.color = "var(--success)";
            showToast('Help & Support', 'Support ticket submitted successfully!', 'success');
            saveNotification('Support Ticket Submitted', `Submitted help request: "${subject}"`, 'info', 'fa-circle-question');
            document.getElementById('help-ticket-form').reset();
            loadHelpTickets();
        } else {
            statusText.innerText = data.error;
            statusText.style.color = "var(--danger)";
        }
    } catch (err) {
        statusText.innerText = "Connection error. Please try again.";
        statusText.style.color = "var(--danger)";
    }
}

async function loadHelpTickets() {
    const listEl = document.getElementById('help-ticket-list');
    listEl.innerHTML = '<p class="empty-placeholder">Loading tickets...</p>';

    try {
        const response = await fetch('/api/help/list/');
        const data = await response.json();
        if (data.success) {
            listEl.innerHTML = '';
            if (data.tickets.length === 0) {
                listEl.innerHTML = '<p class="empty-placeholder">No support tickets submitted yet.</p>';
                return;
            }
            data.tickets.forEach(t => {
                const item = document.createElement('div');
                item.className = 'list-item';
                item.style.padding = '12px';
                item.style.border = '1px solid var(--border-color)';
                item.style.borderRadius = 'var(--radius-sm)';
                item.style.flexDirection = 'column';
                item.style.alignItems = 'flex-start';
                item.style.gap = '4px';
                
                const date = new Date(t.created_at).toLocaleDateString();
                const statusBadgeColor = t.status === 'solved' ? 'var(--success)' : 'var(--accent)';
                
                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; width:100%; font-size:0.8rem; font-weight:600;">
                        <span style="color:var(--text-primary);">${t.subject}</span>
                        <span style="color:${statusBadgeColor}; text-transform:uppercase;">${t.status}</span>
                    </div>
                    <p style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px; word-break:break-all;">${t.message}</p>
                    <span style="font-size:0.7rem; color:var(--text-secondary); opacity:0.7;">Submitted: ${date}</span>
                `;
                listEl.appendChild(item);
            });
        }
    } catch (err) {
        listEl.innerHTML = '<p class="empty-placeholder text-danger">Error loading tickets.</p>';
    }
}

// --- APP CHAT THEME SELECTOR & CUSTOM COLOR PALETTE ---
function changeAppTheme(themeName) {
    // Clear inline custom style overrides
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--accent-hover');
    document.documentElement.style.removeProperty('--text-active');
    document.documentElement.style.removeProperty('--accent-glow');
    document.documentElement.style.removeProperty('--accent-subtle');

    if (themeName === 'default') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('esctrix_theme');
    } else {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('esctrix_theme', themeName);
    }
    
    // Update visual active card borders
    document.querySelectorAll('.theme-card').forEach(card => {
        card.style.border = '1px solid var(--border-color)';
    });
    
    const activeCard = document.getElementById(`theme-card-${themeName}`);
    if (activeCard) {
        activeCard.style.border = '2px solid var(--accent)';
    }

    showToast('Theme Updated', `Theme changed to ${themeName.toUpperCase()}`, 'success');
}

function applyCustomColorTheme(hexColor, silent = false) {
    if (!hexColor || !hexColor.startsWith('#')) return;
    
    document.documentElement.setAttribute('data-theme', 'custom');
    document.documentElement.style.setProperty('--accent', hexColor);
    document.documentElement.style.setProperty('--accent-hover', adjustColorBrightness(hexColor, -15));
    document.documentElement.style.setProperty('--text-active', adjustColorBrightness(hexColor, 25));
    document.documentElement.style.setProperty('--accent-glow', hexToRgba(hexColor, 0.35));
    document.documentElement.style.setProperty('--accent-subtle', hexToRgba(hexColor, 0.15));
    
    localStorage.setItem('esctrix_theme', hexColor);

    // Update UI color picker input and hex text input
    const picker = document.getElementById('custom-color-picker');
    if (picker) picker.value = hexColor;
    
    const dot = document.getElementById('custom-color-preview-dot');
    if (dot) dot.style.background = hexColor;
    
    const hexInput = document.getElementById('custom-hex-input');
    if (hexInput) hexInput.value = hexColor;

    // Reset card highlight borders
    document.querySelectorAll('.theme-card').forEach(card => {
        card.style.border = '1px solid var(--border-color)';
    });

    if (!silent) {
        showToast('Custom Theme', `Theme color updated to ${hexColor.toUpperCase()}`, 'success');
    }
}

function hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustColorBrightness(hex, percent) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let num = parseInt(c, 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = (num >> 8 & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Restore saved theme on load silently
const savedTheme = localStorage.getItem('esctrix_theme');
if (savedTheme) {
    if (savedTheme.startsWith('#')) {
        applyCustomColorTheme(savedTheme, true);
    } else {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

// --- NOTIFICATION STORAGE & ACTIVITY LOG ENGINE ---

function getStoredNotifications() {
    try {
        const key = `esctrix_notifications_${CURRENT_USER.username}`;
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        return [];
    }
}

function saveNotification(title, message, type = 'info', icon = 'fa-bell') {
    try {
        const key = `esctrix_notifications_${CURRENT_USER.username}`;
        const list = getStoredNotifications();
        const item = {
            id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            title,
            message,
            type,
            icon,
            timestamp: new Date().toISOString(),
            read: false
        };
        list.unshift(item);
        if (list.length > 30) list.pop();
        localStorage.setItem(key, JSON.stringify(list));
        
        updateNotificationBadge();
        renderNotificationsTab();
        return item;
    } catch (e) {
        console.error("Error saving notification", e);
    }
}

function clearAllNotifications() {
    const key = `esctrix_notifications_${CURRENT_USER.username}`;
    localStorage.removeItem(key);
    renderNotificationsTab();
    updateNotificationBadge();
    showToast('Notifications', 'Activity log cleared.', 'info');
}

function updateNotificationBadge() {
    const list = getStoredNotifications();
    const unreadCount = list.filter(n => !n.read).length;
    const badge = document.getElementById('activity-badge');
    if (badge) {
        const reqList = document.getElementById('request-list');
        const hasRequests = reqList && reqList.children.length > 0 && !reqList.querySelector('.empty-placeholder');
        if (unreadCount > 0 || hasRequests) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function renderNotificationsTab() {
    const container = document.getElementById('notifications-tab-container');
    if (!container) return;
    
    const list = getStoredNotifications();

    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty-placeholder" style="padding: 20px 10px; text-align: center;">
                <i class="fa-regular fa-bell" style="font-size: 1.5rem; color: var(--text-secondary); opacity: 0.4; margin-bottom: 6px; display: block;"></i>
                <p style="color: var(--text-secondary); font-size: 0.8rem;">No recent account activity</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    list.forEach(n => {
        const row = document.createElement('div');
        row.className = 'list-item';
        row.style.padding = '10px 12px';
        row.style.border = '1px solid var(--border-color)';
        row.style.borderRadius = 'var(--radius-sm)';
        row.style.alignItems = 'flex-start';
        row.style.background = n.read ? 'transparent' : 'rgba(124, 58, 237, 0.08)';
        
        const dateStr = new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
        
        let iconColor = 'var(--accent)';
        if (n.type === 'success') iconColor = 'var(--success)';
        if (n.type === 'error' || n.type === 'danger') iconColor = 'var(--danger)';
        if (n.type === 'security') iconColor = '#ffb700';

        row.innerHTML = `
            <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: ${iconColor}; flex-shrink: 0; margin-right: 10px;">
                <i class="fa-solid ${n.icon}"></i>
            </div>
            <div class="list-item-info" style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 0.82rem; color: var(--text-primary);">${n.title}</strong>
                    <span style="font-size: 0.68rem; color: var(--text-secondary); opacity: 0.7;">${dateStr}</span>
                </div>
                <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">${n.message}</div>
            </div>
        `;
        container.appendChild(row);
    });
}

// Initial loads
window.addEventListener('DOMContentLoaded', () => {
    loadPendingRequests();
    setInterval(loadPendingRequests, 10000);
    renderAvatarPresetGrid();
    
    // Restore theme silently on page load
    const saved = localStorage.getItem('esctrix_theme');
    if (saved && saved.startsWith('#')) {
        applyCustomColorTheme(saved, true);
    }

    // Log session login event once per session
    if (!sessionStorage.getItem('esctrix_login_logged')) {
        sessionStorage.setItem('esctrix_login_logged', '1');
        saveNotification('Session Authenticated', 'Logged in to ESCTRIX session', 'success', 'fa-key');
        
        const officialBadge = document.getElementById('esctrix-official-badge');
        if (officialBadge) officialBadge.classList.remove('hidden');
        
        showToast('Welcome to ESCTRIX', 'Check the ESCTRIX Official channel for platform release updates!', 'info', 5000, () => openEsctrixOfficialChannel());
    }
    
    updateNotificationBadge();
    renderNotificationsTab();
    loadStoriesTray();
});

// --- ANIMATED AVATAR PICKER GALLERY ---
let currentAvatarStyle = 'avataaars';
let selectedAvatarSeed = CURRENT_USER.avatar_index || 0;

function switchAvatarStyle(style, btnEl) {
    currentAvatarStyle = style;
    document.querySelectorAll('.avatar-style-tab').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    renderAvatarPresetGrid();
}

function renderAvatarPresetGrid() {
    const grid = document.getElementById('avatar-preset-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const presetSeeds = [
        0, 101, 205, 312, 450, 520, 615, 789, 892, 999,
        1234, 2500, 3810, 4920, 5555, 6789, 7420, 8888, 9301, 9999
    ];
    
    presetSeeds.forEach(seed => {
        const item = document.createElement('div');
        item.className = `avatar-preset-item ${Number(seed) === Number(selectedAvatarSeed) ? 'selected' : ''}`;
        item.onclick = () => selectAvatarSeed(seed);
        
        item.innerHTML = `
            <img src="https://api.dicebear.com/7.x/${currentAvatarStyle}/svg?seed=${seed}" loading="lazy" alt="Avatar ${seed}">
        `;
        grid.appendChild(item);
    });
}

function selectAvatarSeed(seed) {
    selectedAvatarSeed = seed;
    const inputEl = document.getElementById('edit-avatar');
    if (inputEl) inputEl.value = seed;
    
    const previewEl = document.getElementById('setting-avatar-preview');
    if (previewEl) previewEl.src = `https://api.dicebear.com/7.x/${currentAvatarStyle}/svg?seed=${seed}`;
    
    const labelEl = document.getElementById('current-seed-label');
    if (labelEl) labelEl.innerText = seed;
    
    const profilePreviewEl = document.getElementById('profile-avatar-preview');
    if (profilePreviewEl) profilePreviewEl.src = `https://api.dicebear.com/7.x/${currentAvatarStyle}/svg?seed=${seed}`;
    
    renderAvatarPresetGrid();
}

function randomizeAvatar() {
    const randomSeed = Math.floor(Math.random() * 10000);
    selectAvatarSeed(randomSeed);
    
    const previewImg = document.getElementById('setting-avatar-preview');
    if (previewImg) {
        previewImg.style.transform = 'scale(0.85) rotate(-12deg)';
        setTimeout(() => {
            previewImg.style.transform = 'scale(1) rotate(0deg)';
        }, 220);
    }
}

function scrollAvatarTabs(amount) {
    const container = document.getElementById('avatar-style-tabs');
    if (container) {
        container.scrollBy({ left: amount, behavior: 'smooth' });
    }
}

// --- 1. PWA REGISTRATION & INSTALLATION ---
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/js/sw.js').catch(err => console.log('SW registration failed:', err));
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) installBtn.style.display = 'block';
});

function triggerPwaInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            showToast('PWA Install', 'ESCTRIX app installed successfully!', 'success');
        }
        deferredPrompt = null;
    });
}

// --- 2. UI SOUND SYNTHESIZER ENGINE (Web Audio API) ---
let soundEnabled = localStorage.getItem('esctrix_sound_enabled') !== 'false';

function toggleSoundEffects() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('esctrix_sound_enabled', soundEnabled);
    const btn = document.getElementById('sound-toggle-btn');
    if (btn) {
        btn.innerHTML = soundEnabled ? '<i class="fa-solid fa-volume-high"></i> UI Sound Effects: Enabled' : '<i class="fa-solid fa-volume-xmark"></i> UI Sound Effects: Disabled';
    }
    showToast('Audio Settings', soundEnabled ? 'UI sound effects enabled' : 'UI sound effects muted', 'info');
}

function playUiSound(type) {
    if (!soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === 'sent') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'received') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        }
    } catch (e) {
        // AudioContext silent fallback
    }
}

// --- 3. PASSCODE / PIN LOCK ENGINE ---
let enteredPin = '';

function savePasscodePin() {
    const input = document.getElementById('pin-lock-input');
    const val = input ? input.value.trim() : '';
    if (val.length !== 4 || isNaN(val)) {
        showToast('PIN Error', 'Please enter a valid 4-digit numeric PIN.', 'error');
        return;
    }
    localStorage.setItem(`esctrix_pin_${CURRENT_USER.username}`, btoa(val));
    showToast('Security Updated', '4-Digit Passcode PIN Lock enabled!', 'success');
    saveNotification('Passcode Lock', 'In-App Passcode PIN Lock enabled', 'security', 'fa-lock');
    if (input) input.value = '';
}

function disablePasscodePin() {
    localStorage.removeItem(`esctrix_pin_${CURRENT_USER.username}`);
    showToast('Security Updated', 'Passcode PIN Lock disabled.', 'info');
    saveNotification('Passcode Lock', 'In-App Passcode PIN Lock disabled', 'security', 'fa-lock-open');
}

function checkAutoPinLock() {
    const savedPin = localStorage.getItem(`esctrix_pin_${CURRENT_USER.username}`);
    if (savedPin) {
        const overlay = document.getElementById('pin-lock-overlay');
        if (overlay) overlay.classList.remove('hidden');
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        checkAutoPinLock();
    }
});

function pressPinKey(digit) {
    if (enteredPin.length < 4) {
        enteredPin += digit;
        updatePinDots();
    }
}

function clearPinKey() {
    enteredPin = enteredPin.slice(0, -1);
    updatePinDots();
}

function updatePinDots() {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (dot) {
            dot.classList.toggle('filled', i <= enteredPin.length);
        }
    }
}

function submitPinUnlock() {
    const savedPin = localStorage.getItem(`esctrix_pin_${CURRENT_USER.username}`);
    if (!savedPin) return;
    if (btoa(enteredPin) === savedPin) {
        document.getElementById('pin-lock-overlay').classList.add('hidden');
        enteredPin = '';
        updatePinDots();
        showToast('Unlocked', 'Passcode verified successfully!', 'success');
    } else {
        showToast('Incorrect PIN', 'Passcode incorrect. Try again.', 'error');
        enteredPin = '';
        updatePinDots();
    }
}

// --- 4. 24-HOUR STORIES ENGINE ---
async function loadStoriesTray() {
    const tray = document.getElementById('stories-tray');
    if (!tray) return;
    
    try {
        const response = await fetch('/api/story/list/');
        const data = await response.json();
        
        if (data.success) {
            tray.innerHTML = '';
            if (data.stories.length === 0) {
                tray.innerHTML = '<span style="font-size:0.75rem; color:var(--text-secondary); opacity:0.7;">No active 24h stories</span>';
                return;
            }
            
            data.stories.forEach(s => {
                const item = document.createElement('div');
                item.className = 'story-circle-item';
                item.onclick = () => viewStory(s);
                
                item.innerHTML = `
                    <div class="story-avatar-wrap">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${s.avatar_index}">
                    </div>
                    <span class="story-username">${s.is_self ? 'You' : s.display_name}</span>
                `;
                tray.appendChild(item);
            });
        }
    } catch (e) {
        console.error("Stories load error", e);
    }
}

function openAddStoryModal() {
    document.getElementById('add-story-modal').classList.remove('hidden');
}

function closeAddStoryModal() {
    document.getElementById('add-story-modal').classList.add('hidden');
}

async function submitNewStory() {
    const caption = document.getElementById('story-caption-input').value.trim();
    const fileInput = document.getElementById('story-file-input');
    let mediaData = '';
    let mediaType = 'text';

    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.type.startsWith('video/')) {
            mediaType = 'video';
        } else if (file.type.startsWith('image/')) {
            mediaType = 'image';
        }
        
        mediaData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    const privacy = document.getElementById('story-privacy-select')?.value || 'friends';

    if (!caption && !mediaData) {
        showToast('Story Error', 'Please enter a caption or attach a photo/video.', 'error');
        return;
    }

    try {
        const response = await fetch('/api/story/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ caption, media_data: mediaData, media_type: mediaType, privacy: privacy })
        });
        const data = await response.json();
        if (data.success) {
            showToast('Story Published', data.is_global ? 'Admin Global Story published to all users!' : 'Your 24h status story is live!', 'success');
            saveNotification('Story Published', 'Published a 24-hour status story', 'info', 'fa-circle-plus');
            closeAddStoryModal();
            document.getElementById('story-caption-input').value = '';
            if (fileInput) fileInput.value = '';
            loadStoriesTray();
        } else {
            showToast('Story Error', data.error, 'error');
        }
    } catch (e) {
        console.error(e);
    }
}

function viewStory(s) {
    document.getElementById('story-viewer-name').innerHTML = `${s.display_name} ${s.is_global || s.is_admin ? '<i class="fa-solid fa-circle-check" style="color:#0066ff; font-size:0.78rem;" title="Official Admin Story"></i>' : ''}`;
    document.getElementById('story-viewer-time').innerText = s.created_at;
    document.getElementById('story-viewer-avatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.avatar_index}`;
    document.getElementById('story-viewer-caption').innerText = s.caption || '';

    const imgEl = document.getElementById('story-viewer-image');
    const vidEl = document.getElementById('story-viewer-video');

    if (s.media_type === 'video' && s.media_data) {
        imgEl.style.display = 'none';
        vidEl.src = s.media_data;
        vidEl.style.display = 'block';
    } else if (s.media_type === 'image' && s.media_data) {
        vidEl.style.display = 'none';
        imgEl.src = s.media_data;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
        vidEl.style.display = 'none';
    }

    document.getElementById('story-viewer-modal').classList.remove('hidden');
}

function closeStoryViewer() {
    const vidEl = document.getElementById('story-viewer-video');
    if (vidEl) {
        vidEl.pause();
        vidEl.src = '';
    }
    document.getElementById('story-viewer-modal').classList.add('hidden');
}

async function updateStoryPrivacySetting(privacyVal) {
    try {
        const response = await fetch('/api/story/privacy/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ story_privacy: privacyVal })
        });
        const data = await response.json();
        if (data.success) {
            showToast('Privacy Updated', `24h Story visibility updated to: ${privacyVal}`, 'success');
        }
    } catch (e) {
        console.error(e);
    }
}

// --- 5. VOICE NOTES RECORDER ENGINE ---
let mediaRecorder = null;
let audioChunks = [];
let isRecordingVoice = false;

async function toggleVoiceRecording() {
    const btn = document.getElementById('voice-record-btn');
    if (!isRecordingVoice) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result;
                    sendVoiceNoteMessage(base64Audio);
                };
            };

            mediaRecorder.start();
            isRecordingVoice = true;
            if (btn) btn.classList.add('recording');
            showToast('Voice Note', 'Recording audio... Click mic again to send.', 'info');
        } catch (e) {
            console.error(e);
            showToast('Mic Error', 'Microphone access is required to record voice notes.', 'error');
        }
    } else {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(t => t.stop());
        }
        isRecordingVoice = false;
        if (btn) btn.classList.remove('recording');
    }
}

async function sendVoiceNoteMessage(audioDataUrl) {
    if (!currentActiveChatUser) return;
    const text = `🎤 [Voice Note]`;
    const encrypted = await encryptMessage(text, currentSessionSharedKey);

    const payload = {
        recipient_username: currentActiveChatUser,
        encrypted_content: encrypted,
        expires_in: null,
        media_url: audioDataUrl,
        is_voice_note: true
    };
    sendToServer('SEND_MESSAGE', payload);
    playUiSound('sent');
}

// --- 6. PINNED MESSAGES ENGINE ---
function pinMessage(text) {
    const banner = document.getElementById('pinned-message-banner');
    const textEl = document.getElementById('pinned-message-text');
    if (banner && textEl) {
        textEl.innerText = text;
        banner.classList.remove('hidden');
        showToast('Pinned Message', 'Message pinned to chat header.', 'info');
    }
}

function unpinCurrentMessage() {
    const banner = document.getElementById('pinned-message-banner');
    if (banner) banner.classList.add('hidden');
}

// --- OFFICIAL ESCTRIX CHANNEL UPDATES ---
async function openEsctrixOfficialChannel() {
    currentActiveChatUser = null;
    currentActiveGroupId = null;
    
    // UI panel switching
    document.getElementById('chat-placeholder').classList.add('hidden');
    document.getElementById('chat-panel').classList.remove('hidden');
    
    // Header
    const avatarEl = document.getElementById('session-avatar');
    if (avatarEl) {
        avatarEl.src = '/static/img/logo.png?v=5';
        avatarEl.style.objectFit = 'cover';
        avatarEl.style.background = '#000';
        avatarEl.style.padding = '0px';
    }
    
    document.getElementById('session-name').innerHTML = `ESCTRIX <i class="fa-solid fa-circle-check" style="color:#0066ff; font-size:0.88rem;" title="Official Verified Channel"></i>`;
    document.getElementById('session-status').innerText = 'Official System Updates & Announcements';

    const officialBadge = document.getElementById('esctrix-official-badge');
    if (officialBadge) officialBadge.classList.add('hidden');

    // Hide direct call buttons for system channel
    const callBtns = document.querySelectorAll('.chat-header-actions .btn-call-action');
    callBtns.forEach(b => {
        if (!b.classList.contains('mobile-back-btn')) b.style.display = 'none';
    });

    const msgContainer = document.getElementById('chat-messages');
    msgContainer.innerHTML = '<p class="empty-placeholder">Loading official updates...</p>';

    try {
        const response = await fetch('/api/system/broadcasts/');
        const data = await response.json();
        if (data.success) {
            msgContainer.innerHTML = '';
            if (data.broadcasts.length === 0) {
                msgContainer.innerHTML = '<p class="empty-placeholder">No official announcements yet.</p>';
                return;
            }
            
            data.broadcasts.forEach(b => {
                const bubble = document.createElement('div');
                bubble.className = 'chat-bubble income';
                bubble.style.maxWidth = '85%';
                bubble.style.background = 'linear-gradient(145deg, rgba(20, 22, 32, 0.95), rgba(15, 16, 24, 0.98))';
                bubble.style.border = '1px solid var(--accent-glow)';
                bubble.style.borderRadius = '16px';
                bubble.style.padding = '14px 16px';
                bubble.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';

                bubble.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content:space-between; width:100%; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px; margin-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:28px; height:28px; border-radius:50%; background:#000; padding:2px; border:1px solid var(--accent); display:flex; align-items:center; justify-content:center;">
                                <img src="/static/img/logo.png" style="width:100%; height:100%; border-radius:50%;">
                            </div>
                            <strong style="color:var(--text-primary); font-size:0.88rem; font-weight:700; display:flex; align-items:center; gap:4px;">
                                ${b.title} <i class="fa-solid fa-circle-check" style="color:#0066ff; font-size:0.78rem;"></i>
                            </strong>
                        </div>
                        <span style="font-size:0.7rem; color:var(--text-secondary); opacity:0.8; font-weight:500;">${b.created_at}</span>
                    </div>
                    <div style="font-size:0.86rem; color:var(--text-primary); line-height:1.5; white-space:pre-wrap;">${b.message}</div>
                    <div style="margin-top:10px; display:inline-flex; align-items:center; gap:5px; font-size:0.68rem; background:rgba(124,58,237,0.15); color:var(--accent); border:1px solid var(--accent-subtle); padding:3px 9px; border-radius:12px; font-weight:700; text-transform:uppercase;">
                        <i class="fa-solid fa-bullhorn"></i> ${b.category}
                    </div>
                `;
                msgContainer.appendChild(bubble);
            });
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }
    } catch (err) {
        console.error(err);
        msgContainer.innerHTML = '<p class="empty-placeholder text-danger">Error loading announcements.</p>';
    }
}
