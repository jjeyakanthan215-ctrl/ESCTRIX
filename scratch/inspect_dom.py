import time
import sys
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8006"

def inspect():
    console_errors = []
    console_logs = []
    page_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warning"] else console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda exc: page_errors.append(str(exc)))

        print("Navigating to", URL, flush=True)
        page.goto(URL, wait_until="domcontentloaded")
        page.wait_for_timeout(1000)

        print("Page Title:", page.title(), flush=True)
        print("Intro screen visible:", page.is_visible("#intro-screen.active"), flush=True)

        # Click Get Started
        page.click("#intro-get-started-btn")
        page.wait_for_timeout(500)
        print("Login screen visible:", page.is_visible("#login-screen.active"), flush=True)

        # Register new user
        user_name = f"tester_{int(time.time()) % 10000}"
        print(f"Registering user {user_name}...", flush=True)
        page.click("#auth-toggle")
        page.wait_for_timeout(300)
        page.fill("#auth-username", user_name)
        page.fill("#auth-password", "pass12345")
        page.click("#auth-submit-btn")
        page.wait_for_timeout(1000)

        # If on login screen, submit credentials to log in
        if page.is_visible("#login-screen.active"):
            print("Logging in with newly created account...", flush=True)
            page.fill("#auth-username", user_name)
            page.fill("#auth-password", "pass12345")
            page.click("#auth-submit-btn")
            page.wait_for_selector("#dashboard-screen.active", timeout=10000)

        print("Logged in successfully! Dashboard is active.", flush=True)

        # Enter chat pane
        # Check active chat pane or click on Aura AI / Chat
        print("Opening chat...", flush=True)
        # Check if chat-screen or 2-pane dashboard is already the chat interface!
        chat_pane = page.query_selector("#quantum-chat-pane")
        print("Quantum Cyber-style Chat pane in DOM:", bool(chat_pane), flush=True)
        print("Chat pane visible:", page.is_visible("#quantum-chat-pane"), flush=True)

        # Check Active Chat Header details
        chat_name = page.query_selector("#active-chat-name")
        print("Active chat name:", chat_name.inner_text() if chat_name else "N/A", flush=True)

        # Check Calling UI elements
        video_call_btn = page.query_selector("#video-call-btn")
        print("Call button present:", bool(video_call_btn), flush=True)
        if video_call_btn:
            print("Testing Call Chooser Modal...", flush=True)
            video_call_btn.click()
            page.wait_for_timeout(500)
            modal_visible = page.is_visible("#call-type-modal:not(.hidden)")
            print("Call type modal visible after click:", modal_visible, flush=True)
            cancel_call_btn = page.query_selector("#cancel-call-type-btn")
            if cancel_call_btn:
                cancel_call_btn.click()
                page.wait_for_timeout(300)

        # Inspect Chat Input bar elements
        print("Checking Chat Input bar...", flush=True)
        print("Message input present:", bool(page.query_selector("#message-input")), flush=True)
        print("Send btn present:", bool(page.query_selector("#send-btn")), flush=True)
        print("Voice note btn present:", bool(page.query_selector("#voice-note-btn")), flush=True)
        print("File btn present:", bool(page.query_selector("#file-btn")), flush=True)
        print("Emoji btn present:", bool(page.query_selector("#emoji-picker-btn")), flush=True)

        # Test sending a message
        print("Testing message send...", flush=True)
        page.fill("#message-input", "Hello Quantum World!")
        page.click("#send-btn")
        page.wait_for_timeout(1500)

        # Check message bubble in DOM
        messages = page.query_selector_all(".message")
        print(f"Total message elements in DOM: {len(messages)}", flush=True)
        for m in messages[-3:]:
            print("  Message element class:", m.get_attribute("class"), "-> text:", m.inner_text()[:60].replace("\n", " "), flush=True)

        # Check Video Overlay DOM structure
        video_overlay = page.query_selector("#video-overlay")
        print("Video overlay in DOM:", bool(video_overlay), flush=True)
        if video_overlay:
            ctrls = [b.get_attribute("id") for b in video_overlay.query_selector_all(".video-controls button")]
            print("Video overlay controls:", ctrls, flush=True)

        # Check Incoming Call Modal DOM structure
        call_modal = page.query_selector("#call-modal")
        print("Incoming call modal in DOM:", bool(call_modal), flush=True)

        print("\n=== Console Errors / Warnings ===", flush=True)
        for err in console_errors:
            print(" ", err, flush=True)

        print("\n=== Page Errors ===", flush=True)
        for err in page_errors:
            print(" ", err, flush=True)

        print("\nINSPECTION COMPLETE.", flush=True)
        browser.close()

if __name__ == "__main__":
    inspect()
