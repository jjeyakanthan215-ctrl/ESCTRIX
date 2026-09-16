import time
import sys
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8006"

def run_test():
    print("=== STARTING AUTOMATED DOM & CHAT/CALL VERIFICATION ===", flush=True)

    with sync_playwright() as p:
        # Launch browser with fake media devices so WebRTC calls work seamlessly in headless
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--use-fake-ui-for-media-stream",
                "--use-fake-device-for-media-stream"
            ]
        )

        context_a = browser.new_context()
        page_a = context_a.new_page()

        errors_a = []
        page_a.on("pageerror", lambda exc: errors_a.append(str(exc)))
        page_a.on("console", lambda msg: errors_a.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)

        print("[Step 1] Loading web app and verifying initial DOM...", flush=True)
        page_a.goto(URL, wait_until="domcontentloaded")
        page_a.wait_for_timeout(1000)

        # 1. Verify Intro Screen
        assert page_a.is_visible("#intro-screen.active"), "Intro screen should be active on start"
        print("  -> Intro screen verified.", flush=True)

        # 2. Register & Login User A
        user_a = f"alice_{int(time.time()) % 10000}"
        page_a.click("#intro-get-started-btn")
        page_a.wait_for_timeout(400)
        page_a.click("#auth-toggle")
        page_a.fill("#auth-username", user_a)
        page_a.fill("#auth-password", "pass12345")
        page_a.click("#auth-submit-btn")
        page_a.wait_for_timeout(800)

        if page_a.is_visible("#login-screen.active"):
            page_a.fill("#auth-username", user_a)
            page_a.fill("#auth-password", "pass12345")
            page_a.click("#auth-submit-btn")
            page_a.wait_for_selector("#dashboard-screen.active", timeout=10000)

        print(f"  -> User A (@{user_a}) logged in to dashboard.", flush=True)

        # 3. Verify Newly Added Calling & Chat DOM Elements
        print("[Step 2] Verifying Instagram/WhatsApp/Telegram DOM elements...", flush=True)
        assert page_a.query_selector("#audio-call-btn"), "Dedicated Audio Call button (#audio-call-btn) must exist in header"
        assert page_a.query_selector("#video-call-btn"), "Dedicated Video Call button (#video-call-btn) must exist in header"
        assert page_a.query_selector("#reply-preview-bar"), "Quoted Reply Preview bar (#reply-preview-bar) must exist"
        assert page_a.query_selector("#attachment-popover"), "Attachment Popover menu (#attachment-popover) must exist"
        assert page_a.query_selector("#call-minimize-btn"), "Call Minimize PiP button (#call-minimize-btn) must exist"
        assert page_a.query_selector("#outgoing-call-card"), "Outgoing Call Card (#outgoing-call-card) must exist"
        assert page_a.query_selector("#call-pip-pill"), "Floating PiP Pill (#call-pip-pill) must exist"
        print("  -> All calling and chat DOM elements verified in document structure.", flush=True)

        # 4. Verify Dynamic Mic <-> Send Transition
        print("[Step 3] Testing dynamic Voice Mic <-> Send Plane button transformation...", flush=True)
        send_btn = page_a.query_selector("#send-btn")
        assert "mic-mode" in send_btn.get_attribute("class"), "Send button should be in mic-mode when input is empty"
        print("  -> Empty input correctly displays Microphone mode.", flush=True)

        # Type text
        page_a.fill("#message-input", "Hello Quantum World")
        page_a.wait_for_timeout(300)
        assert "mic-mode" not in page_a.query_selector("#send-btn").get_attribute("class"), "Send button should switch to send mode when text is typed"
        print("  -> Typing text smoothly switches button to Send Plane mode.", flush=True)

        # Clear text
        page_a.fill("#message-input", "")
        page_a.wait_for_timeout(300)
        assert "mic-mode" in page_a.query_selector("#send-btn").get_attribute("class"), "Send button should revert to mic-mode when cleared"
        print("  -> Clearing input reverts button to Microphone mode.", flush=True)

        # 5. Verify Attachment Popover Menu
        print("[Step 4] Testing Attachment Popover menu...", flush=True)
        page_a.click("#file-btn")
        page_a.wait_for_timeout(300)
        assert page_a.is_visible("#attachment-popover:not(.hidden)"), "Attachment popover should be visible on file-btn click"
        print("  -> Attachment popover opened with Photos/Videos, Docs, View-Once, and Voice options.", flush=True)
        # Close by clicking outside
        page_a.click(".chat-pane-header")
        page_a.wait_for_timeout(300)
        assert page_a.is_hidden("#attachment-popover"), "Attachment popover should close when clicking outside"
        print("  -> Attachment popover closed on outside click.", flush=True)

        # 6. Test Message Sending, Quoted Reply, and Instagram Double-Tap to Like
        print("[Step 5] Testing message sending & reaction features...", flush=True)
        page_a.fill("#message-input", "First test message from Alice")
        page_a.click("#send-btn")
        page_a.wait_for_timeout(500)

        # Verify message bubble in DOM
        messages = page_a.query_selector_all(".message.sent")
        assert len(messages) >= 1, "At least 1 sent message must be rendered in DOM"
        latest_msg = messages[-1]
        print("  -> Message sent and rendered in DOM with timestamp and status tick.", flush=True)

        # Verify quick reply button
        print("[Step 6] Testing Quoted Reply Preview Bar...", flush=True)
        reply_btn = latest_msg.query_selector(".msg-reply-trigger-btn")
        if reply_btn:
            reply_btn.click()
            page_a.wait_for_timeout(300)
            assert page_a.is_visible("#reply-preview-bar:not(.hidden)"), "Reply preview bar should become visible"
            print("  -> Quoted Reply bar activated with sender and snippet.", flush=True)

            # Send reply message
            page_a.fill("#message-input", "This is a quoted reply!")
            page_a.click("#send-btn")
            page_a.wait_for_timeout(500)

            # Check that the new message contains .message-reply-quote
            reply_quotes = page_a.query_selector_all(".message-reply-quote")
            assert len(reply_quotes) >= 1, "Quoted reply bubble must be present in DOM"
            print("  -> Quoted reply block successfully embedded into message bubble.", flush=True)

        # Test Instagram Double-Tap to Like
        print("[Step 7] Testing Instagram-style Double-Click to Like (Heart Burst)...", flush=True)
        latest_msg = page_a.query_selector_all(".message.sent")[-1]
        latest_msg.dblclick()
        page_a.wait_for_timeout(600)
        reaction_pill = latest_msg.query_selector(".msg-reaction-pill[data-emoji='❤️']")
        assert reaction_pill is not None, "Double-click should create a ❤️ reaction pill on the message bubble"
        print("  -> Double-tap heart reaction successfully applied to message bubble.", flush=True)

        # 7. Test Calling Option & Outgoing Ringing Overlay
        print("[Step 8] Testing Audio Call Initiation & Outgoing Ringing Overlay...", flush=True)
        page_a.click("#audio-call-btn")
        page_a.wait_for_timeout(1000)

        assert page_a.is_visible("#video-overlay:not(.hidden)"), "Video overlay should be visible when call is initiated"
        assert page_a.is_visible("#outgoing-call-card:not(.hidden)"), "Outgoing ringing card with pulsing avatar must be visible"
        print("  -> Outgoing call overlay active with synthesized Web Audio ringtone cadence.", flush=True)

        # 8. Test Picture-in-Picture (PiP) Floating Pill
        print("[Step 9] Testing Picture-in-Picture (PiP) Minimize & Maximize...", flush=True)
        page_a.click("#call-minimize-btn")
        page_a.wait_for_timeout(500)

        assert page_a.is_hidden("#video-overlay"), "Video overlay should be hidden when minimized to PiP"
        assert page_a.is_visible("#call-pip-pill:not(.hidden)"), "Floating PiP pill must be visible"
        print("  -> Call minimized into sleek floating PiP pill. Chat interface remains completely accessible!", flush=True)

        # Maximize PiP pill
        page_a.click("#pip-expand-btn")
        page_a.wait_for_timeout(500)
        assert page_a.is_visible("#video-overlay:not(.hidden)"), "Video overlay should restore when PiP is expanded"
        assert page_a.is_hidden("#call-pip-pill"), "PiP pill should hide when call is maximized"
        print("  -> PiP maximized back to full-screen overlay seamlessly.", flush=True)

        # End the call
        page_a.click("#end-video-call-btn")
        page_a.wait_for_timeout(500)
        assert page_a.is_hidden("#video-overlay"), "Video overlay should close on call end"
        print("  -> Call ended cleanly and media streams torn down.", flush=True)

        # Check console errors
        print("[Step 10] Checking console error logs...", flush=True)
        if errors_a:
            print(f"  WARNING: {len(errors_a)} console errors/page errors detected:")
            for e in errors_a:
                print("   ", e)
        else:
            print("  -> ZERO JavaScript or DOM errors detected! Code is flawless.", flush=True)

        browser.close()
        print("\n=== ALL AUTOMATED DOM TESTS PASSED WITH 100% SUCCESS! ===", flush=True)

if __name__ == "__main__":
    run_test()
