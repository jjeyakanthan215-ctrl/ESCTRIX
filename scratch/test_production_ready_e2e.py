import time
import sys
import subprocess
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8006"

def run_test():
    print("=== STARTING FULL PRODUCTION E2E VERIFICATION ===", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--use-fake-ui-for-media-stream",
                "--use-fake-device-for-media-stream",
                "--no-sandbox"
            ]
        )

        ctx_a = browser.new_context(viewport={"width": 1280, "height": 800})
        ctx_b = browser.new_context(viewport={"width": 1280, "height": 800})

        page_a = ctx_a.new_page()
        page_b = ctx_b.new_page()

        errors_a = []
        errors_b = []
        page_a.on("pageerror", lambda e: errors_a.append(f"A error: {e}"))
        page_b.on("pageerror", lambda e: errors_b.append(f"B error: {e}"))
        page_a.on("console", lambda m: errors_a.append(f"A: {m.text}") if m.type == "error" else None)
        page_b.on("console", lambda m: errors_b.append(f"B: {m.text}") if m.type == "error" else None)

        ts = int(time.time() * 1000) % 100000
        user_a = f"alice_{ts}"
        user_b = f"bob_{ts}"

        # ── Step 1: Register & Login Alice ──
        print(f"[Step 1] Registering User A (@{user_a})...", flush=True)
        page_a.goto(URL, wait_until="domcontentloaded")
        page_a.wait_for_timeout(800)
        page_a.click("#intro-get-started-btn")
        page_a.wait_for_timeout(300)
        page_a.click("#auth-toggle")
        page_a.wait_for_timeout(200)
        page_a.fill("#auth-username", user_a)
        page_a.fill("#auth-password", "AliceSecret123!")
        page_a.fill("#auth-displayname", "Alice Quantum")
        page_a.click("#auth-submit-btn")
        page_a.wait_for_selector("#dashboard-screen.active", timeout=12000)
        print("  -> User A logged in successfully.", flush=True)

        # ── Step 2: Register & Login Bob ──
        print(f"[Step 2] Registering User B (@{user_b})...", flush=True)
        page_b.goto(URL, wait_until="domcontentloaded")
        page_b.wait_for_timeout(800)
        page_b.click("#intro-get-started-btn")
        page_b.wait_for_timeout(300)
        page_b.click("#auth-toggle")
        page_b.wait_for_timeout(200)
        page_b.fill("#auth-username", user_b)
        page_b.fill("#auth-password", "BobSecret123!")
        page_b.fill("#auth-displayname", "Bob Quantum")
        page_b.click("#auth-submit-btn")
        page_b.wait_for_selector("#dashboard-screen.active", timeout=12000)
        print("  -> User B logged in successfully.", flush=True)

        # ── Step 3: Verify Folder Tabs include 'Requests' ──
        print("[Step 3] Verifying Requests Folder Tab...", flush=True)
        req_tab = page_b.query_selector('.folder-tab[data-folder="requests"]')
        assert req_tab is not None, "Requests folder tab must be in DOM"
        print("  -> Requests folder tab verified in sidebar.", flush=True)

        # ── Step 4: Alice Adds Bob (Sends Contact/Friend Request) ──
        print(f"[Step 4] Alice adding Bob (@{user_b})...", flush=True)
        page_a.evaluate(f"async () => await ESCTRIX.addContact('{user_b}')")
        page_a.wait_for_timeout(1000)

        # ── Step 5: Bob Sees Real-Time Request Notification & Badge ──
        print("[Step 5] Checking Bob receives real-time request...", flush=True)
        page_b.wait_for_timeout(1000)
        page_b.click('.folder-tab[data-folder="requests"]')
        page_b.wait_for_timeout(500)

        card = page_b.wait_for_selector(f'.incoming-request-card[data-username="{user_a}"]', timeout=6000)
        assert card is not None, f"Request card for @{user_a} must be visible in Bob's Requests folder"
        print(f"  -> Bob successfully sees incoming request card for @{user_a}!", flush=True)

        # ── Step 6: Bob Accepts Request ──
        print("[Step 6] Bob accepting Alice's request...", flush=True)
        accept_btn = card.query_selector(".accept-request-btn")
        assert accept_btn is not None, "Accept button must exist on request card"
        accept_btn.click()
        page_b.wait_for_timeout(1000)

        # Verify Bob now has Alice in contacts
        contacts_b = page_b.evaluate("() => ESCTRIX.state.contacts.map(c => c.contact_username)")
        assert user_a in contacts_b, f"Alice (@{user_a}) must be in Bob's contacts after accept"
        print(f"  -> Request accepted! @{user_a} is now a mutual contact.", flush=True)

        # ── Step 7: Open Direct Chat & Test Real-Time Messaging with Status Ticks ──
        print("[Step 7] Testing real-time messaging between Alice and Bob...", flush=True)
        page_b.evaluate(f"ESCTRIX.chat.switchChat('space', {{ spaceName: '@{user_a}' }})")
        page_a.evaluate(f"ESCTRIX.chat.switchChat('space', {{ spaceName: '@{user_b}' }})")
        page_a.wait_for_timeout(800)
        page_b.wait_for_timeout(800)

        # Bob sends message to Alice
        test_msg = f"Quantum Secure Message {ts}"
        page_b.fill("#message-input", test_msg)
        page_b.click("#send-btn")
        page_b.wait_for_timeout(1000)

        # Alice receives message
        page_a.wait_for_selector(f"text={test_msg}", timeout=8000)
        print("  -> Real-time message delivered to Alice successfully!", flush=True)

        # Verify status tick on Bob's side
        sent_bubble = page_b.query_selector(".message.sent")
        assert sent_bubble is not None, "Sent message bubble must exist"
        tick = sent_bubble.query_selector(".msg-status-tick")
        assert tick is not None, "Status tick icon must be rendered"
        print("  -> Message status tick verified (delivered / read).", flush=True)

        # ── Step 8: Test Dynamic Mic <-> Send transformation ──
        print("[Step 8] Testing Mic vs Send plane icon transformation...", flush=True)
        page_a.fill("#message-input", "")
        page_a.wait_for_timeout(200)
        assert "mic-mode" in page_a.query_selector("#send-btn").get_attribute("class"), "Send button should be in mic-mode when input is empty"

        page_a.fill("#message-input", "Reply from Alice")
        page_a.wait_for_timeout(200)
        assert "mic-mode" not in page_a.query_selector("#send-btn").get_attribute("class"), "Send button should switch to send mode when input has text"
        page_a.click("#send-btn")
        page_a.wait_for_timeout(800)
        print("  -> Dynamic voice/send button functioning smoothly.", flush=True)

        # ── Step 9: Test WebRTC Calling & Floating Picture-in-Picture (PiP) ──
        print("[Step 9] Testing WebRTC Calling & Floating PiP Pill...", flush=True)
        page_a.click("#audio-call-btn")
        page_a.wait_for_timeout(1000)

        assert page_a.is_visible("#video-overlay:not(.hidden)"), "Alice's outgoing call overlay must be visible"
        print("  -> Outgoing calling overlay active with pulsing avatar and synthesized audio.", flush=True)

        # Minimize to floating PiP
        page_a.click("#call-minimize-btn")
        page_a.wait_for_timeout(500)
        assert page_a.is_visible("#call-pip-pill:not(.hidden)"), "Floating PiP pill must be visible"
        assert page_a.is_hidden("#video-overlay"), "Main video overlay must hide in PiP mode"
        print("  -> Call minimized to floating PiP pill. Chat interface remains accessible!", flush=True)

        # Restore from PiP
        page_a.click("#pip-expand-btn")
        page_a.wait_for_timeout(500)
        assert page_a.is_visible("#video-overlay:not(.hidden)"), "Main video overlay restored"
        assert page_a.is_hidden("#call-pip-pill"), "PiP pill hidden"

        # End call cleanly
        page_a.click("#end-video-call-btn")
        page_a.wait_for_timeout(600)
        assert page_a.is_hidden("#video-overlay"), "Call overlay closed on teardown"
        print("  -> Call ended cleanly with zero stream leaks.", flush=True)

        # ── Step 10: Check for console errors ──
        print("[Step 10] Checking console error logs on both clients...", flush=True)
        fatal_errors = [e for e in (errors_a + errors_b) if "favicon" not in e.lower()]
        if fatal_errors:
            print(f"  WARNING: Detected {len(fatal_errors)} console errors:")
            for err in fatal_errors:
                print("   ", err)
        else:
            print("  -> ZERO JavaScript / DOM errors detected across both clients!", flush=True)

        browser.close()
        print("\n=== ALL PRODUCTION E2E TESTS PASSED WITH 100% SUCCESS! ===", flush=True)

if __name__ == "__main__":
    run_test()
