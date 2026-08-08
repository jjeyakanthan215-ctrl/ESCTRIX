// ==========================================================================
// ESCTRIX (Instagram & Telegram Hybrid Redesign) - MAIN FRONTEND ENGINE
// ==========================================================================

let currentActiveChatUser = null;
let currentActiveGroupId = null;

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

    // Toggle panels visibility
    document.querySelectorAll('.ig-tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(tabId);
    if (target) target.classList.remove('hidden');

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
    displayPanel.classList.remove('hidden');

    document.querySelectorAll('.setting-form-pane').forEach(el => el.classList.add('hidden'));
    const targetPane = document.getElementById(optionId);
    if (targetPane) targetPane.classList.remove('hidden');

    // If block list, load it
    if (optionId === 'set-blocklist') {
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
        } else {
            const li = document.createElement('div');
            li.className = 'list-item';
            li.onclick = () => openChat(f);
            li.innerHTML = `
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${f.avatar_index}">
                <div class="list-item-info">
                    <div class="list-item-title">${f.display_name}</div>
                    <div class="list-item-subtitle">@${f.username}</div>
                </div>
                <button class="btn-small btn-secondary">Chat</button>
            `;
            offlineEl.appendChild(li);
        }
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

// --- OPEN CHAT (1-ON-1) ---
async function openChat(friend) {
    currentActiveChatUser = friend.username;
    currentActiveGroupId = null;
    
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
                ticksHTML = '<span class="ticks-read" style="margin-left: 4px; color: var(--success);"><i class="fa-solid fa-check-double"></i></span>';
            } else {
                ticksHTML = '<span class="ticks-sent" style="margin-left: 4px; color: var(--text-muted);"><i class="fa-solid fa-check"></i></span>';
            }
        }
        
        // Reactions rendering
        let reactionsHTML = '';
        if (m.reactions && m.reactions.length > 0) {
            reactionsHTML = `<div class="bubble-reactions" style="display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap;">`;
            m.reactions.forEach(r => {
                reactionsHTML += `<span class="reaction-badge" title="Reacted by @${r.username}" style="background: rgba(255,255,255,0.15); padding: 2px 6px; border-radius: 12px; font-size: 0.8rem; cursor: pointer;">${r.emoji}</span>`;
            });
            reactionsHTML += `</div>`;
        }
        
        div.id = `msg-wrap-${m.id}`;
        div.innerHTML = `
            <div class="message ${isMe ? 'msg-sent' : 'msg-recv'}" style="position: relative;">
                ${activeGroupId && !isMe ? `<span class="msg-sender-name" style="font-weight: 600; font-size: 0.85rem; color: var(--primary-light);">@${m.from}</span><br>` : ''}
                <div class="msg-content-text">${contentHTML}</div>
                <div class="msg-meta-row" style="display: flex; justify-content: flex-end; align-items: center; font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                    ${timerHTML}
                    <span class="msg-time" style="margin-left: 6px;">${new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
            alert('Profile updated successfully!');
            window.location.reload();
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert('Failed to update profile');
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
            alert('Avatar updated successfully!');
            window.location.reload();
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert('Failed to update avatar');
    }
}

async function changePassword(e) {
    e.preventDefault();
    const oldP = document.getElementById('old-password').value;
    const newP = document.getElementById('new-password').value;
    const status = document.getElementById('password-status');
    
    status.innerText = 'Updating...';
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
            document.getElementById('password-form').reset();
        } else {
            status.innerText = data.error;
            status.style.color = 'var(--danger)';
        }
    } catch (err) {
        status.innerText = 'Error connecting to server';
        status.style.color = 'var(--danger)';
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
            alert('User unblocked!');
            loadBlockList();
        } else {
            alert(data.error);
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
        alert('Please specify group name.');
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
            alert('Group created successfully!');
            nameInput.value = '';
            closeCreateGroupModal();
            // Notify WebSocket to join group room dynamically
            sendToServer('JOIN_GROUP', { group_id: data.group_id });
            loadGroupList();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
    }
}

// --- VIEW PARTICIPANT PROFILE POPUP ---
let modalProfileUsername = null;

async function viewChatParticipantProfile() {
    if (!currentActiveChatUser) return;
    viewUserProfile(currentActiveChatUser);
}

async function viewUserProfile(username) {
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
            friendBtn.className = 'btn-modal-action btn-primary';
            
            if (data.is_friend) {
                friendBtn.innerText = 'Friends';
                friendBtn.disabled = true;
                actionWrap.appendChild(friendBtn);
            } else {
                friendBtn.innerText = 'Add Friend';
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
            alert(isUnblockAction ? 'User unblocked!' : 'User blocked successfully!');
            closeUserProfileModal();
            sendToServer('FRIEND_LIST'); // Refresh list
            closeChat();
        } else {
            alert(data.error);
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
                    buttonHTML = `<button class="btn-small btn-secondary" disabled>Sent</button>`;
                } else if (u.status === 'received') {
                    buttonHTML = `<button class="btn-small" onclick="acceptFriendRequest('${u.username}')">Accept</button>`;
                } else if (u.status === 'friends') {
                    buttonHTML = `<button class="btn-small btn-secondary" onclick="viewUserProfile('${u.username}')">Profile</button>`;
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
            alert('Friend request sent!');
            debounceSearch();
        } else {
            alert(data.error);
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
            alert('Friend request accepted!');
            loadPendingRequests();
            sendToServer('FRIEND_LIST');
        } else {
            alert(data.error);
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
            loadPendingRequests();
        } else {
            alert(data.error);
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
        }
    } catch (err) {
        console.error("Error loading pending requests", err);
    }
}

// Restore saved theme on load
const savedTheme = localStorage.getItem('esctrix_theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
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

// --- APP CHAT THEME SELECTOR ---
function changeAppTheme(themeName) {
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
}

// Initial loads
window.addEventListener('DOMContentLoaded', () => {
    loadPendingRequests();
    setInterval(loadPendingRequests, 10000);
});
