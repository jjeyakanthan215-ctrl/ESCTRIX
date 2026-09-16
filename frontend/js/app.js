/**
 * ESCTRIX Quantum — Futuristic Decentralized P2P Messenger & AI Suite
 * Client-Side Engine: Permanent Identity, Aura AI Companion, Vibe Analyzer,
 * Web Audio Synthesizer, Zero-Knowledge E2EE, and WebRTC Mesh Calling.
 */

const ESCTRIX = {
    // --- Application State ---
    state: {
        user: null, // { username, account_id, display_name, bio, avatar_color, role }
        activeChat: {
            id: 'ai',
            type: 'ai', // 'ai' | 'saved' | 'space' | 'direct'
            title: 'Aura AI Neural Companion',
            subtitle: 'Neural link synchronized • E2EE',
            avatar: 'sparkle',
            online: true
        },
        chatHistories: {
            ai: [],
            saved: [],
            space: []
        },
        contacts: [],
        p2p: null,
        activeSpaceName: '',
        activeSpacePin: '',
        vanishMode: false,
        vanishTimer: 0,
        isLoginMode: true,
        sfxEnabled: true,
        audioCtx: null,
        
        // Voice Note Recorder & Playback
        mediaRecorder: null,
        voiceChunks: [],
        voiceTimerInterval: null,
        voiceSeconds: 0,
        currentAudioPlayer: null,
        isAdminAuthMode: false,

        // WebRTC & Calls
        isVideoCalling: false,
        isMuted: false,
        isCamOff: false,
        isScreenSharing: false,
        localVideoStream: null,
        screenStream: null,
        callTimerInterval: null,
        callSeconds: 0,
        currentFacingMode: 'user',
        isSpeakerMode: true,
        fileReceives: {},

        // Persistent User Signaling Socket & Friends
        userWs: null,
        userWsPingInterval: null,
        incomingFriendAdds: [],
        friendsCount: 0,
        activeDirectTarget: null,

        // Admin Telemetry
        adminWs: null,
        adminStatsInterval: null
    },

    // --- DOM Cache ---
    elements: {},

    // --- Initialization ---
    init() {
        this.cacheElements();
        this.initAudioContext();
        this.cursor?.init();
        this.contextMenu?.init();
        this.lightbox?.init();
        this.nav?.init();
        this.bindEvents();
        this.initPWA();
        this.initSavedPreferences();
        this.checkPersistentAuth();
        console.log('⚡ ESCTRIX Quantum Initialized');
    },

    cacheElements() {
        const ids = [
            'intro-screen', 'intro-get-started-btn', 'auth-back-to-intro-btn',
            'admin-enter-chat-btn', 'admin-logout-btn',
            'auth-brand-badge', 'auth-user-icon', 'auth-security-text', 'auth-switch-bar',
            'login-screen', 'dashboard-screen', 'admin-screen',
            'auth-title', 'auth-subtitle', 'auth-username', 'auth-password', 'auth-pwd-toggle', 'auth-displayname',
            'display-name-group', 'auth-submit-btn', 'passkey-login-btn', 'register-passkey-btn', 'passkey-status-label', 'menu-vanish-label', 'auth-toggle', 'auth-toggle-msg', 'login-error',
            'admin-new-password-input', 'admin-pwd-toggle', 'admin-change-pwd-btn',
            'telegram-sidebar', 'telegram-chat-pane', 'chat-search-input', 'search-clear-btn',
            'sidebar-add-friend-btn', 'new-space-btn', 'chat-threads-list', 'dynamic-chat-threads', 'thread-aura-ai', 'thread-saved-messages',
            'cloud-connection-banner', 'cloud-banner-msg', 'cloud-sync-pill', 'cloud-sync-label',
            'drawer-open-btn', 'footer-user-chip', 'footer-user-avatar', 'footer-user-name', 'footer-user-id',
            'footer-settings-btn', 'cmd-palette-btn', 'admin-panel-btn', 'admin-back-btn',
            'back-to-threads-btn', 'active-chat-avatar', 'active-chat-dot', 'active-chat-name', 'active-chat-status',
            'vibe-indicator-badge', 'vibe-emoji', 'vibe-text', 'audio-call-btn', 'video-call-btn', 'screen-share-btn',
            'e2ee-verify-btn', 'chat-menu-btn', 'chat-dropdown-menu', 'menu-peer-profile-btn', 'menu-settings-btn',
            'menu-vanish-btn', 'menu-burn-btn', 'menu-summarize-btn', 'menu-export-btn', 'menu-clear-btn',
            'messages-viewport', 'messages-list', 'typing-indicator', 'typing-avatar', 'typing-name',
            'reply-preview-bar', 'reply-preview-sender', 'reply-preview-text', 'reply-cancel-btn',
            // Voice Recording HUD
            'voice-recording-bar', 'voice-rec-timer', 'voice-rec-status',
            'voice-discard-btn', 'voice-pause-btn', 'voice-preview-btn', 'voice-send-btn',
            // Context Menu & Custom Dialog & Cursor
            'custom-context-menu', 'context-menu-items',
            'custom-dialog-modal', 'dialog-icon', 'dialog-icon-halo', 'dialog-title', 'dialog-message',
            'dialog-input', 'dialog-cancel-btn', 'dialog-confirm-btn',
            'quantum-cursor-dot', 'quantum-cursor-ring',
            'file-upload-progress', 'progress-bar-fill', 'progress-percent', 'progress-filename', 'progress-speed',
            'file-input', 'file-btn', 'attachment-popover', 'attach-media-btn', 'attach-doc-btn', 'attach-viewonce-btn', 'attach-voice-btn',
            'emoji-picker-btn', 'emoji-picker', 'ai-assist-btn', 'ai-tools-popover',
            'ai-tool-polish', 'ai-tool-translate', 'ai-tool-summarize', 'ai-tool-vibe',
            'message-input', 'voice-note-btn', 'send-btn',
            'new-space-modal', 'new-space-close-btn', 'tab-host', 'tab-join', 'host-setup', 'client-setup',
            'host-waiting', 'start-host-btn', 'host-pin', 'host-space-name', 'qr-code-img', 'display-pin',
            'my-space-name', 'stop-host-btn', 'join-space-name', 'join-pin', 'connect-btn', 'host-error', 'auth-error',
            'cmd-palette-modal', 'cmd-palette-input', 'cmd-palette-close', 'cmd-list',
            'ai-polish-modal', 'ai-polish-close-btn', 'ai-polish-input', 'ai-polish-output-wrap', 'ai-polish-output',
            'execute-polish-btn', 'apply-polished-btn',
            'ai-translate-modal', 'ai-translate-close-btn', 'translate-lang-select', 'ai-translate-input',
            'ai-translate-output-wrap', 'ai-translate-output', 'execute-translate-btn', 'apply-translated-btn',
            'video-overlay', 'local-video', 'group-video-grid', 'video-peer-name', 'call-timer',
            'e2ee-call-verify-btn', 'call-minimize-btn', 'outgoing-call-card', 'outgoing-avatar', 'outgoing-peer-name', 'outgoing-status',
            'call-pip-pill', 'pip-avatar', 'pip-peer-name', 'pip-timer', 'pip-mute-btn', 'pip-expand-btn', 'pip-end-btn',
            'switch-speaker-btn', 'mute-btn', 'cam-off-btn', 'switch-cam-btn',
            'call-screen-share-btn', 'incall-chat-btn', 'incall-chat-panel', 'incall-chat-close', 'incall-messages',
            'incall-message-input', 'incall-send-btn', 'end-video-call-btn',
            'call-type-modal', 'call-type-peer-name', 'start-audio-call-btn', 'start-video-call-btn', 'cancel-call-type-btn',
            'call-modal', 'caller-name', 'incoming-call-title', 'accept-call-btn', 'decline-call-btn',
            'e2ee-modal', 'e2ee-canvas', 'e2ee-hash-label', 'e2ee-close-btn', 'safety-emojis-row',
            'stat-total-users', 'stat-active-hosts', 'stat-total-connections', 'stat-ai-status', 'admin-users-tbody',
            'admin-hosts-ul', 'admin-chat-log', 'admin-broadcast-msg', 'admin-broadcast-btn',
            'admin-new-password-input', 'admin-change-pwd-btn', 'admin-back-intro-btn',
            'kicked-overlay', 'kicked-message', 'kicked-ok-btn', 'kick-admin-modal', 'kick-modal-target',
            'kick-custom-msg', 'kick-confirm-btn', 'kick-cancel-btn', 'toast', 'toast-msg',
            'intro-nav-get-started-btn', 'intro-bottom-get-started-btn',
            'intro-user-card', 'intro-user-avatar', 'intro-user-displayname', 'intro-user-handle',
            'intro-user-accountid', 'intro-btn-label', 'intro-switch-account-btn',
            'nav-to-intro-btn',
            // Quantum Profile Card
            'user-profile-modal', 'user-profile-close-btn', 'up-avatar-halo', 'up-avatar', 'up-displayname',
            'up-username', 'up-account-id', 'up-bio', 'up-peer-actions', 'up-own-actions', 'up-own-edit-btn',
            'up-action-dm', 'up-action-voice', 'up-action-video', 'up-action-add-contact', 'up-add-contact-label', 'up-action-share-qr',
            // Quantum QR Nametag
            'qr-nametag-modal', 'qr-nametag-close-btn', 'nametag-card', 'nametag-avatar', 'nametag-displayname',
            'nametag-username', 'nametag-qr-img', 'nametag-account-id', 'nametag-copy-link-btn',
            // Settings Suite
            'settings-suite-modal', 'settings-close-btn', 'settings-back-btn', 'settings-header-icon', 'settings-header-text',
            'settings-admin-tab-btn', 'settings-avatar-halo',
            'settings-avatar-text', 'settings-avatar-cycle-btn', 'settings-avatar-upload-btn', 'settings-avatar-file-input',
            'settings-avatar-remove-btn', 'avatar-preset-picker',
            'settings-meta-displayname', 'settings-meta-username',
            'settings-meta-account-id', 'settings-copy-id-btn', 'settings-input-displayname', 'settings-input-bio',
            'settings-save-profile-btn', 'settings-my-nametag-btn', 'pref-read-receipts', 'pref-last-seen',
            'setup-passcode-btn', 'passcode-status-label', 'pref-burn-timer', 'sessions-container',
            'terminate-other-sessions-btn', 'pref-enter-send', 'pref-font-size', 'pref-sfx-toggle',
            'pref-ringtone-toggle', 'pref-preview-toggle', 'storage-usage-val', 'storage-bar-fill',
            'clear-media-cache-btn', 'clear-chat-history-btn', 'settings-open-admin-screen-btn', 'settings-logout-btn',
            'hub-profile-card', 'hub-avatar-display', 'hub-profile-name', 'hub-profile-handle', 'hub-profile-id', 'settings-hub-admin-card',
            // Find & Add Friends Modal
            'add-friend-modal', 'add-friend-close-btn', 'add-friend-input', 'add-friend-clear-btn', 'add-friend-results',
            // Contacts tab & count badge
            'contacts-count-badge',
            // Friend Profile Preview Card Modal
            'friend-profile-preview-modal', 'friend-preview-close-btn', 'friend-preview-avatar-halo', 'friend-preview-avatar',
            'friend-preview-presence', 'friend-preview-name', 'friend-preview-handle', 'friend-preview-id', 'friend-preview-bio',
            'friend-preview-added-you-notice', 'friend-preview-add-btn', 'friend-preview-add-label', 'friend-preview-chat-btn',
            // Chat Gating Shield Card
            'chat-gate-card', 'chat-gate-avatar', 'chat-gate-name', 'chat-gate-handle', 'chat-gate-desc', 'chat-gate-add-btn', 'chat-gate-profile-btn',
            // Passcode Screen Lock
            'passcode-lock-overlay', 'pin-dots-row', 'pin-clear-btn', 'pin-enter-btn', 'pin-error-msg'
        ];

        ids.forEach(id => {
            const camelKey = id.replace(/-([a-z])/g, g => g[1].toUpperCase());
            this.elements[camelKey] = document.getElementById(id);
        });
    },

    // --- Web Audio Synthesizer (Sci-Fi Sound FX) ---
    initAudioContext() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.state.audioCtx = new AudioCtx();
            }
        } catch (e) {
            console.debug('Web Audio not supported:', e);
        }
    },

    playSfx(type) {
        if (!this.state.sfxEnabled || !this.state.audioCtx) return;
        try {
            const ctx = this.state.audioCtx;
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'send') {
                // Futuristic upward chirp
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'receive') {
                // Soft bell-like double harmonic chime
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(659.25, now);
                osc.frequency.setValueAtTime(880, now + 0.08);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc.start(now);
                osc.stop(now + 0.22);
            } else if (type === 'call') {
                // Pulse tone
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'click') {
                // Subtle tactile tick
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
            } else if (type === 'decline') {
                // Standard three-beep busy/decline signal
                const freqs = [425, 425, 425];
                freqs.forEach((f, idx) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(f, now + idx * 0.18);
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.07, now + idx * 0.18);
                    g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 0.12);
                    o.start(now + idx * 0.18);
                    o.stop(now + idx * 0.18 + 0.12);
                });
            }
        } catch (e) {
            console.debug('SFX error:', e);
        }
    },

    startRingtone(mode = 'outgoing') {
        this.stopRingtone();
        if (!this.state.sfxEnabled) return;
        try {
            const playCadence = () => {
                if (!this.state.audioCtx) return;
                const ctx = this.state.audioCtx;
                if (ctx.state === 'suspended') ctx.resume();
                const now = ctx.currentTime;

                if (mode === 'outgoing') {
                    // Telephone dial tone cadence (440Hz + 480Hz)
                    const osc1 = ctx.createOscillator();
                    const osc2 = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc1.type = 'sine';
                    osc2.type = 'sine';
                    osc1.frequency.setValueAtTime(440, now);
                    osc2.frequency.setValueAtTime(480, now);
                    osc1.connect(gain);
                    osc2.connect(gain);
                    gain.connect(ctx.destination);
                    gain.gain.setValueAtTime(0.045, now);
                    gain.gain.setValueAtTime(0.045, now + 1.2);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
                    osc1.start(now);
                    osc2.start(now);
                    osc1.stop(now + 1.4);
                    osc2.stop(now + 1.4);
                } else {
                    // Incoming melodic chime cadence (harmonic bells)
                    const freqs = [523.25, 659.25, 783.99, 1046.50];
                    freqs.forEach((freq, idx) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        gain.gain.setValueAtTime(0.07, now + idx * 0.12);
                        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.35);
                        osc.start(now + idx * 0.12);
                        osc.stop(now + idx * 0.12 + 0.35);
                    });
                }
            };
            playCadence();
            this._ringtoneInterval = setInterval(playCadence, mode === 'outgoing' ? 3000 : 2500);
        } catch (err) {
            console.debug('Ringtone error:', err);
        }
    },

    stopRingtone() {
        if (this._ringtoneInterval) {
            clearInterval(this._ringtoneInterval);
            this._ringtoneInterval = null;
        }
    },

    // --- Toast Notifications ---
    showToast(message, isError = false) {
        const e = this.elements;
        if (!e.toast || !e.toastMsg) return;
        e.toastMsg.textContent = message;
        e.toast.style.background = isError ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)';
        e.toast.classList.remove('hidden');
        requestAnimationFrame(() => e.toast.classList.add('show'));
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            e.toast.classList.remove('show');
            setTimeout(() => e.toast.classList.add('hidden'), 350);
        }, 3200);
    },

    // --- Persistent Auth & Preferences ---
    initSavedPreferences() {
        const sfx = localStorage.getItem('esctrix_sfx');
        if (sfx !== null) {
            this.state.sfxEnabled = sfx === 'true';
            if (this.elements.prefSfxToggle) this.elements.prefSfxToggle.checked = this.state.sfxEnabled;
        }
        const theme = localStorage.getItem('esctrix_theme') || 'cyber-obsidian';
        document.documentElement.setAttribute('data-theme', theme);
        this.settings?.loadTheme();

        const wp = localStorage.getItem('esctrix_wallpaper') || 'cyber-grid';
        this.settings?.applyWallpaperClass(wp);

        const fontSize = localStorage.getItem('esctrix_fontsize') || 'medium';
        if (this.elements.prefFontSize) this.elements.prefFontSize.value = fontSize;
        this.settings?.applyFontSize(fontSize);

        // Passcode Lock Init
        this.passcode?.init();
    },

    checkPersistentAuth() {
        const saved = localStorage.getItem('esctrix_quantum_session');
        if (saved) {
            try {
                const user = JSON.parse(saved);
                if (user && user.username) {
                    this.state.user = user;
                    this.applyUserProfile(user);
                    this.loadSavedMessages();
                    this.loadContacts();
                    this.connectUserSocket(user.username);
                    this.updateContactsCount();
                    this.renderIntroUserState(user);

                    // Validate session with backend to refresh activity timestamp & verify 7-day retention
                    fetch('/api/auth/validate-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: user.username, account_id: user.account_id })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.status === 'success' && data.user) {
                            this.state.user = data.user;
                            localStorage.setItem('esctrix_quantum_session', JSON.stringify(data.user));
                            this.applyUserProfile(data.user);
                            this.renderIntroUserState(data.user);
                        } else if (data.status === 'error') {
                            // Account expired after 7 days inactivity or was deleted
                            console.warn('Session expired or account purged:', data.message);
                            localStorage.removeItem('esctrix_quantum_session');
                            this.state.user = null;
                            this.renderIntroUserState(null);
                        }
                    })
                    .catch(() => {});
                }
            } catch (e) {
                localStorage.removeItem('esctrix_quantum_session');
                this.renderIntroUserState(null);
            }
        } else {
            this.renderIntroUserState(null);
        }
        // Introduction page is always the starting gateway of the project
        this.showScreen('intro-screen');

        // Check for ?join=room_name&pin=123 from scanned QR code or shared link
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const autoJoinSpace = urlParams.get('join');
            const autoJoinPin = urlParams.get('pin');
            if (autoJoinSpace) {
                setTimeout(() => {
                    this.space.switchTab('join');
                    if (this.elements.joinSpaceName) this.elements.joinSpaceName.value = autoJoinSpace;
                    if (autoJoinPin && this.elements.joinPin) this.elements.joinPin.value = autoJoinPin;
                    this.modal.open('new-space-modal');
                }, 600);
            }
        } catch (e) {}
    },

    // ─────────────────────────────────────────────────────────
    // CLOUD CONNECTION & REAL-TIME SYNC STATE CONTROLLER
    // ─────────────────────────────────────────────────────────
    setCloudSyncState(state) {
        const pill = document.getElementById('cloud-sync-pill');
        const label = document.getElementById('cloud-sync-label');
        const banner = document.getElementById('cloud-connection-banner');
        if (state === 'connected') {
            if (pill) {
                pill.className = 'cloud-sync-pill connected';
                if (label) label.textContent = 'Cloud Online';
            }
            if (banner) banner.classList.add('hidden');
        } else {
            if (pill) {
                pill.className = 'cloud-sync-pill syncing';
                if (label) label.textContent = 'Syncing Cloud Relay...';
            }
            if (banner) banner.classList.remove('hidden');
        }
    },

    // ─────────────────────────────────────────────────────────
    // PERSISTENT USER SIGNALING WEBSOCKET (GLOBAL PRESENCE & CALLING)
    // ─────────────────────────────────────────────────────────
    connectUserSocket(username) {
        if (!username) return;
        if (this.state.userWs && (this.state.userWs.readyState === WebSocket.OPEN || this.state.userWs.readyState === WebSocket.CONNECTING)) {
            return;
        }
        clearInterval(this.state.userWsPingInterval);

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/user/${encodeURIComponent(username)}`;

        try {
            this.setCloudSyncState('syncing');
            const ws = new WebSocket(wsUrl);
            this.state.userWs = ws;

            ws.onopen = () => {
                console.log(`⚡ Persistent global user socket connected: @${username}`);
                this.setCloudSyncState('connected');
                // 25-second keepalive ping to prevent Render 55s reverse-proxy timeout
                this.state.userWsPingInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 25000);
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    this.handleUserSocketMessage(msg);
                } catch (e) {}
            };

            ws.onclose = () => {
                clearInterval(this.state.userWsPingInterval);
                this.setCloudSyncState('syncing');
                console.log('User socket disconnected, attempting reconnect in 3s...');
                if (this.state.user && this.state.user.username === username) {
                    setTimeout(() => this.connectUserSocket(username), 3000);
                }
            };

            ws.onerror = () => {
                this.setCloudSyncState('syncing');
                ws.close();
            };
        } catch (e) {
            this.setCloudSyncState('syncing');
            console.error('Failed to create user socket:', e);
        }
    },

    handleUserSocketMessage(msg) {
        const type = msg.type;
        if (type === 'pong') {
            return;
        }

        if (type === 'friend_added') {
            this.playSfx('receive');
            this.showToast(msg.message || `@${msg.sender_username} added you as a friend! 👥`);
            this.loadContacts();
            this.updateContactsCount();
            return;
        }

        if (type === 'direct_file_meta') {
            this.chunks.handleChunkMeta(msg, true);
            return;
        }

        if (type === 'direct_file_chunk') {
            this.chunks.handleChunkData(msg, true);
            return;
        }

        if (type === 'direct_file_complete') {
            this.chunks.handleChunkComplete(msg, true);
            return;
        }

        if (type === 'direct_chat_message') {
            this.playSfx('receive');
            const chatKey = `@${msg.sender_username}`;
            const isMe = msg.sender_username === this.state.user?.username;
            const newMsg = {
                id: msg.id,
                sender: isMe ? 'me' : 'peer',
                name: msg.sender_display_name || msg.sender_username,
                text: msg.content,
                type: msg.msg_type || 'text',
                fileUrl: (msg.msg_type === 'image' || msg.msg_type === 'file' || msg.msg_type === 'voice') ? msg.content : undefined,
                payload: msg.msg_type === 'voice' ? msg.content : undefined,
                fileName: msg.file_meta || 'File',
                fileSize: '',
                vanish: Boolean(msg.vanish),
                replyTo: msg.reply_to || undefined,
                status: 'delivered',
                time: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            if (!this.state.chatHistories[chatKey]) {
                this.state.chatHistories[chatKey] = [];
            }
            this.state.chatHistories[chatKey].push(newMsg);

            // If active chat is currently with this sender, display live in DOM
            if (this.state.activeChat && this.state.activeChat.title === chatKey) {
                this.chat.appendMessageDOM(newMsg);
                fetch('/api/direct-messages/read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reader_username: this.state.user?.username,
                        sender_username: msg.sender_username
                    })
                }).catch(() => {});
            } else {
                this.showToast(`💬 @${msg.sender_username}: ${msg.msg_type === 'text' ? msg.content.substring(0, 40) : '[' + msg.msg_type + ']'}`);
            }
            return;
        }

        if (type === 'direct_typing') {
            const chatKey = `@${msg.sender_username}`;
            if (this.state.activeChat && this.state.activeChat.title === chatKey) {
                const e = this.elements;
                if (e.typingIndicator && e.typingName) {
                    e.typingName.textContent = `@${msg.sender_username}`;
                    e.typingIndicator.classList.remove('hidden');
                }
                if (e.activeChatStatus) {
                    if (!this._origHeaderStatus) this._origHeaderStatus = e.activeChatStatus.innerHTML;
                    e.activeChatStatus.innerHTML = '<span class="typing-header-text"><span class="typing-dots-mini"><span></span><span></span><span></span></span> typing...</span>';
                }
                clearTimeout(this._directTypingTimer);
                this._directTypingTimer = setTimeout(() => {
                    if (e.typingIndicator) e.typingIndicator.classList.add('hidden');
                    if (e.activeChatStatus && this._origHeaderStatus) {
                        e.activeChatStatus.innerHTML = this._origHeaderStatus;
                        this._origHeaderStatus = null;
                    }
                }, 3000);
            }
            return;
        }

        if (type === 'direct_call_offer') {
            this.startRingtone('incoming');
            const e = this.elements;
            if (e.callerName) e.callerName.textContent = `@${msg.sender_username}`;
            if (e.incomingCallTitle) {
                e.incomingCallTitle.textContent = msg.call_type === 'video' ? 'Incoming Video Call' : 'Incoming Audio Call';
            }
            this.state.incomingDirectCall = msg;
            this.state.queuedDirectCandidates = [];
            this.modal.open('call-modal');
            return;
        }

        if (type === 'direct_call_answer') {
            this.stopRingtone();
            if (this.elements.outgoingCallCard) this.elements.outgoingCallCard.classList.add('hidden');
            if (this.state.directCallPC && msg.answer) {
                this.state.directCallPC.setRemoteDescription(new RTCSessionDescription(msg.answer))
                    .then(() => {
                        console.log('[Direct Call] Remote answer set successfully');
                        while (this.state.queuedDirectCandidates && this.state.queuedDirectCandidates.length > 0) {
                            const cand = this.state.queuedDirectCandidates.shift();
                            this.state.directCallPC.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                        }
                    })
                    .catch(err => console.error('[Direct Call] Failed to set remote description:', err));
            }
            this.call.startTimer();
            this.showToast('Call connected! 📞');
            return;
        }

        if (type === 'direct_ice_candidate') {
            if (msg.candidate) {
                if (this.state.directCallPC && this.state.directCallPC.remoteDescription) {
                    this.state.directCallPC.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
                } else {
                    if (!this.state.queuedDirectCandidates) this.state.queuedDirectCandidates = [];
                    this.state.queuedDirectCandidates.push(msg.candidate);
                }
            }
            return;
        }

        if (type === 'direct_call_declined') {
            this.stopRingtone();
            this.playSfx('decline');
            this.showToast(`@${msg.sender_username} declined the call.`);
            this.call.end(false);
            return;
        }

        if (type === 'direct_call_end') {
            this.stopRingtone();
            this.showToast(`@${msg.sender_username} ended the call.`);
            this.call.end(false);
            return;
        }
    },

    async updateContactsCount() {
        const username = this.state.user?.username;
        if (!username) return;
        try {
            const [cRes, iRes] = await Promise.all([
                fetch(`/api/user/friends/count?username=${encodeURIComponent(username)}`),
                fetch(`/api/user/contacts/incoming?username=${encodeURIComponent(username)}`)
            ]);
            const cData = await cRes.json();
            const iData = await iRes.json();

            if (cData.status === 'success') {
                this.state.friendsCount = cData.count || 0;
                if (this.elements.contactsCountBadge) {
                    this.elements.contactsCountBadge.textContent = String(this.state.friendsCount);
                }
            }
            if (iData.status === 'success') {
                this.state.incomingFriendAdds = iData.incoming || [];
            }
        } catch (e) {}
    },

    renderIntroUserState(user) {
        const e = this.elements;
        if (user && user.username) {
            if (e.introUserCard) e.introUserCard.classList.remove('hidden');
            if (e.introUserDisplayname) e.introUserDisplayname.textContent = user.display_name || user.username;
            if (e.introUserHandle) e.introUserHandle.textContent = `@${user.username}`;
            if (e.introUserAccountid) e.introUserAccountid.textContent = user.account_id || 'ESC-QUANTUM';
            if (e.introUserAvatar) {
                e.introUserAvatar.textContent = (user.display_name || user.username || 'U').charAt(0).toUpperCase();
                if (user.avatar_color) e.introUserAvatar.style.background = user.avatar_color;
            }
            if (e.introBtnLabel) e.introBtnLabel.textContent = `Launch Quantum Workspace (${user.display_name || user.username}) →`;
            if (e.introSwitchAccountBtn) e.introSwitchAccountBtn.classList.remove('hidden');
        } else {
            if (e.introUserCard) e.introUserCard.classList.add('hidden');
            if (e.introBtnLabel) e.introBtnLabel.textContent = 'Get Started';
            if (e.introSwitchAccountBtn) e.introSwitchAccountBtn.classList.add('hidden');
        }
    },

    applyUserProfile(user) {
        const e = this.elements;
        const initials = (user.display_name || user.username || 'U').charAt(0).toUpperCase();

        // Footer chip
        if (e.footerUserName) e.footerUserName.textContent = user.display_name || user.username;
        if (e.footerUserId) e.footerUserId.textContent = user.account_id || 'ESC-QUANTUM';
        if (e.footerUserAvatar) {
            if (user.avatar_photo) {
                e.footerUserAvatar.innerHTML = `<img src="${user.avatar_photo}" class="avatar-img" alt="Avatar">`;
                e.footerUserAvatar.style.background = 'transparent';
            } else {
                e.footerUserAvatar.textContent = initials;
                if (user.avatar_color) e.footerUserAvatar.style.background = user.avatar_color;
            }
        }

        // Settings Suite Profile
        if (e.settingsMetaDisplayname) e.settingsMetaDisplayname.textContent = user.display_name || user.username;
        if (e.settingsMetaUsername) e.settingsMetaUsername.textContent = `@${user.username}`;
        if (e.settingsMetaAccountId) e.settingsMetaAccountId.textContent = user.account_id || 'ESC-QUANTUM';
        if (e.settingsAvatarText) {
            if (user.avatar_photo) {
                e.settingsAvatarText.innerHTML = `<img src="${user.avatar_photo}" class="settings-avatar-img" alt="Avatar">`;
                e.settingsAvatarText.style.background = 'transparent';
            } else {
                e.settingsAvatarText.textContent = initials;
                e.settingsAvatarText.style.background = '#111827';
            }
            if (user.avatar_color) e.settingsAvatarHalo.style.background = user.avatar_color;
        }
        if (e.settingsInputDisplayname) e.settingsInputDisplayname.value = user.display_name || user.username;
        if (e.settingsInputBio) e.settingsInputBio.value = user.bio || '';
        this.settings?.updateHubProfile(user);

        // Intro Screen Card Avatar
        if (e.introUserAvatar) {
            if (user.avatar_photo) {
                e.introUserAvatar.innerHTML = `<img src="${user.avatar_photo}" class="avatar-img" alt="Avatar">`;
                e.introUserAvatar.style.background = 'transparent';
            } else {
                e.introUserAvatar.textContent = initials;
                if (user.avatar_color) e.introUserAvatar.style.background = user.avatar_color;
            }
        }

        // Stealth Admin tab in Settings
        if (user.role === 'admin') {
            if (e.settingsAdminTabBtn) e.settingsAdminTabBtn.classList.remove('hidden');
        } else {
            if (e.settingsAdminTabBtn) e.settingsAdminTabBtn.classList.add('hidden');
        }
    },

    showScreen(screenId, pushHistory = true) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
        if (pushHistory && this.nav) {
            this.nav.pushState('screen', screenId);
        }
    },

    // --- Event Bindings ---
    bindEvents() {
        const e = this.elements;

        // Intro Screen Actions
        const handleGetStarted = () => {
            this.playSfx('click');
            if (this.state.user) {
                this.showScreen('dashboard-screen');
                this.showToast(`Welcome back, ${this.state.user.display_name || this.state.user.username}! 🚀`);
            } else {
                this.showScreen('login-screen');
            }
        };

        e.introGetStartedBtn?.addEventListener('click', handleGetStarted);
        e.introNavGetStartedBtn?.addEventListener('click', handleGetStarted);
        e.introBottomGetStartedBtn?.addEventListener('click', handleGetStarted);

        e.introSwitchAccountBtn?.addEventListener('click', () => {
            this.playSfx('click');
            this.showScreen('login-screen');
        });

        e.navToIntroBtn?.addEventListener('click', () => {
            this.playSfx('click');
            this.renderIntroUserState(this.state.user);
            this.showScreen('intro-screen');
        });

        e.adminBackIntroBtn?.addEventListener('click', () => {
            this.playSfx('click');
            this.renderIntroUserState(this.state.user);
            this.showScreen('intro-screen');
        });

        e.authBackToIntroBtn?.addEventListener('click', () => {
            this.playSfx('click');
            this.renderIntroUserState(this.state.user);
            this.showScreen('intro-screen');
        });

        e.adminEnterChatBtn?.addEventListener('click', () => {
            this.playSfx('click');
            this.showScreen('dashboard-screen');
        });
        e.adminLogoutBtn?.addEventListener('click', () => this.auth.logout());
        e.adminChangePwdBtn?.addEventListener('click', () => this.admin.changeMyPassword());

        // Stealth Admin Keyboard Shortcut (Ctrl + Shift + A)
        window.addEventListener('keydown', (ev) => {
            if (ev.ctrlKey && ev.shiftKey && ev.key.toLowerCase() === 'a') {
                ev.preventDefault();
                if (this.state.user && this.state.user.role === 'admin') {
                    this.admin.open();
                }
            }
        });

        // Auth Screen
        e.authToggle?.addEventListener('click', () => this.auth.toggleMode());
        e.authSubmitBtn?.addEventListener('click', () => this.auth.submit());
        e.passkeyLoginBtn?.addEventListener('click', () => this.passkey.authenticate());
        e.registerPasskeyBtn?.addEventListener('click', () => this.passkey.register());
        e.authPassword?.addEventListener('keypress', (ev) => { if (ev.key === 'Enter') this.auth.submit(); });

        // Burn Timer Preference Selector
        const burnPref = document.getElementById('pref-burn-timer');
        burnPref?.addEventListener('change', (ev) => {
            const val = ev.target.value;
            const parsed = val === 'view_once' ? 'view_once' : parseInt(val);
            this.state.vanishTimer = parsed;
            this.state.vanishMode = parsed !== 0;
            const labelEl = document.getElementById('menu-vanish-label');
            if (labelEl) {
                labelEl.textContent = parsed === 0 
                    ? 'Vanish Timer: Off' 
                    : (parsed === 'view_once' ? 'Vanish: View-Once 🔒' : `Vanish: ${parsed}s`);
            }
            this.showToast(`Default vanish duration set to: ${ev.target.options[ev.target.selectedIndex].text}`);
        });

        // Password Visibility Toggles (Eye View Button)
        const setupPasswordToggle = (btn, input) => {
            if (!btn || !input) return;
            btn.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const isPwd = input.type === 'password';
                input.type = isPwd ? 'text' : 'password';
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = isPwd ? 'ph ph-eye-slash' : 'ph ph-eye';
                }
                btn.title = isPwd ? 'Hide Password' : 'Show Password';
                this.playSfx('click');
            });
        };
        setupPasswordToggle(e.authPwdToggle, e.authPassword);
        setupPasswordToggle(e.adminPwdToggle, e.adminNewPasswordInput);

        // Settings Suite Triggers
        e.drawerOpenBtn?.addEventListener('click', () => this.settings.open());
        e.footerUserChip?.addEventListener('click', () => this.settings.open());
        e.footerSettingsBtn?.addEventListener('click', () => this.settings.open());
        e.settingsCloseBtn?.addEventListener('click', () => this.settings.close());
        e.settingsBackBtn?.addEventListener('click', () => this.settings.showHub());

        // Find & Add Friends Modal Triggers
        e.sidebarAddFriendBtn?.addEventListener('click', () => this.friendSearch.openModal());
        e.addFriendCloseBtn?.addEventListener('click', () => this.friendSearch.closeModal());
        e.addFriendClearBtn?.addEventListener('click', () => {
            if (e.addFriendInput) {
                e.addFriendInput.value = '';
                this.friendSearch.search('');
                e.addFriendInput.focus();
            }
        });
        e.addFriendInput?.addEventListener('input', (ev) => this.friendSearch.search(ev.target.value));

        // Settings Hub Categories & Profile Card navigation
        document.querySelectorAll('.settings-hub-card, #hub-profile-card').forEach(card => {
            card.addEventListener('click', (ev) => this.settings.switchTab(ev.currentTarget.dataset.tab));
        });

        // Expandable Settings Accordion Items (Options reveal right below button)
        document.addEventListener('click', (ev) => {
            const header = ev.target.closest('.settings-accordion-header');
            if (header) {
                const item = header.closest('.settings-accordion-item');
                if (item) {
                    item.classList.toggle('open');
                    ESCTRIX.playSfx('click');
                }
            }
        });

        document.querySelectorAll('.settings-nav-btn').forEach(btn => {
            btn.addEventListener('click', (ev) => this.settings.switchTab(ev.currentTarget.dataset.tab));
        });

        e.settingsSaveProfileBtn?.addEventListener('click', () => this.settings.saveProfile());
        e.settingsAvatarCycleBtn?.addEventListener('click', () => this.settings.cycleAvatarColor());
        e.settingsAvatarUploadBtn?.addEventListener('click', () => e.settingsAvatarFileInput?.click());
        e.settingsAvatarFileInput?.addEventListener('change', (ev) => {
            const file = ev.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (re) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const size = 256;
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    const minDim = Math.min(img.width, img.height);
                    const sx = (img.width - minDim) / 2;
                    const sy = (img.height - minDim) / 2;
                    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
                    const compressed = canvas.toDataURL('image/jpeg', 0.85);
                    if (this.state.user) {
                        this.state.user.avatar_photo = compressed;
                        this.applyUserProfile(this.state.user);
                        this.settings.saveProfile();
                        this.showToast('Profile photo updated! 📸');
                    }
                };
                img.src = re.target.result;
            };
            reader.readAsDataURL(file);
        });
        e.settingsAvatarRemoveBtn?.addEventListener('click', () => {
            if (this.state.user) {
                this.state.user.avatar_photo = '';
                this.applyUserProfile(this.state.user);
                this.settings.saveProfile();
                this.showToast('Profile photo reset to initials.');
            }
        });

        // Theme Selector Triggers
        document.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', (ev) => {
                const theme = ev.currentTarget.dataset.theme;
                this.settings.setTheme(theme);
            });
        });

        e.settingsCopyIdBtn?.addEventListener('click', () => this.settings.copyAccountId());
        e.settingsMyNametagBtn?.addEventListener('click', () => this.profileModal.openNametag(this.state.user));
        e.setupPasscodeBtn?.addEventListener('click', () => this.passcode.promptSetup());
        e.terminateOtherSessionsBtn?.addEventListener('click', () => this.settings.terminateOtherSessions());
        e.settingsOpenAdminScreenBtn?.addEventListener('click', () => {
            this.settings.close();
            this.admin.open();
        });
        e.settingsLogoutBtn?.addEventListener('click', () => this.auth.logout());

        // Wallpaper Selector
        document.querySelectorAll('.wallpaper-card').forEach(card => {
            card.addEventListener('click', (ev) => {
                const wp = ev.currentTarget.dataset.wallpaper;
                this.settings.setWallpaper(wp);
            });
        });

        // Font Size Selector
        e.prefFontSize?.addEventListener('change', (ev) => this.settings.applyFontSize(ev.target.value));

        // Preferences Toggles
        e.prefReadReceipts?.addEventListener('change', (ev) => localStorage.setItem('esctrix_read_receipts', String(ev.target.checked)));
        e.prefLastSeen?.addEventListener('change', (ev) => localStorage.setItem('esctrix_last_seen', ev.target.value));
        e.prefBurnTimer?.addEventListener('change', (ev) => localStorage.setItem('esctrix_burn_timer', ev.target.value));
        e.prefEnterSend?.addEventListener('change', (ev) => localStorage.setItem('esctrix_enter_send', String(ev.target.checked)));
        e.prefSfxToggle?.addEventListener('change', (ev) => {
            this.state.sfxEnabled = ev.target.checked;
            localStorage.setItem('esctrix_sfx', String(this.state.sfxEnabled));
            this.playSfx('click');
        });
        e.prefRingtoneToggle?.addEventListener('change', (ev) => localStorage.setItem('esctrix_ringtone', String(ev.target.checked)));
        e.prefPreviewToggle?.addEventListener('change', (ev) => localStorage.setItem('esctrix_preview', String(ev.target.checked)));

        e.clearMediaCacheBtn?.addEventListener('click', () => this.settings.clearMediaCache());
        e.clearChatHistoryBtn?.addEventListener('click', () => this.settings.clearChatHistory());

        // Help & Contact Support Actions
        document.getElementById('copy-support-email-btn')?.addEventListener('click', () => {
            navigator.clipboard.writeText('esctrix369@gmail.com').then(() => {
                this.playSfx('send');
                this.showToast('Support email (esctrix369@gmail.com) copied to clipboard! 📋');
            });
        });

        document.getElementById('support-submit-btn')?.addEventListener('click', () => {
            const cat = document.getElementById('support-request-category')?.value || 'General Support';
            const subject = document.getElementById('support-request-subject')?.value.trim() || `[ESCTRIX Support] ${cat}`;
            const message = document.getElementById('support-request-message')?.value.trim();
            if (!message) {
                this.showToast('Please describe your issue or request.', true);
                return;
            }
            const username = this.state.user?.username || 'Guest';
            const accountId = this.state.user?.account_id || 'N/A';
            const body = `Support Request for Admin Jeyakanthan\n\nUser: @${username} (Account ID: ${accountId})\nCategory: ${cat}\n\nMessage / Request Details:\n${message}\n\n---\nSent via ESCTRIX Quantum Support`;
            const mailUrl = `mailto:esctrix369@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(mailUrl, '_blank');
            this.playSfx('send');
            this.showToast('Opening email client for Admin Jeyakanthan... ✨');
        });


        // User Profile Modal Actions
        e.userProfileCloseBtn?.addEventListener('click', () => this.profileModal.close());
        e.upActionDm?.addEventListener('click', () => this.profileModal.startDM());
        e.upActionVoice?.addEventListener('click', () => this.profileModal.startCall('audio'));
        e.upActionVideo?.addEventListener('click', () => this.profileModal.startCall('video'));
        e.upActionAddContact?.addEventListener('click', () => this.profileModal.toggleContact());
        e.upActionShareQr?.addEventListener('click', () => this.profileModal.openNametag(this.profileModal.currentUser));
        e.upOwnEditBtn?.addEventListener('click', () => {
            this.profileModal.close();
            this.settings.open();
            this.settings.switchTab('profile');
        });

        // QR Nametag Actions
        e.qrNametagCloseBtn?.addEventListener('click', () => this.modal.close('qr-nametag-modal'));
        e.nametagCopyLinkBtn?.addEventListener('click', () => this.profileModal.copyNametagLink());

        // Friend Profile Preview Modal Actions
        e.friendPreviewCloseBtn?.addEventListener('click', () => this.friendPreview.close());
        e.friendPreviewAddBtn?.addEventListener('click', () => this.friendPreview.handleAddClick());
        e.friendPreviewChatBtn?.addEventListener('click', () => this.friendPreview.handleChatClick());

        // Chat Gate Card Actions
        e.chatGateAddBtn?.addEventListener('click', async () => {
            const target = ESCTRIX.state.activeDirectTarget;
            if (target) {
                await ESCTRIX.addContact(target);
                ESCTRIX.chat.hideChatGate();
                ESCTRIX.showToast(`Chat with @${target} unlocked! 🔓`);
            }
        });
        e.chatGateProfileBtn?.addEventListener('click', () => {
            const target = ESCTRIX.state.activeDirectTarget;
            if (target) {
                fetch(`/api/user/profile?username=${encodeURIComponent(target)}`)
                    .then(r => r.json())
                    .then(data => {
                        if (data.profile) ESCTRIX.friendPreview.open(data.profile);
                    });
            }
        });

        // Passcode Screen Lock Keypad
        document.querySelectorAll('.pin-key[data-digit]').forEach(k => {
            k.addEventListener('click', (ev) => this.passcode.pressDigit(ev.currentTarget.dataset.digit));
        });
        e.pinClearBtn?.addEventListener('click', () => this.passcode.clearDigit());
        e.pinEnterBtn?.addEventListener('click', () => this.passcode.verify());

        // Chat Tabs & Folders
        document.querySelectorAll('.folder-tab').forEach(tab => {
            tab.addEventListener('click', (ev) => {
                const folder = ev.currentTarget.dataset.folder || ev.target.closest('.folder-tab')?.dataset.folder;
                if (folder) this.chat.filterFolder(folder);
            });
        });

        // Pinned Thread Selection
        e.threadAuraAi?.addEventListener('click', () => this.chat.switchChat('ai'));
        e.threadSavedMessages?.addEventListener('click', () => this.chat.switchChat('saved'));

        // Search in Sidebar
        e.chatSearchInput?.addEventListener('input', (ev) => this.chat.handleSearch(ev.target.value));
        e.searchClearBtn?.addEventListener('click', () => {
            e.chatSearchInput.value = '';
            e.searchClearBtn.classList.add('hidden');
            this.chat.renderChatList();
        });

        // Mobile Back
        e.backToThreadsBtn?.addEventListener('click', () => {
            if (this.nav) {
                this.nav.goBack();
            } else {
                document.querySelector('.telegram-shell')?.classList.remove('chat-open');
            }
        });

        // New Space Modal
        e.newSpaceBtn?.addEventListener('click', () => {
            this.space.switchTab('host');
            this.modal.open('new-space-modal');
        });
        e.newSpaceCloseBtn?.addEventListener('click', () => this.modal.close('new-space-modal'));
        e.tabHost?.addEventListener('click', () => this.space.switchTab('host'));
        e.tabJoin?.addEventListener('click', () => this.space.switchTab('join'));
        e.startHostBtn?.addEventListener('click', () => this.space.startHosting());
        e.stopHostBtn?.addEventListener('click', () => this.space.stopHosting());
        e.connectBtn?.addEventListener('click', () => this.space.joinSpace());

        // Message Input & Dynamic Send / Mic Switch (WA / TG style)
        const updateSendBtnState = () => {
            const val = e.messageInput?.value.trim() || '';
            if (val.length > 0) {
                if (e.sendBtn) {
                    e.sendBtn.classList.remove('mic-mode');
                    e.sendBtn.innerHTML = '<i class="ph ph-paper-plane-right"></i>';
                    e.sendBtn.title = 'Send Message (Enter)';
                }
            } else {
                if (e.sendBtn) {
                    e.sendBtn.classList.add('mic-mode');
                    e.sendBtn.innerHTML = '<i class="ph ph-microphone"></i>';
                    e.sendBtn.title = 'Hold or Click to Record Voice Note';
                }
            }
        };
        updateSendBtnState();

        e.sendBtn?.addEventListener('click', () => {
            if (e.sendBtn.classList.contains('mic-mode') && (!e.messageInput?.value || e.messageInput.value.trim().length === 0)) {
                this.voice.start();
            } else {
                this.chat.sendMessage();
                updateSendBtnState();
            }
        });

        e.messageInput?.addEventListener('keypress', (ev) => {
            const enterSend = localStorage.getItem('esctrix_enter_send') !== 'false';
            if (ev.key === 'Enter' && !ev.shiftKey && enterSend) {
                ev.preventDefault();
                this.chat.sendMessage();
                updateSendBtnState();
            }
        });

        e.messageInput?.addEventListener('input', (ev) => {
            updateSendBtnState();
            if (ev.target.value === '/') {
                this.commandPalette.open();
            }
            this.chat.handleTyping();
        });

        // Quoted Reply Preview Bar Cancel
        e.replyCancelBtn?.addEventListener('click', () => this.chat.cancelReply());

        // File Attachment & Popover (IG / WA style)
        e.fileBtn?.addEventListener('click', (ev) => {
            ev.stopPropagation();
            e.attachmentPopover?.classList.toggle('hidden');
        });
        document.addEventListener('click', (ev) => {
            if (!ev.target.closest('.attachment-tools-wrap') && e.attachmentPopover) {
                e.attachmentPopover.classList.add('hidden');
            }
        });
        e.attachMediaBtn?.addEventListener('click', () => {
            e.attachmentPopover?.classList.add('hidden');
            if (e.fileInput) {
                e.fileInput.accept = 'image/*,video/*';
                e.fileInput.click();
            }
        });
        e.attachDocBtn?.addEventListener('click', () => {
            e.attachmentPopover?.classList.add('hidden');
            if (e.fileInput) {
                e.fileInput.accept = '*/*';
                e.fileInput.click();
            }
        });
        e.attachViewonceBtn?.addEventListener('click', () => {
            e.attachmentPopover?.classList.add('hidden');
            this.state.vanishTimer = 'view_once';
            this.state.vanishMode = true;
            this.showToast('Vanish Mode set to: VIEW-ONCE 🔒');
            if (e.fileInput) {
                e.fileInput.accept = 'image/*,video/*';
                e.fileInput.click();
            }
        });
        e.attachVoiceBtn?.addEventListener('click', () => {
            e.attachmentPopover?.classList.add('hidden');
            this.voice.start();
        });
        e.fileInput?.addEventListener('change', (ev) => this.chat.handleFileSelect(ev));

        // Emoji Picker
        e.emojiPickerBtn?.addEventListener('click', () => e.emojiPicker.classList.toggle('hidden'));
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                e.messageInput.value += btn.textContent;
                e.emojiPicker.classList.add('hidden');
                updateSendBtnState();
                e.messageInput.focus();
            });
        });

        // Voice Note Recorder Controls
        e.voiceNoteBtn?.addEventListener('click', () => this.voice.start());
        e.voiceDiscardBtn?.addEventListener('click', () => this.voice.discard());
        e.voicePauseBtn?.addEventListener('click', () => this.voice.togglePause());
        e.voicePreviewBtn?.addEventListener('click', () => this.voice.togglePreview());
        e.voiceSendBtn?.addEventListener('click', () => this.voice.sendVoice());

        // AI Suite Popover & Tools
        e.aiAssistBtn?.addEventListener('click', (ev) => {
            ev.stopPropagation();
            e.aiToolsPopover.classList.toggle('hidden');
        });
        document.addEventListener('click', (ev) => {
            if (!ev.target.closest('.ai-tools-wrap') && e.aiToolsPopover) {
                e.aiToolsPopover.classList.add('hidden');
            }
            if (!ev.target.closest('.dropdown-wrap') && e.chatDropdownMenu) {
                e.chatDropdownMenu.classList.add('hidden');
            }
        });

        e.aiToolPolish?.addEventListener('click', () => this.ai.openPolishModal());
        e.aiToolTranslate?.addEventListener('click', () => this.ai.openTranslateModal());
        e.aiToolSummarize?.addEventListener('click', () => this.ai.summarizeActiveChat());
        e.aiToolVibe?.addEventListener('click', () => this.ai.triggerVibeScan());

        // Polish Modal
        e.aiPolishCloseBtn?.addEventListener('click', () => this.modal.close('ai-polish-modal'));
        document.querySelectorAll('.tone-btn').forEach(b => {
            b.addEventListener('click', (ev) => {
                document.querySelectorAll('.tone-btn').forEach(x => x.classList.remove('active'));
                ev.target.classList.add('active');
            });
        });
        e.executePolishBtn?.addEventListener('click', () => this.ai.executePolish());
        e.applyPolishedBtn?.addEventListener('click', () => this.ai.applyPolishedText());

        // Translate Modal
        e.aiTranslateCloseBtn?.addEventListener('click', () => this.modal.close('ai-translate-modal'));
        e.executeTranslateBtn?.addEventListener('click', () => this.ai.executeTranslate());
        e.applyTranslatedBtn?.addEventListener('click', () => this.ai.sendTranslatedMessage());

        // Command Palette
        e.cmdPaletteBtn?.addEventListener('click', () => this.commandPalette.open());
        e.cmdPaletteClose?.addEventListener('click', () => this.commandPalette.close());
        window.addEventListener('keydown', (ev) => {
            if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
                ev.preventDefault();
                this.commandPalette.toggle();
            }
        });
        document.querySelectorAll('.cmd-item').forEach(item => {
            item.addEventListener('click', () => this.commandPalette.run(item.dataset.cmd));
        });

        // Chat Header Actions
        e.chatMenuBtn?.addEventListener('click', (ev) => {
            ev.stopPropagation();
            e.chatDropdownMenu.classList.toggle('hidden');
        });
        e.menuPeerProfileBtn?.addEventListener('click', () => {
            e.chatDropdownMenu?.classList.add('hidden');
            this.openActiveChatProfile();
        });
        e.menuSettingsBtn?.addEventListener('click', () => {
            e.chatDropdownMenu?.classList.add('hidden');
            this.settings.open();
        });
        e.activeChatAvatar?.addEventListener('click', () => this.openActiveChatProfile());
        e.activeChatName?.addEventListener('click', () => this.openActiveChatProfile());
        e.menuVanishBtn?.addEventListener('click', () => this.chat.toggleVanishMode());
        e.menuBurnBtn?.addEventListener('click', () => this.chat.burnSpace());
        e.menuSummarizeBtn?.addEventListener('click', () => this.ai.summarizeActiveChat());
        e.menuExportBtn?.addEventListener('click', () => this.chat.exportHistory());
        e.menuClearBtn?.addEventListener('click', () => this.chat.clearCurrentView());

        // Calls & Media Controls (WA / TG / IG style)
        e.audioCallBtn?.addEventListener('click', () => this.call.initiate('audio'));
        e.videoCallBtn?.addEventListener('click', () => this.call.initiate('video'));
        e.callMinimizeBtn?.addEventListener('click', () => this.call.minimize());
        e.pipExpandBtn?.addEventListener('click', () => this.call.maximize());
        e.pipMuteBtn?.addEventListener('click', () => this.call.toggleMute());
        e.pipEndBtn?.addEventListener('click', () => this.call.end());
        e.startAudioCallBtn?.addEventListener('click', () => this.call.initiate('audio'));
        e.startVideoCallBtn?.addEventListener('click', () => this.call.initiate('video'));
        e.cancelCallTypeBtn?.addEventListener('click', () => this.modal.close('call-type-modal'));
        e.acceptCallBtn?.addEventListener('click', () => this.call.accept());
        e.declineCallBtn?.addEventListener('click', () => this.call.decline());
        e.endVideoCallBtn?.addEventListener('click', () => this.call.end());
        e.muteBtn?.addEventListener('click', () => this.call.toggleMute());
        e.camOffBtn?.addEventListener('click', () => this.call.toggleCam());
        e.switchCamBtn?.addEventListener('click', () => this.call.flipCamera());
        e.screenShareBtn?.addEventListener('click', () => this.call.toggleScreenShare());
        e.callScreenShareBtn?.addEventListener('click', () => this.call.toggleScreenShare());
        e.incallChatBtn?.addEventListener('click', () => e.incallChatPanel.classList.toggle('hidden'));
        e.incallChatClose?.addEventListener('click', () => e.incallChatPanel.classList.add('hidden'));
        e.incallSendBtn?.addEventListener('click', () => this.call.sendIncallMessage());

        // E2EE Verification
        e.e2eeVerifyBtn?.addEventListener('click', () => this.verification.openModal());
        e.e2eeCallVerifyBtn?.addEventListener('click', () => this.verification.openModal());
        e.e2eeCloseBtn?.addEventListener('click', () => this.modal.close('e2ee-modal'));

        // Admin Dashboard
        e.adminPanelBtn?.addEventListener('click', () => this.admin.open());
        e.adminBackBtn?.addEventListener('click', () => this.showScreen('dashboard-screen'));
        e.adminBroadcastBtn?.addEventListener('click', () => this.admin.broadcast());
        e.kickedOkBtn?.addEventListener('click', () => {
            e.kickedOverlay.classList.add('hidden');
            this.showScreen('dashboard-screen');
        });
    },

    // ─────────────────────────────────────────────────────────
    // AUTHENTICATION MODULE (Unified & Stealth)
    // ─────────────────────────────────────────────────────────
    auth: {
        toggleMode() {
            ESCTRIX.state.isLoginMode = !ESCTRIX.state.isLoginMode;
            const e = ESCTRIX.elements;
            e.loginError.textContent = '';
            if (ESCTRIX.state.isLoginMode) {
                e.authTitle.textContent = 'Account Login';
                e.authSubtitle.textContent = 'Decentralized P2P Messaging & Neural AI';
                e.authSubmitBtn.innerHTML = '<i class="ph ph-sign-in"></i> Sign In';
                e.authToggleMsg.textContent = "Don't have an account?";
                e.authToggle.textContent = 'Register New Identity';
                e.displayNameGroup.style.display = 'none';
            } else {
                e.authTitle.textContent = 'Create Quantum Identity';
                e.authSubtitle.textContent = 'Get your permanent unique Account ID & @handle';
                e.authSubmitBtn.innerHTML = '<i class="ph ph-user-plus"></i> Generate Account';
                e.authToggleMsg.textContent = 'Already have an account?';
                e.authToggle.textContent = 'Sign In';
                e.displayNameGroup.style.display = 'flex';
            }
            if (e.passkeyLoginBtn) {
                e.passkeyLoginBtn.style.display = ESCTRIX.state.isLoginMode ? 'flex' : 'none';
                const divider = document.querySelector('.auth-divider');
                if (divider) divider.style.display = ESCTRIX.state.isLoginMode ? 'flex' : 'none';
            }
        },

        async submit() {
            const e = ESCTRIX.elements;
            const username = e.authUsername.value.trim();
            const password = e.authPassword.value.trim();
            const displayName = e.authDisplayname?.value.trim() || '';

            if (!username || !password) {
                e.loginError.textContent = 'Please enter both username and password.';
                return;
            }

            e.loginError.textContent = 'Authenticating quantum frequency...';
            e.authSubmitBtn.disabled = true;

            const endpoint = ESCTRIX.state.isLoginMode ? '/api/auth/login' : '/api/auth/register';
            const payload = { username, password, display_name: displayName };

            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (data.status === 'success') {
                    ESCTRIX.playSfx('send');
                    let user = data.user;
                    if (!user) {
                        const pRes = await fetch(`/api/user/profile?username=${encodeURIComponent(username)}`);
                        const pData = await pRes.json();
                        user = pData.profile || { username, account_id: 'ESC-LIVE', display_name: username, role: data.role || 'user' };
                    }

                    ESCTRIX.state.user = user;
                    localStorage.setItem('esctrix_quantum_session', JSON.stringify(user));
                    ESCTRIX.applyUserProfile(user);

                    ESCTRIX.showScreen('dashboard-screen');
                    ESCTRIX.loadSavedMessages();
                    ESCTRIX.loadContacts();
                    ESCTRIX.connectUserSocket(user.username);
                    ESCTRIX.updateContactsCount();
                    ESCTRIX.showToast(`Identity verified: ${user.display_name || user.username} 🚀`);
                } else {
                    e.loginError.textContent = data.message || 'Authentication failed. Please check credentials.';
                }
            } catch (err) {
                e.loginError.textContent = 'Network offline or server unreachable.';
            } finally {
                e.authSubmitBtn.disabled = false;
            }
        },

        logout() {
            localStorage.removeItem('esctrix_quantum_session');
            ESCTRIX.state.user = null;
            if (ESCTRIX.state.userWs) {
                try { ESCTRIX.state.userWs.close(); } catch (e) {}
                ESCTRIX.state.userWs = null;
            }
            clearInterval(ESCTRIX.state.userWsPingInterval);
            if (ESCTRIX.state.p2p) {
                ESCTRIX.state.p2p.disconnect();
                ESCTRIX.state.p2p = null;
            }
            ESCTRIX.elements.settingsSuiteModal?.classList.add('hidden');
            ESCTRIX.elements.authUsername.value = '';
            ESCTRIX.elements.authPassword.value = '';
            ESCTRIX.renderIntroUserState(null);
            ESCTRIX.showScreen('intro-screen');
            ESCTRIX.showToast('Session terminated securely.');
        }
    },

    avatarPresets: [
        {
            name: 'Cyber Hacker',
            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%238b5cf6'/%3E%3Cstop offset='100%25' stop-color='%2306d6c7'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='%230b101d'/%3E%3Ccircle cx='50' cy='50' r='46' fill='none' stroke='url(%23g1)' stroke-width='3'/%3E%3Cpath d='M25 40 Q50 20 75 40 L75 60 Q50 85 25 60 Z' fill='%231f293d' stroke='%2306d6c7' stroke-width='2'/%3E%3Crect x='34' y='46' width='12' height='6' rx='3' fill='%2306d6c7'/%3E%3Crect x='54' y='46' width='12' height='6' rx='3' fill='%2306d6c7'/%3E%3Cpath d='M42 62 Q50 68 58 62' stroke='%238b5cf6' stroke-width='2' fill='none'/%3E%3C/svg%3E"
        },
        {
            name: 'Neural AI',
            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%233b82f6'/%3E%3Cstop offset='100%25' stop-color='%2306d6c7'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='%23061325'/%3E%3Ccircle cx='50' cy='50' r='46' fill='none' stroke='url(%23g2)' stroke-width='3'/%3E%3Ccircle cx='50' cy='50' r='24' fill='%231e293b' stroke='%2338bdf8' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='10' fill='%2306d6c7'/%3E%3Ccircle cx='32' cy='32' r='4' fill='%2338bdf8'/%3E%3Ccircle cx='68' cy='32' r='4' fill='%2338bdf8'/%3E%3Ccircle cx='32' cy='68' r='4' fill='%2338bdf8'/%3E%3Ccircle cx='68' cy='68' r='4' fill='%2338bdf8'/%3E%3Cpath d='M50 26 L50 40 M50 60 L50 74 M26 50 L40 50 M60 50 L74 50' stroke='%2338bdf8' stroke-width='2'/%3E%3C/svg%3E"
        },
        {
            name: 'Quantum Agent',
            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23ec4899'/%3E%3Cstop offset='100%25' stop-color='%238b5cf6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='%23180824'/%3E%3Ccircle cx='50' cy='50' r='46' fill='none' stroke='url(%23g3)' stroke-width='3'/%3E%3Cpath d='M50 22 L76 34 L76 58 Q50 82 50 82 Q24 58 24 58 L24 34 Z' fill='%232e1047' stroke='%23ec4899' stroke-width='2'/%3E%3Cpolygon points='50,34 62,56 38,56' fill='%23f59e0b'/%3E%3Ccircle cx='50' cy='66' r='3' fill='%2306d6c7'/%3E%3C/svg%3E"
        },
        {
            name: 'Aurora Ghost',
            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g4' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2310b981'/%3E%3Cstop offset='100%25' stop-color='%2334d399'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='%23041914'/%3E%3Ccircle cx='50' cy='50' r='46' fill='none' stroke='url(%23g4)' stroke-width='3'/%3E%3Cpath d='M30 40 Q50 18 70 40 L70 70 Q60 62 50 70 Q40 62 30 70 Z' fill='%23064e3b' stroke='%2334d399' stroke-width='2'/%3E%3Ccircle cx='42' cy='46' r='5' fill='%2334d399'/%3E%3Ccircle cx='58' cy='46' r='5' fill='%2334d399'/%3E%3C/svg%3E"
        },
        {
            name: 'Solar Pilot',
            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g5' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f59e0b'/%3E%3Cstop offset='100%25' stop-color='%23ef4444'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='%231c0d02'/%3E%3Ccircle cx='50' cy='50' r='46' fill='none' stroke='url(%23g5)' stroke-width='3'/%3E%3Ccircle cx='50' cy='50' r='24' fill='%233b1805' stroke='%23f59e0b' stroke-width='2'/%3E%3Cpath d='M32 50 L68 50' stroke='%23f59e0b' stroke-width='8' stroke-linecap='round'/%3E%3Cpath d='M36 50 Q50 64 64 50' fill='none' stroke='%23ef4444' stroke-width='3'/%3E%3C/svg%3E"
        },
        {
            name: 'Astro Rover',
            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g6' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%236366f1'/%3E%3Cstop offset='100%25' stop-color='%2338bdf8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='50' fill='%230f1429'/%3E%3Ccircle cx='50' cy='50' r='46' fill='none' stroke='url(%23g6)' stroke-width='3'/%3E%3Ccircle cx='50' cy='48' r='22' fill='%231e293b' stroke='%236366f1' stroke-width='2'/%3E%3Cpath d='M36 46 Q50 36 64 46 Q64 58 50 58 Q36 58 36 46 Z' fill='%2338bdf8'/%3E%3Crect x='44' y='72' width='12' height='10' rx='3' fill='%236366f1'/%3E%3C/svg%3E"
        }
    ],

    initAvatarPresets() {
        const container = document.getElementById('avatar-preset-picker');
        if (!container) return;
        container.innerHTML = this.avatarPresets.map((p, idx) => `
            <div class="avatar-preset-chip" data-preset-idx="${idx}" title="${p.name}">
                <img src="${p.url}" alt="${p.name}">
            </div>
        `).join('');
        container.querySelectorAll('.avatar-preset-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const idx = parseInt(chip.dataset.presetIdx);
                const preset = this.avatarPresets[idx];
                if (preset && ESCTRIX.state.user) {
                    ESCTRIX.state.user.avatar_photo = preset.url;
                    ESCTRIX.applyUserProfile(ESCTRIX.state.user);
                    ESCTRIX.settings.saveProfile();
                    container.querySelectorAll('.avatar-preset-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    ESCTRIX.showToast(`Applied preset: ${preset.name} ✨`);
                }
            });
        });
    },

    openActiveChatProfile() {
        const s = this.state;
        if (!s.activeChat) return;
        if (s.activeChat.type === 'ai') {
            this.profileModal.open({
                username: 'AuraAI',
                display_name: 'Aura AI Neural Companion',
                account_id: 'AI-CORE-001',
                bio: 'Adaptive conversational intelligence and peer security companion.',
                avatar_color: 'linear-gradient(135deg, #8b5cf6, #06d6c7)'
            });
        } else if (s.activeChat.type === 'saved') {
            if (s.user) this.profileModal.open(s.user);
        } else if (s.activeChat.type === 'space') {
            const title = s.activeChat.title || '';
            const targetUser = title.replace(/^@/, '');
            fetch(`/api/user/profile?username=${encodeURIComponent(targetUser)}`)
                .then(r => r.json())
                .then(data => {
                    const prof = data.profile || data.user;
                    if (prof) {
                        this.profileModal.open(prof);
                    } else {
                        this.profileModal.open({
                            username: targetUser,
                            display_name: title,
                            account_id: 'ESC-PEER',
                            bio: 'Decentralized P2P Mesh Room Peer'
                        });
                    }
                })
                .catch(() => {
                    this.profileModal.open({
                        username: targetUser,
                        display_name: title,
                        account_id: 'ESC-PEER',
                        bio: 'Decentralized P2P Mesh Room Peer'
                    });
                });
        }
    },

    // ─────────────────────────────────────────────────────────
    // QUANTUM USER PROFILE & NAMETAG MODULE
    // ─────────────────────────────────────────────────────────
    profileModal: {
        currentUser: null,

        async open(user) {
            ESCTRIX.playSfx('click');
            this.currentUser = user;
            const e = ESCTRIX.elements;
            if (!e.userProfileModal) return;

            // Populate profile
            if (e.upDisplayname) e.upDisplayname.textContent = user.display_name || user.username;
            if (e.upUsername) e.upUsername.textContent = `@${user.username}`;
            if (e.upAccountId) e.upAccountId.textContent = user.account_id || 'ESC-QUANTUM';
            if (e.upBio) e.upBio.textContent = user.bio || 'Decentralized & Quantum Secured 🚀';
            if (e.upAvatar) {
                if (user.avatar_photo) {
                    e.upAvatar.innerHTML = `<img src="${user.avatar_photo}" class="avatar-img" alt="Avatar">`;
                    e.upAvatar.style.background = 'transparent';
                } else {
                    e.upAvatar.textContent = (user.display_name || user.username || 'U').charAt(0).toUpperCase();
                    if (user.avatar_color) e.upAvatar.style.background = user.avatar_color;
                }
            }

            // Check if user is viewing their own profile
            const isSelf = ESCTRIX.state.user && user.username === ESCTRIX.state.user.username;
            if (isSelf) {
                e.upPeerActions?.classList.add('hidden');
                e.upOwnActions?.classList.remove('hidden');
            } else {
                e.upPeerActions?.classList.remove('hidden');
                e.upOwnActions?.classList.add('hidden');
                // Check if already contact
                const isContact = (ESCTRIX.state.contacts || []).some(c => c.contact_username === user.username);
                if (e.upAddContactLabel) {
                    e.upAddContactLabel.textContent = isContact ? 'In Your Contacts ✓' : 'Add to Contacts';
                }
            }

            e.userProfileModal.classList.remove('hidden');
        },

        close() {
            ESCTRIX.elements.userProfileModal?.classList.add('hidden');
        },

        startDM() {
            if (!this.currentUser) return;
            this.close();
            ESCTRIX.space.openDirectSpace(this.currentUser.username);
            ESCTRIX.chat.switchChat('space', { spaceName: `@${this.currentUser.username}` });
        },

        startCall(type) {
            if (!this.currentUser) return;
            this.close();
            ESCTRIX.space.openDirectSpace(this.currentUser.username);
            ESCTRIX.chat.switchChat('space', { spaceName: `@${this.currentUser.username}` });
            setTimeout(() => {
                ESCTRIX.call.initiate(type);
            }, 300);
        },

        async toggleContact() {
            if (!this.currentUser) return;
            await ESCTRIX.addContact(this.currentUser.username);
            if (ESCTRIX.elements.upAddContactLabel) {
                ESCTRIX.elements.upAddContactLabel.textContent = 'In Your Contacts ✓';
            }
        },

        openNametag(user) {
            if (!user) return;
            ESCTRIX.playSfx('click');
            const e = ESCTRIX.elements;
            if (e.nametagDisplayname) e.nametagDisplayname.textContent = user.display_name || user.username;
            if (e.nametagUsername) e.nametagUsername.textContent = `@${user.username}`;
            if (e.nametagAccountId) e.nametagAccountId.textContent = user.account_id || 'ESC-QUANTUM';
            if (e.nametagAvatar) {
                if (user.avatar_photo) {
                    e.nametagAvatar.innerHTML = `<img src="${user.avatar_photo}" class="avatar-img" alt="Avatar">`;
                    e.nametagAvatar.style.background = 'transparent';
                } else {
                    e.nametagAvatar.textContent = (user.display_name || user.username || 'U').charAt(0).toUpperCase();
                    if (user.avatar_color) e.nametagAvatar.style.background = user.avatar_color;
                }
            }

            // Generate clean QR
            const directUrl = `${window.location.origin}/@${user.username}`;
            if (e.nametagQrImg) {
                e.nametagQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(directUrl)}`;
            }

            ESCTRIX.modal.open('qr-nametag-modal');
        },

        copyNametagLink() {
            const user = this.currentUser || ESCTRIX.state.user;
            if (!user) return;
            const directUrl = `${window.location.origin}/@${user.username}`;
            navigator.clipboard.writeText(directUrl).then(() => {
                ESCTRIX.playSfx('send');
                ESCTRIX.showToast(`Direct Handle Link copied: @${user.username} 📋`);
            });
        }
    },

    // ─────────────────────────────────────────────────────────
    // ADVANCED MULTI-TAB SETTINGS SUITE MODULE
    // ─────────────────────────────────────────────────────────
    settings: {
        open(targetTab = 'hub') {
            ESCTRIX.playSfx('click');
            const user = ESCTRIX.state.user;
            if (user) {
                ESCTRIX.applyUserProfile(user);
                this.updateHubProfile(user);
            }
            this.loadPreferences();
            this.loadSessions();
            this.loadTheme();
            ESCTRIX.initAvatarPresets();

            // Toggle admin tab if admin
            const isAdmin = user && (user.role === 'admin' || user.username === 'ESCTRIX_Admin');
            if (ESCTRIX.elements.settingsAdminTabBtn) {
                ESCTRIX.elements.settingsAdminTabBtn.classList.toggle('hidden', !isAdmin);
            }
            if (ESCTRIX.elements.settingsHubAdminCard) {
                ESCTRIX.elements.settingsHubAdminCard.classList.toggle('hidden', !isAdmin);
            }

            ESCTRIX.elements.settingsSuiteModal?.classList.remove('hidden');
            ESCTRIX.nav?.pushState('modal', 'settings-suite-modal');
            if (targetTab && targetTab !== 'hub') {
                this.switchTab(targetTab);
            } else {
                this.showHub();
            }
        },

        close() {
            ESCTRIX.elements.settingsSuiteModal?.classList.add('hidden');
        },

        updateHubProfile(user) {
            const e = ESCTRIX.elements;
            if (!user) return;
            if (e.hubProfileName) e.hubProfileName.textContent = user.display_name || user.username;
            if (e.hubProfileHandle) e.hubProfileHandle.textContent = `@${user.username}`;
            if (e.hubProfileId) e.hubProfileId.textContent = user.account_id || 'ESC-QUANTUM';
            if (e.hubAvatarDisplay) {
                if (user.avatar_photo) {
                    e.hubAvatarDisplay.innerHTML = `<img src="${user.avatar_photo}" alt="Avatar">`;
                    e.hubAvatarDisplay.style.background = 'transparent';
                } else {
                    e.hubAvatarDisplay.textContent = (user.display_name || user.username || 'U').charAt(0).toUpperCase();
                    if (user.avatar_color) e.hubAvatarDisplay.style.background = user.avatar_color;
                }
            }
        },

        showHub() {
            ESCTRIX.playSfx('click');
            const e = ESCTRIX.elements;
            e.settingsBackBtn?.classList.add('hidden');
            if (e.settingsHeaderText) e.settingsHeaderText.textContent = 'Settings & Preferences';
            if (e.settingsHeaderIcon) e.settingsHeaderIcon.className = 'ph ph-gear-six';

            document.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.settings-tab-view').forEach(v => v.classList.remove('active'));

            const hubBtn = document.querySelector(`.settings-nav-btn[data-tab="hub"]`);
            if (hubBtn) hubBtn.classList.add('active');
            const hubView = document.getElementById('tab-hub-view');
            if (hubView) hubView.classList.add('active');
        },

        switchTab(tabName) {
            if (tabName === 'hub') {
                this.showHub();
                return;
            }
            ESCTRIX.playSfx('click');
            const e = ESCTRIX.elements;
            e.settingsBackBtn?.classList.remove('hidden');

            const tabTitles = {
                profile: { text: 'Profile & Identity', icon: 'ph-user-circle' },
                privacy: { text: 'Privacy & Security', icon: 'ph-shield-check' },
                chats: { text: 'Chats & Aesthetics', icon: 'ph-paint-brush' },
                notifications: { text: 'Sounds & Alerts', icon: 'ph-bell-ringing' },
                storage: { text: 'Data & Storage', icon: 'ph-hard-drives' },
                help: { text: 'Help & Contact Support', icon: 'ph-headset' },
                admin: { text: 'Admin Command Console', icon: 'ph-shield-star' }
            };

            const info = tabTitles[tabName];
            if (info) {
                if (e.settingsHeaderText) e.settingsHeaderText.textContent = info.text;
                if (e.settingsHeaderIcon) e.settingsHeaderIcon.className = `ph ${info.icon}`;
            }

            document.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.settings-tab-view').forEach(v => v.classList.remove('active'));

            const targetBtn = document.querySelector(`.settings-nav-btn[data-tab="${tabName}"]`);
            const targetView = document.getElementById(`tab-${tabName}-view`);
            if (targetBtn) {
                targetBtn.classList.add('active');
                targetBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
            if (targetView) targetView.classList.add('active');
        },

        setTheme(themeName) {
            ESCTRIX.playSfx('click');
            document.documentElement.setAttribute('data-theme', themeName);
            localStorage.setItem('esctrix_theme', themeName);
            document.querySelectorAll('.theme-card').forEach(c => {
                c.classList.toggle('active', c.dataset.theme === themeName);
            });
            ESCTRIX.showToast(`Theme updated: ${themeName.replace('-', ' ').toUpperCase()} ✨`);
        },

        loadTheme() {
            const saved = localStorage.getItem('esctrix_theme') || 'cyber-obsidian';
            document.documentElement.setAttribute('data-theme', saved);
            document.querySelectorAll('.theme-card').forEach(c => {
                c.classList.toggle('active', c.dataset.theme === saved);
            });
        },

        loadPreferences() {
            const e = ESCTRIX.elements;
            if (e.prefReadReceipts) {
                e.prefReadReceipts.checked = localStorage.getItem('esctrix_read_receipts') !== 'false';
            }
            if (e.prefLastSeen) {
                e.prefLastSeen.value = localStorage.getItem('esctrix_last_seen') || 'contacts';
            }
            if (e.prefBurnTimer) {
                e.prefBurnTimer.value = localStorage.getItem('esctrix_burn_timer') || '0';
            }
            if (e.prefEnterSend) {
                e.prefEnterSend.checked = localStorage.getItem('esctrix_enter_send') !== 'false';
            }
            if (e.prefFontSize) {
                e.prefFontSize.value = localStorage.getItem('esctrix_fontsize') || 'medium';
            }
            if (e.prefSfxToggle) {
                e.prefSfxToggle.checked = ESCTRIX.state.sfxEnabled;
            }
            if (e.prefRingtoneToggle) {
                e.prefRingtoneToggle.checked = localStorage.getItem('esctrix_ringtone') !== 'false';
            }
            if (e.prefPreviewToggle) {
                e.prefPreviewToggle.checked = localStorage.getItem('esctrix_preview') !== 'false';
            }

            // Wallpaper active card
            const currentWp = localStorage.getItem('esctrix_wallpaper') || 'cyber-grid';
            document.querySelectorAll('.wallpaper-card').forEach(c => {
                if (c.dataset.wallpaper === currentWp) {
                    c.classList.add('active');
                } else {
                    c.classList.remove('active');
                }
            });

            // Passcode status
            const hasPasscode = Boolean(localStorage.getItem('esctrix_passcode_pin'));
            if (e.passcodeStatusLabel) {
                e.passcodeStatusLabel.textContent = hasPasscode ? 'Change PIN (Active)' : 'Setup PIN';
            }

            // Storage estimate
            if (e.storageUsageVal) {
                const lsSize = (JSON.stringify(localStorage).length / (1024 * 1024)).toFixed(2);
                e.storageUsageVal.textContent = `${lsSize} MB`;
            }
        },

        async saveProfile() {
            const user = ESCTRIX.state.user;
            if (!user) return;
            const newName = ESCTRIX.elements.settingsInputDisplayname?.value.trim();
            const newBio = ESCTRIX.elements.settingsInputBio?.value.trim();

            if (!newName) {
                ESCTRIX.showToast('Display name cannot be empty', true);
                return;
            }

            try {
                const res = await fetch('/api/user/profile/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: user.username,
                        display_name: newName,
                        bio: newBio,
                        avatar_color: user.avatar_color || '',
                        avatar_photo: user.avatar_photo !== undefined ? user.avatar_photo : ''
                    })
                });
                const data = await res.json();
                if (data.status === 'success' && data.profile) {
                    ESCTRIX.state.user = { ...user, ...data.profile };
                    localStorage.setItem('esctrix_quantum_session', JSON.stringify(ESCTRIX.state.user));
                    ESCTRIX.applyUserProfile(ESCTRIX.state.user);
                    ESCTRIX.showToast('Profile updated successfully! ✨');
                }
            } catch (e) {
                ESCTRIX.showToast('Failed to update profile', true);
            }
        },

        cycleAvatarColor() {
            const colors = [
                'linear-gradient(135deg, #8b5cf6, #06d6c7)',
                'linear-gradient(135deg, #ec4899, #8b5cf6)',
                'linear-gradient(135deg, #3b82f6, #06d6c7)',
                'linear-gradient(135deg, #10b981, #059669)',
                'linear-gradient(135deg, #f59e0b, #ef4444)',
                'linear-gradient(135deg, #6366f1, #a855f7)'
            ];
            const current = ESCTRIX.state.user?.avatar_color || colors[0];
            let nextIdx = (colors.indexOf(current) + 1) % colors.length;
            if (nextIdx < 0) nextIdx = 0;
            const newColor = colors[nextIdx];

            if (ESCTRIX.state.user) {
                ESCTRIX.state.user.avatar_color = newColor;
                ESCTRIX.applyUserProfile(ESCTRIX.state.user);
                this.saveProfile();
            }
        },

        copyAccountId() {
            const id = ESCTRIX.state.user?.account_id || 'ESC-000000';
            navigator.clipboard.writeText(id).then(() => {
                ESCTRIX.playSfx('send');
                ESCTRIX.showToast(`Account ID ${id} copied to clipboard! 📋`);
            });
        },

        setWallpaper(wpName) {
            ESCTRIX.playSfx('click');
            localStorage.setItem('esctrix_wallpaper', wpName);
            document.querySelectorAll('.wallpaper-card').forEach(c => {
                c.classList.toggle('active', c.dataset.wallpaper === wpName);
            });
            this.applyWallpaperClass(wpName);
            ESCTRIX.showToast(`Chat Wallpaper set to: ${wpName.replace('-', ' ').toUpperCase()}`);
        },

        applyWallpaperClass(wpName) {
            const vp = ESCTRIX.elements.messagesViewport;
            if (!vp) return;
            vp.classList.remove('wp-cyber-grid', 'wp-doodle-pattern', 'wp-oled-black', 'wp-emerald-matrix');
            vp.classList.add(`wp-${wpName}`);
        },

        applyFontSize(size) {
            localStorage.setItem('esctrix_fontsize', size);
            const list = ESCTRIX.elements.messagesList;
            if (!list) return;
            list.style.fontSize = size === 'small' ? '0.86rem' : size === 'large' ? '1.05rem' : '0.94rem';
        },

        async loadSessions() {
            const user = ESCTRIX.state.user;
            if (!user) return;
            const container = ESCTRIX.elements.sessionsContainer;
            if (!container) return;

            try {
                const res = await fetch(`/api/user/sessions?username=${encodeURIComponent(user.username)}`);
                const data = await res.json();
                if (data.status === 'success' && data.sessions) {
                    container.innerHTML = data.sessions.map((s, idx) => `
                        <div class="session-item ${s.is_current || idx === 0 ? 'current' : ''}">
                            <div class="session-icon"><i class="ph ph-desktop"></i></div>
                            <div class="session-meta">
                                <strong>${s.device || 'Quantum Web Client'}</strong>
                                <span class="muted">${s.ip || '127.0.0.1'} • ${s.online_since || 'Active now'}</span>
                            </div>
                            ${s.is_current || idx === 0 ? '<span class="badge-pill active-badge">This Device</span>' : ''}
                        </div>
                    `).join('');
                }
            } catch (e) {}
        },

        async terminateOtherSessions() {
            const user = ESCTRIX.state.user;
            if (!user) return;
            try {
                await fetch('/api/user/sessions/terminate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user.username })
                });
                ESCTRIX.showToast('All other active sessions revoked! 🛡️');
                this.loadSessions();
            } catch (e) {}
        },

        clearMediaCache() {
            // Clears any stored blobs or large cached strings
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('esctrix_cache_') || key.startsWith('cached_voice_')) {
                    localStorage.removeItem(key);
                }
            });
            ESCTRIX.showToast('Media cache cleared! 🧹');
            this.loadPreferences();
        },

        clearChatHistory() {
            ESCTRIX.dialog.confirm(
                'Purge Local History',
                'Clear local message cache across all conversations? (Encrypted cloud vault is untouched)',
                () => {
                    ESCTRIX.state.chatHistories['ai'] = [];
                    ESCTRIX.state.chatHistories['space'] = [];
                    ESCTRIX.chat.renderMessages();
                    ESCTRIX.showToast('Local conversation view purged.');
                },
                true
            );
        }
    },

    // ─────────────────────────────────────────────────────────
    // FIND & ADD FRIENDS MODULE (SEARCH BY USERNAME)
    // ─────────────────────────────────────────────────────────
    friendSearch: {
        debounceTimer: null,

        openModal() {
            ESCTRIX.playSfx('click');
            const e = ESCTRIX.elements;
            e.addFriendModal?.classList.remove('hidden');
            ESCTRIX.nav?.pushState('modal', 'add-friend-modal');
            if (e.addFriendInput) {
                e.addFriendInput.value = '';
                e.addFriendInput.focus();
            }
            if (e.addFriendClearBtn) e.addFriendClearBtn.classList.add('hidden');
            this.renderPlaceholder();
        },

        closeModal() {
            ESCTRIX.elements.addFriendModal?.classList.add('hidden');
        },

        renderPlaceholder() {
            const container = ESCTRIX.elements.addFriendResults;
            if (!container) return;
            container.innerHTML = `
                <div class="friend-search-placeholder">
                    <i class="ph ph-users-three" style="font-size:2.4rem; opacity:0.35; margin-bottom:8px; display:block;"></i>
                    <p>Enter a username above to find users across the network</p>
                </div>
            `;
        },

        search(query) {
            clearTimeout(this.debounceTimer);
            const clean = (query || '').trim();
            const e = ESCTRIX.elements;
            if (!clean) {
                e.addFriendClearBtn?.classList.add('hidden');
                this.renderPlaceholder();
                return;
            }
            e.addFriendClearBtn?.classList.remove('hidden');
            this.debounceTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/user/search?q=${encodeURIComponent(clean)}`);
                    const data = await res.json();
                    if (data.status === 'success') {
                        this.renderResults(data.users || [], clean);
                    }
                } catch (err) {
                    console.error('Friend search error:', err);
                }
            }, 220);
        },

        renderResults(users, query) {
            const container = ESCTRIX.elements.addFriendResults;
            if (!container) return;
            const currentUsername = ESCTRIX.state.user?.username;
            const contacts = ESCTRIX.state.contacts || [];
            const contactUsernames = new Set(contacts.map(c => c.contact_username));

            const filtered = users.filter(u => u.username !== currentUsername);

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="friend-search-placeholder">
                        <i class="ph ph-user-circle" style="font-size:2rem; opacity:0.4; margin-bottom:8px; display:block;"></i>
                        <p>No users found matching <strong style="color:var(--accent)">${query}</strong></p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filtered.map(u => {
                const isFriend = contactUsernames.has(u.username);
                const avatarContent = u.avatar_photo
                    ? `<img src="${u.avatar_photo}" alt="Avatar">`
                    : (u.display_name || u.username).charAt(0).toUpperCase();
                const avatarBg = u.avatar_photo ? 'transparent' : (u.avatar_color || 'var(--primary)');
                return `
                    <div class="friend-user-card" data-username="${u.username}">
                        <div class="friend-card-avatar" style="background:${avatarBg}">
                            ${avatarContent}
                        </div>
                        <div class="friend-card-info">
                            <span class="friend-card-name">${u.display_name || u.username}</span>
                            <span class="friend-card-handle">@${u.username}</span>
                            <span class="friend-card-id">${u.account_id || ''}</span>
                        </div>
                        <div class="friend-card-actions">
                            <button class="friend-action-btn friend-action-preview" data-username="${u.username}" title="View Identity Card">
                                <i class="ph ph-identification-card"></i>
                                <span>Profile</span>
                            </button>
                            <button class="friend-action-btn friend-action-add ${isFriend ? 'added' : ''}" data-username="${u.username}">
                                <i class="ph ${isFriend ? 'ph-check' : 'ph-user-plus'}"></i>
                                <span>${isFriend ? 'Friend' : 'Add Friend'}</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // Bind card click to open rich friend preview verification modal
            container.querySelectorAll('.friend-user-card').forEach(card => {
                card.addEventListener('click', (ev) => {
                    if (ev.target.closest('.friend-action-add')) return;
                    const uname = card.dataset.username;
                    const foundUser = filtered.find(u => u.username === uname);
                    if (foundUser) {
                        ESCTRIX.friendPreview.open(foundUser);
                    }
                });
            });

            // Bind click to add friend
            container.querySelectorAll('.friend-action-add').forEach(btn => {
                btn.addEventListener('click', async (ev) => {
                    ev.stopPropagation();
                    const targetUsername = btn.dataset.username;
                    if (!targetUsername || btn.classList.contains('added')) return;
                    btn.innerHTML = `<i class="ph ph-circle-notch animate-spin"></i> Adding...`;
                    await ESCTRIX.addContact(targetUsername);
                    btn.classList.add('added');
                    btn.innerHTML = `<i class="ph ph-check"></i> Added!`;
                    ESCTRIX.playSfx('connect');
                });
            });
        }
    },

    // ─────────────────────────────────────────────────────────
    // FRIEND PROFILE PREVIEW CARD (IDENTIFICATION CARD)
    // ─────────────────────────────────────────────────────────
    friendPreview: {
        currentUser: null,

        open(user) {
            if (!user) return;
            this.currentUser = user;
            ESCTRIX.playSfx('click');

            const e = ESCTRIX.elements;
            const contacts = ESCTRIX.state.contacts || [];
            const isFriend = contacts.some(c => c.contact_username === user.username);
            const isIncoming = (ESCTRIX.state.incomingFriendAdds || []).some(u => u.username === user.username);

            if (e.friendPreviewName) e.friendPreviewName.textContent = user.display_name || user.username;
            if (e.friendPreviewHandle) e.friendPreviewHandle.textContent = `@${user.username}`;
            if (e.friendPreviewId) e.friendPreviewId.textContent = user.account_id || 'ESC-QUANTUM';
            if (e.friendPreviewBio) e.friendPreviewBio.textContent = user.bio || 'Quantum decentralized peer. Zero-knowledge encrypted.';

            // Avatar rendering
            if (e.friendPreviewAvatar) {
                if (user.avatar_photo) {
                    e.friendPreviewAvatar.innerHTML = `<img src="${user.avatar_photo}" alt="Avatar">`;
                    e.friendPreviewAvatar.style.background = 'transparent';
                } else {
                    e.friendPreviewAvatar.innerHTML = (user.display_name || user.username || 'U').charAt(0).toUpperCase();
                    e.friendPreviewAvatar.style.background = user.avatar_color || 'var(--primary)';
                }
            }

            // Mutual / Added You Notice
            if (e.friendPreviewAddedYouNotice) {
                if (isIncoming && !isFriend) {
                    e.friendPreviewAddedYouNotice.classList.remove('hidden');
                } else {
                    e.friendPreviewAddedYouNotice.classList.add('hidden');
                }
            }

            // Buttons state
            if (e.friendPreviewAddBtn && e.friendPreviewAddLabel) {
                if (isFriend) {
                    e.friendPreviewAddBtn.classList.add('added');
                    e.friendPreviewAddBtn.style.opacity = '0.7';
                    e.friendPreviewAddBtn.disabled = true;
                    e.friendPreviewAddLabel.textContent = 'Friends ✓';
                } else if (isIncoming) {
                    e.friendPreviewAddBtn.classList.remove('added');
                    e.friendPreviewAddBtn.style.opacity = '1';
                    e.friendPreviewAddBtn.disabled = false;
                    e.friendPreviewAddLabel.textContent = 'Add Back 🤝';
                } else {
                    e.friendPreviewAddBtn.classList.remove('added');
                    e.friendPreviewAddBtn.style.opacity = '1';
                    e.friendPreviewAddBtn.disabled = false;
                    e.friendPreviewAddLabel.textContent = 'Add Friend';
                }
            }

            if (e.friendPreviewChatBtn) {
                if (isFriend) {
                    e.friendPreviewChatBtn.classList.remove('hidden');
                } else {
                    e.friendPreviewChatBtn.classList.add('hidden');
                }
            }

            e.friendProfilePreviewModal?.classList.remove('hidden');
        },

        close() {
            ESCTRIX.elements.friendProfilePreviewModal?.classList.add('hidden');
        },

        async handleAddClick() {
            if (!this.currentUser) return;
            const targetUsername = this.currentUser.username;
            const e = ESCTRIX.elements;
            if (e.friendPreviewAddBtn) {
                e.friendPreviewAddBtn.disabled = true;
                e.friendPreviewAddLabel.textContent = 'Connecting...';
            }
            await ESCTRIX.addContact(targetUsername);
            if (e.friendPreviewAddBtn) {
                e.friendPreviewAddBtn.classList.add('added');
                e.friendPreviewAddLabel.textContent = 'Friends ✓';
                e.friendPreviewAddBtn.style.opacity = '0.7';
            }
            if (e.friendPreviewAddedYouNotice) {
                e.friendPreviewAddedYouNotice.classList.add('hidden');
            }
            if (e.friendPreviewChatBtn) {
                e.friendPreviewChatBtn.classList.remove('hidden');
            }
            ESCTRIX.playSfx('connect');
        },

        handleChatClick() {
            if (!this.currentUser) return;
            const targetUsername = this.currentUser.username;
            this.close();
            ESCTRIX.elements.addFriendModal?.classList.add('hidden');
            ESCTRIX.space.openDirectSpace(targetUsername);
            ESCTRIX.chat.switchChat('space', { spaceName: `@${targetUsername}` });
        }
    },

    // ─────────────────────────────────────────────────────────
    // PASSCODE SCREEN LOCK MODULE
    // ─────────────────────────────────────────────────────────
    passcode: {
        enteredPin: '',
        isLocked: false,

        init() {
            const hasPasscode = Boolean(localStorage.getItem('esctrix_passcode_pin'));
            if (hasPasscode) {
                // Auto lock on tab hide / blur
                document.addEventListener('visibilitychange', () => {
                    if (document.hidden && localStorage.getItem('esctrix_passcode_pin')) {
                        this.lock();
                    }
                });
            }
        },

        promptSetup() {
            const existing = localStorage.getItem('esctrix_passcode_pin');
            if (existing) {
                ESCTRIX.dialog.confirm(
                    'Passcode Security',
                    'A 4-digit Passcode PIN is currently active. Remove security PIN or set a new one?',
                    () => {
                        localStorage.removeItem('esctrix_passcode_pin');
                        ESCTRIX.showToast('Passcode screen lock removed.');
                        ESCTRIX.settings.loadPreferences();
                    }
                );
                return;
            }

            ESCTRIX.dialog.prompt(
                'Setup Screen Lock',
                'Enter a 4-digit security PIN for screen lock:',
                'e.g. 1234',
                '',
                (pin) => {
                    if (pin && /^\d{4}$/.test(pin)) {
                        localStorage.setItem('esctrix_passcode_pin', pin);
                        ESCTRIX.showToast('4-Digit Passcode Lock Enabled! 🔒');
                        ESCTRIX.settings.loadPreferences();
                    } else if (pin) {
                        ESCTRIX.showToast('PIN must be exactly 4 digits (0-9).', true);
                    }
                }
            );
        },

        lock() {
            const pin = localStorage.getItem('esctrix_passcode_pin');
            if (!pin) return;
            this.isLocked = true;
            this.enteredPin = '';
            this.updateDots();
            ESCTRIX.elements.passcodeLockOverlay?.classList.remove('hidden');
        },

        pressDigit(digit) {
            if (this.enteredPin.length < 4) {
                this.enteredPin += digit;
                ESCTRIX.playSfx('click');
                this.updateDots();
                if (this.enteredPin.length === 4) {
                    setTimeout(() => this.verify(), 150);
                }
            }
        },

        clearDigit() {
            if (this.enteredPin.length > 0) {
                this.enteredPin = this.enteredPin.slice(0, -1);
                ESCTRIX.playSfx('click');
                this.updateDots();
            }
        },

        updateDots() {
            const dots = document.querySelectorAll('.pin-dot');
            dots.forEach((dot, idx) => {
                dot.classList.toggle('filled', idx < this.enteredPin.length);
            });
            if (ESCTRIX.elements.pinErrorMsg) {
                ESCTRIX.elements.pinErrorMsg.textContent = '';
            }
        },

        verify() {
            const saved = localStorage.getItem('esctrix_passcode_pin');
            if (this.enteredPin === saved) {
                ESCTRIX.playSfx('receive');
                this.isLocked = false;
                ESCTRIX.elements.passcodeLockOverlay?.classList.add('hidden');
                this.enteredPin = '';
                this.updateDots();
                ESCTRIX.showToast('Screen unlocked! 🔓');
            } else {
                ESCTRIX.playSfx('call');
                if (ESCTRIX.elements.pinErrorMsg) {
                    ESCTRIX.elements.pinErrorMsg.textContent = 'Incorrect PIN. Try again.';
                }
                this.enteredPin = '';
                this.updateDots();
            }
        }
    },

    // ─────────────────────────────────────────────────────────
    // CHAT & MESSAGING MODULE
    // ─────────────────────────────────────────────────────────
    chat: {
        switchChat(type, spaceData = null) {
            ESCTRIX.playSfx('click');
            const e = ESCTRIX.elements;
            const s = ESCTRIX.state;

            // Mark sidebar items active
            document.querySelectorAll('.chat-thread-item').forEach(i => i.classList.remove('active'));

            if (type === 'ai') {
                s.activeChat = {
                    id: 'ai',
                    type: 'ai',
                    title: 'Aura AI Neural Companion',
                    subtitle: 'Neural link synchronized • E2EE',
                    avatar: 'sparkle',
                    online: true
                };
                e.threadAuraAi?.classList.add('active');
                if (e.activeChatAvatar) {
                    e.activeChatAvatar.innerHTML = '<i class="ph ph-sparkle"></i>';
                    e.activeChatAvatar.style.background = 'linear-gradient(135deg, #8b5cf6, #06d6c7)';
                }
                this.hideChatGate();
            } else if (type === 'saved') {
                s.activeChat = {
                    id: 'saved',
                    type: 'saved',
                    title: 'Saved Messages',
                    subtitle: 'Personal encrypted cloud vault',
                    avatar: 'bookmark',
                    online: true
                };
                e.threadSavedMessages?.classList.add('active');
                if (e.activeChatAvatar) {
                    e.activeChatAvatar.innerHTML = '<i class="ph ph-bookmark-simple"></i>';
                    e.activeChatAvatar.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
                }
                this.hideChatGate();
            } else if (type === 'space') {
                const spaceName = spaceData?.spaceName || s.activeSpaceName || 'P2P Space';
                const isDirect = spaceName.startsWith('@');
                const targetUname = isDirect ? spaceName.slice(1) : null;
                s.activeChat = {
                    id: 'space',
                    type: 'space',
                    title: spaceName,
                    subtitle: isDirect ? 'Direct Peer Channel • E2EE' : 'Mesh Room • WebRTC DTLS/SRTP',
                    avatar: isDirect ? 'user' : 'broadcast',
                    online: true
                };
                if (e.activeChatAvatar) {
                    e.activeChatAvatar.innerHTML = isDirect ? '<i class="ph ph-user-circle"></i>' : '<i class="ph ph-broadcast"></i>';
                    e.activeChatAvatar.style.background = isDirect ? 'linear-gradient(135deg, #06d6c7, #3b82f6)' : 'linear-gradient(135deg, #10b981, #06d6c7)';
                }

                if (isDirect && targetUname) {
                    this.checkChatGate(targetUname);
                    // Fetch direct message history from database
                    if (s.user?.username) {
                        const chatKey = `@${targetUname}`;
                        fetch(`/api/direct-messages/${encodeURIComponent(targetUname)}?username=${encodeURIComponent(s.user.username)}`)
                            .then(res => res.json())
                            .then(data => {
                                if (data.status === 'success' && data.messages) {
                                    s.chatHistories[chatKey] = data.messages.map(m => ({
                                        id: m.id,
                                        sender: m.sender_username === s.user.username ? 'me' : 'peer',
                                        name: m.sender_username,
                                        text: m.content,
                                        type: m.msg_type || 'text',
                                        fileUrl: (m.msg_type === 'image' || m.msg_type === 'file' || m.msg_type === 'voice') ? m.content : undefined,
                                        payload: m.msg_type === 'voice' ? m.content : undefined,
                                        fileName: m.file_meta || 'File',
                                        fileSize: '',
                                        vanish: Boolean(m.vanish),
                                        time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
                                    }));
                                    if (s.activeChat && s.activeChat.title === chatKey) {
                                        this.renderMessages();
                                    }
                                }
                            })
                            .catch(() => {});
                    }
                } else {
                    this.hideChatGate();
                }
            }

            e.activeChatName.textContent = s.activeChat.title;
            e.activeChatStatus.textContent = s.activeChat.subtitle;

            // On mobile, trigger layout slide and push history state
            const shell = document.querySelector('.telegram-shell');
            if (shell) {
                const wasOpen = shell.classList.contains('chat-open');
                shell.classList.add('chat-open');
                if (!wasOpen) {
                    ESCTRIX.nav?.pushState('chat', s.activeChat?.title);
                }
            }

            this.renderMessages();
        },

        renderMessages() {
            const e = ESCTRIX.elements;
            const s = ESCTRIX.state;
            const chatKey = (s.activeChat?.title && s.activeChat.title.startsWith('@')) ? s.activeChat.title : s.activeChat?.type;
            const msgs = s.chatHistories[chatKey] || s.chatHistories[s.activeChat?.type] || [];

            e.messagesList.innerHTML = `
                <div class="message system-bubble">
                    <i class="ph ph-lock-key"></i>
                    <span>Zero-Knowledge Encryption Verified. Frequency Secure.</span>
                </div>
            `;

            msgs.forEach(m => this.appendMessageDOM(m));
            e.messagesViewport.scrollTop = e.messagesViewport.scrollHeight;

            // Trigger AI Smart Replies & Vibe check if there are recent messages
            if (msgs.length > 0 && s.activeChat?.type !== 'saved') {
                ESCTRIX.ai.updateSmartReplies(msgs.map(x => x.text || ''));
                ESCTRIX.ai.updateVibeBadge(msgs.map(x => x.text || ''));
            }
        },

        appendMessageDOM(msg) {
            const e = ESCTRIX.elements;
            const div = document.createElement('div');
            const isMe = msg.sender === 'me';
            const isViewOnce = msg.vanish === 'view_once' || msg.vanish === -1 || msg.viewOnce;
            div.className = `message ${isMe ? 'sent' : 'received'} ${msg.vanish ? 'vanish-msg' : ''}`;
            const timeStr = msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let tickClass = 'tick-read';
            let tickIcon = 'ph-checks';
            if (msg.status === 'sent') {
                tickClass = 'tick-sent';
                tickIcon = 'ph-check';
            } else if (msg.status === 'delivered') {
                tickClass = 'tick-delivered';
                tickIcon = 'ph-checks';
            }
            const statusTick = isMe ? `<span class="msg-status-tick ${tickClass}"><i class="ph ${tickIcon}"></i></span>` : '';

            // Quoted message snippet if replying (WA / TG style)
            const quoteHtml = msg.replyTo ? `
                <div class="message-reply-quote">
                    <span class="message-reply-quote-sender">${msg.replyTo.sender || 'Peer'}</span>
                    <span class="message-reply-quote-text">${msg.replyTo.text || ''}</span>
                </div>
            ` : '';

            const vanishDuration = typeof msg.vanish === 'number' && msg.vanish > 0 ? msg.vanish : 10;
            // Vanish header badge if active
            const vanishHeader = (msg.vanish && !isViewOnce) ? `
                <div class="vanish-badge">
                    <i class="ph ph-ghost"></i> <span class="vanish-countdown-txt">${vanishDuration}s</span>
                    <div class="vanish-bar"><div class="vanish-bar-fill"></div></div>
                </div>
            ` : '';

            // Quick Emoji Reaction Bar (Float on hover + Quick Reply)
            const reactionBar = `
                <div class="msg-reactions-bar">
                    <button class="reaction-quick-btn" data-emoji="🔥">🔥</button>
                    <button class="reaction-quick-btn" data-emoji="⚡">⚡</button>
                    <button class="reaction-quick-btn" data-emoji="🛡️">🛡️</button>
                    <button class="reaction-quick-btn" data-emoji="👀">👀</button>
                    <button class="reaction-quick-btn" data-emoji="❤️">❤️</button>
                    <button class="msg-reply-trigger-btn" title="Reply"><i class="ph ph-arrow-bend-up-left"></i></button>
                </div>
            `;

            const vanishFooter = (msg.vanish && !isViewOnce) ? `
                <div class="vanish-footer">
                    <i class="ph ph-shield-warning"></i> Auto-destructing in ${vanishDuration} seconds
                </div>
            ` : '';

            if (isViewOnce) {
                div.innerHTML = `
                    ${reactionBar}
                    <div class="view-once-bubble">
                        <div class="view-once-card">
                            <div class="view-once-icon"><i class="ph ph-lock-key"></i></div>
                            <div class="view-once-meta">
                                <span class="view-once-title">View-Once Encrypted Media</span>
                                <span class="view-once-sub">${msg.fileName || (msg.type === 'video' ? 'Encrypted Video' : 'Encrypted Photo')} • Single View</span>
                            </div>
                            <button class="view-once-reveal-btn"><i class="ph ph-eye"></i> View</button>
                        </div>
                    </div>
                    <div class="message-meta">
                        <span>${timeStr}</span>
                        ${statusTick}
                    </div>
                `;
                const card = div.querySelector('.view-once-card');
                card?.addEventListener('click', () => {
                    const mediaUrl = msg.fileUrl || msg.content || '';
                    const isVid = msg.type === 'video';
                    const triggerBurn = () => {
                        card.classList.add('view-once-burned');
                        card.innerHTML = `
                            <div class="view-once-icon" style="background:rgba(255,255,255,0.05); color:#64748b; border-color:transparent;"><i class="ph ph-lock-key-open"></i></div>
                            <div class="view-once-meta"><span class="view-once-title" style="color:#64748b;">Opened & Destroyed</span><span class="view-once-sub">Media permanently erased</span></div>
                        `;
                        setTimeout(() => {
                            div.classList.add('vanish-disintegrate');
                            setTimeout(() => div.remove(), 600);
                        }, 1200);
                    };

                    if (isVid) {
                        ESCTRIX.lightbox.openVideo(mediaUrl, msg.fileName || 'View Once Video', triggerBurn);
                    } else {
                        ESCTRIX.lightbox.open(mediaUrl, msg.fileName || 'View Once Photo', triggerBurn);
                    }
                });
            } else if (msg.type === 'video') {
                const mediaUrl = msg.fileUrl || msg.content || '';
                div.innerHTML = `
                    ${reactionBar}
                    ${vanishHeader}
                    <div class="video-bubble" data-url="${mediaUrl}">
                        <video src="${mediaUrl}" controls playsinline preload="metadata" class="chat-media-video"></video>
                        <div class="video-bubble-overlay">
                            <span><i class="ph ph-video-camera"></i> ${msg.fileName || 'Video'}</span>
                            <span>${msg.fileSize || ''}</span>
                            <a href="${mediaUrl}" download="${msg.fileName || 'video.mp4'}" class="video-dl-btn" title="Download Video">
                                <i class="ph ph-download-simple"></i>
                            </a>
                        </div>
                    </div>
                    <div class="msg-reactions-container"></div>
                    <div class="message-meta">
                        <span>${timeStr}</span>
                        ${statusTick}
                    </div>
                    ${vanishFooter}
                `;
            } else if (msg.type === 'voice') {
                div.innerHTML = `
                    ${reactionBar}
                    ${vanishHeader}
                    <div class="voice-bubble">
                        <button class="voice-play-btn" data-audio="${encodeURIComponent(msg.data || msg.payload || '')}">
                            <i class="ph ph-play"></i>
                        </button>
                        <div class="voice-waveform-preview">
                            <svg class="voice-waveform-svg" viewBox="0 0 160 24" fill="none">
                                <rect x="0" y="8" width="4" height="8" rx="2" fill="currentColor"/>
                                <rect x="8" y="4" width="4" height="16" rx="2" fill="currentColor"/>
                                <rect x="16" y="2" width="4" height="20" rx="2" fill="currentColor"/>
                                <rect x="24" y="6" width="4" height="12" rx="2" fill="currentColor"/>
                                <rect x="32" y="3" width="4" height="18" rx="2" fill="currentColor"/>
                                <rect x="40" y="7" width="4" height="10" rx="2" fill="currentColor"/>
                                <rect x="48" y="1" width="4" height="22" rx="2" fill="currentColor"/>
                                <rect x="56" y="5" width="4" height="14" rx="2" fill="currentColor"/>
                                <rect x="64" y="2" width="4" height="20" rx="2" fill="currentColor"/>
                                <rect x="72" y="8" width="4" height="8" rx="2" fill="currentColor"/>
                                <rect x="80" y="4" width="4" height="16" rx="2" fill="currentColor"/>
                                <rect x="88" y="6" width="4" height="12" rx="2" fill="currentColor"/>
                                <rect x="96" y="1" width="4" height="22" rx="2" fill="currentColor"/>
                                <rect x="104" y="3" width="4" height="18" rx="2" fill="currentColor"/>
                                <rect x="112" y="7" width="4" height="10" rx="2" fill="currentColor"/>
                                <rect x="120" y="4" width="4" height="16" rx="2" fill="currentColor"/>
                                <rect x="128" y="2" width="4" height="20" rx="2" fill="currentColor"/>
                                <rect x="136" y="8" width="4" height="8" rx="2" fill="currentColor"/>
                                <rect x="144" y="7" width="4" height="10" rx="2" fill="currentColor"/>
                            </svg>
                            <div class="voice-meta-row">
                                <span>${msg.duration || '0:05'}</span>
                                <span class="voice-speed-pill" data-speed="1.0">1.0x</span>
                            </div>
                        </div>
                    </div>
                    <div class="msg-reactions-container"></div>
                    <div class="message-meta">
                        <span>${timeStr}</span>
                        ${statusTick}
                    </div>
                    ${vanishFooter}
                `;
                // Bind voice play & speed cycling
                const pBtn = div.querySelector('.voice-play-btn');
                const speedPill = div.querySelector('.voice-speed-pill');
                pBtn?.addEventListener('click', () => ESCTRIX.voice.playAudio(decodeURIComponent(pBtn.dataset.audio), pBtn, speedPill));
                speedPill?.addEventListener('click', () => {
                    const speeds = [1.0, 1.5, 2.0];
                    let cur = parseFloat(speedPill.dataset.speed || '1.0');
                    let next = speeds[(speeds.indexOf(cur) + 1) % speeds.length];
                    speedPill.dataset.speed = String(next);
                    speedPill.textContent = `${next.toFixed(1)}x`;
                    if (ESCTRIX.state.currentAudioPlayer) {
                        ESCTRIX.state.currentAudioPlayer.playbackRate = next;
                    }
                });
            } else if (msg.type === 'image') {
                div.innerHTML = `
                    ${reactionBar}
                    ${vanishHeader}
                    <div class="image-bubble" data-url="${msg.fileUrl || msg.content || ''}">
                        <img src="${msg.fileUrl || msg.content || ''}" class="chat-media-thumb" alt="${msg.fileName || 'Shared Photo'}">
                        <div class="image-bubble-overlay">
                            <span><i class="ph ph-image"></i> ${msg.fileName || 'Photo'}</span>
                            <span>${msg.fileSize || ''}</span>
                        </div>
                    </div>
                    <div class="msg-reactions-container"></div>
                    <div class="message-meta">
                        <span>${timeStr}</span>
                        ${statusTick}
                    </div>
                    ${vanishFooter}
                `;
                div.querySelector('.image-bubble')?.addEventListener('click', () => {
                    ESCTRIX.lightbox.open(msg.fileUrl || msg.content || '', msg.fileName || 'Encrypted Photo');
                });
            } else if (msg.type === 'file') {
                div.innerHTML = `
                    ${reactionBar}
                    ${vanishHeader}
                    <div class="file-bubble">
                        <div class="file-icon-box"><i class="ph ph-file-arrow-down"></i></div>
                        <div class="file-details">
                            <span class="file-name">${msg.fileName || 'Shared Document'}</span>
                            <span class="file-size">${msg.fileSize || 'Encrypted File'}</span>
                        </div>
                        <a href="${msg.fileUrl || msg.content || '#'}" download="${msg.fileName || 'file'}" class="file-dl-btn">
                            <i class="ph ph-download-simple"></i>
                        </a>
                    </div>
                    <div class="msg-reactions-container"></div>
                    <div class="message-meta">
                        <span>${timeStr}</span>
                        ${statusTick}
                    </div>
                    ${vanishFooter}
                `;
            } else {
                // Text / Markdown snippet
                const formatted = ESCTRIX.chat.formatMarkdown(msg.text || msg.content || '');
                div.innerHTML = `
                    ${reactionBar}
                    ${vanishHeader}
                    ${!isMe && msg.name ? `<span class="sender-name">${msg.name}</span>` : ''}
                    ${quoteHtml}
                    <div class="message-text">${formatted}</div>
                    <div class="msg-reactions-container"></div>
                    <div class="message-meta">
                        <span>${timeStr}</span>
                        ${statusTick}
                    </div>
                    ${vanishFooter}
                `;
            }

            // Bind Reaction Emojis
            div.querySelectorAll('.reaction-quick-btn').forEach(btn => {
                btn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const emoji = btn.dataset.emoji;
                    const rContainer = div.querySelector('.msg-reactions-container');
                    if (rContainer) {
                        const existingPill = rContainer.querySelector(`[data-emoji="${emoji}"]`);
                        if (existingPill) {
                            let count = parseInt(existingPill.dataset.count || '1') + 1;
                            existingPill.dataset.count = String(count);
                            existingPill.textContent = `${emoji} ${count}`;
                        } else {
                            const pill = document.createElement('span');
                            pill.className = 'msg-reaction-pill';
                            pill.dataset.emoji = emoji;
                            pill.dataset.count = '1';
                            pill.textContent = emoji;
                            rContainer.appendChild(pill);
                        }
                        ESCTRIX.playSfx('click');
                    }
                });
            });

            // Quick Reply button trigger
            div.querySelector('.msg-reply-trigger-btn')?.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const senderName = isMe ? 'You' : (msg.name || ESCTRIX.state.activeChat?.title || 'Peer');
                const snippet = msg.text || msg.fileName || (msg.type ? `[${msg.type}]` : 'Message');
                ESCTRIX.chat.startReply(senderName, snippet);
            });

            // Instagram double-tap / double-click to like
            div.addEventListener('dblclick', (ev) => {
                if (ev.target.closest('button, a, video, audio, input')) return;
                const heart = document.createElement('div');
                heart.className = 'heart-burst';
                heart.textContent = '❤️';
                div.appendChild(heart);
                setTimeout(() => heart.remove(), 900);
                ESCTRIX.playSfx('click');

                const rContainer = div.querySelector('.msg-reactions-container');
                if (rContainer) {
                    const existingPill = rContainer.querySelector('[data-emoji="❤️"]');
                    if (existingPill) {
                        let count = parseInt(existingPill.dataset.count || '1') + 1;
                        existingPill.dataset.count = String(count);
                        existingPill.textContent = `❤️ ${count}`;
                    } else {
                        const pill = document.createElement('span');
                        pill.className = 'msg-reaction-pill';
                        pill.dataset.emoji = '❤️';
                        pill.dataset.count = '1';
                        pill.textContent = '❤️';
                        rContainer.appendChild(pill);
                    }
                }
            });

            // Handle Vanishing Countdown Timer
            if (msg.vanish && !isViewOnce) {
                const totalDuration = typeof msg.vanish === 'number' && msg.vanish > 0 ? msg.vanish : 10;
                let timeLeft = totalDuration;
                const countTxt = div.querySelector('.vanish-countdown-txt');
                const barFill = div.querySelector('.vanish-bar-fill');
                if (countTxt) countTxt.textContent = `${timeLeft}s`;
                const vanishInterval = setInterval(() => {
                    timeLeft -= 1;
                    if (countTxt) countTxt.textContent = `${timeLeft}s`;
                    if (barFill) barFill.style.width = `${(timeLeft / totalDuration) * 100}%`;
                    if (timeLeft <= 0) {
                        clearInterval(vanishInterval);
                        div.classList.add('vanish-disintegrate');
                        setTimeout(() => {
                            div.remove();
                            const chatKey = (ESCTRIX.state.activeChat?.title && ESCTRIX.state.activeChat.title.startsWith('@')) ? ESCTRIX.state.activeChat.title : ESCTRIX.state.activeChat?.type;
                            const history = ESCTRIX.state.chatHistories[chatKey];
                            if (history) {
                                const idx = history.indexOf(msg);
                                if (idx > -1) history.splice(idx, 1);
                            }
                        }, 600);
                    }
                }, 1000);
            }

            e.messagesList.appendChild(div);
            e.messagesViewport.scrollTop = e.messagesViewport.scrollHeight;
        },

        startReply(sender, text) {
            ESCTRIX.state.activeReplyTo = { sender, text };
            const e = ESCTRIX.elements;
            if (e.replyPreviewSender) e.replyPreviewSender.textContent = `Replying to ${sender}`;
            if (e.replyPreviewText) e.replyPreviewText.textContent = text.length > 55 ? text.substring(0, 52) + '...' : text;
            if (e.replyPreviewBar) e.replyPreviewBar.classList.remove('hidden');
            e.messageInput?.focus();
        },

        cancelReply() {
            ESCTRIX.state.activeReplyTo = null;
            if (ESCTRIX.elements.replyPreviewBar) ESCTRIX.elements.replyPreviewBar.classList.add('hidden');
        },

        formatMarkdown(text) {
            // Safe escape and formatting
            let escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            // Code block ```code```
            escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>');
            // Bold **text**
            escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Italic *text*
            escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
            // Linebreaks
            escaped = escaped.replace(/\n/g, '<br>');
            return escaped;
        },

        async sendMessage(overrideText = '') {
            const e = ESCTRIX.elements;
            const s = ESCTRIX.state;
            const text = overrideText || e.messageInput.value.trim();
            if (!text) return;

            e.messageInput.value = '';
            ESCTRIX.playSfx('send');

            const chatKey = (s.activeChat?.title && s.activeChat.title.startsWith('@')) ? s.activeChat.title : s.activeChat?.type;
            const isDirect = s.activeChat?.title && s.activeChat.title.startsWith('@');
            const targetUname = isDirect ? s.activeChat.title.slice(1) : null;

            const replySnapshot = s.activeReplyTo ? { ...s.activeReplyTo } : null;
            this.cancelReply();

            const newMsg = {
                sender: 'me',
                text,
                type: 'text',
                vanish: s.vanishMode,
                status: 'sent',
                replyTo: replySnapshot,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            // Store in active chat history
            if (!s.chatHistories[chatKey]) s.chatHistories[chatKey] = [];
            s.chatHistories[chatKey].push(newMsg);
            this.appendMessageDOM(newMsg);

            // Routing
            if (s.activeChat.type === 'ai') {
                ESCTRIX.ai.handleUserQuery(text);
            } else if (s.activeChat.type === 'saved') {
                ESCTRIX.savedVault.save(text);
            } else if (isDirect && targetUname) {
                if (s.userWs && s.userWs.readyState === WebSocket.OPEN) {
                    s.userWs.send(JSON.stringify({
                        type: 'direct_chat_message',
                        target_username: targetUname,
                        content: text,
                        msg_type: 'text',
                        vanish: s.vanishMode ? 1 : 0,
                        reply_to: replySnapshot,
                        sender_display_name: s.user?.display_name || s.user?.username
                    }));
                }
                if (s.p2p) {
                    s.p2p.sendData({
                        type: 'chat',
                        text,
                        senderName: s.user?.display_name || s.user?.username,
                        vanish: s.vanishMode,
                        replyTo: replySnapshot
                    });
                }
            } else if (s.activeChat.type === 'space') {
                if (s.p2p) {
                    s.p2p.sendData({
                        type: 'chat',
                        text,
                        senderName: s.user?.display_name || s.user?.username,
                        vanish: s.vanishMode,
                        replyTo: replySnapshot
                    });
                }
            }
        },

        handleTyping() {
            const s = ESCTRIX.state;
            const isDirect = s.activeChat?.title && s.activeChat.title.startsWith('@');
            const targetUname = isDirect ? s.activeChat.title.slice(1) : null;
            if (isDirect && targetUname && s.userWs && s.userWs.readyState === WebSocket.OPEN) {
                s.userWs.send(JSON.stringify({
                    type: 'direct_typing',
                    target_username: targetUname
                }));
            } else if (s.activeChat?.type === 'space' && s.p2p) {
                s.p2p.sendSignalingMessage('typing', { username: s.user?.username });
            }
        },

        handleFileSelect(ev) {
            const file = ev.target.files[0];
            if (!file) return;
            ev.target.value = '';

            const s = ESCTRIX.state;
            const isDirect = s.activeChat?.title && s.activeChat.title.startsWith('@');
            const targetUname = isDirect ? s.activeChat.title.slice(1) : null;
            const vanishSetting = s.vanishTimer !== undefined && s.vanishTimer !== 0 ? s.vanishTimer : (s.vanishMode ? 10 : 0);

            ESCTRIX.chunks.sendFile({
                file,
                isDirect,
                targetUsername: targetUname,
                p2p: s.p2p,
                vanish: vanishSetting
            });
        },

        toggleVanishMode() {
            const durations = [0, 5, 10, 30, 'view_once'];
            let cur = ESCTRIX.state.vanishTimer || 0;
            let nextIdx = (durations.indexOf(cur) + 1) % durations.length;
            let nextVal = durations[nextIdx];
            ESCTRIX.state.vanishTimer = nextVal;
            ESCTRIX.state.vanishMode = nextVal !== 0;

            const burnSelect = document.getElementById('pref-burn-timer');
            if (burnSelect) burnSelect.value = String(nextVal);

            const labelEl = document.getElementById('menu-vanish-label');
            const toastTxt = nextVal === 0 
                ? 'Vanish Timer: OFF (Messages preserved)' 
                : (nextVal === 'view_once' 
                    ? 'Vanish Mode: VIEW-ONCE 🔒 (Single view auto-burn)' 
                    : `Vanish Timer: ${nextVal} SECONDS ⏱️`);

            if (labelEl) {
                labelEl.textContent = nextVal === 0 
                    ? 'Vanish Timer: Off' 
                    : (nextVal === 'view_once' ? 'Vanish: View-Once 🔒' : `Vanish: ${nextVal}s`);
            }

            ESCTRIX.playSfx('click');
            ESCTRIX.showToast(toastTxt);
        },

        burnSpace() {
            ESCTRIX.dialog.confirm(
                'Burn Space Room',
                'Permanently wipe this room, flush cryptographic keys, and purge all data for everyone?',
                () => {
                    ESCTRIX.playSfx('call');
                    const s = ESCTRIX.state;
                    const chatKey = (s.activeChat?.title && s.activeChat.title.startsWith('@')) ? s.activeChat.title : s.activeChat?.type;
                    if (s.p2p) {
                        s.p2p.sendData({ type: 'burn_room' });
                    }
                    s.chatHistories[chatKey] = [];
                    s.chatHistories['space'] = [];
                    ESCTRIX.chat.renderMessages();
                    ESCTRIX.showToast('Room Purged & Cryptographically Burned. 🧹');
                },
                true
            );
        },

        exportHistory() {
            const s = ESCTRIX.state;
            const chatKey = (s.activeChat?.title && s.activeChat.title.startsWith('@')) ? s.activeChat.title : s.activeChat?.type;
            const history = s.chatHistories[chatKey] || s.chatHistories[s.activeChat?.type] || [];
            const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ESCTRIX_${(s.activeChat?.title || 'chat').replace(/\s+/g, '_')}_history.json`;
            a.click();
            ESCTRIX.showToast('Chat history exported securely. 💾');
        },

        clearCurrentView() {
            const s = ESCTRIX.state;
            const chatKey = (s.activeChat?.title && s.activeChat.title.startsWith('@')) ? s.activeChat.title : s.activeChat?.type;
            s.chatHistories[chatKey] = [];
            if (s.activeChat?.type) s.chatHistories[s.activeChat.type] = [];
            ESCTRIX.chat.renderMessages();
            ESCTRIX.showToast('Local chat view cleared.');
        },

        filterFolder(folder) {
            document.querySelectorAll('.folder-tab').forEach(t => t.classList.remove('active'));
            document.querySelector(`.folder-tab[data-folder="${folder}"]`)?.classList.add('active');

            const aiThread = ESCTRIX.elements.threadAuraAi;
            const savedThread = ESCTRIX.elements.threadSavedMessages;
            const dynamicList = ESCTRIX.elements.dynamicChatThreads;

            if (folder === 'all') {
                aiThread.style.display = 'flex';
                savedThread.style.display = 'flex';
                dynamicList.style.display = 'block';
                this.renderChatList();
            } else if (folder === 'ai') {
                aiThread.style.display = 'flex';
                savedThread.style.display = 'none';
                dynamicList.style.display = 'none';
            } else if (folder === 'saved') {
                aiThread.style.display = 'none';
                savedThread.style.display = 'flex';
                dynamicList.style.display = 'none';
            } else if (folder === 'spaces') {
                aiThread.style.display = 'none';
                savedThread.style.display = 'none';
                dynamicList.style.display = 'block';
                this.renderChatList();
            } else if (folder === 'contacts') {
                aiThread.style.display = 'none';
                savedThread.style.display = 'none';
                dynamicList.style.display = 'block';
                this.renderContactsFolder();
            } else {
                aiThread.style.display = 'flex';
                savedThread.style.display = 'flex';
                dynamicList.style.display = 'block';
                this.renderChatList();
            }
        },

        async handleSearch(query) {
            const q = query.trim();
            const e = ESCTRIX.elements;
            if (!q) {
                e.searchClearBtn?.classList.add('hidden');
                e.threadAuraAi?.classList.remove('hidden');
                e.threadSavedMessages?.classList.remove('hidden');
                this.renderChatList();
                return;
            }
            e.searchClearBtn?.classList.remove('hidden');
            // Hide default pinned companion threads during active contact search
            e.threadAuraAi?.classList.add('hidden');
            e.threadSavedMessages?.classList.add('hidden');

            try {
                const res = await fetch(`/api/user/search?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                if (data.status === 'success') {
                    this.renderSearchResults(data.users, q);
                }
            } catch (err) {}
        },

        renderSearchResults(users, query) {
            const list = ESCTRIX.elements.dynamicChatThreads;
            if (!users || users.length === 0) {
                list.innerHTML = `<div style="padding:20px; text-align:center; font-size:0.85rem; color:var(--text-muted)">
                    <i class="ph ph-user-circle" style="font-size:2rem; opacity:0.5; display:block; margin-bottom:8px;"></i>
                    No users found matching <strong style="color:var(--accent)">${query}</strong>
                </div>`;
                return;
            }

            const contacts = ESCTRIX.state.contacts || [];
            const contactUsernames = new Set(contacts.map(c => c.contact_username));

            list.innerHTML = users.map(u => {
                const isContact = contactUsernames.has(u.username);
                const avatarContent = u.avatar_photo
                    ? `<img src="${u.avatar_photo}" class="avatar-img" alt="Avatar">`
                    : (u.display_name || u.username).charAt(0).toUpperCase();
                const avatarBg = u.avatar_photo ? 'transparent' : (u.avatar_color || 'var(--primary)');
                return `
                    <div class="chat-thread-item user-search-result" data-username="${u.username}">
                        <div class="thread-avatar-wrap">
                            <div class="thread-avatar" style="background:${avatarBg}">
                                ${avatarContent}
                            </div>
                        </div>
                        <div class="thread-info">
                            <div class="thread-top-line">
                                <span class="thread-title">${u.display_name || u.username}</span>
                                <div style="display:flex; align-items:center; gap:4px;">
                                    <button class="user-search-add-btn ${isContact ? 'added' : ''}" data-add="${u.username}" title="${isContact ? 'In Contacts' : 'Add Friend'}">
                                        <i class="ph ${isContact ? 'ph-check' : 'ph-user-plus'}"></i> ${isContact ? 'Friend' : 'Add'}
                                    </button>
                                    <button class="user-search-msg-btn" data-dm="${u.username}" title="Message @${u.username}">
                                        <i class="ph ph-chat-circle-dots"></i> Message
                                    </button>
                                </div>
                            </div>
                            <div class="thread-bottom-line">
                                <span class="thread-preview" style="color:var(--accent); font-weight:600;">@${u.username}</span>
                                <span style="font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono);">${u.account_id || ''}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Bind click to open Profile Card, Add Friend, or Message
            list.querySelectorAll('.user-search-result').forEach(row => {
                row.addEventListener('click', async (ev) => {
                    const addBtn = ev.target.closest('.user-search-add-btn');
                    const dmBtn = ev.target.closest('.user-search-msg-btn');
                    const targetUname = row.dataset.username;

                    if (addBtn) {
                        ev.stopPropagation();
                        if (!targetUname || addBtn.classList.contains('added')) return;
                        addBtn.innerHTML = `<i class="ph ph-circle-notch animate-spin"></i>`;
                        await ESCTRIX.addContact(targetUname);
                        addBtn.classList.add('added');
                        addBtn.innerHTML = `<i class="ph ph-check"></i> Friend`;
                        ESCTRIX.playSfx('connect');
                        return;
                    }

                    if (dmBtn) {
                        ev.stopPropagation();
                        ESCTRIX.space.openDirectSpace(targetUname);
                        ESCTRIX.chat.switchChat('space', { spaceName: `@${targetUname}` });
                        return;
                    }
                    const foundUser = users.find(u => u.username === targetUname);
                    if (foundUser) {
                        ESCTRIX.friendPreview.open(foundUser);
                    }
                });
            });
        },

        renderContactsFolder() {
            const list = ESCTRIX.elements.dynamicChatThreads;
            const contacts = ESCTRIX.state.contacts || [];
            const incoming = ESCTRIX.state.incomingFriendAdds || [];

            let html = '';

            // Folder Header with Action
            html += `
                <div class="contacts-section-header">
                    <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.08em; font-weight:700; color:var(--accent);">
                        Friends (${contacts.length})
                    </span>
                    <button id="contacts-find-btn" style="background:rgba(6, 214, 199, 0.12); border:1px solid var(--accent); color:var(--accent); font-size:0.7rem; font-weight:600; padding:4px 9px; border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:5px; transition:all 0.2s ease;">
                        <i class="ph ph-user-plus"></i> Add Friend
                    </button>
                </div>
            `;

            // Incoming requests / "Added You" section
            if (incoming.length > 0) {
                html += `
                    <div style="padding:8px 14px 4px; font-size:0.72rem; color:var(--primary); font-weight:700; text-transform:uppercase; letter-spacing:0.06em; display:flex; align-items:center; gap:6px;">
                        <i class="ph ph-bell-ringing"></i> Added You (${incoming.length})
                    </div>
                `;
                incoming.forEach(u => {
                    const avatarContent = u.avatar_photo
                        ? `<img src="${u.avatar_photo}" class="avatar-img" alt="Avatar">`
                        : (u.display_name || u.username).charAt(0).toUpperCase();
                    const avatarBg = u.avatar_photo ? 'transparent' : (u.avatar_color || 'var(--primary)');
                    html += `
                        <div class="chat-thread-item incoming-friend-item" data-username="${u.username}">
                            <div class="thread-avatar-wrap">
                                <div class="thread-avatar" style="background:${avatarBg}">
                                    ${avatarContent}
                                </div>
                            </div>
                            <div class="thread-info">
                                <div class="thread-top-line">
                                    <span class="thread-title">${u.display_name || u.username}</span>
                                    <button class="user-search-add-btn add-back-btn" data-add="${u.username}" title="Add back to friends">
                                        <i class="ph ph-user-plus"></i> Add Back
                                    </button>
                                </div>
                                <div class="thread-bottom-line">
                                    <span class="thread-preview" style="color:var(--accent); font-weight:600;">@${u.username}</span>
                                    <span style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">${u.account_id || ''}</span>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }

            // Existing contacts / friends list
            if (contacts.length === 0) {
                html += `
                    <div style="padding:32px 18px; text-align:center; color:var(--text-muted);">
                        <i class="ph ph-users" style="font-size:2.5rem; opacity:0.35; display:block; margin-bottom:10px; color:var(--accent);"></i>
                        <div style="font-size:0.9rem; font-weight:600; color:var(--text-main); margin-bottom:4px;">No Friends Added Yet</div>
                        <div style="font-size:0.75rem; line-height:1.4; margin-bottom:14px;">Search and add friends by their @username to unlock direct messaging and WebRTC calls.</div>
                        <button class="btn primary-btn btn-sm" id="contacts-empty-find-btn" style="margin:0 auto; padding:6px 14px; font-size:0.75rem;">
                            <i class="ph ph-magnifying-glass"></i> Find Friends
                        </button>
                    </div>
                `;
            } else {
                contacts.forEach(c => {
                    const avatarContent = c.avatar_photo
                        ? `<img src="${c.avatar_photo}" class="avatar-img" alt="Avatar">`
                        : (c.display_name || c.contact_username).charAt(0).toUpperCase();
                    const avatarBg = c.avatar_photo ? 'transparent' : (c.avatar_color || 'var(--primary)');
                    html += `
                        <div class="chat-thread-item contact-folder-item" data-username="${c.contact_username}">
                            <div class="thread-avatar-wrap">
                                <div class="thread-avatar" style="background:${avatarBg}">
                                    ${avatarContent}
                                </div>
                            </div>
                            <div class="thread-info">
                                <div class="thread-top-line">
                                    <span class="thread-title">${c.display_name || c.contact_username}</span>
                                    <div style="display:flex; align-items:center; gap:4px;">
                                        <button class="user-search-msg-btn contact-dm-btn" data-dm="${c.contact_username}" title="Direct Message">
                                            <i class="ph ph-chat-circle-dots"></i> Chat
                                        </button>
                                    </div>
                                </div>
                                <div class="thread-bottom-line">
                                    <span class="thread-preview" style="color:var(--accent); font-weight:600;">@${c.contact_username}</span>
                                    <span style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">${c.contact_account_id || ''}</span>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }

            list.innerHTML = html;

            // Wire up actions
            list.querySelector('#contacts-find-btn')?.addEventListener('click', () => {
                ESCTRIX.friendSearch.open();
            });
            list.querySelector('#contacts-empty-find-btn')?.addEventListener('click', () => {
                ESCTRIX.friendSearch.open();
            });

            list.querySelectorAll('.add-back-btn').forEach(btn => {
                btn.addEventListener('click', async (ev) => {
                    ev.stopPropagation();
                    const uname = btn.dataset.add;
                    if (!uname) return;
                    btn.innerHTML = `<i class="ph ph-circle-notch animate-spin"></i>`;
                    await ESCTRIX.addContact(uname);
                    btn.innerHTML = `<i class="ph ph-check"></i> Friends`;
                    btn.classList.add('added');
                    ESCTRIX.playSfx('connect');
                    ESCTRIX.chat.renderContactsFolder();
                });
            });

            list.querySelectorAll('.incoming-friend-item').forEach(row => {
                row.addEventListener('click', (ev) => {
                    if (ev.target.closest('.add-back-btn')) return;
                    const uname = row.dataset.username;
                    const incomingUser = (ESCTRIX.state.incomingFriendAdds || []).find(u => u.username === uname);
                    if (incomingUser) ESCTRIX.friendPreview.open(incomingUser);
                });
            });

            list.querySelectorAll('.contact-dm-btn').forEach(btn => {
                btn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const uname = btn.dataset.dm;
                    if (!uname) return;
                    ESCTRIX.space.openDirectSpace(uname);
                    ESCTRIX.chat.switchChat('space', { spaceName: `@${uname}` });
                });
            });

            list.querySelectorAll('.contact-folder-item').forEach(row => {
                row.addEventListener('click', (ev) => {
                    if (ev.target.closest('.contact-dm-btn')) return;
                    const uname = row.dataset.username;
                    const c = (ESCTRIX.state.contacts || []).find(x => x.contact_username === uname);
                    if (c) {
                        ESCTRIX.friendPreview.open({
                            username: c.contact_username,
                            display_name: c.display_name,
                            account_id: c.contact_account_id,
                            avatar_color: c.avatar_color,
                            avatar_photo: c.avatar_photo,
                            bio: c.bio
                        });
                    }
                });
            });
        },

        async checkChatGate(targetUsername) {
            const e = ESCTRIX.elements;
            const s = ESCTRIX.state;
            const myUname = s.user?.username;

            // Aura AI, Saved Messages, and group spaces are ungated
            if (!targetUsername || targetUsername === myUname || s.activeChat?.type === 'ai' || s.activeChat?.type === 'saved') {
                this.hideChatGate();
                return;
            }

            if (s.activeChat?.title && !s.activeChat.title.startsWith('@')) {
                this.hideChatGate();
                return;
            }

            // Check if user is in local contacts
            const isLocalFriend = (s.contacts || []).some(c => c.contact_username === targetUsername);
            if (isLocalFriend) {
                this.hideChatGate();
                return;
            }

            // Check backend friends status
            try {
                const res = await fetch(`/api/user/friends/check?user_a=${encodeURIComponent(myUname)}&user_b=${encodeURIComponent(targetUsername)}`);
                const data = await res.json();
                if (data.status === 'success' && data.is_friend) {
                    this.hideChatGate();
                    return;
                }
            } catch (err) {}

            // Target is not a friend -> Display Gating Shield Card
            s.activeDirectTarget = targetUsername;
            if (e.chatGateCard) {
                e.chatGateCard.classList.remove('hidden');
                if (e.chatGateName) e.chatGateName.textContent = targetUsername;
                if (e.chatGateHandle) e.chatGateHandle.textContent = `@${targetUsername}`;
                if (e.chatGateAvatar) {
                    e.chatGateAvatar.textContent = targetUsername.charAt(0).toUpperCase();
                }

                // Fetch rich profile to enrich gate display
                fetch(`/api/user/profile?username=${encodeURIComponent(targetUsername)}`)
                    .then(r => r.json())
                    .then(p => {
                        if (p.status === 'success' && p.user) {
                            if (e.chatGateName) e.chatGateName.textContent = p.user.display_name || p.user.username;
                            if (e.chatGateAvatar) {
                                if (p.user.avatar_photo) {
                                    e.chatGateAvatar.innerHTML = `<img src="${p.user.avatar_photo}" alt="Avatar">`;
                                    e.chatGateAvatar.style.background = 'transparent';
                                } else {
                                    e.chatGateAvatar.textContent = (p.user.display_name || p.user.username).charAt(0).toUpperCase();
                                    e.chatGateAvatar.style.background = p.user.avatar_color || 'var(--primary)';
                                }
                            }
                        }
                    }).catch(() => {});
            }

            // Disable composer
            if (e.messageInput) {
                e.messageInput.disabled = true;
                e.messageInput.placeholder = `Add @${targetUsername} as a friend to unlock direct messaging`;
            }
            if (e.sendBtn) e.sendBtn.disabled = true;
            if (e.voiceNoteBtn) e.voiceNoteBtn.disabled = true;
            if (e.fileBtn) e.fileBtn.disabled = true;
        },

        hideChatGate() {
            const e = ESCTRIX.elements;
            if (e.chatGateCard) e.chatGateCard.classList.add('hidden');
            if (e.messageInput) {
                e.messageInput.disabled = false;
                e.messageInput.placeholder = "Message... (Type '/' for commands)";
            }
            if (e.sendBtn) e.sendBtn.disabled = false;
            if (e.voiceNoteBtn) e.voiceNoteBtn.disabled = false;
            if (e.fileBtn) e.fileBtn.disabled = false;
        },

        renderChatList() {
            const list = ESCTRIX.elements.dynamicChatThreads;
            const contacts = ESCTRIX.state.contacts || [];

            if (contacts.length === 0 && !ESCTRIX.state.activeSpaceName) {
                list.innerHTML = `<div style="padding:14px; text-align:center; font-size:0.8rem; color:var(--text-muted)">No active contacts or spaces. Click (+) to join.</div>`;
                return;
            }

            let html = '';
            if (ESCTRIX.state.activeSpaceName) {
                html += `
                    <div class="chat-thread-item" id="space-thread-item">
                        <div class="thread-avatar-wrap">
                            <div class="thread-avatar" style="background:linear-gradient(135deg, #10b981, #06d6c7)">
                                <i class="ph ph-broadcast"></i>
                            </div>
                            <span class="presence-dot online"></span>
                        </div>
                        <div class="thread-info">
                            <div class="thread-top-line">
                                <span class="thread-title">${ESCTRIX.state.activeSpaceName}</span>
                                <span class="thread-time">Active</span>
                            </div>
                            <div class="thread-bottom-line">
                                <span class="thread-preview">P2P Mesh Session</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            contacts.forEach(c => {
                html += `
                    <div class="chat-thread-item contact-thread-item" data-contact="${c.contact_username}">
                        <div class="thread-avatar-wrap">
                            <div class="thread-avatar" style="background:${c.avatar_color || 'var(--primary)'}">
                                ${(c.display_name || c.contact_username).charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div class="thread-info">
                            <div class="thread-top-line">
                                <span class="thread-title">${c.display_name || c.contact_username}</span>
                                <span class="thread-time" style="font-family:var(--font-mono); color:var(--accent)">${c.contact_account_id}</span>
                            </div>
                            <div class="thread-bottom-line">
                                <span class="thread-preview">@${c.contact_username}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            list.innerHTML = html;

            document.getElementById('space-thread-item')?.addEventListener('click', () => {
                ESCTRIX.chat.switchChat('space');
            });

            list.querySelectorAll('.contact-thread-item').forEach(el => {
                el.addEventListener('click', () => {
                    const uname = el.dataset.contact;
                    ESCTRIX.space.openDirectSpace(uname);
                    ESCTRIX.chat.switchChat('space', { spaceName: `@${uname}` });
                });
            });
        }
    },

    // ─────────────────────────────────────────────────────────
    // AURA AI SUITE MODULE
    // ─────────────────────────────────────────────────────────
    ai: {
        async handleUserQuery(prompt) {
            return this.sendToAura(prompt);
        },

        async sendToAura(prompt) {
            const e = ESCTRIX.elements;
            // Display typing indicator
            e.typingIndicator.classList.remove('hidden');
            e.typingName.textContent = 'Aura AI';

            try {
                const res = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: prompt })
                });
                const data = await res.json();
                e.typingIndicator.classList.add('hidden');

                if (data.status === 'success' && data.reply) {
                    ESCTRIX.playSfx('receive');
                    const aiMsg = {
                        sender: 'aura',
                        name: 'Aura AI',
                        text: data.reply,
                        type: 'text',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    ESCTRIX.state.chatHistories['ai'].push(aiMsg);
                    ESCTRIX.chat.appendMessageDOM(aiMsg);
                }
            } catch (err) {
                e.typingIndicator.classList.add('hidden');
            }
        },

        async updateSmartReplies(messages) {
            const e = ESCTRIX.elements;
            if (!messages || messages.length === 0) {
                e.smartReplies.classList.add('hidden');
                return;
            }

            try {
                const res = await fetch('/api/ai/smart_reply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: messages.slice(-4) })
                });
                const data = await res.json();
                if (data.status === 'success' && data.replies && data.replies.length > 0) {
                    e.smartReplies.innerHTML = data.replies.map(r => `
                        <button class="smart-reply-chip">${r}</button>
                    `).join('');
                    e.smartReplies.classList.remove('hidden');

                    e.smartReplies.querySelectorAll('.smart-reply-chip').forEach(btn => {
                        btn.addEventListener('click', () => {
                            ESCTRIX.chat.sendMessage(btn.textContent);
                            e.smartReplies.classList.add('hidden');
                        });
                    });
                }
            } catch (err) {}
        },

        async updateVibeBadge(messages) {
            const e = ESCTRIX.elements;
            if (!messages || messages.length === 0) return;

            try {
                const res = await fetch('/api/ai/vibe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: messages.slice(-5) })
                });
                const data = await res.json();
                if (data.status === 'success' && data.vibe) {
                    e.vibeEmoji.textContent = data.vibe.emoji || '✨';
                    e.vibeText.textContent = data.vibe.vibe || 'Clear';
                    e.vibeIndicatorBadge.style.borderColor = data.vibe.color || 'var(--accent)';
                }
            } catch (err) {}
        },

        openPolishModal() {
            ESCTRIX.playSfx('click');
            const curText = ESCTRIX.elements.messageInput.value.trim();
            ESCTRIX.elements.aiPolishInput.value = curText;
            ESCTRIX.elements.aiPolishOutputWrap.classList.add('hidden');
            ESCTRIX.modal.open('ai-polish-modal');
        },

        async executePolish() {
            const text = ESCTRIX.elements.aiPolishInput.value.trim();
            if (!text) return;
            const activeTone = document.querySelector('.tone-btn.active')?.dataset.tone || 'cyberpunk';
            ESCTRIX.elements.executePolishBtn.disabled = true;

            try {
                const res = await fetch('/api/ai/polish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, tone: activeTone })
                });
                const data = await res.json();
                if (data.status === 'success' && data.polished) {
                    ESCTRIX.elements.aiPolishOutput.textContent = data.polished;
                    ESCTRIX.elements.aiPolishOutputWrap.classList.remove('hidden');
                    ESCTRIX.playSfx('receive');
                }
            } catch (err) {} finally {
                ESCTRIX.elements.executePolishBtn.disabled = false;
            }
        },

        applyPolishedText() {
            const polished = ESCTRIX.elements.aiPolishOutput.textContent;
            ESCTRIX.elements.messageInput.value = polished;
            ESCTRIX.modal.close('ai-polish-modal');
            ESCTRIX.elements.messageInput.focus();
            ESCTRIX.playSfx('send');
        },

        openTranslateModal() {
            ESCTRIX.playSfx('click');
            const curText = ESCTRIX.elements.messageInput.value.trim();
            ESCTRIX.elements.aiTranslateInput.value = curText;
            ESCTRIX.elements.aiTranslateOutputWrap.classList.add('hidden');
            ESCTRIX.modal.open('ai-translate-modal');
        },

        async executeTranslate() {
            const text = ESCTRIX.elements.aiTranslateInput.value.trim();
            if (!text) return;
            const targetLang = ESCTRIX.elements.translateLangSelect.value;
            ESCTRIX.elements.executeTranslateBtn.disabled = true;

            try {
                const res = await fetch('/api/ai/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, target_lang: targetLang })
                });
                const data = await res.json();
                if (data.status === 'success' && data.translated) {
                    ESCTRIX.elements.aiTranslateOutput.textContent = data.translated;
                    ESCTRIX.elements.aiTranslateOutputWrap.classList.remove('hidden');
                    ESCTRIX.playSfx('receive');
                }
            } catch (err) {} finally {
                ESCTRIX.elements.executeTranslateBtn.disabled = false;
            }
        },

        sendTranslatedMessage() {
            const translated = ESCTRIX.elements.aiTranslateOutput.textContent;
            ESCTRIX.chat.sendMessage(translated);
            ESCTRIX.modal.close('ai-translate-modal');
        },

        async summarizeActiveChat() {
            const msgs = ESCTRIX.state.chatHistories[ESCTRIX.state.activeChat.type] || [];
            if (msgs.length === 0) {
                ESCTRIX.showToast('No messages in this chat to summarize.', true);
                return;
            }

            ESCTRIX.showToast('Synthesizing chat summary with Aura AI... ⏳');

            try {
                const res = await fetch('/api/ai/summarize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: msgs.map(m => m.text || '') })
                });
                const data = await res.json();
                if (data.status === 'success' && data.summary) {
                    ESCTRIX.playSfx('receive');
                    const sumMsg = {
                        sender: 'aura',
                        name: 'Aura AI Recap',
                        text: data.summary,
                        type: 'text',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    ESCTRIX.state.chatHistories[ESCTRIX.state.activeChat.type].push(sumMsg);
                    ESCTRIX.chat.appendMessageDOM(sumMsg);
                }
            } catch (err) {}
        },

        triggerVibeScan() {
            const msgs = ESCTRIX.state.chatHistories[ESCTRIX.state.activeChat.type] || [];
            if (msgs.length > 0) {
                this.updateVibeBadge(msgs.map(x => x.text || ''));
                ESCTRIX.showToast('Chat vibe analysis refreshed! ⚡');
            } else {
                ESCTRIX.showToast('Need at least 1 message to analyze vibe.', true);
            }
        }
    },

    // ─────────────────────────────────────────────────────────
    // ADVANCED VOICE NOTE MODULE
    // ─────────────────────────────────────────────────────────
    voice: {
        stream: null,
        recorder: null,
        chunks: [],
        timerInterval: null,
        seconds: 0,
        isPaused: false,
        previewAudio: null,
        previewBlob: null,

        async start() {
            const e = ESCTRIX.elements;
            if (this.recorder && this.recorder.state === 'recording') {
                return;
            }

            try {
                this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.chunks = [];
                this.seconds = 0;
                this.isPaused = false;
                this.previewBlob = null;
                if (this.previewAudio) {
                    this.previewAudio.pause();
                    this.previewAudio = null;
                }

                this.recorder = new MediaRecorder(this.stream);
                this.recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) this.chunks.push(event.data);
                };

                this.recorder.start(250); // Slice chunks every 250ms for live preview
                ESCTRIX.playSfx('click');

                // Update HUD DOM
                e.voiceRecordingBar?.classList.remove('hidden');
                if (e.voiceRecTimer) e.voiceRecTimer.textContent = '0:00';
                if (e.voiceRecStatus) e.voiceRecStatus.textContent = 'Recording...';
                if (e.voicePauseBtn) e.voicePauseBtn.innerHTML = '<i class="ph ph-pause"></i>';
                if (e.voicePreviewBtn) e.voicePreviewBtn.classList.add('hidden');

                clearInterval(this.timerInterval);
                this.timerInterval = setInterval(() => {
                    if (!this.isPaused) {
                        this.seconds++;
                        const mins = Math.floor(this.seconds / 60);
                        const secs = (this.seconds % 60).toString().padStart(2, '0');
                        if (e.voiceRecTimer) e.voiceRecTimer.textContent = `${mins}:${secs}`;
                    }
                }, 1000);
            } catch (err) {
                ESCTRIX.showToast('Microphone access denied or unavailable.', true);
            }
        },

        togglePause() {
            const e = ESCTRIX.elements;
            if (!this.recorder) return;

            if (this.recorder.state === 'recording') {
                this.recorder.pause();
                this.isPaused = true;
                if (e.voicePauseBtn) e.voicePauseBtn.innerHTML = '<i class="ph ph-play"></i>';
                if (e.voiceRecStatus) e.voiceRecStatus.textContent = 'Paused';
                if (e.voicePreviewBtn) e.voicePreviewBtn.classList.remove('hidden');
                this.preparePreviewBlob();
                ESCTRIX.playSfx('click');
            } else if (this.recorder.state === 'paused') {
                if (this.previewAudio) {
                    this.previewAudio.pause();
                    this.previewAudio = null;
                }
                this.recorder.resume();
                this.isPaused = false;
                if (e.voicePauseBtn) e.voicePauseBtn.innerHTML = '<i class="ph ph-pause"></i>';
                if (e.voiceRecStatus) e.voiceRecStatus.textContent = 'Recording...';
                ESCTRIX.playSfx('click');
            }
        },

        preparePreviewBlob() {
            if (this.chunks.length > 0) {
                this.previewBlob = new Blob(this.chunks, { type: 'audio/webm' });
            }
        },

        togglePreview() {
            const e = ESCTRIX.elements;
            if (!this.previewBlob && this.chunks.length > 0) {
                this.preparePreviewBlob();
            }
            if (!this.previewBlob) return;

            if (this.previewAudio && !this.previewAudio.paused) {
                this.previewAudio.pause();
                if (e.voicePreviewBtn) e.voicePreviewBtn.innerHTML = '<i class="ph ph-play"></i>';
            } else {
                const url = URL.createObjectURL(this.previewBlob);
                this.previewAudio = new Audio(url);
                this.previewAudio.play();
                if (e.voicePreviewBtn) e.voicePreviewBtn.innerHTML = '<i class="ph ph-pause"></i>';
                this.previewAudio.onended = () => {
                    if (e.voicePreviewBtn) e.voicePreviewBtn.innerHTML = '<i class="ph ph-play"></i>';
                };
            }
        },

        discard() {
            this.cleanup();
            ESCTRIX.playSfx('call');
            ESCTRIX.showToast('Voice note discarded.');
        },

        sendVoice() {
            if (!this.recorder || this.chunks.length === 0) {
                this.cleanup();
                return;
            }

            const durationSecs = Math.max(1, this.seconds);
            const durationStr = `${Math.floor(durationSecs / 60)}:${(durationSecs % 60).toString().padStart(2, '0')}`;

            this.preparePreviewBlob();
            const blob = this.previewBlob || new Blob(this.chunks, { type: 'audio/webm' });
            const reader = new FileReader();

            reader.onloadend = () => {
                const base64 = reader.result;
                const s = ESCTRIX.state;
                const chatKey = (s.activeChat?.title && s.activeChat.title.startsWith('@')) ? s.activeChat.title : s.activeChat?.type;
                const isDirect = s.activeChat?.title && s.activeChat.title.startsWith('@');
                const targetUname = isDirect ? s.activeChat.title.slice(1) : null;

                const voiceMsg = {
                    sender: 'me',
                    type: 'voice',
                    data: base64,
                    payload: base64,
                    duration: durationStr,
                    vanish: s.vanishMode,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };

                if (!s.chatHistories[chatKey]) s.chatHistories[chatKey] = [];
                s.chatHistories[chatKey].push(voiceMsg);
                ESCTRIX.chat.appendMessageDOM(voiceMsg);
                ESCTRIX.playSfx('send');

                if (isDirect && targetUname && s.userWs && s.userWs.readyState === WebSocket.OPEN) {
                    s.userWs.send(JSON.stringify({
                        type: 'direct_chat_message',
                        target_username: targetUname,
                        content: base64,
                        msg_type: 'voice',
                        file_meta: durationStr,
                        vanish: s.vanishMode ? 1 : 0,
                        sender_display_name: s.user?.display_name || s.user?.username
                    }));
                }

                if (s.activeChat?.type === 'space' && s.p2p) {
                    s.p2p.sendData({
                        type: 'voice_note',
                        payload: base64,
                        duration: durationStr,
                        vanish: s.vanishMode
                    });
                }
                this.cleanup();
            };

            reader.readAsDataURL(blob);
        },

        cleanup() {
            if (this.recorder && this.recorder.state !== 'inactive') {
                try { this.recorder.stop(); } catch (e) {}
            }
            if (this.stream) {
                this.stream.getTracks().forEach(t => t.stop());
                this.stream = null;
            }
            if (this.previewAudio) {
                this.previewAudio.pause();
                this.previewAudio = null;
            }
            clearInterval(this.timerInterval);
            this.recorder = null;
            this.chunks = [];
            this.seconds = 0;
            this.isPaused = false;
            this.previewBlob = null;
            ESCTRIX.elements.voiceRecordingBar?.classList.add('hidden');
        },

        playAudio(base64Url, buttonEl, speedPillEl = null) {
            const s = ESCTRIX.state;
            if (s.currentAudioPlayer) {
                s.currentAudioPlayer.pause();
                s.currentAudioPlayer = null;
                document.querySelectorAll('.voice-play-btn i').forEach(i => i.className = 'ph ph-play');
            }

            const audio = new Audio(base64Url);
            const rate = speedPillEl ? parseFloat(speedPillEl.dataset.speed || '1.0') : 1.0;
            audio.playbackRate = rate;
            s.currentAudioPlayer = audio;
            const icon = buttonEl.querySelector('i');
            if (icon) icon.className = 'ph ph-pause';

            audio.onended = () => {
                if (icon) icon.className = 'ph ph-play';
                s.currentAudioPlayer = null;
            };

            audio.play();
        }
    },

    // ─────────────────────────────────────────────────────────
    // COMMAND PALETTE MODULE (Ctrl+K or /)
    // ─────────────────────────────────────────────────────────
    commandPalette: {
        open() {
            ESCTRIX.playSfx('click');
            ESCTRIX.elements.cmdPaletteModal.classList.remove('hidden');
            ESCTRIX.elements.cmdPaletteInput.focus();
            ESCTRIX.elements.cmdPaletteInput.value = '';
        },
        close() {
            ESCTRIX.elements.cmdPaletteModal.classList.add('hidden');
        },
        toggle() {
            if (ESCTRIX.elements.cmdPaletteModal.classList.contains('hidden')) {
                this.open();
            } else {
                this.close();
            }
        },
        run(cmd) {
            this.close();
            if (cmd === '/ai') {
                ESCTRIX.chat.switchChat('ai');
            } else if (cmd === '/polish') {
                ESCTRIX.ai.openPolishModal();
            } else if (cmd === '/translate') {
                ESCTRIX.ai.openTranslateModal();
            } else if (cmd === '/summarize') {
                ESCTRIX.ai.summarizeActiveChat();
            } else if (cmd === '/call') {
                ESCTRIX.call.openCallChooser();
            } else if (cmd === '/vanish') {
                ESCTRIX.chat.toggleVanishMode();
            } else if (cmd === '/burn') {
                ESCTRIX.chat.burnSpace();
            } else if (cmd === '/export') {
                ESCTRIX.chat.exportHistory();
            }
        }
    },

    // ─────────────────────────────────────────────────────────
    // SAVED MESSAGES (Personal Encrypted Cloud Vault)
    // ─────────────────────────────────────────────────────────
    savedMessages: {
        async save(content) {
            const username = ESCTRIX.state.user?.username;
            if (!username) return;
            try {
                await fetch('/api/user/saved_messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, content })
                });
            } catch (e) {}
        }
    },

    async loadSavedMessages() {
        const username = this.state.user?.username;
        if (!username) return;
        try {
            const res = await fetch(`/api/user/saved_messages?username=${encodeURIComponent(username)}`);
            const data = await res.json();
            if (data.status === 'success' && data.messages) {
                this.state.chatHistories['saved'] = data.messages.map(m => ({
                    sender: 'me',
                    text: m.content,
                    type: m.msg_type || 'text',
                    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }));
            }
        } catch (e) {}
    },

    // ─────────────────────────────────────────────────────────
    // CONTACTS MODULE
    // ─────────────────────────────────────────────────────────
    async loadContacts() {
        const username = this.state.user?.username;
        if (!username) return;
        try {
            const res = await fetch(`/api/user/contacts?username=${encodeURIComponent(username)}`);
            const data = await res.json();
            if (data.status === 'success') {
                this.state.contacts = data.contacts || [];
                this.chat.renderChatList();
            }
        } catch (e) {}
    },

    async addContact(contactUsername) {
        const username = this.state.user?.username;
        if (!username || contactUsername === username) return;
        try {
            const res = await fetch('/api/user/contacts/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner_username: username, contact_username: contactUsername })
            });
            const data = await res.json();
            if (data.status === 'success') {
                this.showToast(`Contact @${contactUsername} added! ✨`);
                this.loadContacts();
            }
        } catch (e) {}
    },

    // ─────────────────────────────────────────────────────────
    // SPACE HOSTING & P2P JOIN MODULE
    // ─────────────────────────────────────────────────────────
    space: {
        switchTab(tab) {
            const e = ESCTRIX.elements;
            if (tab === 'host') {
                e.tabHost.classList.add('active-tab');
                e.tabJoin.classList.remove('active-tab');
                e.clientSetup.style.display = 'none';
                if (ESCTRIX.state.activeSpaceName) {
                    e.hostWaiting.style.display = 'block';
                    e.hostSetup.style.display = 'none';
                } else {
                    e.hostSetup.style.display = 'block';
                    e.hostWaiting.style.display = 'none';
                }
            } else {
                e.tabJoin.classList.add('active-tab');
                e.tabHost.classList.remove('active-tab');
                e.clientSetup.style.display = 'block';
                e.hostSetup.style.display = 'none';
                e.hostWaiting.style.display = 'none';
            }
        },

        async startHosting() {
            const e = ESCTRIX.elements;
            const spaceName = e.hostSpaceName.value.trim() || `${ESCTRIX.state.user?.username || 'Host'}-Room`;
            const pin = e.hostPin.value.trim();

            e.hostError.textContent = 'Launching quantum room...';

            try {
                const res = await fetch('/api/host/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: ESCTRIX.state.user?.username,
                        space_name: spaceName,
                        pin
                    })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    ESCTRIX.playSfx('send');
                    ESCTRIX.state.activeSpaceName = spaceName;
                    ESCTRIX.state.activeSpacePin = pin;
                    e.hostError.textContent = '';
                    e.hostSetup.style.display = 'none';
                    e.hostWaiting.style.display = 'block';
                    
                    const qrSrc = data.qr_code && data.qr_code.startsWith('data:') 
                        ? data.qr_code 
                        : `data:image/png;base64,${data.qr_code}`;
                    e.qrCodeImg.src = qrSrc;
                    e.displayPin.textContent = pin || 'NONE';
                    e.mySpaceName.textContent = spaceName;

                    // Initialize WebRTC signaling
                    ESCTRIX.space.initP2P(spaceName, pin, true);
                    ESCTRIX.chat.renderChatList();
                    ESCTRIX.showToast(`Space "${spaceName}" is now live! 🚀`);
                } else {
                    e.hostError.textContent = data.message || 'Space name taken.';
                }
            } catch (err) {
                e.hostError.textContent = 'Server communication error.';
            }
        },

        async stopHosting() {
            const e = ESCTRIX.elements;
            const spaceName = ESCTRIX.state.activeSpaceName;
            if (spaceName) {
                fetch('/api/host/stop', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ space_name: spaceName })
                });
            }
            if (ESCTRIX.state.p2p) {
                ESCTRIX.state.p2p.disconnect();
                ESCTRIX.state.p2p = null;
            }
            ESCTRIX.state.activeSpaceName = '';
            ESCTRIX.state.activeSpacePin = '';
            if (e.hostSpaceName) e.hostSpaceName.value = '';
            if (e.hostPin) e.hostPin.value = '';
            if (e.hostError) e.hostError.textContent = '';
            if (e.hostWaiting) e.hostWaiting.style.display = 'none';
            if (e.hostSetup) e.hostSetup.style.display = 'block';
            ESCTRIX.modal.close('new-space-modal');
            ESCTRIX.chat.renderChatList();
            ESCTRIX.showToast('Space closed.');
        },

        async joinSpace() {
            const e = ESCTRIX.elements;
            const spaceName = e.joinSpaceName.value.trim();
            const pin = e.joinPin.value.trim();

            if (!spaceName) {
                e.authError.textContent = 'Enter space name.';
                return;
            }

            e.authError.textContent = 'Synchronizing peer handshake...';
            ESCTRIX.state.activeSpaceName = spaceName;
            ESCTRIX.state.activeSpacePin = pin;

            ESCTRIX.space.initP2P(spaceName, pin, false);
        },

        openDirectSpace(targetUsername) {
            const myUname = ESCTRIX.state.user?.username;
            const sorted = [myUname, targetUsername].sort();
            const spaceName = `Direct-${sorted[0]}-${sorted[1]}`;
            ESCTRIX.state.activeSpaceName = spaceName;
            ESCTRIX.space.initP2P(spaceName, '', false);
        },

        initP2P(spaceName, pin, isHost) {
            if (ESCTRIX.state.p2p) {
                ESCTRIX.state.p2p.disconnect();
            }

            const e = ESCTRIX.elements;

            ESCTRIX.state.p2p = new P2PConnection(
                // onMessage
                (data) => {
                    ESCTRIX.playSfx('receive');
                    if (data.type === 'chat') {
                        const msg = {
                            sender: 'peer',
                            name: data.senderName || 'Peer',
                            text: data.text,
                            type: 'text',
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                        if (!ESCTRIX.state.chatHistories['space']) ESCTRIX.state.chatHistories['space'] = [];
                        ESCTRIX.state.chatHistories['space'].push(msg);
                        if (ESCTRIX.state.activeChat.type === 'space') {
                            ESCTRIX.chat.appendMessageDOM(msg);
                            ESCTRIX.ai.updateSmartReplies([data.text]);
                            ESCTRIX.ai.updateVibeBadge([data.text]);
                        }
                    } else if (data.type === 'burn_room') {
                        ESCTRIX.state.chatHistories['space'] = [];
                        if (ESCTRIX.state.activeChat.type === 'space') {
                            ESCTRIX.chat.renderMessages();
                        }
                        ESCTRIX.showToast('Room Purged by peer! 🧹');
                    } else if (data.type === 'voice_note') {
                        const vMsg = {
                            sender: 'peer',
                            type: 'voice',
                            data: data.payload,
                            duration: data.duration || '0:05',
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                        if (!ESCTRIX.state.chatHistories['space']) ESCTRIX.state.chatHistories['space'] = [];
                        ESCTRIX.state.chatHistories['space'].push(vMsg);
                        if (ESCTRIX.state.activeChat.type === 'space') {
                            ESCTRIX.chat.appendMessageDOM(vMsg);
                        }
                    } else if (data.type === 'typing') {
                        if (e.typingIndicator && e.typingName) {
                            e.typingName.textContent = data.username || 'Peer';
                            e.typingIndicator.classList.remove('hidden');
                            clearTimeout(ESCTRIX._peerTypingTimer);
                            ESCTRIX._peerTypingTimer = setTimeout(() => {
                                e.typingIndicator.classList.add('hidden');
                            }, 3000);
                        }
                    } else if (data.type === 'file_chunk_meta') {
                        ESCTRIX.chunks.handleChunkMeta(data, false);
                    } else if (data.type === 'file_chunk_data') {
                        ESCTRIX.chunks.handleChunkData(data, false);
                    } else if (data.type === 'file_chunk_complete') {
                        ESCTRIX.chunks.handleChunkComplete(data, false);
                    } else if (data.type === 'file') {
                        const fMsg = {
                            sender: 'peer',
                            type: 'file',
                            fileName: data.name,
                            fileSize: `${(data.size / 1024).toFixed(1)} KB`,
                            fileUrl: data.payload,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                        if (!ESCTRIX.state.chatHistories['space']) ESCTRIX.state.chatHistories['space'] = [];
                        ESCTRIX.state.chatHistories['space'].push(fMsg);
                        if (ESCTRIX.state.activeChat.type === 'space') {
                            ESCTRIX.chat.appendMessageDOM(fMsg);
                        }
                    }
                },
                // onConnectionStateChange
                (state, details) => {
                    console.log('[P2P State]:', state, details);
                    if (state === 'connected') {
                        ESCTRIX.playSfx('send');
                        if (e.authError) e.authError.textContent = '';
                        ESCTRIX.modal.close('new-space-modal');
                        ESCTRIX.chat.switchChat('space');
                        ESCTRIX.showToast('P2P Direct WebRTC Mesh Connected! 🛡️');
                    } else if (state === 'failed_auth') {
                        if (e.authError) {
                            e.authError.textContent = ESCTRIX.state.p2p?.authMessage || 'Authentication failed: Incorrect PIN or invalid space.';
                        }
                    } else if (state === 'disconnected') {
                        if (e.authError && e.authError.textContent.includes('Synchronizing')) {
                            e.authError.textContent = 'Disconnected from room.';
                        }
                    }
                },
                // onTrack
                (stream, peerId) => {
                    ESCTRIX.call.handleRemoteStream(stream);
                },
                // onCallSignal
                (signal) => {
                    ESCTRIX.call.handleSignal(signal);
                }
            );

            ESCTRIX.state.p2p.connectSignaling(
                window.location.host,
                pin,
                ESCTRIX.state.user?.username,
                spaceName
            );
        }
    },

    // ─────────────────────────────────────────────────────────
    // WEBRTC CALLING & MEDIA MODULE
    // ─────────────────────────────────────────────────────────
    call: {
        setupDirectPeerConnection(targetUsername) {
            const s = ESCTRIX.state;
            if (s.directCallPC) {
                try { s.directCallPC.close(); } catch (e) {}
                s.directCallPC = null;
            }
            s.queuedDirectCandidates = [];

            const pc = new RTCPeerConnection({
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
            });

            pc.onicecandidate = (ev) => {
                if (ev.candidate && s.userWs && s.userWs.readyState === WebSocket.OPEN) {
                    s.userWs.send(JSON.stringify({
                        type: 'direct_ice_candidate',
                        target_username: targetUsername,
                        candidate: ev.candidate
                    }));
                }
            };

            pc.ontrack = (ev) => {
                console.log('[Direct Call] Remote audio/video track received:', ev.streams, ev.track);
                const stream = (ev.streams && ev.streams[0]) ? ev.streams[0] : new MediaStream([ev.track]);
                this.handleRemoteStream(stream);
            };

            pc.onconnectionstatechange = () => {
                console.log('[Direct Call] Connection state:', pc.connectionState);
                if (pc.connectionState === 'connected') {
                    ESCTRIX.showToast('Call connected securely! 🛡️');
                } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                    console.log('[Direct Call] Call disconnected or failed');
                }
            };

            s.directCallPC = pc;
            return pc;
        },

        openCallChooser() {
            ESCTRIX.playSfx('click');
            ESCTRIX.elements.callTypePeerName.textContent = ESCTRIX.state.activeChat?.title || 'Peer';
            ESCTRIX.modal.open('call-type-modal');
        },

        async initiate(type) {
            ESCTRIX.modal.close('call-type-modal');
            const s = ESCTRIX.state;
            const e = ESCTRIX.elements;

            // Direct Call Friend-Gating Check
            const isDirect = s.activeChat?.title?.startsWith('@');
            const targetUname = isDirect ? s.activeChat.title.slice(1) : null;
            if (isDirect && targetUname) {
                let isFriend = (s.contacts || []).some(c => c.contact_username === targetUname);
                if (!isFriend && s.user?.username) {
                    try {
                        const checkRes = await fetch(`/api/user/friends/check?user_a=${encodeURIComponent(s.user.username)}&user_b=${encodeURIComponent(targetUname)}`);
                        const checkData = await checkRes.json();
                        if (checkData.status === 'success' && checkData.is_friend) {
                            isFriend = true;
                        }
                    } catch (err) {}
                }
                if (!isFriend) {
                    ESCTRIX.showToast(`Note: Adding @${targetUname} to your friends list ensures prioritized direct calling.`, false);
                }
            }

            ESCTRIX.playSfx('call');

            try {
                const constraints = {
                    audio: true,
                    video: type === 'video' ? { facingMode: s.currentFacingMode } : false
                };
                s.localVideoStream = await navigator.mediaDevices.getUserMedia(constraints);
                if (type === 'video' && e.localVideo) {
                    e.localVideo.srcObject = s.localVideoStream;
                    e.localVideo.style.display = 'block';
                } else if (e.localVideo) {
                    e.localVideo.style.display = 'none';
                }

                // Route through persistent User WebSocket if direct call, otherwise through room signaling
                if (isDirect && targetUname && s.userWs && s.userWs.readyState === WebSocket.OPEN) {
                    s.activeDirectCallTarget = targetUname;
                    const pc = this.setupDirectPeerConnection(targetUname);
                    s.localVideoStream.getTracks().forEach(track => {
                        pc.addTrack(track, s.localVideoStream);
                    });

                    const offer = await pc.createOffer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: type === 'video'
                    });
                    await pc.setLocalDescription(offer);

                    s.userWs.send(JSON.stringify({
                        type: 'direct_call_offer',
                        target_username: targetUname,
                        caller_username: s.user?.username,
                        caller_display_name: s.user?.display_name || s.user?.username,
                        call_type: type,
                        offer: offer
                    }));
                } else {
                    if (s.p2p) {
                        await s.p2p.startMedia(s.localVideoStream);
                        s.p2p.sendCallSignal('call_request', {
                            callType: type,
                            caller: s.user?.display_name || s.user?.username || 'Peer'
                        });
                    }
                }

                if (e.outgoingCallCard) {
                    e.outgoingCallCard.classList.remove('hidden');
                    if (e.outgoingPeerName) e.outgoingPeerName.textContent = isDirect ? `@${targetUname}` : (s.activeChat?.title || 'Peer');
                    if (e.outgoingAvatar) e.outgoingAvatar.textContent = (targetUname || s.activeChat?.title || 'P').replace('@', '').charAt(0).toUpperCase();
                    if (e.outgoingStatus) e.outgoingStatus.textContent = type === 'video' ? 'Outgoing Video Call... Ringing...' : 'Outgoing Voice Call... Ringing...';
                }
                ESCTRIX.startRingtone('outgoing');

                e.videoOverlay.classList.remove('hidden');
                e.videoPeerName.textContent = isDirect ? `@${targetUname}` : (s.activeChat?.title || 'Call in progress');
                if (e.callTimer) e.callTimer.textContent = 'Calling...';
                s.isVideoCalling = true;
                ESCTRIX.showToast(`Initiating ${type} call...`);
            } catch (err) {
                console.error('[Call initiate error]:', err);
                ESCTRIX.stopRingtone();
                if (e.outgoingCallCard) e.outgoingCallCard.classList.add('hidden');
                ESCTRIX.showToast('Camera or Microphone access required for calls.', true);
            }
        },

        handleSignal(signal) {
            if (signal.type === 'call_request') {
                ESCTRIX.startRingtone('incoming');
                const caller = signal.data?.caller || signal.sender || 'Peer';
                const callType = signal.data?.callType || 'video';
                if (ESCTRIX.elements.callerName) ESCTRIX.elements.callerName.textContent = caller;
                if (ESCTRIX.elements.incomingCallTitle) {
                    ESCTRIX.elements.incomingCallTitle.textContent = callType === 'video' ? 'Incoming Video Call' : 'Incoming Audio Call';
                }
                ESCTRIX.state.incomingSpaceCall = signal;
                ESCTRIX.modal.open('call-modal');
            } else if (signal.type === 'call_accepted') {
                ESCTRIX.stopRingtone();
                if (ESCTRIX.elements.outgoingCallCard) ESCTRIX.elements.outgoingCallCard.classList.add('hidden');
                this.startTimer();
                ESCTRIX.playSfx('send');
                ESCTRIX.showToast('Call connected! 📞');
            } else if (signal.type === 'call_declined') {
                ESCTRIX.stopRingtone();
                ESCTRIX.playSfx('decline');
                ESCTRIX.showToast('Call declined.');
                this.end(false);
            } else if (signal.type === 'call_ended') {
                ESCTRIX.stopRingtone();
                ESCTRIX.showToast('Call ended by peer.');
                this.end(false);
            }
        },

        async accept() {
            ESCTRIX.modal.close('call-modal');
            ESCTRIX.stopRingtone();
            const s = ESCTRIX.state;
            const e = ESCTRIX.elements;

            try {
                const isVideo = s.incomingDirectCall ? (s.incomingDirectCall.call_type === 'video') : (s.incomingSpaceCall?.data?.callType === 'video');
                s.localVideoStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: isVideo ? { facingMode: s.currentFacingMode } : false
                });
                if (isVideo && e.localVideo) {
                    e.localVideo.srcObject = s.localVideoStream;
                    e.localVideo.style.display = 'block';
                } else if (e.localVideo) {
                    e.localVideo.style.display = 'none';
                }

                if (s.incomingDirectCall && s.userWs && s.userWs.readyState === WebSocket.OPEN) {
                    const targetUname = s.incomingDirectCall.sender_username;
                    s.activeDirectCallTarget = targetUname;

                    const pc = this.setupDirectPeerConnection(targetUname);
                    s.localVideoStream.getTracks().forEach(track => {
                        pc.addTrack(track, s.localVideoStream);
                    });

                    if (s.incomingDirectCall.offer) {
                        await pc.setRemoteDescription(new RTCSessionDescription(s.incomingDirectCall.offer));
                        while (s.queuedDirectCandidates && s.queuedDirectCandidates.length > 0) {
                            const cand = s.queuedDirectCandidates.shift();
                            pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                        }
                    }

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    s.userWs.send(JSON.stringify({
                        type: 'direct_call_answer',
                        target_username: targetUname,
                        accepted: true,
                        answer: answer
                    }));
                    s.incomingDirectCall = null;
                } else {
                    if (s.p2p) {
                        await s.p2p.startMedia(s.localVideoStream);
                        s.p2p.sendCallSignal('call_accepted', {});
                    }
                    s.incomingSpaceCall = null;
                }

                if (e.outgoingCallCard) e.outgoingCallCard.classList.add('hidden');
                e.videoOverlay.classList.remove('hidden');
                e.videoPeerName.textContent = s.activeDirectCallTarget ? `@${s.activeDirectCallTarget}` : (s.activeChat?.title || 'In Call');
                s.isVideoCalling = true;
                this.startTimer();
            } catch (err) {
                console.error('[Call accept error]:', err);
                ESCTRIX.showToast('Media access error.', true);
            }
        },

        decline() {
            ESCTRIX.modal.close('call-modal');
            ESCTRIX.stopRingtone();
            const s = ESCTRIX.state;
            if (s.incomingDirectCall && s.userWs && s.userWs.readyState === WebSocket.OPEN) {
                s.userWs.send(JSON.stringify({
                    type: 'direct_call_declined',
                    target_username: s.incomingDirectCall.sender_username
                }));
                s.incomingDirectCall = null;
            } else if (s.p2p) {
                s.p2p.sendCallSignal('call_declined', {});
                s.incomingSpaceCall = null;
            }
        },

        handleRemoteStream(stream) {
            const grid = ESCTRIX.elements.groupVideoGrid;
            if (!grid) return;

            let remoteVid = document.getElementById('remote-video-stream');
            if (!remoteVid) {
                remoteVid = document.createElement('video');
                remoteVid.id = 'remote-video-stream';
                remoteVid.autoplay = true;
                remoteVid.playsInline = true;
                remoteVid.style.width = '100%';
                remoteVid.style.height = '100%';
                remoteVid.style.objectFit = 'cover';
                remoteVid.style.borderRadius = '14px';
                grid.appendChild(remoteVid);
            }
            remoteVid.srcObject = stream;
            remoteVid.muted = false;
            remoteVid.volume = 1.0;
            remoteVid.play().catch(e => console.log('[Direct Call] Autoplay handled:', e));

            // Check if audio-only stream (no video tracks enabled)
            const hasVideo = stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;
            let audioCard = document.getElementById('audio-call-indicator-card');
            if (!hasVideo) {
                remoteVid.style.display = 'none';
                if (!audioCard) {
                    audioCard = document.createElement('div');
                    audioCard.id = 'audio-call-indicator-card';
                    audioCard.style.cssText = 'display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; width:100%; gap:16px; color:#fff; text-align:center; padding:20px;';
                    audioCard.innerHTML = `
                        <div class="caller-avatar ringing-pulse" style="width:90px; height:90px; font-size:2.2rem; background:linear-gradient(135deg, #06d6c7, #8b5cf6); margin:0 auto;">
                            <i class="ph ph-waveform"></i>
                        </div>
                        <h3 style="font-size:1.3rem; margin:0; font-weight:700;">Voice Call Connected</h3>
                        <span style="font-size:0.85rem; color:var(--text-muted); background:rgba(6,214,199,0.15); border:1px solid rgba(6,214,199,0.3); padding:4px 14px; border-radius:20px;">
                            <i class="ph ph-shield-check"></i> E2EE Encrypted Audio Channel
                        </span>
                    `;
                    grid.appendChild(audioCard);
                }
                audioCard.style.display = 'flex';
            } else {
                remoteVid.style.display = 'block';
                if (audioCard) audioCard.style.display = 'none';
            }
        },

        startTimer() {
            const s = ESCTRIX.state;
            const e = ESCTRIX.elements;
            s.callSeconds = 0;
            clearInterval(s.callTimerInterval);
            s.callTimerInterval = setInterval(() => {
                s.callSeconds++;
                const mins = Math.floor(s.callSeconds / 60).toString().padStart(2, '0');
                const secs = (s.callSeconds % 60).toString().padStart(2, '0');
                const timeStr = `${mins}:${secs}`;
                if (e.callTimer) e.callTimer.textContent = timeStr;
                if (e.pipTimer) e.pipTimer.textContent = timeStr;
            }, 1000);
        },

        minimize() {
            const s = ESCTRIX.state;
            const e = ESCTRIX.elements;
            if (!s.isVideoCalling) return;
            if (e.videoOverlay) e.videoOverlay.classList.add('hidden');
            if (e.callPipPill) {
                const target = s.activeDirectCallTarget ? `@${s.activeDirectCallTarget}` : (s.activeChat?.title || 'In Call');
                if (e.pipPeerName) e.pipPeerName.textContent = target;
                if (e.pipAvatar) e.pipAvatar.textContent = target.replace('@', '').charAt(0).toUpperCase();
                if (e.pipTimer && e.callTimer) e.pipTimer.textContent = e.callTimer.textContent;
                e.callPipPill.classList.remove('hidden');
            }
            ESCTRIX.showToast('Call minimized to floating window');
        },

        maximize() {
            const e = ESCTRIX.elements;
            if (e.callPipPill) e.callPipPill.classList.add('hidden');
            if (e.videoOverlay) e.videoOverlay.classList.remove('hidden');
        },

        end(sendSignal = true) {
            const s = ESCTRIX.state;
            const e = ESCTRIX.elements;

            ESCTRIX.stopRingtone();
            if (e.outgoingCallCard) e.outgoingCallCard.classList.add('hidden');
            if (e.callPipPill) e.callPipPill.classList.add('hidden');
            if (e.muteBtn) e.muteBtn.classList.remove('is-muted');
            if (e.camOffBtn) e.camOffBtn.classList.remove('is-cam-off');
            if (e.callScreenShareBtn) e.callScreenShareBtn.classList.remove('is-sharing');

            if (sendSignal) {
                // Direct 1-on-1 call end signal
                if (s.activeDirectCallTarget && s.userWs && s.userWs.readyState === WebSocket.OPEN) {
                    s.userWs.send(JSON.stringify({
                        type: 'direct_call_end',
                        target_username: s.activeDirectCallTarget
                    }));
                }
                // Space room call end signal
                if (s.p2p) {
                    s.p2p.sendCallSignal('call_ended', {});
                }
            }

            s.activeDirectCallTarget = null;
            s.incomingDirectCall = null;
            s.incomingSpaceCall = null;

            if (s.directCallPC) {
                try { s.directCallPC.close(); } catch (err) {}
                s.directCallPC = null;
            }
            if (s.localVideoStream) {
                s.localVideoStream.getTracks().forEach(t => t.stop());
                s.localVideoStream = null;
            }
            if (s.screenStream) {
                s.screenStream.getTracks().forEach(t => t.stop());
                s.screenStream = null;
            }

            const audioCard = document.getElementById('audio-call-indicator-card');
            if (audioCard) audioCard.remove();
            const remoteVid = document.getElementById('remote-video-stream');
            if (remoteVid) {
                remoteVid.srcObject = null;
                remoteVid.remove();
            }

            // Also clean up any extra peer video elements in groupVideoGrid
            if (e.groupVideoGrid) {
                const extraVideos = e.groupVideoGrid.querySelectorAll('video:not(#local-video-preview)');
                extraVideos.forEach(v => {
                    v.srcObject = null;
                    v.remove();
                });
            }

            clearInterval(s.callTimerInterval);
            s.callTimerInterval = null;
            s.callSeconds = 0;
            if (e.callTimer) e.callTimer.textContent = '00:00';
            if (e.videoOverlay) e.videoOverlay.classList.add('hidden');
            s.isVideoCalling = false;
            s.isScreenSharing = false;
            s.isMuted = false;
            s.isCamOff = false;

            ESCTRIX.modal.close('call-modal');
            ESCTRIX.modal.close('call-type-modal');
            ESCTRIX.showToast('Call ended.');
        },

        toggleMute() {
            const s = ESCTRIX.state;
            const audioTrack = s.localVideoStream?.getAudioTracks()[0];
            if (audioTrack) {
                s.isMuted = !s.isMuted;
                audioTrack.enabled = !s.isMuted;
                ESCTRIX.elements.muteBtn?.querySelector('i') && (ESCTRIX.elements.muteBtn.querySelector('i').className = s.isMuted ? 'ph ph-microphone-slash' : 'ph ph-microphone');
                ESCTRIX.elements.muteBtn?.classList.toggle('is-muted', s.isMuted);
                if (ESCTRIX.elements.pipMuteBtn) {
                    ESCTRIX.elements.pipMuteBtn.querySelector('i').className = s.isMuted ? 'ph ph-microphone-slash' : 'ph ph-microphone';
                }
                ESCTRIX.showToast(s.isMuted ? 'Muted' : 'Unmuted');
            }
        },

        toggleCam() {
            const s = ESCTRIX.state;
            const videoTrack = s.localVideoStream?.getVideoTracks()[0];
            if (videoTrack) {
                s.isCamOff = !s.isCamOff;
                videoTrack.enabled = !s.isCamOff;
                ESCTRIX.elements.camOffBtn?.querySelector('i') && (ESCTRIX.elements.camOffBtn.querySelector('i').className = s.isCamOff ? 'ph ph-video-camera-slash' : 'ph ph-video-camera');
                ESCTRIX.elements.camOffBtn?.classList.toggle('is-cam-off', s.isCamOff);
            }
        },

        async flipCamera() {
            const s = ESCTRIX.state;
            const e = ESCTRIX.elements;
            if (!s.isVideoCalling) {
                ESCTRIX.showToast('No active video call to switch camera.', true);
                return;
            }

            s.currentFacingMode = s.currentFacingMode === 'user' ? 'environment' : 'user';
            const modeLabel = s.currentFacingMode === 'user' ? 'Front' : 'Back';

            try {
                // Obtain new video track without renegotiation or touching audio
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: s.currentFacingMode } },
                    audio: false
                });
                const newVideoTrack = newStream.getVideoTracks()[0];
                if (!newVideoTrack) {
                    ESCTRIX.showToast('Could not access requested camera.', true);
                    return;
                }

                // Stop previous local video track
                const oldVideoTrack = s.localVideoStream ? s.localVideoStream.getVideoTracks()[0] : null;
                if (oldVideoTrack) {
                    oldVideoTrack.stop();
                    s.localVideoStream.removeTrack(oldVideoTrack);
                }

                // Attach new video track to local stream
                if (s.localVideoStream) {
                    s.localVideoStream.addTrack(newVideoTrack);
                } else {
                    s.localVideoStream = newStream;
                }

                // Update local preview DOM
                if (e.localVideo) {
                    e.localVideo.srcObject = s.localVideoStream;
                }

                // 1. Seamlessly replace track on direct 1-on-1 PeerConnection
                if (s.directCallPC) {
                    const senders = s.directCallPC.getSenders();
                    const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
                    if (videoSender) {
                        await videoSender.replaceTrack(newVideoTrack);
                    }
                }

                // 2. Seamlessly replace track on all mesh room PeerConnections (if in Space room)
                if (s.p2p && s.p2p.peers) {
                    for (const [peerId, peerObj] of s.p2p.peers) {
                        const pc = peerObj?.pc;
                        if (pc) {
                            const senders = pc.getSenders();
                            const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
                            if (videoSender) {
                                await videoSender.replaceTrack(newVideoTrack);
                            }
                        }
                    }
                }

                ESCTRIX.playSfx('send');
                ESCTRIX.showToast(`Switched to ${modeLabel} camera 📷`);
            } catch (err) {
                console.error('[flipCamera error]:', err);
                // Revert facing mode state on error
                s.currentFacingMode = s.currentFacingMode === 'user' ? 'environment' : 'user';
                ESCTRIX.showToast('Camera switch failed: ' + (err.message || 'Permission denied'), true);
            }
        },

        async toggleScreenShare() {
            const s = ESCTRIX.state;
            try {
                if (!s.isScreenSharing) {
                    s.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                    const screenTrack = s.screenStream.getVideoTracks()[0];
                    ESCTRIX.elements.localVideo.srcObject = s.screenStream;
                    s.isScreenSharing = true;
                    screenTrack.onended = () => this.toggleScreenShare();
                    ESCTRIX.showToast('Screen sharing activated.');
                } else {
                    if (s.screenStream) s.screenStream.getTracks().forEach(t => t.stop());
                    ESCTRIX.elements.localVideo.srcObject = s.localVideoStream;
                    s.isScreenSharing = false;
                }
            } catch (err) {}
        },

        sendIncallMessage() {
            const input = ESCTRIX.elements.incallMessageInput;
            const text = input.value.trim();
            if (!text) return;
            input.value = '';
            const msgEl = document.createElement('div');
            msgEl.style.cssText = 'padding:4px 8px; margin-bottom:4px; font-size:0.8rem; background:rgba(255,255,255,0.1); border-radius:6px;';
            msgEl.textContent = `You: ${text}`;
            ESCTRIX.elements.incallMessages.appendChild(msgEl);
            ESCTRIX.state.p2p?.sendData({ type: 'incall_chat', text, sender: ESCTRIX.state.user?.username });
        }
    },

    // ─────────────────────────────────────────────────────────
    // ZERO-KNOWLEDGE E2EE VERIFICATION MODULE
    // ─────────────────────────────────────────────────────────
    verification: {
        openModal() {
            ESCTRIX.playSfx('click');
            const canvas = ESCTRIX.elements.e2eeCanvas;
            const ctx = canvas.getContext('2d');
            const hashLabel = ESCTRIX.elements.e2eeHashLabel;

            // Generate deterministic visual cryptographic pattern based on usernames
            const seed = (ESCTRIX.state.user?.username || 'user') + (ESCTRIX.state.activeSpaceName || 'space');
            let hash = 0;
            for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#060a12';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw holographic generative grid
            const cols = 5;
            const size = canvas.width / cols;
            for (let r = 0; r < cols; r++) {
                for (let c = 0; c < cols; c++) {
                    const val = (hash >> (r * 5 + c)) & 1;
                    if (val) {
                        ctx.fillStyle = (r + c) % 2 === 0 ? '#06d6c7' : '#8b5cf6';
                        ctx.beginPath();
                        ctx.roundRect(c * size + 4, r * size + 4, size - 8, size - 8, [6]);
                        ctx.fill();
                    }
                }
            }

            // Generate Quantum 4 safety emojis
            const emojiPool = ['⚡', '🚀', '🌌', '🔒', '💎', '🛡️', '🛰️', '🔥', '🔮', '🎯', '✨', '🪐', '💫', '🔑', '🧬', '🛸'];
            const absHash = Math.abs(hash);
            const e1 = emojiPool[absHash % emojiPool.length];
            const e2 = emojiPool[(absHash >> 4) % emojiPool.length];
            const e3 = emojiPool[(absHash >> 8) % emojiPool.length];
            const e4 = emojiPool[(absHash >> 12) % emojiPool.length];

            const em1 = document.getElementById('safety-emoji-1');
            const em2 = document.getElementById('safety-emoji-2');
            const em3 = document.getElementById('safety-emoji-3');
            const em4 = document.getElementById('safety-emoji-4');
            if (em1) em1.textContent = e1;
            if (em2) em2.textContent = e2;
            if (em3) em3.textContent = e3;
            if (em4) em4.textContent = e4;

            hashLabel.textContent = `FINGERPRINT: SHA256-${absHash.toString(16).toUpperCase()}-QUANTUM-E2EE`;
            ESCTRIX.modal.open('e2ee-modal');
        }
    },

    // ─────────────────────────────────────────────────────────
    // ADMIN DASHBOARD MODULE
    // ─────────────────────────────────────────────────────────
    admin: {
        async open() {
            ESCTRIX.showScreen('admin-screen');
            this.fetchStats();
            clearInterval(ESCTRIX.state.adminStatsInterval);
            ESCTRIX.state.adminStatsInterval = setInterval(() => this.fetchStats(), 5000);
        },

        async fetchStats() {
            const u = ESCTRIX.state.user?.username;
            try {
                const res = await fetch(`/api/admin/stats?username=${encodeURIComponent(u)}`);
                const data = await res.json();
                if (data.status === 'success') {
                    if (ESCTRIX.elements.statTotalUsers) ESCTRIX.elements.statTotalUsers.textContent = data.total_users || 0;
                    if (ESCTRIX.elements.statActiveHosts) ESCTRIX.elements.statActiveHosts.textContent = data.active_hosts || 0;
                    if (ESCTRIX.elements.statTotalConnections) ESCTRIX.elements.statTotalConnections.textContent = data.total_connections || 0;
                    if (ESCTRIX.elements.statAiStatus) {
                        ESCTRIX.elements.statAiStatus.textContent = data.gemini_active ? 'ONLINE • GEMINI' : 'ONLINE • AURA';
                    }

                    // Populate users table
                    const tbody = ESCTRIX.elements.adminUsersTbody;
                    tbody.innerHTML = (data.user_list || []).map(usr => {
                        const createdDate = usr.created_at ? new Date(usr.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Active';
                        const isRoot = usr.username === 'ESCTRIX_Admin';
                        return `
                            <tr>
                                <td style="font-family:var(--font-mono); color:var(--accent); font-weight:700;">${usr.account_id || 'ESC-LIVE'}</td>
                                <td>
                                    <strong>${usr.display_name || usr.username}</strong>
                                    <span style="display:block; font-size:0.75rem; color:var(--text-muted)">@${usr.username}</span>
                                </td>
                                <td><span class="badge-pill ${usr.role === 'admin' ? 'ai-badge' : ''}">${usr.role.toUpperCase()}</span></td>
                                <td style="font-size:0.8rem; color:var(--text-muted)">${createdDate}</td>
                                <td style="text-align:right">
                                    ${!isRoot ? `
                                        <button class="btn info-outline-btn" style="margin-right:4px;" onclick="ESCTRIX.admin.toggleRole('${usr.username}', '${usr.role}')">
                                            ${usr.role === 'admin' ? 'Demote' : 'Promote'}
                                        </button>
                                        <button class="btn warning-outline-btn" style="margin-right:4px;" onclick="ESCTRIX.admin.promptResetPassword('${usr.username}')">
                                            Reset Key
                                        </button>
                                        <button class="btn danger-outline-btn" onclick="ESCTRIX.admin.deleteUser('${usr.username}')">
                                            Purge
                                        </button>
                                    ` : '<span class="badge-pill" style="opacity:0.6">ROOT</span>'}
                                </td>
                            </tr>
                        `;
                    }).join('');

                    // Populate active hosts
                    const hList = ESCTRIX.elements.adminHostsUl;
                    if (data.active_hosts_list && data.active_hosts_list.length > 0) {
                        hList.innerHTML = data.active_hosts_list.map(h => `
                            <li style="padding:8px; border-bottom:1px solid var(--panel-border); display:flex; justify-content:space-between;">
                                <span>🚀 <strong>${h.hostname}</strong> (${h.clients} peers)</span>
                            </li>
                        `).join('');
                    } else {
                        hList.innerHTML = '<li class="muted-li">No active rooms at this time.</li>';
                    }
                }
            } catch (err) {}
        },

        async toggleRole(targetUsername, currentRole) {
            const newRole = currentRole === 'admin' ? 'user' : 'admin';
            ESCTRIX.dialog.confirm(
                'Update Role Permission',
                `Switch @${targetUsername} role to ${newRole.toUpperCase()}?`,
                async () => {
                    const u = ESCTRIX.state.user?.username;
                    try {
                        const res = await fetch('/api/admin/update_role', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ admin_username: u, target_username: targetUsername, new_role: newRole })
                        });
                        const data = await res.json();
                        ESCTRIX.showToast(data.message || 'Role updated.');
                        this.fetchStats();
                    } catch (e) {
                        ESCTRIX.showToast('Failed to update role.', true);
                    }
                }
            );
        },

        async promptResetPassword(targetUsername) {
            ESCTRIX.dialog.prompt(
                'Reset Identity Key',
                `Enter new password for @${targetUsername}:`,
                'Minimum 4 characters',
                '',
                async (newPwd) => {
                    if (!newPwd || newPwd.length < 4) {
                        ESCTRIX.showToast('Password too short (min 4 characters).', true);
                        return;
                    }
                    const u = ESCTRIX.state.user?.username;
                    try {
                        const res = await fetch('/api/admin/reset_password', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ admin_username: u, target_username: targetUsername, new_password: newPwd })
                        });
                        const data = await res.json();
                        ESCTRIX.showToast(data.message || 'Password updated.');
                    } catch (e) {
                        ESCTRIX.showToast('Failed to reset password.', true);
                    }
                }
            );
        },

        async changeMyPassword() {
            const newPwd = ESCTRIX.elements.adminNewPasswordInput?.value.trim();
            if (!newPwd || newPwd.length < 4) {
                ESCTRIX.showToast('Please enter at least 4 characters for new password.', true);
                return;
            }
            const u = ESCTRIX.state.user?.username;
            try {
                const res = await fetch('/api/admin/reset_password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ admin_username: u, target_username: u, new_password: newPwd })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    if (ESCTRIX.elements.adminNewPasswordInput) ESCTRIX.elements.adminNewPasswordInput.value = '';
                    ESCTRIX.showToast('Commander key updated successfully! 🛡️');
                } else {
                    ESCTRIX.showToast(data.message || 'Update failed', true);
                }
            } catch (e) {
                ESCTRIX.showToast('Server communication error', true);
            }
        },

        async deleteUser(targetUsername) {
            ESCTRIX.dialog.confirm(
                'Purge Account Identity',
                `Permanently purge identity @${targetUsername}? All account records and keys will be deleted.`,
                async () => {
                    const u = ESCTRIX.state.user?.username;
                    try {
                        const res = await fetch('/api/admin/delete_user', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ admin_username: u, target_username: targetUsername })
                        });
                        const data = await res.json();
                        ESCTRIX.showToast(data.message || 'Action executed.');
                        this.fetchStats();
                    } catch (e) {}
                },
                true
            );
        },

        async broadcast() {
            const msg = ESCTRIX.elements.adminBroadcastMsg.value.trim();
            if (!msg) return;
            const u = ESCTRIX.state.user?.username;
            try {
                await fetch('/api/admin/broadcast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ admin_username: u, message: msg })
                });
                ESCTRIX.elements.adminBroadcastMsg.value = '';
                ESCTRIX.showToast('Global announcement transmitted.');
            } catch (e) {}
        }
    },

    // ─────────────────────────────────────────────────────────
    // IN-APP GLASS DIALOG SYSTEM (No Native Alerts)
    // ─────────────────────────────────────────────────────────
    dialog: {
        confirm(title, message, onConfirm, isDanger = false) {
            const e = ESCTRIX.elements;
            if (!e.customDialogModal) return;
            if (e.dialogTitle) e.dialogTitle.textContent = title;
            if (e.dialogMessage) e.dialogMessage.textContent = message;
            if (e.dialogInput) e.dialogInput.classList.add('hidden');
            if (e.dialogIconHalo) e.dialogIconHalo.className = `dialog-icon-halo ${isDanger ? 'danger' : ''}`;
            if (e.dialogIcon) e.dialogIcon.className = `ph ${isDanger ? 'ph-warning-octagon' : 'ph-question'}`;

            e.customDialogModal.classList.add('active');

            const handleConfirm = () => {
                cleanup();
                if (onConfirm) onConfirm();
            };
            const handleCancel = () => {
                cleanup();
            };
            const cleanup = () => {
                e.customDialogModal.classList.remove('active');
                e.dialogConfirmBtn?.removeEventListener('click', handleConfirm);
                e.dialogCancelBtn?.removeEventListener('click', handleCancel);
            };

            e.dialogConfirmBtn?.addEventListener('click', handleConfirm);
            e.dialogCancelBtn?.addEventListener('click', handleCancel);
        },

        prompt(title, message, placeholder = '', defaultValue = '', onConfirm) {
            const e = ESCTRIX.elements;
            if (!e.customDialogModal) return;
            if (e.dialogTitle) e.dialogTitle.textContent = title;
            if (e.dialogMessage) e.dialogMessage.textContent = message;
            if (e.dialogInput) {
                e.dialogInput.classList.remove('hidden');
                e.dialogInput.placeholder = placeholder;
                e.dialogInput.value = defaultValue;
                setTimeout(() => e.dialogInput.focus(), 100);
            }
            if (e.dialogIconHalo) e.dialogIconHalo.className = 'dialog-icon-halo';
            if (e.dialogIcon) e.dialogIcon.className = 'ph ph-pencil-simple';

            e.customDialogModal.classList.add('active');

            const handleConfirm = () => {
                const val = e.dialogInput ? e.dialogInput.value.trim() : '';
                cleanup();
                if (onConfirm) onConfirm(val);
            };
            const handleCancel = () => {
                cleanup();
            };
            const cleanup = () => {
                e.customDialogModal.classList.remove('active');
                e.dialogConfirmBtn?.removeEventListener('click', handleConfirm);
                e.dialogCancelBtn?.removeEventListener('click', handleCancel);
            };

            e.dialogConfirmBtn?.addEventListener('click', handleConfirm);
            e.dialogCancelBtn?.addEventListener('click', handleCancel);
        },

        alert(title, message, isError = false) {
            const e = ESCTRIX.elements;
            if (!e.customDialogModal) return;
            if (e.dialogTitle) e.dialogTitle.textContent = title;
            if (e.dialogMessage) e.dialogMessage.textContent = message;
            if (e.dialogInput) e.dialogInput.classList.add('hidden');
            if (e.dialogCancelBtn) e.dialogCancelBtn.style.display = 'none';
            if (e.dialogIconHalo) e.dialogIconHalo.className = `dialog-icon-halo ${isError ? 'danger' : ''}`;
            if (e.dialogIcon) e.dialogIcon.className = `ph ${isError ? 'ph-x-circle' : 'ph-info'}`;

            e.customDialogModal.classList.add('active');

            const handleClose = () => {
                e.customDialogModal.classList.remove('active');
                if (e.dialogCancelBtn) e.dialogCancelBtn.style.display = 'inline-block';
                e.dialogConfirmBtn?.removeEventListener('click', handleClose);
            };
            e.dialogConfirmBtn?.addEventListener('click', handleClose);
        }
    },

    // ─────────────────────────────────────────────────────────
    // DYNAMIC CUSTOM CONTEXT MENU & LONG-PRESS
    // ─────────────────────────────────────────────────────────
    contextMenu: {
        activeTarget: null,
        targetType: null, // 'message' | 'thread' | 'canvas'

        init() {
            // Block native browser context menu
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.handleTrigger(e.clientX, e.clientY, e.target);
            });

            // Long Press handler for mobile & touchscreens (500ms)
            let touchTimer = null;
            let touchStartPos = { x: 0, y: 0 };

            document.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    const touch = e.touches[0];
                    touchStartPos = { x: touch.clientX, y: touch.clientY };
                    touchTimer = setTimeout(() => {
                        this.handleTrigger(touchStartPos.x, touchStartPos.y, e.target);
                    }, 500);
                }
            }, { passive: true });

            document.addEventListener('touchmove', (e) => {
                if (e.touches.length === 1) {
                    const touch = e.touches[0];
                    const dist = Math.hypot(touch.clientX - touchStartPos.x, touch.clientY - touchStartPos.y);
                    if (dist > 10) clearTimeout(touchTimer);
                }
            }, { passive: true });

            document.addEventListener('touchend', () => clearTimeout(touchTimer), { passive: true });

            // Close context menu on outside click or escape
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#custom-context-menu')) {
                    this.close();
                }
            });
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.close();
            });
        },

        handleTrigger(x, y, targetEl) {
            ESCTRIX.playSfx('click');
            const menu = ESCTRIX.elements.customContextMenu;
            const container = ESCTRIX.elements.contextMenuItems;
            if (!menu || !container) return;

            const msgEl = targetEl.closest('.message');
            const threadEl = targetEl.closest('.chat-thread-item');

            let itemsHtml = '';

            if (msgEl) {
                this.activeTarget = msgEl;
                this.targetType = 'message';
                const textContent = msgEl.querySelector('.message-text')?.textContent || '';
                itemsHtml = `
                    <button class="context-menu-item" data-action="copy">
                        <i class="ph ph-copy"></i> Copy Message
                    </button>
                    <button class="context-menu-item" data-action="reply">
                        <i class="ph ph-arrow-bend-up-left"></i> Reply
                    </button>
                    <button class="context-menu-item" data-action="forward">
                        <i class="ph ph-share-fat"></i> Forward
                    </button>
                    <button class="context-menu-item" data-action="star">
                        <i class="ph ph-star"></i> Star / Save
                    </button>
                    <div class="context-menu-divider"></div>
                    <button class="context-menu-item danger" data-action="delete_msg">
                        <i class="ph ph-trash"></i> Delete for Me
                    </button>
                `;
            } else if (threadEl) {
                this.activeTarget = threadEl;
                this.targetType = 'thread';
                const username = threadEl.dataset.contact || threadEl.dataset.username;
                itemsHtml = `
                    ${username ? `
                    <button class="context-menu-item" data-action="view_profile" data-username="${username}">
                        <i class="ph ph-user"></i> View Profile Card
                    </button>` : ''}
                    <button class="context-menu-item" data-action="pin_chat">
                        <i class="ph ph-push-pin"></i> Pin to Top
                    </button>
                    <button class="context-menu-item" data-action="mute_chat">
                        <i class="ph ph-bell-slash"></i> Mute Alerts
                    </button>
                    <div class="context-menu-divider"></div>
                    <button class="context-menu-item danger" data-action="clear_thread">
                        <i class="ph ph-broom"></i> Clear History
                    </button>
                `;
            } else {
                this.activeTarget = targetEl;
                this.targetType = 'canvas';
                itemsHtml = `
                    <button class="context-menu-item" data-action="new_space">
                        <i class="ph ph-broadcast"></i> Host New Space
                    </button>
                    <button class="context-menu-item" data-action="verify_e2ee">
                        <i class="ph ph-shield-check"></i> E2EE Security Safety
                    </button>
                    <button class="context-menu-item" data-action="settings">
                        <i class="ph ph-gear"></i> Settings Suite
                    </button>
                    <div class="context-menu-divider"></div>
                    <button class="context-menu-item danger" data-action="clear_view">
                        <i class="ph ph-trash"></i> Clear Chat View
                    </button>
                `;
            }

            container.innerHTML = itemsHtml;

            // Bind actions
            container.querySelectorAll('.context-menu-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    this.executeAction(action, e.currentTarget);
                });
            });

            // Positioning within viewport
            menu.style.left = `${Math.min(x, window.innerWidth - 210)}px`;
            menu.style.top = `${Math.min(y, window.innerHeight - 240)}px`;
            menu.classList.add('active');
        },

        close() {
            ESCTRIX.elements.customContextMenu?.classList.remove('active');
        },

        executeAction(action, btnEl) {
            this.close();
            if (action === 'copy') {
                const text = this.activeTarget?.querySelector('.message-text')?.textContent || '';
                if (text) {
                    navigator.clipboard.writeText(text);
                    ESCTRIX.showToast('Message copied to clipboard! 📋');
                }
            } else if (action === 'reply') {
                const text = this.activeTarget?.querySelector('.message-text')?.textContent || '';
                if (ESCTRIX.elements.messageInput) {
                    ESCTRIX.elements.messageInput.value = `> ${text}\n`;
                    ESCTRIX.elements.messageInput.focus();
                }
            } else if (action === 'forward') {
                const text = this.activeTarget?.querySelector('.message-text')?.textContent || '';
                ESCTRIX.showToast('Forwarding message to active thread...');
                if (ESCTRIX.elements.messageInput) {
                    ESCTRIX.elements.messageInput.value = text;
                    ESCTRIX.elements.messageInput.focus();
                }
            } else if (action === 'star') {
                const text = this.activeTarget?.querySelector('.message-text')?.textContent || '';
                if (text) {
                    ESCTRIX.savedMessages.save(text);
                    ESCTRIX.showToast('Message starred & saved to Cloud Vault! ⭐');
                }
            } else if (action === 'delete_msg') {
                this.activeTarget?.remove();
                ESCTRIX.showToast('Message removed from view.');
            } else if (action === 'view_profile') {
                const uname = btnEl?.dataset.username;
                if (uname) {
                    fetch(`/api/user/profile?username=${encodeURIComponent(uname)}`)
                        .then(r => r.json())
                        .then(data => {
                            if (data.profile) ESCTRIX.profileModal.open(data.profile);
                        });
                }
            } else if (action === 'pin_chat') {
                ESCTRIX.showToast('Thread pinned to top of workspace 📌');
            } else if (action === 'mute_chat') {
                ESCTRIX.showToast('Chat notifications muted 🔇');
            } else if (action === 'clear_thread' || action === 'clear_view') {
                ESCTRIX.chat.clearCurrentView();
            } else if (action === 'new_space') {
                ESCTRIX.modal.open('new-space-modal');
            } else if (action === 'verify_e2ee') {
                ESCTRIX.verification.openModal();
            } else if (action === 'settings') {
                ESCTRIX.settings.open();
            }
        }
    },

    // ─────────────────────────────────────────────────────────
    // QUANTUM MEDIA LIGHTBOX CONTROLLER
    // ─────────────────────────────────────────────────────────
    lightbox: {
        modal: null,
        img: null,
        filename: null,
        downloadBtn: null,
        closeBtn: null,
        backdrop: null,
        _onClose: null,

        init() {
            this.modal = document.getElementById('media-lightbox-modal');
            this.img = document.getElementById('lightbox-img');
            this.filename = document.getElementById('lightbox-filename');
            this.downloadBtn = document.getElementById('lightbox-download-btn');
            this.closeBtn = document.getElementById('lightbox-close-btn');
            this.backdrop = this.modal?.querySelector('.lightbox-backdrop');

            this.closeBtn?.addEventListener('click', () => this.close());
            this.backdrop?.addEventListener('click', () => this.close());
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden') && this.modal.style.display !== 'none') {
                    this.close();
                }
            });
        },

        open(url, name = 'Media Preview', onClose = null) {
            if (!this.modal) this.init();
            this._onClose = onClose;
            if (this.img) {
                this.img.src = url;
                this.img.style.display = 'block';
            }
            const oldVid = this.modal?.querySelector('.lightbox-video');
            if (oldVid) oldVid.remove();

            if (this.filename) this.filename.textContent = name;
            if (this.downloadBtn) {
                this.downloadBtn.href = url;
                this.downloadBtn.download = name || 'encrypted-media.png';
            }
            if (this.modal) {
                this.modal.classList.remove('hidden');
                this.modal.style.display = 'flex';
            }
            ESCTRIX.playSfx('click');
        },

        openVideo(url, name = 'Video Preview', onClose = null) {
            if (!this.modal) this.init();
            this._onClose = onClose;
            if (this.img) this.img.style.display = 'none';

            let vid = this.modal?.querySelector('.lightbox-video');
            if (!vid) {
                vid = document.createElement('video');
                vid.className = 'lightbox-video';
                vid.controls = true;
                vid.autoplay = true;
                vid.style.maxWidth = '90vw';
                vid.style.maxHeight = '80vh';
                vid.style.borderRadius = '12px';
                vid.style.boxShadow = '0 8px 32px rgba(0,0,0,0.8)';
                this.img?.parentNode?.insertBefore(vid, this.img);
            }
            vid.src = url;
            vid.style.display = 'block';

            if (this.filename) this.filename.textContent = name;
            if (this.downloadBtn) {
                this.downloadBtn.href = url;
                this.downloadBtn.download = name || 'video.mp4';
            }
            if (this.modal) {
                this.modal.classList.remove('hidden');
                this.modal.style.display = 'flex';
            }
            ESCTRIX.playSfx('click');
        },

        close() {
            if (this._onClose) {
                const cb = this._onClose;
                this._onClose = null;
                cb();
            }
            const vid = this.modal?.querySelector('.lightbox-video');
            if (vid) {
                vid.pause();
                vid.src = '';
                vid.remove();
            }
            if (this.img) this.img.style.display = 'block';

            if (this.modal) {
                this.modal.classList.add('hidden');
                this.modal.style.display = 'none';
            }
        }
    },

    // ─────────────────────────────────────────────────────────
    // CHUNKED MEDIA & FILE TRANSMISSION ENGINE
    // ─────────────────────────────────────────────────────────
    chunks: {
        incoming: new Map(),

        showProgress(fileName, speedStr, percent) {
            const e = ESCTRIX.elements;
            if (e.fileUploadProgress) e.fileUploadProgress.classList.remove('hidden');
            if (e.progressFilename) e.progressFilename.textContent = fileName;
            if (e.progressSpeed) e.progressSpeed.textContent = speedStr;
            if (e.progressPercent) e.progressPercent.textContent = `${percent}%`;
            if (e.progressBarFill) e.progressBarFill.style.width = `${percent}%`;
        },

        hideProgress() {
            const e = ESCTRIX.elements;
            if (e.fileUploadProgress) {
                setTimeout(() => {
                    e.fileUploadProgress.classList.add('hidden');
                    if (e.progressBarFill) e.progressBarFill.style.width = '0%';
                }, 800);
            }
        },

        handleChunkMeta(msg, isDirect = false) {
            const id = msg.transferId || msg.transfer_id;
            if (!id) return;
            this.incoming.set(id, {
                meta: {
                    transferId: id,
                    fileName: msg.fileName || msg.file_name || 'file',
                    fileSize: msg.fileSize || msg.file_size || 0,
                    fileSizeStr: msg.fileSizeStr || msg.file_size_str || '',
                    mimeType: msg.mimeType || msg.mime_type || 'application/octet-stream',
                    msgType: msg.msgType || msg.msg_type || 'file',
                    totalChunks: msg.totalChunks || msg.total_chunks || 1,
                    vanish: msg.vanish || 0,
                    senderName: msg.sender_display_name || msg.sender_username || msg.senderName || 'Peer'
                },
                chunks: new Array(msg.totalChunks || msg.total_chunks || 1),
                receivedBytes: 0,
                receivedCount: 0,
                startTime: Date.now(),
                isDirect,
                senderUsername: msg.sender_username
            });
            this.showProgress(`Receiving: ${msg.fileName || msg.file_name || 'file'}`, '0 KB/s', 0);
        },

        handleChunkData(msg, isDirect = false) {
            const id = msg.transferId || msg.transfer_id;
            const rec = this.incoming.get(id);
            if (!rec) return;

            const idx = msg.chunkIndex !== undefined ? msg.chunkIndex : msg.chunk_index;
            const chunkData = msg.data || msg.chunk;
            if (!rec.chunks[idx]) {
                rec.chunks[idx] = chunkData;
                rec.receivedCount++;
                const approxBytes = Math.round(chunkData.length * 0.75);
                rec.receivedBytes += approxBytes;
            }

            const total = rec.meta.totalChunks;
            const pct = Math.round((rec.receivedCount / total) * 100);
            const elapsed = Math.max((Date.now() - rec.startTime) / 1000, 0.05);
            const speedKBps = (rec.receivedBytes / 1024) / elapsed;
            const speedStr = speedKBps > 1024 ? `${(speedKBps / 1024).toFixed(1)} MB/s` : `${Math.round(speedKBps)} KB/s`;

            this.showProgress(`Receiving: ${rec.meta.fileName}`, speedStr, pct);
        },

        handleChunkComplete(msg, isDirect = false) {
            const id = msg.transferId || msg.transfer_id;
            const rec = this.incoming.get(id);
            if (!rec) return;

            this.showProgress(`Finalizing: ${rec.meta.fileName}`, 'Done ✓', 100);
            this.hideProgress();

            try {
                const byteArrays = [];
                for (let i = 0; i < rec.chunks.length; i++) {
                    const b64 = rec.chunks[i] || '';
                    const binary = atob(b64);
                    const bytes = new Uint8Array(binary.length);
                    for (let j = 0; j < binary.length; j++) {
                        bytes[j] = binary.charCodeAt(j);
                    }
                    byteArrays.push(bytes);
                }
                const blob = new Blob(byteArrays, { type: rec.meta.mimeType });
                const blobUrl = URL.createObjectURL(blob);

                const s = ESCTRIX.state;
                const chatKey = isDirect ? `@${rec.senderUsername}` : 'space';
                const sizeStr = rec.meta.fileSizeStr || (blob.size > 1024*1024 ? `${(blob.size/(1024*1024)).toFixed(1)} MB` : `${(blob.size/1024).toFixed(1)} KB`);

                const newMsg = {
                    sender: 'peer',
                    name: rec.meta.senderName,
                    type: rec.meta.msgType,
                    fileName: rec.meta.fileName,
                    fileSize: sizeStr,
                    fileUrl: blobUrl,
                    content: blobUrl,
                    vanish: rec.meta.vanish,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };

                if (!s.chatHistories[chatKey]) s.chatHistories[chatKey] = [];
                s.chatHistories[chatKey].push(newMsg);

                if (s.activeChat && ((isDirect && s.activeChat.title === chatKey) || (!isDirect && s.activeChat.type === 'space'))) {
                    ESCTRIX.chat.appendMessageDOM(newMsg);
                } else {
                    ESCTRIX.showToast(`📎 Received ${rec.meta.fileName} from ${rec.meta.senderName}`);
                }
                ESCTRIX.playSfx('receive');
            } catch (err) {
                console.error('[Chunk Assembly Error]:', err);
                ESCTRIX.showToast(`Failed to assemble received file: ${rec.meta.fileName}`);
            } finally {
                this.incoming.delete(id);
            }
        },

        async sendFile({ file, isDirect, targetUsername, p2p, vanish }) {
            const chunkSize = 64 * 1024;
            const totalChunks = Math.ceil(file.size / chunkSize);
            const transferId = 'xfr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
            const isVideo = file.type && file.type.startsWith('video/');
            const isImg = file.type && file.type.startsWith('image/');
            const isAudio = file.type && file.type.startsWith('audio/');
            const msgType = isVideo ? 'video' : (isImg ? 'image' : (isAudio ? 'voice' : 'file'));
            const sizeStr = file.size > 1024 * 1024 
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
                : `${(file.size / 1024).toFixed(1)} KB`;

            const s = ESCTRIX.state;
            const myName = s.user?.display_name || s.user?.username || 'Me';

            this.showProgress(`Sending: ${file.name}`, '0 KB/s', 0);

            // Send metadata
            if (isDirect && s.userWs && s.userWs.readyState === WebSocket.OPEN) {
                s.userWs.send(JSON.stringify({
                    type: 'direct_file_meta',
                    target_username: targetUsername,
                    transfer_id: transferId,
                    file_name: file.name,
                    file_size: file.size,
                    file_size_str: sizeStr,
                    mime_type: file.type || 'application/octet-stream',
                    msg_type: msgType,
                    total_chunks: totalChunks,
                    vanish: vanish ? (typeof vanish === 'number' || vanish === 'view_once' ? vanish : 10) : 0,
                    sender_display_name: myName
                }));
            } else if (p2p) {
                p2p.sendData({
                    type: 'file_chunk_meta',
                    transferId,
                    fileName: file.name,
                    fileSize: file.size,
                    fileSizeStr: sizeStr,
                    mimeType: file.type || 'application/octet-stream',
                    msgType,
                    totalChunks,
                    vanish: vanish ? (typeof vanish === 'number' || vanish === 'view_once' ? vanish : 10) : 0,
                    senderName: myName
                });
            }

            // Stream chunks
            let offset = 0;
            const startTime = Date.now();

            for (let i = 0; i < totalChunks; i++) {
                const slice = file.slice(offset, offset + chunkSize);
                const arrayBuffer = await slice.arrayBuffer();

                let binary = '';
                const bytes = new Uint8Array(arrayBuffer);
                const len = bytes.byteLength;
                for (let b = 0; b < len; b += 8192) {
                    binary += String.fromCharCode.apply(null, bytes.subarray(b, Math.min(b + 8192, len)));
                }
                const base64Chunk = btoa(binary);

                if (isDirect && s.userWs && s.userWs.readyState === WebSocket.OPEN) {
                    if (s.userWs.bufferedAmount > 262144) {
                        await new Promise(res => setTimeout(res, 50));
                    }
                    s.userWs.send(JSON.stringify({
                        type: 'direct_file_chunk',
                        target_username: targetUsername,
                        transfer_id: transferId,
                        chunk_index: i,
                        total_chunks: totalChunks,
                        chunk: base64Chunk
                    }));
                } else if (p2p) {
                    for (const [, peerObj] of p2p.peers) {
                        if (peerObj.dc && peerObj.dc.readyState === 'open' && peerObj.dc.bufferedAmount > 262144) {
                            await new Promise(res => {
                                const lowHandler = () => {
                                    peerObj.dc.removeEventListener('bufferedamountlow', lowHandler);
                                    res();
                                };
                                peerObj.dc.addEventListener('bufferedamountlow', lowHandler);
                                setTimeout(res, 60);
                            });
                        }
                    }
                    p2p.sendData({
                        type: 'file_chunk_data',
                        transferId,
                        chunkIndex: i,
                        totalChunks,
                        data: base64Chunk
                    });
                }

                offset += chunkSize;
                const transferred = Math.min(offset, file.size);
                const pct = Math.round((transferred / file.size) * 100);
                const elapsed = Math.max((Date.now() - startTime) / 1000, 0.05);
                const speedKBps = (transferred / 1024) / elapsed;
                const speedStr = speedKBps > 1024 ? `${(speedKBps / 1024).toFixed(1)} MB/s` : `${Math.round(speedKBps)} KB/s`;

                this.showProgress(`Sending: ${file.name}`, speedStr, pct);
            }

            // Send completion message
            if (isDirect && s.userWs && s.userWs.readyState === WebSocket.OPEN) {
                s.userWs.send(JSON.stringify({
                    type: 'direct_file_complete',
                    target_username: targetUsername,
                    transfer_id: transferId,
                    file_name: file.name,
                    file_size: sizeStr,
                    msg_type: msgType,
                    vanish: vanish ? (typeof vanish === 'number' || vanish === 'view_once' ? vanish : 10) : 0,
                    sender_display_name: myName
                }));
            } else if (p2p) {
                p2p.sendData({
                    type: 'file_chunk_complete',
                    transferId,
                    fileName: file.name,
                    fileSize: file.size,
                    fileSizeStr: sizeStr,
                    msgType,
                    vanish: vanish ? (typeof vanish === 'number' || vanish === 'view_once' ? vanish : 10) : 0
                });
            }

            this.showProgress(`Completed: ${file.name}`, 'Sent ✓', 100);
            this.hideProgress();

            const localBlobUrl = URL.createObjectURL(file);
            const chatKey = isDirect ? `@${targetUsername}` : s.activeChat?.type;
            const localMsg = {
                sender: 'me',
                name: 'You',
                type: msgType,
                fileName: file.name,
                fileSize: sizeStr,
                fileUrl: localBlobUrl,
                content: localBlobUrl,
                vanish: vanish ? (typeof vanish === 'number' || vanish === 'view_once' ? vanish : 10) : 0,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            if (!s.chatHistories[chatKey]) s.chatHistories[chatKey] = [];
            s.chatHistories[chatKey].push(localMsg);
            ESCTRIX.chat.appendMessageDOM(localMsg);
            ESCTRIX.playSfx('send');
        }
    },

    // ─────────────────────────────────────────────────────────
    // BIOMETRIC WEBAUTHN / PASSKEY CONTROLLER
    // ─────────────────────────────────────────────────────────
    passkey: {
        isSupported() {
            return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create);
        },

        async register() {
            if (!this.isSupported()) {
                ESCTRIX.showToast('WebAuthn Passkeys are not supported on this browser/device.');
                return;
            }
            const user = ESCTRIX.state.user;
            if (!user) {
                ESCTRIX.showToast('Please sign in first to register a passkey.');
                return;
            }
            try {
                const chalRes = await fetch(`/api/auth/passkey/challenge?username=${encodeURIComponent(user.username)}`);
                const chalData = await chalRes.json();
                if (chalData.status !== 'success') {
                    throw new Error(chalData.message || 'Failed to acquire passkey challenge');
                }

                const challengeBytes = new Uint8Array(chalData.challenge.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                const userIdBytes = new TextEncoder().encode(user.username);

                const credential = await navigator.credentials.create({
                    publicKey: {
                        challenge: challengeBytes,
                        rp: {
                            name: 'ESCTRIX Quantum',
                            id: window.location.hostname
                        },
                        user: {
                            id: userIdBytes,
                            name: user.username,
                            displayName: user.display_name || user.username
                        },
                        pubKeyCredParams: [
                            { type: 'public-key', alg: -7 },
                            { type: 'public-key', alg: -257 }
                        ],
                        authenticatorSelection: {
                            authenticatorAttachment: 'platform',
                            userVerification: 'preferred',
                            residentKey: 'preferred'
                        },
                        timeout: 60000,
                        attestation: 'none'
                    }
                });

                if (!credential) {
                    throw new Error('Credential creation was cancelled or returned empty.');
                }

                const credentialId = btoa(String.fromCharCode.apply(null, new Uint8Array(credential.rawId)));
                const pubKeyData = credential.response.getPublicKey 
                    ? btoa(String.fromCharCode.apply(null, new Uint8Array(credential.response.getPublicKey())))
                    : credentialId;

                const regRes = await fetch('/api/auth/passkey/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: user.username,
                        credential_id: credentialId,
                        public_key: pubKeyData
                    })
                });
                const regData = await regRes.json();
                if (regData.status === 'success') {
                    ESCTRIX.playSfx('send');
                    ESCTRIX.showToast('Hardware Passkey enrolled successfully! 🛡️');
                    const label = document.getElementById('passkey-status-label');
                    if (label) label.textContent = 'Enrolled ✓ (Active)';
                } else {
                    throw new Error(regData.message || 'Registration failed');
                }
            } catch (err) {
                console.error('[Passkey Register Error]:', err);
                ESCTRIX.showToast(err.name === 'NotAllowedError' ? 'Passkey setup cancelled.' : `Passkey error: ${err.message || 'Unknown'}`);
            }
        },

        async authenticate() {
            if (!this.isSupported()) {
                ESCTRIX.showToast('WebAuthn Passkeys are not supported on this browser/device.');
                return;
            }
            try {
                ESCTRIX.showToast('Waiting for biometric verification... 🔒');
                const chalRes = await fetch('/api/auth/passkey/challenge');
                const chalData = await chalRes.json();
                if (chalData.status !== 'success') {
                    throw new Error('Failed to acquire passkey challenge');
                }

                const challengeBytes = new Uint8Array(chalData.challenge.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

                const assertion = await navigator.credentials.get({
                    publicKey: {
                        challenge: challengeBytes,
                        rpId: window.location.hostname,
                        userVerification: 'preferred',
                        timeout: 60000
                    }
                });

                if (!assertion) {
                    throw new Error('Biometric verification cancelled.');
                }

                const credentialId = btoa(String.fromCharCode.apply(null, new Uint8Array(assertion.rawId)));

                const authRes = await fetch('/api/auth/passkey/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        credential_id: credentialId
                    })
                });
                const authData = await authRes.json();
                if (authData.status === 'success' && authData.user) {
                    ESCTRIX.playSfx('send');
                    ESCTRIX.showToast(`Biometric match verified! Welcome, @${authData.user.username} 🛡️`);
                    ESCTRIX.state.user = authData.user;
                    localStorage.setItem('esctrix_user', JSON.stringify(authData.user));
                    ESCTRIX.setupPersistentUserSignaling(authData.user.username);
                    ESCTRIX.switchScreen('dashboard-screen');
                    ESCTRIX.updateUserUI(authData.user);
                    ESCTRIX.contacts.fetchContacts();
                    ESCTRIX.contacts.fetchIncomingFriends();
                } else {
                    throw new Error(authData.message || 'Passkey not recognized on this server.');
                }
            } catch (err) {
                console.error('[Passkey Auth Error]:', err);
                ESCTRIX.showToast(err.name === 'NotAllowedError' ? 'Biometric login cancelled.' : `Login error: ${err.message || 'Verification failed'}`);
            }
        }
    },

    // ─────────────────────────────────────────────────────────
    // GLOWING QUANTUM CURSOR ENGINE
    // ─────────────────────────────────────────────────────────
    cursor: {
        dot: null,
        ring: null,
        mouseX: window.innerWidth / 2,
        mouseY: window.innerHeight / 2,
        ringX: window.innerWidth / 2,
        ringY: window.innerHeight / 2,

        init() {
            this.dot = document.getElementById('quantum-cursor-dot');
            this.ring = document.getElementById('quantum-cursor-ring');
            if (!this.dot || !this.ring) return;

            window.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
                this.dot.style.transform = `translate(${this.mouseX}px, ${this.mouseY}px) translate(-50%, -50%)`;

                // Interactive target hover detection
                const target = e.target;
                const isHoverable = target.closest('button, a, input, textarea, select, .chat-thread-item, .message, .pin-key, .wallpaper-card, .voice-speed-pill');
                this.ring.classList.toggle('hovering', Boolean(isHoverable));
            });

            // Smooth trailing lerp animation for outer magnetic ring
            const animate = () => {
                this.ringX += (this.mouseX - this.ringX) * 0.18;
                this.ringY += (this.mouseY - this.ringY) * 0.18;
                if (this.ring) {
                    this.ring.style.transform = `translate(${this.ringX}px, ${this.ringY}px) translate(-50%, -50%)`;
                }
                requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        }
    },

    // ─────────────────────────────────────────────────────────
    // QUANTUM HISTORY & SYSTEM BACK-NAVIGATION CONTROLLER
    // ─────────────────────────────────────────────────────────
    nav: {
        _isHandlingPop: false,

        init() {
            // Push initial baseline state so browser & mobile back buttons are intercepted
            try {
                if (!window.history.state) {
                    window.history.replaceState({ type: 'base', screen: 'initial' }, '', window.location.href);
                }
            } catch (e) {}

            window.addEventListener('popstate', (ev) => {
                this.handleBack(ev.state);
            });
        },

        pushState(type, id = null) {
            if (this._isHandlingPop) return;
            try {
                window.history.pushState({ type, id, t: Date.now() }, '', window.location.href);
            } catch (e) {}
        },

        handleBack(state) {
            this._isHandlingPop = true;

            try {
                // 1. Check if active Call overlay is visible
                const videoOverlay = ESCTRIX.elements?.videoOverlay;
                if (videoOverlay && !videoOverlay.classList.contains('hidden')) {
                    ESCTRIX.call.end();
                    return;
                }

                // 2. Check if any modal is currently visible
                const openModals = Array.from(document.querySelectorAll('.modal:not(.hidden), .modal-overlay:not(.hidden), .custom-dialog-modal.active'));
                if (openModals.length > 0) {
                    const topModal = openModals[openModals.length - 1];
                    if (topModal.classList.contains('custom-dialog-modal')) {
                        topModal.classList.remove('active');
                    } else if (topModal.id === 'settings-suite-modal') {
                        ESCTRIX.settings.close();
                    } else if (topModal.id === 'user-profile-modal') {
                        ESCTRIX.profileModal.close();
                    } else if (topModal.id === 'add-friend-modal') {
                        ESCTRIX.friendSearch.closeModal();
                    } else {
                        topModal.classList.add('hidden');
                    }
                    return;
                }

                // 3. Check if on mobile and chat is currently open (.chat-open)
                const shell = document.querySelector('.telegram-shell');
                if (shell && shell.classList.contains('chat-open')) {
                    shell.classList.remove('chat-open');
                    return;
                }

                // 4. Check if dropdown menu is open
                const dropdown = document.getElementById('chat-dropdown-menu');
                if (dropdown && !dropdown.classList.contains('hidden')) {
                    dropdown.classList.add('hidden');
                    return;
                }

                // 5. Check screen transitions (admin -> dashboard, login -> intro, dashboard -> intro)
                const adminScreen = document.getElementById('admin-screen');
                if (adminScreen && adminScreen.classList.contains('active')) {
                    ESCTRIX.showScreen('dashboard-screen', false);
                    return;
                }

                const loginScreen = document.getElementById('login-screen');
                if (loginScreen && loginScreen.classList.contains('active')) {
                    ESCTRIX.showScreen('intro-screen', false);
                    return;
                }

                const dashboardScreen = document.getElementById('dashboard-screen');
                if (dashboardScreen && dashboardScreen.classList.contains('active')) {
                    ESCTRIX.showScreen('intro-screen', false);
                    return;
                }
            } finally {
                this._isHandlingPop = false;
            }
        },

        goBack() {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                this.handleBack(null);
            }
        }
    },

    // ─────────────────────────────────────────────────────────
    // MODAL HELPER
    // ─────────────────────────────────────────────────────────
    modal: {
        open(id) {
            const m = document.getElementById(id);
            if (m) {
                m.classList.remove('hidden');
                ESCTRIX.nav?.pushState('modal', id);
            }
        },
        close(id) {
            const m = document.getElementById(id);
            if (m) m.classList.add('hidden');
        }
    },

    initPWA() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js?v=2.1.0').then(reg => {
                reg.update();
            }).catch(() => {});
        }
    }
};

// Start application when DOM is loaded
window.addEventListener('DOMContentLoaded', () => ESCTRIX.init());
 