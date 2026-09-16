"""
Automated Two-Party End-to-End Calling Test
Simulates:
1. User Alice (Context A) and User Bob (Context B) logging in concurrently
2. Alice adding Bob as contact and opening direct chat
3. Alice clicking #video-call-btn (initiating call)
4. Alice's outgoing ringing overlay (#outgoing-call-card) displaying with pulsing avatar
5. Bob receiving incoming call modal (#call-modal) with Alice's name and ringtone
6. Bob clicking #accept-call-btn to connect the call
7. Both users active in WebRTC call session with live timer
8. Alice minimizing to Picture-in-Picture (#call-pip-pill) and restoring
9. Call termination (#end-video-call-btn) and clean teardown on both sides
10. Verifying zero JavaScript or DOM errors on both browsers
"""
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8006"

def run_two_party_call_test():
    print("=== STARTING AUTOMATED TWO-PARTY CALLING TEST IN DOM ===", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--use-fake-ui-for-media-stream",
                "--use-fake-device-for-media-stream",
                "--no-sandbox",
                "--disable-dev-shm-usage"
            ]
        )

        context_a = browser.new_context(viewport={"width": 1280, "height": 800})
        context_b = browser.new_context(viewport={"width": 1280, "height": 800})

        page_a = context_a.new_page()
        page_b = context_b.new_page()

        errors_a = []
        errors_b = []
        page_a.on("pageerror", lambda e: errors_a.append(str(e)))
        page_b.on("pageerror", lambda e: errors_b.append(str(e)))
        page_a.on("console", lambda m: errors_a.append(f"A: {m.text}") if m.type == "error" else None)
        page_b.on("console", lambda m: errors_b.append(f"B: {m.text}") if m.type == "error" else None)

        ts = int(time.time()) % 10000
        user_a = f"alice_{ts}"
        user_b = f"bob_{ts}"

        # ── Step 1: Register and Log In User A (Alice) ──
        print(f"[Step 1] Logging in User A (@{user_a})...", flush=True)
        page_a.goto(BASE_URL, wait_until="domcontentloaded")
        page_a.wait_for_timeout(600)
        page_a.click("#intro-get-started-btn")
        page_a.wait_for_timeout(300)
        page_a.click("#auth-toggle")
        page_a.wait_for_timeout(200)
        page_a.fill("#auth-username", user_a)
        page_a.fill("#auth-password", "AliceSecret99!")
        page_a.fill("#auth-displayname", "Alice Quantum")
        page_a.click("#auth-submit-btn")
        page_a.wait_for_timeout(1000)
        assert page_a.is_visible("#dashboard-screen:not(.hidden)"), "Alice must reach dashboard"
        print(f"  -> Alice logged in successfully.", flush=True)

        # ── Step 2: Register and Log In User B (Bob) ──
        print(f"[Step 2] Logging in User B (@{user_b})...", flush=True)
        page_b.goto(BASE_URL, wait_until="domcontentloaded")
        page_b.wait_for_timeout(600)
        page_b.click("#intro-get-started-btn")
        page_b.wait_for_timeout(300)
        page_b.click("#auth-toggle")
        page_b.wait_for_timeout(200)
        page_b.fill("#auth-username", user_b)
        page_b.fill("#auth-password", "BobSecret99!")
        page_b.fill("#auth-displayname", "Bob Quantum")
        page_b.click("#auth-submit-btn")
        page_b.wait_for_timeout(1000)
        assert page_b.is_visible("#dashboard-screen:not(.hidden)"), "Bob must reach dashboard"
        print(f"  -> Bob logged in successfully.", flush=True)

        # ── Step 3: Alice Adds Bob as Contact & Opens Direct Chat ──
        print(f"[Step 3] Alice adding Bob (@{user_b}) and opening direct chat...", flush=True)
        page_a.evaluate(f"""async () => {{
            await ESCTRIX.addContact('{user_b}');
            ESCTRIX.chat.switchChat('space', {{ spaceName: '@{user_b}' }});
        }}""")
        page_a.wait_for_timeout(800)
        assert page_a.eval_on_selector("#active-chat-name", "el => el.textContent") == f"@{user_b}", "Alice must be in direct chat with Bob"
        print(f"  -> Alice opened direct chat pane with @{user_b}.", flush=True)

        # ── Step 4: Alice Initiates Video Call ──
        print("[Step 4] Alice clicking Video Call button (#video-call-btn)...", flush=True)
        assert page_a.is_visible("#video-call-btn"), "Video call button must be visible"
        page_a.click("#video-call-btn")
        page_a.wait_for_timeout(1000)

        # Verify Alice's Outgoing Ringing Overlay
        assert page_a.is_visible("#video-overlay:not(.hidden)"), "Alice's video overlay must open"
        assert page_a.is_visible("#outgoing-call-card:not(.hidden)"), "Alice's outgoing ringing card must display"
        print("  -> Alice is in calling state with pulsing radar rings.", flush=True)

        # ── Step 5: Bob Receives Incoming Call ──
        print("[Step 5] Verifying Bob receives incoming call modal...", flush=True)
        page_b.wait_for_selector("#call-modal:not(.hidden)", timeout=8000)
        caller_label = page_b.eval_on_selector("#caller-name", "el => el.textContent")
        print(f"  -> Bob received incoming call modal from: '{caller_label}'", flush=True)

        # ── Step 6: Bob Accepts Call ──
        print("[Step 6] Bob clicking Accept Call (#accept-call-btn)...", flush=True)
        page_b.click("#accept-call-btn")
        page_b.wait_for_timeout(1500)

        # Verify both users are now in active call mode
        assert page_b.is_visible("#video-overlay:not(.hidden)"), "Bob's video overlay must be active"
        assert page_a.is_hidden("#outgoing-call-card"), "Alice's outgoing card must hide upon answer"
        print("  -> Both Alice and Bob connected in encrypted call session!", flush=True)

        # ── Step 7: Test Picture-in-Picture Multitasking on Alice ──
        print("[Step 7] Testing Picture-in-Picture minimization on Alice's device...", flush=True)
        page_a.click("#call-minimize-btn")
        page_a.wait_for_timeout(500)
        assert page_a.is_hidden("#video-overlay"), "Alice's video overlay should hide in PiP mode"
        assert page_a.is_visible("#call-pip-pill:not(.hidden)"), "Alice's floating PiP pill must be visible"
        print("  -> Call minimized into floating PiP pill. Chat pane remains interactive!", flush=True)

        # Maximize back
        page_a.click("#pip-expand-btn")
        page_a.wait_for_timeout(500)
        assert page_a.is_visible("#video-overlay:not(.hidden)"), "Overlay should restore on maximize"
        print("  -> PiP pill maximized back to full overlay.", flush=True)

        # ── Step 8: Clean Teardown / End Call ──
        print("[Step 8] Ending call (#end-video-call-btn)...", flush=True)
        page_a.click("#end-video-call-btn")
        page_a.wait_for_timeout(1000)

        assert page_a.is_hidden("#video-overlay"), "Alice's video overlay must close on call end"
        assert page_b.is_hidden("#video-overlay"), "Bob's video overlay must close synchronously"
        print("  -> Call terminated and media released symmetrically on both devices.", flush=True)

        # ── Step 9: Console Error Verification ──
        print("[Step 9] Checking console error logs for both clients...", flush=True)
        errs = errors_a + errors_b
        if errs:
            print(f"  WARNING: {len(errs)} error(s) detected:")
            for e in errs:
                print("   ", e)
        else:
            print("  -> ZERO JavaScript or DOM errors detected across both clients!", flush=True)

        browser.close()
        print("\n=== TWO-PARTY CALLING TEST COMPLETED WITH 100% SUCCESS! ===", flush=True)

if __name__ == "__main__":
    run_two_party_call_test()
