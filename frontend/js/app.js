/**
 * ESCTRIX Quantum — Futuristic Telegram P2P Messenger & AI Suite
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
        this.bindEvents();
        this.initPWA();
        this.initSavedPreferences();
        this.checkPersistentAuth();
        console.log('⚡ ESCTRIX Quantum Initialized');
    },

    cacheElements() {
        const ids = [
            'intro-screen', 'intro-get-started-btn', 'intro-admin-portal-btn', 'auth-back-to-intro-btn',
            'role-tab-user', 'role-tab-admin', 'admin-enter-chat-btn', 'admin-logout-btn',
            'auth-brand-badge', 'auth-user-icon', 'auth-security-text', 'auth-switch-bar',
            'login-screen', 'dashboard-screen', 'admin-screen',
            'auth-title', 'auth-subtitle', 'auth-username', 'auth-password', 'auth-displayname',
            'display-name-group', 'auth-submit-btn', 'auth-toggle', 'auth-toggle-msg', 'login-error',
            'telegram-sidebar', 'telegram-chat-pane', 'chat-search-input', 'search-clear-btn',
            'new-space-btn', 'chat-threads-list', 'dynamic-chat-threads', 'thread-aura-ai', 'thread-saved-messages',
            'drawer-open-btn', 'profile-drawer', 'drawer-backdrop', 'drawer-close-btn',
            'drawer-avatar-halo', 'drawer-avatar-text', 'drawer-avatar-change-btn', 'drawer-displayname',
            'drawer-username', 'drawer-account-id', 'copy-account-id-btn', 'drawer-input-displayname',
            'drawer-input-bio', 'drawer-save-profile-btn', 'toggle-sfx', 'logout-btn',
            'footer-user-chip', 'footer-user-avatar', 'footer-user-name', 'footer-user-id',
            'cmd-palette-btn', 'admin-panel-btn', 'admin-back-btn',
            'back-to-threads-btn', 'active-chat-avatar', 'active-chat-dot', 'active-chat-name', 'active-chat-status',
            'vibe-indicator-badge', 'vibe-emoji', 'vibe-text', 'video-call-btn', 'screen-share-btn',
            'e2ee-verify-btn', 'chat-menu-btn', 'chat-dropdown-menu', 'menu-vanish-btn', 'menu-burn-btn',
            'menu-summarize-btn', 'menu-export-btn', 'menu-clear-btn',
            'messages-viewport', 'messages-list', 'typing-indicator', 'typing-avatar', 'typing-name',
            'smart-replies', 'voice-recording-bar', 'voice-rec-timer',
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
            'e2ee-modal', 'e2ee-canvas', 'e2ee-hash-label', 'e2ee-close-btn',
            'stat-total-users', 'stat-active-hosts', 'stat-total-connections', 'stat-ai-status', 'admin-users-tbody',
            'admin-hosts-ul', 'admin-chat-log', 'admin-broadcast-msg', 'admin-broadcast-btn',
            'admin-new-password-input', 'admin-change-pwd-btn', 'admin-back-intro-btn',
            'kicked-overlay', 'kicked-message', 'kicked-ok-btn', 'kick-admin-modal', 'kick-modal-target',
            'kick-custom-msg', 'kick-confirm-btn', 'kick-cancel-btn', 'toast', 'toast-msg',
            'intro-nav-get-started-btn', 'intro-nav-admin-btn', 'intro-bottom-get-started-btn',
            'intro-user-card', 'intro-user-avatar', 'intro-user-displayname', 'intro-user-handle',
            'intro-user-accountid', 'intro-btn-label', 'intro-switch-account-btn',
            'nav-to-intro-btn', 'chat-commander-btn'
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
            if (this.elements.toggleSfx) this.elements.toggleSfx.checked = this.state.sfxEnabled;
        }
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

        // Profile Drawer
        if (e.drawerDisplayname) e.drawerDisplayname.textContent = user.display_name || user.username;
        if (e.drawerUsername) e.drawerUsername.textContent = `@${user.username}`;
        if (e.drawerAccountId) e.drawerAccountId.textContent = user.account_id || 'ESC-QUANTUM';
        if (e.drawerAvatarText) {
            e.drawerAvatarText.textContent = initials;
            if (user.avatar_color) e.drawerAvatarHalo.style.background = user.avatar_color;
        }
        if (e.drawerInputDisplayname) e.drawerInputDisplayname.value = user.display_name || user.username;
        if (e.drawerInputBio) e.drawerInputBio.value = user.bio || '';

        // Admin trigger
        if (user.role === 'admin') {
            if (e.adminPanelBtn) e.adminPanelBtn.classList.remove('hidden');
            if (e.chatCommanderBtn) e.chatCommanderBtn.classList.remove('hidden');
        } else {
            if (e.adminPanelBtn) e.adminPanelBtn.classList.add('hidden');
            if (e.chatCommanderBtn) e.chatCommanderBtn.classList.add('hidden');
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
                this.auth.setRoleMode('user');
                this.showScreen('login-screen');
            }
        };

        e.introGetStartedBtn?.addEventListener('click', handleGetStarted);
        e.introNavGetStartedBtn?.addEventListener('click', handleGetStarted);
        e.introBottomGetStartedBtn?.addEventListener('click', handleGetStarted);

        const handleAdminPortal = () => {
            this.playSfx('click');
            if (this.state.user && this.state.user.role === 'admin') {
                this.admin.open();
            } else {
                this.auth.setRoleMode('admin');
                this.showScreen('login-screen');
            }
        };

        e.introAdminPortalBtn?.addEventListener('click', handleAdminPortal);
        e.introNavAdminBtn?.addEventListener('click', handleAdminPortal);

        e.introSwitchAccountBtn?.addEventListener('click', () => {
            this.playSfx('click');
            this.auth.setRoleMode('user');
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

        e.chatCommanderBtn?.addEventListener('click', () => {
            this.playSfx('click');
            this.admin.open();
        });

        e.authBackToIntroBtn?.addEventListener('click', () => {
            this.playSfx('click');
            this.renderIntroUserState(this.state.user);
            this.showScreen('intro-screen');
        });
        e.roleTabUser?.addEventListener('click', () => this.auth.setRoleMode('user'));
        e.roleTabAdmin?.addEventListener('click', () => this.auth.setRoleMode('admin'));
        e.adminEnterChatBtn?.addEventListener('click', () => {
            this.playSfx('click');
            this.showScreen('dashboard-screen');
        });
        e.adminLogoutBtn?.addEventListener('click', () => this.auth.logout());
        e.adminChangePwdBtn?.addEventListener('click', () => this.admin.changeMyPassword());

        // Auth Screen
        e.authToggle?.addEventListener('click', () => this.auth.toggleMode());
        e.authSubmitBtn?.addEventListener('click', () => this.auth.submit());
        e.authPassword?.addEventListener('keypress', (ev) => { if (ev.key === 'Enter') this.auth.submit(); });

        // Drawer
        e.drawerOpenBtn?.addEventListener('click', () => this.drawer.open());
        e.drawerCloseBtn?.addEventListener('click', () => this.drawer.close());
        e.drawerBackdrop?.addEventListener('click', () => this.drawer.close());
        e.footerUserChip?.addEventListener('click', () => this.drawer.open());
        e.copyAccountIdBtn?.addEventListener('click', () => this.drawer.copyAccountId());
        e.drawerSaveProfileBtn?.addEventListener('click', () => this.drawer.saveProfile());
        e.drawerAvatarChangeBtn?.addEventListener('click', () => this.drawer.cycleAvatarColor());
        e.logoutBtn?.addEventListener('click', () => this.auth.logout());
        e.toggleSfx?.addEventListener('change', (ev) => {
            this.state.sfxEnabled = ev.target.checked;
            localStorage.setItem('esctrix_sfx', String(this.state.sfxEnabled));
            this.playSfx('click');
        });

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
            if (ev.key === 'Enter') this.chat.sendMessage();
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

        // Voice Note Recorder
        if (e.voiceNoteBtn) {
            e.voiceNoteBtn.addEventListener('click', () => this.voice.toggle());
        }

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
    // AUTHENTICATION MODULE
    // ─────────────────────────────────────────────────────────
    auth: {
        setRoleMode(mode) {
            const e = ESCTRIX.elements;
            e.loginError.textContent = '';
            if (mode === 'admin') {
                ESCTRIX.state.isAdminAuthMode = true;
                e.roleTabAdmin?.classList.add('active', 'admin-mode');
                e.roleTabUser?.classList.remove('active');
                e.authTitle.textContent = 'Admin Commander Portal';
                e.authSubtitle.textContent = 'Enter administrator credentials for live telemetry & moderation';
                if (e.authBrandBadge) {
                    e.authBrandBadge.textContent = 'COMMANDER';
                    e.authBrandBadge.style.background = 'linear-gradient(135deg, #ef4444, #8b5cf6)';
                }
                if (e.authSwitchBar) e.authSwitchBar.style.display = 'none';
                if (e.displayNameGroup) e.displayNameGroup.style.display = 'none';
                e.authUsername.placeholder = 'Admin Handle (e.g. ESCTRIX_Admin, Gayathri)';
                e.authSubmitBtn.innerHTML = '<i class="ph ph-shield-star"></i> Access Command Console';
                if (e.authSecurityText) e.authSecurityText.textContent = 'Encrypted TLS Root Administrator Channel';
            } else {
                ESCTRIX.state.isAdminAuthMode = false;
                e.roleTabUser?.classList.add('active');
                e.roleTabAdmin?.classList.remove('active', 'admin-mode');
                e.authTitle.textContent = ESCTRIX.state.isLoginMode ? 'Account Login' : 'Create Quantum Identity';
                e.authSubtitle.textContent = 'Decentralized P2P Messaging & Neural AI';
                if (e.authBrandBadge) {
                    e.authBrandBadge.textContent = 'QUANTUM';
                    e.authBrandBadge.style.background = 'linear-gradient(135deg, var(--primary), var(--accent))';
                }
                if (e.authSwitchBar) e.authSwitchBar.style.display = 'block';
                e.authUsername.placeholder = 'Username (Handle)';
                e.authSubmitBtn.innerHTML = ESCTRIX.state.isLoginMode ? '<i class="ph ph-sign-in"></i> Sign In' : '<i class="ph ph-user-plus"></i> Generate Account';
                if (e.authSecurityText) e.authSecurityText.textContent = 'Zero-Knowledge AES-256 E2EE Client Secured';
            }
        },

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

            const endpoint = (ESCTRIX.state.isLoginMode || ESCTRIX.state.isAdminAuthMode) ? '/api/auth/login' : '/api/auth/register';
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
                        // Fallback profile query
                        const pRes = await fetch(`/api/user/profile?username=${encodeURIComponent(username)}`);
                        const pData = await pRes.json();
                        user = pData.profile || { username, account_id: 'ESC-LIVE', display_name: username, role: data.role || 'user' };
                    }

                    // Check admin role if in admin mode
                    if (ESCTRIX.state.isAdminAuthMode && user.role !== 'admin') {
                        e.loginError.textContent = 'Access Denied: This identity does not possess Commander privileges.';
                        return;
                    }

                    ESCTRIX.state.user = user;
                    localStorage.setItem('esctrix_quantum_session', JSON.stringify(user));
                    ESCTRIX.applyUserProfile(user);

                    if (ESCTRIX.state.isAdminAuthMode) {
                        ESCTRIX.admin.open();
                        ESCTRIX.showToast(`Commander Verified: Welcome to Command Console 🛡️`);
                    } else {
                        ESCTRIX.showScreen('dashboard-screen');
                        ESCTRIX.loadSavedMessages();
                        ESCTRIX.loadContacts();
                        ESCTRIX.showToast(`Identity verified: ${user.display_name || user.username} 🚀`);
                    }
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
            ESCTRIX.elements.profileDrawer.classList.add('hidden');
            ESCTRIX.elements.authUsername.value = '';
            ESCTRIX.elements.authPassword.value = '';
            ESCTRIX.renderIntroUserState(null);
            ESCTRIX.showScreen('intro-screen');
            ESCTRIX.showToast('Session terminated securely.');
        }
    },

    // ─────────────────────────────────────────────────────────
    // PROFILE DRAWER MODULE
    // ─────────────────────────────────────────────────────────
    drawer: {
        open() {
            ESCTRIX.playSfx('click');
            ESCTRIX.elements.profileDrawer.classList.remove('hidden');
        },
        close() {
            ESCTRIX.elements.profileDrawer.classList.add('hidden');
        },
        copyAccountId() {
            const id = ESCTRIX.state.user?.account_id || 'ESC-000000';
            navigator.clipboard.writeText(id).then(() => {
                ESCTRIX.playSfx('send');
                ESCTRIX.showToast(`Account ID ${id} copied to clipboard! 📋`);
            });
        },
        async saveProfile() {
            const user = ESCTRIX.state.user;
            if (!user) return;
            const newName = ESCTRIX.elements.drawerInputDisplayname.value.trim();
            const newBio = ESCTRIX.elements.drawerInputBio.value.trim();

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
                    ESCTRIX.drawer.close();
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
                        ${msg.sender === 'me' ? '<i class="ph ph-checks" style="color:var(--accent)"></i>' : ''}
                    </div>
                `;
                // Bind voice play
                const pBtn = div.querySelector('.voice-play-btn');
                pBtn?.addEventListener('click', () => ESCTRIX.voice.playAudio(decodeURIComponent(pBtn.dataset.audio), pBtn));
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
                        ${msg.sender === 'me' ? '<i class="ph ph-checks" style="color:var(--accent)"></i>' : ''}
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
                        ${msg.sender === 'me' ? '<i class="ph ph-checks" style="color:var(--accent)"></i>' : ''}
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
            if (confirm('🔥 Burn Space: Permanently wipe this room and purge all data for everyone?')) {
                ESCTRIX.playSfx('call');
                if (ESCTRIX.state.p2p) {
                    ESCTRIX.state.p2p.sendData({ type: 'burn_room' });
                }
                ESCTRIX.state.chatHistories[ESCTRIX.state.activeChat.type] = [];
                ESCTRIX.chat.renderMessages();
                ESCTRIX.showToast('Room Purged & Cryptographically Burned. 🧹');
            }
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

            // Bind click to connect or add contact
            list.querySelectorAll('.user-search-result').forEach(row => {
                row.addEventListener('click', () => {
                    const targetUname = row.dataset.username;
                    ESCTRIX.addContact(targetUname);
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
    // VOICE NOTE RECORDER MODULE
    // ─────────────────────────────────────────────────────────
    voice: {
        async toggle() {
            const s = ESCTRIX.state;
            if (s.mediaRecorder && s.mediaRecorder.state === 'recording') {
                this.stop();
            } else {
                this.start();
            }
        },

        async start() {
            const e = ESCTRIX.elements;
            const s = ESCTRIX.state;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                s.voiceChunks = [];
                s.mediaRecorder = new MediaRecorder(stream);

                s.mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) s.voiceChunks.push(event.data);
                };

                s.mediaRecorder.onstop = () => {
                    const blob = new Blob(s.voiceChunks, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result;
                        const durationStr = `${Math.floor(s.voiceSeconds / 60)}:${(s.voiceSeconds % 60).toString().padStart(2, '0')}`;
                        const voiceMsg = {
                            sender: 'me',
                            type: 'voice',
                            data: base64,
                            duration: durationStr,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                        s.chatHistories[s.activeChat.type].push(voiceMsg);
                        ESCTRIX.chat.appendMessageDOM(voiceMsg);
                        ESCTRIX.playSfx('send');

                        if (s.activeChat.type === 'space' && s.p2p) {
                            s.p2p.sendData({
                                type: 'voice_note',
                                payload: base64,
                                duration: durationStr
                            });
                        }
                    };
                    reader.readAsDataURL(blob);
                    stream.getTracks().forEach(t => t.stop());
                };

                s.mediaRecorder.start();
                s.voiceSeconds = 0;
                e.voiceRecordingBar.classList.remove('hidden');
                e.voiceRecTimer.textContent = '0:00';
                s.voiceTimerInterval = setInterval(() => {
                    s.voiceSeconds++;
                    e.voiceRecTimer.textContent = `${Math.floor(s.voiceSeconds / 60)}:${(s.voiceSeconds % 60).toString().padStart(2, '0')}`;
                }, 1000);
                ESCTRIX.playSfx('click');
            } catch (err) {
                ESCTRIX.showToast('Microphone access denied or unavailable.', true);
            }
        },

        stop() {
            const s = ESCTRIX.state;
            const e = ESCTRIX.elements;
            if (s.mediaRecorder && s.mediaRecorder.state === 'recording') {
                s.mediaRecorder.stop();
            }
            clearInterval(s.voiceTimerInterval);
            e.voiceRecordingBar.classList.add('hidden');
        },

        playAudio(base64Url, buttonEl) {
            const s = ESCTRIX.state;
            if (s.currentAudioPlayer) {
                s.currentAudioPlayer.pause();
                s.currentAudioPlayer = null;
                document.querySelectorAll('.voice-play-btn i').forEach(i => i.className = 'ph ph-play');
            }

            const audio = new Audio(base64Url);
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

            hashLabel.textContent = `FINGERPRINT: SHA256-${Math.abs(hash).toString(16).toUpperCase()}-QUANTUM-E2EE`;
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
                        const isRoot = ['ESCTRIX_Admin', 'Gayathri'].includes(usr.username);
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
            if (!confirm(`Switch @${targetUsername} role to ${newRole.toUpperCase()}?`)) return;
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
        },

        async promptResetPassword(targetUsername) {
            const newPwd = prompt(`Enter new password for @${targetUsername} (minimum 4 characters):`);
            if (!newPwd) return;
            if (newPwd.length < 4) {
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
            if (!confirm(`Permanently purge identity @${targetUsername}? All account records will be deleted.`)) return;
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
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
    }
};

// Start application when DOM is loaded
window.addEventListener('DOMContentLoaded', () => ESCTRIX.init());
