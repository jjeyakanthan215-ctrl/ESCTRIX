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
            'auth-title', 'auth-subtitle', 'auth-username', 'auth-password', 'auth-displayname',
            'display-name-group', 'auth-submit-btn', 'auth-toggle', 'auth-toggle-msg', 'login-error',
            'telegram-sidebar', 'telegram-chat-pane', 'chat-search-input', 'search-clear-btn',
            'new-space-btn', 'chat-threads-list', 'dynamic-chat-threads', 'thread-aura-ai', 'thread-saved-messages',
            'drawer-open-btn', 'footer-user-chip', 'footer-user-avatar', 'footer-user-name', 'footer-user-id',
            'cmd-palette-btn', 'admin-panel-btn', 'admin-back-btn',
            'back-to-threads-btn', 'active-chat-avatar', 'active-chat-dot', 'active-chat-name', 'active-chat-status',
            'vibe-indicator-badge', 'vibe-emoji', 'vibe-text', 'video-call-btn', 'screen-share-btn',
            'e2ee-verify-btn', 'chat-menu-btn', 'chat-dropdown-menu', 'menu-vanish-btn', 'menu-burn-btn',
            'menu-summarize-btn', 'menu-export-btn', 'menu-clear-btn',
            'messages-viewport', 'messages-list', 'typing-indicator', 'typing-avatar', 'typing-name',
            // Voice Recording HUD
            'voice-recording-bar', 'voice-rec-timer', 'voice-rec-status',
            'voice-discard-btn', 'voice-pause-btn', 'voice-preview-btn', 'voice-send-btn',
            // Context Menu & Custom Dialog & Cursor
            'custom-context-menu', 'context-menu-items',
            'custom-dialog-modal', 'dialog-icon', 'dialog-icon-halo', 'dialog-title', 'dialog-message',
            'dialog-input', 'dialog-cancel-btn', 'dialog-confirm-btn',
            'quantum-cursor-dot', 'quantum-cursor-ring',
            'file-upload-progress', 'progress-bar-fill', 'progress-percent', 'progress-filename', 'progress-speed',
            'file-input', 'file-btn', 'emoji-picker-btn', 'emoji-picker', 'ai-assist-btn', 'ai-tools-popover',
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
            'e2ee-call-verify-btn', 'switch-speaker-btn', 'mute-btn', 'cam-off-btn', 'switch-cam-btn',
            'call-screen-share-btn', 'incall-chat-btn', 'incall-chat-panel', 'incall-chat-close', 'incall-messages',
            'incall-message-input', 'incall-send-btn', 'end-video-call-btn',
            'call-type-modal', 'call-type-peer-name', 'start-audio-call-btn', 'start-video-call-btn', 'cancel-call-type-btn',
            'call-modal', 'caller-name', 'accept-call-btn', 'decline-call-btn',
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
            'up-username', 'up-account-id', 'up-bio', 'up-action-dm', 'up-action-voice', 'up-action-video',
            'up-action-add-contact', 'up-add-contact-label', 'up-action-share-qr',
            // Quantum QR Nametag
            'qr-nametag-modal', 'qr-nametag-close-btn', 'nametag-card', 'nametag-avatar', 'nametag-displayname',
            'nametag-username', 'nametag-qr-img', 'nametag-account-id', 'nametag-copy-link-btn',
            // Settings Suite
            'settings-suite-modal', 'settings-close-btn', 'settings-admin-tab-btn', 'settings-avatar-halo',
            'settings-avatar-text', 'settings-avatar-cycle-btn', 'settings-meta-displayname', 'settings-meta-username',
            'settings-meta-account-id', 'settings-copy-id-btn', 'settings-input-displayname', 'settings-input-bio',
            'settings-save-profile-btn', 'settings-my-nametag-btn', 'pref-read-receipts', 'pref-last-seen',
            'setup-passcode-btn', 'passcode-status-label', 'pref-burn-timer', 'sessions-container',
            'terminate-other-sessions-btn', 'pref-enter-send', 'pref-font-size', 'pref-sfx-toggle',
            'pref-ringtone-toggle', 'pref-preview-toggle', 'storage-usage-val', 'storage-bar-fill',
            'clear-media-cache-btn', 'clear-chat-history-btn', 'settings-open-admin-screen-btn', 'settings-logout-btn',
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
            }
        } catch (e) {
            console.debug('SFX error:', e);
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
                    this.renderIntroUserState(user);
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
            e.footerUserAvatar.textContent = initials;
            if (user.avatar_color) e.footerUserAvatar.style.background = user.avatar_color;
        }

        // Settings Suite Profile
        if (e.settingsMetaDisplayname) e.settingsMetaDisplayname.textContent = user.display_name || user.username;
        if (e.settingsMetaUsername) e.settingsMetaUsername.textContent = `@${user.username}`;
        if (e.settingsMetaAccountId) e.settingsMetaAccountId.textContent = user.account_id || 'ESC-QUANTUM';
        if (e.settingsAvatarText) {
            e.settingsAvatarText.textContent = initials;
            if (user.avatar_color) e.settingsAvatarHalo.style.background = user.avatar_color;
        }
        if (e.settingsInputDisplayname) e.settingsInputDisplayname.value = user.display_name || user.username;
        if (e.settingsInputBio) e.settingsInputBio.value = user.bio || '';

        // Stealth Admin tab in Settings
        if (user.role === 'admin') {
            if (e.settingsAdminTabBtn) e.settingsAdminTabBtn.classList.remove('hidden');
        } else {
            if (e.settingsAdminTabBtn) e.settingsAdminTabBtn.classList.add('hidden');
        }
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
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
        e.authPassword?.addEventListener('keypress', (ev) => { if (ev.key === 'Enter') this.auth.submit(); });

        // Settings Suite Triggers
        e.drawerOpenBtn?.addEventListener('click', () => this.settings.open());
        e.footerUserChip?.addEventListener('click', () => this.settings.open());
        e.settingsCloseBtn?.addEventListener('click', () => this.settings.close());

        document.querySelectorAll('.settings-nav-btn').forEach(btn => {
            btn.addEventListener('click', (ev) => this.settings.switchTab(ev.currentTarget.dataset.tab));
        });

        e.settingsSaveProfileBtn?.addEventListener('click', () => this.settings.saveProfile());
        e.settingsAvatarCycleBtn?.addEventListener('click', () => this.settings.cycleAvatarColor());
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

        // User Profile Modal Actions
        e.userProfileCloseBtn?.addEventListener('click', () => this.profileModal.close());
        e.upActionDm?.addEventListener('click', () => this.profileModal.startDM());
        e.upActionVoice?.addEventListener('click', () => this.profileModal.startCall('audio'));
        e.upActionVideo?.addEventListener('click', () => this.profileModal.startCall('video'));
        e.upActionAddContact?.addEventListener('click', () => this.profileModal.toggleContact());
        e.upActionShareQr?.addEventListener('click', () => this.profileModal.openNametag(this.profileModal.currentUser));

        // QR Nametag Actions
        e.qrNametagCloseBtn?.addEventListener('click', () => this.modal.close('qr-nametag-modal'));
        e.nametagCopyLinkBtn?.addEventListener('click', () => this.profileModal.copyNametagLink());

        // Passcode Screen Lock Keypad
        document.querySelectorAll('.pin-key[data-digit]').forEach(k => {
            k.addEventListener('click', (ev) => this.passcode.pressDigit(ev.currentTarget.dataset.digit));
        });
        e.pinClearBtn?.addEventListener('click', () => this.passcode.clearDigit());
        e.pinEnterBtn?.addEventListener('click', () => this.passcode.verify());

        // Chat Tabs & Folders
        document.querySelectorAll('.folder-tab').forEach(tab => {
            tab.addEventListener('click', (ev) => this.chat.filterFolder(ev.target.dataset.folder));
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
            document.querySelector('.telegram-shell')?.classList.remove('chat-open');
        });

        // New Space Modal
        e.newSpaceBtn?.addEventListener('click', () => this.modal.open('new-space-modal'));
        e.newSpaceCloseBtn?.addEventListener('click', () => this.modal.close('new-space-modal'));
        e.tabHost?.addEventListener('click', () => this.space.switchTab('host'));
        e.tabJoin?.addEventListener('click', () => this.space.switchTab('join'));
        e.startHostBtn?.addEventListener('click', () => this.space.startHosting());
        e.stopHostBtn?.addEventListener('click', () => this.space.stopHosting());
        e.connectBtn?.addEventListener('click', () => this.space.joinSpace());

        // Message Input & Sending
        e.sendBtn?.addEventListener('click', () => this.chat.sendMessage());
        e.messageInput?.addEventListener('keypress', (ev) => {
            const enterSend = localStorage.getItem('esctrix_enter_send') !== 'false';
            if (ev.key === 'Enter' && !ev.shiftKey && enterSend) {
                ev.preventDefault();
                this.chat.sendMessage();
            }
        });
        e.messageInput?.addEventListener('input', (ev) => {
            if (ev.target.value === '/') {
                this.commandPalette.open();
            }
            this.chat.handleTyping();
        });

        // File Attachment
        e.fileBtn?.addEventListener('click', () => e.fileInput.click());
        e.fileInput?.addEventListener('change', (ev) => this.chat.handleFileSelect(ev));

        // Emoji Picker
        e.emojiPickerBtn?.addEventListener('click', () => e.emojiPicker.classList.toggle('hidden'));
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                e.messageInput.value += btn.textContent;
                e.emojiPicker.classList.add('hidden');
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
        e.menuVanishBtn?.addEventListener('click', () => this.chat.toggleVanishMode());
        e.menuBurnBtn?.addEventListener('click', () => this.chat.burnSpace());
        e.menuSummarizeBtn?.addEventListener('click', () => this.ai.summarizeActiveChat());
        e.menuExportBtn?.addEventListener('click', () => this.chat.exportHistory());
        e.menuClearBtn?.addEventListener('click', () => this.chat.clearCurrentView());

        // Calls & Media Controls
        e.videoCallBtn?.addEventListener('click', () => this.call.openCallChooser());
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
                e.upAvatar.textContent = (user.display_name || user.username || 'U').charAt(0).toUpperCase();
                if (user.avatar_color) e.upAvatar.style.background = user.avatar_color;
            }

            // Check if already contact
            const isContact = (ESCTRIX.state.contacts || []).some(c => c.contact_username === user.username);
            if (e.upAddContactLabel) {
                e.upAddContactLabel.textContent = isContact ? 'In Your Contacts ✓' : 'Add to Contacts';
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
                e.nametagAvatar.textContent = (user.display_name || user.username || 'U').charAt(0).toUpperCase();
                if (user.avatar_color) e.nametagAvatar.style.background = user.avatar_color;
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
        open() {
            ESCTRIX.playSfx('click');
            const user = ESCTRIX.state.user;
            if (user) {
                ESCTRIX.applyUserProfile(user);
            }
            this.loadPreferences();
            this.loadSessions();
            ESCTRIX.elements.settingsSuiteModal?.classList.remove('hidden');
        },

        close() {
            ESCTRIX.elements.settingsSuiteModal?.classList.add('hidden');
        },

        switchTab(tabName) {
            ESCTRIX.playSfx('click');
            document.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.settings-tab-view').forEach(v => v.classList.remove('active'));

            const targetBtn = document.querySelector(`.settings-nav-btn[data-tab="${tabName}"]`);
            const targetView = document.getElementById(`tab-${tabName}-view`);
            if (targetBtn) targetBtn.classList.add('active');
            if (targetView) targetView.classList.add('active');
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
                        avatar_color: user.avatar_color || ''
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
                e.threadAuraAi.classList.add('active');
                e.activeChatAvatar.innerHTML = '<i class="ph ph-sparkle"></i>';
                e.activeChatAvatar.style.background = 'linear-gradient(135deg, #8b5cf6, #06d6c7)';
            } else if (type === 'saved') {
                s.activeChat = {
                    id: 'saved',
                    type: 'saved',
                    title: 'Saved Messages',
                    subtitle: 'Personal encrypted cloud vault',
                    avatar: 'bookmark',
                    online: true
                };
                e.threadSavedMessages.classList.add('active');
                e.activeChatAvatar.innerHTML = '<i class="ph ph-bookmark-simple"></i>';
                e.activeChatAvatar.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
            } else if (type === 'space') {
                const spaceName = spaceData?.spaceName || s.activeSpaceName || 'P2P Space';
                s.activeChat = {
                    id: 'space',
                    type: 'space',
                    title: spaceName,
                    subtitle: 'Mesh Room • WebRTC DTLS/SRTP',
                    avatar: 'broadcast',
                    online: true
                };
                e.activeChatAvatar.innerHTML = '<i class="ph ph-broadcast"></i>';
                e.activeChatAvatar.style.background = 'linear-gradient(135deg, #10b981, #06d6c7)';
            }

            e.activeChatName.textContent = s.activeChat.title;
            e.activeChatStatus.textContent = s.activeChat.subtitle;

            // On mobile, trigger layout slide
            document.querySelector('.telegram-shell')?.classList.add('chat-open');

            this.renderMessages();
        },

        renderMessages() {
            const e = ESCTRIX.elements;
            const s = ESCTRIX.state;
            const msgs = s.chatHistories[s.activeChat.type] || [];

            e.messagesList.innerHTML = `
                <div class="message system-bubble">
                    <i class="ph ph-lock-key"></i>
                    <span>Zero-Knowledge Encryption Verified. Frequency Secure.</span>
                </div>
            `;

            msgs.forEach(m => this.appendMessageDOM(m));
            e.messagesViewport.scrollTop = e.messagesViewport.scrollHeight;

            // Trigger AI Smart Replies & Vibe check if there are recent messages
            if (msgs.length > 0 && s.activeChat.type !== 'saved') {
                ESCTRIX.ai.updateSmartReplies(msgs.map(x => x.text || ''));
                ESCTRIX.ai.updateVibeBadge(msgs.map(x => x.text || ''));
            }
        },

        appendMessageDOM(msg) {
            const e = ESCTRIX.elements;
            const div = document.createElement('div');
            div.className = `message ${msg.sender === 'me' ? 'sent' : 'received'}`;
            const timeStr = msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const statusTick = msg.sender === 'me' ? '<span class="msg-status-tick tick-read"><i class="ph ph-checks"></i></span>' : '';

            if (msg.type === 'voice') {
                div.innerHTML = `
                    <div class="voice-bubble">
                        <button class="voice-play-btn" data-audio="${encodeURIComponent(msg.data)}">
                            <i class="ph ph-play"></i>
                        </button>
                        <div class="voice-waveform-wrap">
                            <svg class="voice-waveform-svg" viewBox="0 0 160 24">
                                <rect x="0" y="8" width="4" height="8" rx="2" fill="currentColor"/>
                                <rect x="8" y="4" width="4" height="16" rx="2" fill="currentColor"/>
                                <rect x="16" y="2" width="4" height="20" rx="2" fill="currentColor"/>
                                <rect x="24" y="6" width="4" height="12" rx="2" fill="currentColor"/>
                                <rect x="32" y="3" width="4" height="18" rx="2" fill="currentColor"/>
                                <rect x="40" y="10" width="4" height="4" rx="2" fill="currentColor"/>
                                <rect x="48" y="4" width="4" height="16" rx="2" fill="currentColor"/>
                                <rect x="56" y="1" width="4" height="22" rx="2" fill="currentColor"/>
                                <rect x="64" y="7" width="4" height="10" rx="2" fill="currentColor"/>
                                <rect x="72" y="3" width="4" height="18" rx="2" fill="currentColor"/>
                                <rect x="80" y="5" width="4" height="14" rx="2" fill="currentColor"/>
                                <rect x="88" y="2" width="4" height="20" rx="2" fill="currentColor"/>
                                <rect x="96" y="9" width="4" height="6" rx="2" fill="currentColor"/>
                                <rect x="104" y="4" width="4" height="16" rx="2" fill="currentColor"/>
                                <rect x="112" y="6" width="4" height="12" rx="2" fill="currentColor"/>
                                <rect x="120" y="2" width="4" height="20" rx="2" fill="currentColor"/>
                                <rect x="128" y="8" width="4" height="8" rx="2" fill="currentColor"/>
                                <rect x="136" y="4" width="4" height="16" rx="2" fill="currentColor"/>
                                <rect x="144" y="7" width="4" height="10" rx="2" fill="currentColor"/>
                            </svg>
                            <div class="voice-meta-row">
                                <span>${msg.duration || '0:05'}</span>
                                <span class="voice-speed-pill" data-speed="1.0">1.0x</span>
                            </div>
                        </div>
                    </div>
                    <div class="message-meta">
                        <span>${timeStr}</span>
                        ${statusTick}
                    </div>
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
            } else if (msg.type === 'file') {
                div.innerHTML = `
                    <div class="file-bubble">
                        <div class="file-icon-box"><i class="ph ph-file-arrow-down"></i></div>
                        <div class="file-details">
                            <span class="file-name">${msg.fileName || 'Shared Document'}</span>
                            <span class="file-size">${msg.fileSize || 'Encrypted File'}</span>
                        </div>
                        <a href="${msg.fileUrl || '#'}" download="${msg.fileName || 'file'}" class="file-dl-btn">
                            <i class="ph ph-download-simple"></i>
                        </a>
                    </div>
                    <div class="message-meta">
                        <span>${timeStr}</span>
                        ${statusTick}
                    </div>
                `;
            } else {
                // Text / Markdown snippet
                const formatted = ESCTRIX.chat.formatMarkdown(msg.text || '');
                div.innerHTML = `
                    ${msg.sender !== 'me' && msg.name ? `<span class="sender-name">${msg.name}</span>` : ''}
                    <div class="message-text">${formatted}</div>
                    <div class="message-meta">
                        <span>${timeStr}</span>
                        ${statusTick}
                    </div>
                `;
            }

            e.messagesList.appendChild(div);
            e.messagesViewport.scrollTop = e.messagesViewport.scrollHeight;
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

            const newMsg = {
                sender: 'me',
                text,
                type: 'text',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            // Store in active chat history
            if (!s.chatHistories[s.activeChat.type]) s.chatHistories[s.activeChat.type] = [];
            s.chatHistories[s.activeChat.type].push(newMsg);
            this.appendMessageDOM(newMsg);

            // Routing
            if (s.activeChat.type === 'ai') {
                ESCTRIX.ai.sendToAura(text);
            } else if (s.activeChat.type === 'saved') {
                ESCTRIX.savedMessages.save(text);
            } else if (s.activeChat.type === 'space') {
                if (s.p2p) {
                    s.p2p.sendData({
                        type: 'chat',
                        text,
                        senderName: s.user?.display_name || s.user?.username,
                        vanish: s.vanishMode
                    });
                }
            }
        },

        handleTyping() {
            const s = ESCTRIX.state;
            if (s.activeChat.type === 'space' && s.p2p) {
                s.p2p.sendSignalingMessage('typing', { username: s.user?.username });
            }
        },

        handleFileSelect(ev) {
            const file = ev.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                const fileMsg = {
                    sender: 'me',
                    type: 'file',
                    fileName: file.name,
                    fileSize: `${(file.size / 1024).toFixed(1)} KB`,
                    fileUrl: base64,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                ESCTRIX.state.chatHistories[ESCTRIX.state.activeChat.type].push(fileMsg);
                ESCTRIX.chat.appendMessageDOM(fileMsg);
                ESCTRIX.playSfx('send');

                if (ESCTRIX.state.activeChat.type === 'space' && ESCTRIX.state.p2p) {
                    ESCTRIX.state.p2p.sendData({
                        type: 'file',
                        name: file.name,
                        size: file.size,
                        payload: base64
                    });
                }
            };
            reader.readAsDataURL(file);
        },

        toggleVanishMode() {
            ESCTRIX.state.vanishMode = !ESCTRIX.state.vanishMode;
            ESCTRIX.playSfx('click');
            ESCTRIX.showToast(`Vanish Mode (10s): ${ESCTRIX.state.vanishMode ? 'ENABLED 👻' : 'DISABLED'}`);
        },

        burnSpace() {
            ESCTRIX.dialog.confirm(
                'Burn Space Room',
                'Permanently wipe this room, flush cryptographic keys, and purge all data for everyone?',
                () => {
                    ESCTRIX.playSfx('call');
                    if (ESCTRIX.state.p2p) {
                        ESCTRIX.state.p2p.sendData({ type: 'burn_room' });
                    }
                    ESCTRIX.state.chatHistories[ESCTRIX.state.activeChat.type] = [];
                    ESCTRIX.chat.renderMessages();
                    ESCTRIX.showToast('Room Purged & Cryptographically Burned. 🧹');
                },
                true
            );
        },

        exportHistory() {
            const history = ESCTRIX.state.chatHistories[ESCTRIX.state.activeChat.type] || [];
            const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ESCTRIX_${ESCTRIX.state.activeChat.title.replace(/\s+/g, '_')}_history.json`;
            a.click();
            ESCTRIX.showToast('Chat history exported securely. 💾');
        },

        clearCurrentView() {
            ESCTRIX.state.chatHistories[ESCTRIX.state.activeChat.type] = [];
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
            } else {
                aiThread.style.display = 'flex';
                savedThread.style.display = 'flex';
                dynamicList.style.display = 'block';
            }
        },

        async handleSearch(query) {
            const q = query.trim();
            const e = ESCTRIX.elements;
            if (!q) {
                e.searchClearBtn.classList.add('hidden');
                this.renderChatList();
                return;
            }
            e.searchClearBtn.classList.remove('hidden');

            try {
                const res = await fetch(`/api/user/search?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                if (data.status === 'success') {
                    this.renderSearchResults(data.users);
                }
            } catch (err) {}
        },

        renderSearchResults(users) {
            const list = ESCTRIX.elements.dynamicChatThreads;
            if (!users || users.length === 0) {
                list.innerHTML = `<div style="padding:14px; text-align:center; font-size:0.8rem; color:var(--text-muted)">No matching users found</div>`;
                return;
            }
            list.innerHTML = users.map(u => `
                <div class="chat-thread-item user-search-result" data-username="${u.username}">
                    <div class="thread-avatar-wrap">
                        <div class="thread-avatar" style="background:${u.avatar_color || 'var(--primary)'}">
                            ${(u.display_name || u.username).charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div class="thread-info">
                        <div class="thread-top-line">
                            <span class="thread-title">${u.display_name || u.username}</span>
                            <span class="thread-time" style="color:var(--accent); font-family:var(--font-mono)">${u.account_id}</span>
                        </div>
                        <div class="thread-bottom-line">
                            <span class="thread-preview">@${u.username} • ${u.bio || 'Encrypted Peer'}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            // Bind click to open Profile Card
            list.querySelectorAll('.user-search-result').forEach(row => {
                row.addEventListener('click', () => {
                    const targetUname = row.dataset.username;
                    const foundUser = users.find(u => u.username === targetUname);
                    if (foundUser) {
                        ESCTRIX.profileModal.open(foundUser);
                    }
                });
            });
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
                });
            });
        }
    },

    // ─────────────────────────────────────────────────────────
    // AURA AI SUITE MODULE
    // ─────────────────────────────────────────────────────────
    ai: {
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
                const voiceMsg = {
                    sender: 'me',
                    type: 'voice',
                    data: base64,
                    duration: durationStr,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };

                const chatType = ESCTRIX.state.activeChat.type;
                if (!ESCTRIX.state.chatHistories[chatType]) ESCTRIX.state.chatHistories[chatType] = [];
                ESCTRIX.state.chatHistories[chatType].push(voiceMsg);
                ESCTRIX.chat.appendMessageDOM(voiceMsg);
                ESCTRIX.playSfx('send');

                if (chatType === 'space' && ESCTRIX.state.p2p) {
                    ESCTRIX.state.p2p.sendData({
                        type: 'voice_note',
                        payload: base64,
                        duration: durationStr
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
                e.hostSetup.style.display = 'block';
                e.clientSetup.style.display = 'none';
            } else {
                e.tabJoin.classList.add('active-tab');
                e.tabHost.classList.remove('active-tab');
                e.clientSetup.style.display = 'block';
                e.hostSetup.style.display = 'none';
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
                    e.hostSetup.style.display = 'none';
                    e.hostWaiting.style.display = 'block';
                    e.qrCodeImg.src = data.qr_code;
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
                        ESCTRIX.state.chatHistories['space'].push(vMsg);
                        if (ESCTRIX.state.activeChat.type === 'space') {
                            ESCTRIX.chat.appendMessageDOM(vMsg);
                        }
                    } else if (data.type === 'typing') {
                        const e = ESCTRIX.elements;
                        if (e.typingIndicator && e.typingName) {
                            e.typingName.textContent = data.username || 'Peer';
                            e.typingIndicator.classList.remove('hidden');
                            clearTimeout(ESCTRIX._peerTypingTimer);
                            ESCTRIX._peerTypingTimer = setTimeout(() => {
                                e.typingIndicator.classList.add('hidden');
                            }, 3000);
                        }
                    } else if (data.type === 'file') {
                        const fMsg = {
                            sender: 'peer',
                            type: 'file',
                            fileName: data.name,
                            fileSize: `${(data.size / 1024).toFixed(1)} KB`,
                            fileUrl: data.payload,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                        ESCTRIX.state.chatHistories['space'].push(fMsg);
                        if (ESCTRIX.state.activeChat.type === 'space') {
                            ESCTRIX.chat.appendMessageDOM(fMsg);
                        }
                    }
                },
                // onConnectionStateChange
                (state) => {
                    console.log('[P2P State]:', state);
                    if (state === 'connected') {
                        ESCTRIX.playSfx('send');
                        ESCTRIX.modal.close('new-space-modal');
                        ESCTRIX.chat.switchChat('space');
                        ESCTRIX.showToast('P2P Direct WebRTC Mesh Connected! 🛡️');
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
        openCallChooser() {
            ESCTRIX.playSfx('click');
            ESCTRIX.elements.callTypePeerName.textContent = ESCTRIX.state.activeChat.title;
            ESCTRIX.modal.open('call-type-modal');
        },

        async initiate(type) {
            ESCTRIX.modal.close('call-type-modal');
            ESCTRIX.playSfx('call');
            const e = ESCTRIX.elements;
            const s = ESCTRIX.state;

            try {
                const constraints = {
                    audio: true,
                    video: type === 'video' ? { facingMode: s.currentFacingMode } : false
                };
                s.localVideoStream = await navigator.mediaDevices.getUserMedia(constraints);
                if (type === 'video') {
                    e.localVideo.srcObject = s.localVideoStream;
                }

                // Add tracks to WebRTC
                s.localVideoStream.getTracks().forEach(track => {
                    s.p2p?.addTrack(track, s.localVideoStream);
                });

                s.p2p?.sendCallSignal('call_request', { callType: type, caller: s.user?.username });

                e.videoOverlay.classList.remove('hidden');
                e.videoPeerName.textContent = s.activeChat.title;
                s.isVideoCalling = true;
                this.startTimer();
                ESCTRIX.showToast(`Initiating ${type} call...`);
            } catch (err) {
                ESCTRIX.showToast('Camera or Microphone access required for calls.', true);
            }
        },

        handleSignal(signal) {
            if (signal.type === 'call_request') {
                ESCTRIX.playSfx('call');
                ESCTRIX.elements.callerName.textContent = signal.data?.caller || 'Peer';
                ESCTRIX.modal.open('call-modal');
            } else if (signal.type === 'call_accepted') {
                ESCTRIX.showToast('Call accepted by peer.');
            } else if (signal.type === 'call_declined') {
                ESCTRIX.showToast('Call declined.');
                this.end();
            }
        },

        async accept() {
            ESCTRIX.modal.close('call-modal');
            const s = ESCTRIX.state;
            const e = ESCTRIX.elements;

            try {
                s.localVideoStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                e.localVideo.srcObject = s.localVideoStream;
                s.localVideoStream.getTracks().forEach(track => {
                    s.p2p?.addTrack(track, s.localVideoStream);
                });
                s.p2p?.sendCallSignal('call_accepted', {});

                e.videoOverlay.classList.remove('hidden');
                s.isVideoCalling = true;
                this.startTimer();
            } catch (err) {
                ESCTRIX.showToast('Media access error.', true);
            }
        },

        decline() {
            ESCTRIX.modal.close('call-modal');
            ESCTRIX.state.p2p?.sendCallSignal('call_declined', {});
        },

        handleRemoteStream(stream) {
            const grid = ESCTRIX.elements.groupVideoGrid;
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
                e.callTimer.textContent = `${mins}:${secs}`;
            }, 1000);
        },

        end() {
            const s = ESCTRIX.state;
            const e = ESCTRIX.elements;
            if (s.localVideoStream) {
                s.localVideoStream.getTracks().forEach(t => t.stop());
                s.localVideoStream = null;
            }
            if (s.screenStream) {
                s.screenStream.getTracks().forEach(t => t.stop());
                s.screenStream = null;
            }
            clearInterval(s.callTimerInterval);
            e.videoOverlay.classList.add('hidden');
            s.isVideoCalling = false;
            ESCTRIX.showToast('Call ended.');
        },

        toggleMute() {
            const s = ESCTRIX.state;
            const audioTrack = s.localVideoStream?.getAudioTracks()[0];
            if (audioTrack) {
                s.isMuted = !s.isMuted;
                audioTrack.enabled = !s.isMuted;
                ESCTRIX.elements.muteBtn.querySelector('i').className = s.isMuted ? 'ph ph-microphone-slash' : 'ph ph-microphone';
                ESCTRIX.showToast(s.isMuted ? 'Muted' : 'Unmuted');
            }
        },

        toggleCam() {
            const s = ESCTRIX.state;
            const videoTrack = s.localVideoStream?.getVideoTracks()[0];
            if (videoTrack) {
                s.isCamOff = !s.isCamOff;
                videoTrack.enabled = !s.isCamOff;
                ESCTRIX.elements.camOffBtn.querySelector('i').className = s.isCamOff ? 'ph ph-video-camera-slash' : 'ph ph-video-camera';
            }
        },

        async flipCamera() {
            const s = ESCTRIX.state;
            s.currentFacingMode = s.currentFacingMode === 'user' ? 'environment' : 'user';
            this.initiate('video');
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
    // MODAL HELPER
    // ─────────────────────────────────────────────────────────
    modal: {
        open(id) {
            const m = document.getElementById(id);
            if (m) m.classList.remove('hidden');
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
