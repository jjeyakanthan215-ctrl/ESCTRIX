"""
ESCTRIX Quantum — Advanced AI Engine
Powers the Aura AI Companion, Vibe/Sentiment Analyzer, Tone Polisher,
Smart Replies, Chat Summarizer, and Polyglot Translator.

Supports:
1. Google Gemini API (via GEMINI_API_KEY environment variable)
2. Intelligent Built-in NLP Engine (100% offline, zero-latency fallback)
"""

import os
import re
import json
import logging
import urllib.request
import urllib.parse
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_AVAILABLE = bool(GEMINI_API_KEY)


def _call_gemini(prompt: str, system_instruction: str = "") -> Optional[str]:
    """Call Google Gemini REST API if GEMINI_API_KEY is available."""
    if not GEMINI_API_KEY:
        return None

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        contents = []
        if system_instruction:
            contents.append({
                "role": "user",
                "parts": [{"text": f"System Context: {system_instruction}"}]
            })
            contents.append({
                "role": "model",
                "parts": [{"text": "Understood. I will act according to this context."}]
            })
            
        contents.append({
            "role": "user",
            "parts": [{"text": prompt}]
        })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 800
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
    except Exception as e:
        logger.warning(f"Gemini API call failed: {e}")
    return None


def _call_free_ai(prompt: str, system_instruction: str = "") -> Optional[str]:
    """Call free text endpoint for real generative AI when no Gemini key is provided."""
    try:
        url = "https://text.pollinations.ai/"
        payload = {
            "messages": [
                {
                    "role": "system",
                    "content": system_instruction or (
                        "You are Aura AI, the advanced quantum neural companion inside ESCTRIX. "
                        "You are concise, knowledgeable, helpful, and speak with a futuristic, friendly tone."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            "model": "mistral",
            "seed": 42
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "User-Agent": "ESCTRIX-Quantum/2.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            text = response.read().decode("utf-8").strip()
            # If the remote service returned a budget limit, key error, or HTML page, discard it
            if not text or "budget" in text.lower() or "api key" in text.lower() or text.startswith("<!DOCTYPE"):
                return None
            if len(text) > 3:
                return text
    except Exception as e:
        logger.debug(f"Free AI endpoint unavailable ({e}), using local knowledge engine.")
    return None


# ─────────────────────────────────────────────────────────────
# 1. Aura AI Chat Companion
# ─────────────────────────────────────────────────────────────

def ai_chat(user_message: str, chat_history: Optional[List[Dict[str, str]]] = None) -> str:
    """Conversational interaction with the Aura AI companion."""
    system_prompt = (
        "You are Aura AI, the futuristic, highly intelligent quantum companion integrated into ESCTRIX. "
        "You are insightful, technologically advanced, concise, warm, and helpful. "
        "You help users with programming, decentralized technology, security, privacy, writing, and everyday questions."
    )

    msg = user_message.strip().lower()

    # 1. Instant ESCTRIX-specific high accuracy Knowledge Base
    if ("friend" in msg and ("add" in msg or "find" in msg or "search" in msg or "how" in msg)) or "contact" in msg:
        if "count" in msg or "how many" in msg:
            return (
                "📇 **Contacts & Friend Count**:\n"
                "- Look at the folder tabs at the top of your chat list: click the **Contacts** tab.\n"
                "- It displays your live total friend count badge (e.g. `Contacts (3)`).\n"
                "- You can view all confirmed friends, see who added you recently, and add back mutual friends instantly."
            )
        return (
            "👥 **How to Find and Add Friends in ESCTRIX**:\n"
            "1. Click the **Search Icon (🔍)** in the top navigation bar or go to the **Contacts** tab.\n"
            "2. Type the user's `@username` into the search bar.\n"
            "3. Click on their card to view their full **Profile Verification Card** (display picture, bio, and account ID).\n"
            "4. Tap **Add Friend**. They will receive a real-time notification in their **Contacts** tab and can add you back with one tap!\n"
            "5. Once added, direct messaging and P2P calling are automatically unlocked."
        )

    if any(w in msg for w in ["call", "calling", "voice call", "video call", "webrtc"]):
        return (
            "📞 **HD Audio/Video Calling in ESCTRIX**:\n"
            "- Add the user as a friend first.\n"
            "- In your direct chat, click the **Audio Call (📞)** or **Video Call (📹)** icon in the top header.\n"
            "- The recipient receives an instant incoming call modal with ringtone and accept/decline buttons.\n"
            "- Calls run over direct encrypted WebRTC with low latency and zero server-side recording."
        )

    if any(w in msg for w in ["contact list", "how many friends", "my contacts", "contacts tab"]):
        return (
            "📇 **Contacts & Friend Count**:\n"
            "- Look at the folder tabs at the top of your chat list: click the **Contacts** tab.\n"
            "- It displays your live total friend count badge (e.g. `Contacts (3)`).\n"
            "- You can view all confirmed friends, see who added you recently, and add back mutual friends instantly."
        )

    if any(w in msg for w in ["qr", "nametag", "qr code", "scan"]):
        return (
            "📱 **QR Nametag & Fast Connect**:\n"
            "- Tap the **QR icon** in the top bar to open your holographic Nametag.\n"
            "- Other users can scan your QR code with their camera to instantly open your profile and add you.\n"
            "- You can also download or copy your shareable Quantum Link."
        )

    if any(w in msg for w in ["lock", "pin", "screen lock", "app lock"]):
        return (
            "🔐 **Screen Lock & Privacy Shield**:\n"
            "- Open **Settings** (⚙️) from the top bar.\n"
            "- Click on **Privacy & App Lock** to set a custom 4-digit PIN.\n"
            "- You can lock the screen instantly using the lock button or enable auto-lock on inactivity."
        )

    if any(w in msg for w in ["supabase", "database", "postgres", "sql"]):
        return (
            "🗄️ **Supabase Cloud Database Support**:\n"
            "- ESCTRIX includes dual-engine database support (SQLite + Supabase PostgreSQL).\n"
            "- To connect Supabase, set the `SUPABASE_DB_URL` environment variable in your `.env` or Render environment settings.\n"
            "- Execute `supabase_schema.sql` in your Supabase SQL editor to create all required tables."
        )

    if any(w in msg for w in ["hello", "hi", "hey", "greetings", "aura"]):
        return (
            "Greetings! I am **Aura AI**, your quantum neural companion in ESCTRIX. "
            "I'm operating in real-time neural synchronization. "
            "How can I assist you with your communications, technical analysis, code, or ideas today?"
        )

    if any(w in msg for w in ["who are you", "what are you", "your name"]):
        return (
            "I am **Aura AI** — the built-in intelligent neural co-pilot for **ESCTRIX Quantum**. "
            "I provide real-time smart replies, vibe analysis, language translation, code assistance, "
            "and instant privacy-first conversational insights directly inside your quantum workspace."
        )

    if any(w in msg for w in ["security", "e2ee", "privacy", "safe", "encrypt"]):
        return (
            "🔒 **ESCTRIX Quantum Security Architecture**:\n"
            "- **Zero-Knowledge Encryption**: AES-GCM 256-bit + ECDH key exchange directly inside your browser.\n"
            "- **WebRTC Mesh**: Direct peer-to-peer data channels & media streams with DTLS/SRTP.\n"
            "- **Cloud Blindness**: The server and databases only see undecryptable ciphertext.\n"
            "- **Vanish & Burn**: Instant cryptographic wiping of sessions."
        )

    # 2. Try Gemini if configured
    gemini_res = _call_gemini(user_message, system_instruction=system_prompt)
    if gemini_res:
        return gemini_res

    # 3. Call Free AI generation (Pollinations / OpenAI backend)
    free_ai_res = _call_free_ai(user_message, system_instruction=system_prompt)
    if free_ai_res:
        return free_ai_res

    # 4. Intelligent Local Fallback
    if any(w in msg for w in ["code", "python", "javascript", "program", "function", "bug", "api"]):
        return (
            "💻 **Code & Architecture Advisor**:\n"
            "I can assist in optimizing asynchronous WebSockets, WebRTC renegotiations, SQLite/Supabase syncing, "
            "or client-side cryptography. Paste your snippet or question and I'll generate the solution!"
        )

    return (
        f"Synthesizing analysis on: *\"{user_message}\"*\n\n"
        "Here is my perspective: Focusing on modularity, security, and real-time responsiveness yields the best results. "
        "Would you like me to elaborate further, generate code, or summarize this topic?"
    )


# ─────────────────────────────────────────────────────────────
# 2. Real-Time Sentiment & Vibe Analysis
# ─────────────────────────────────────────────────────────────

def ai_vibe_analysis(messages: List[str]) -> Dict[str, Any]:
    """
    Analyzes the emotional vibe of recent chat messages.
    Returns: { "vibe": str, "emoji": str, "color": str, "score": float, "summary": str }
    """
    if not messages:
        return {
            "vibe": "Neutral & Clear",
            "emoji": "✨",
            "color": "#06d6c7",
            "score": 0.5,
            "summary": "Calm, ready for communication."
        }

    combined = " ".join(messages).lower()

    # Vibe categories
    urgent_keywords = ["urgent", "asap", "emergency", "quick", "hurry", "now", "immediately", "deadline", "help", "alert"]
    positive_keywords = ["great", "awesome", "perfect", "love", "good", "thanks", "thank you", "nice", "cool", "yay", "amazing", "super", "happy"]
    analytical_keywords = ["code", "error", "issue", "database", "api", "server", "data", "test", "function", "config", "build", "deploy"]
    casual_keywords = ["haha", "lol", "hey", "sup", "bro", "chill", "fun", "game", "meet", "hangout", "party"]

    urgent_score = sum(combined.count(w) for w in urgent_keywords)
    positive_score = sum(combined.count(w) for w in positive_keywords)
    analytical_score = sum(combined.count(w) for w in analytical_keywords)
    casual_score = sum(combined.count(w) for w in casual_keywords)

    if urgent_score > 1:
        return {
            "vibe": "High Urgency",
            "emoji": "⚡",
            "color": "#f59e0b",
            "score": 0.9,
            "summary": "Time-sensitive discussion detected."
        }
    elif analytical_score >= max(positive_score, casual_score) and analytical_score > 0:
        return {
            "vibe": "Technical & Analytical",
            "emoji": "🔬",
            "color": "#8b5cf6",
            "score": 0.8,
            "summary": "Deep focus on technical problem-solving."
        }
    elif positive_score >= casual_score and positive_score > 0:
        return {
            "vibe": "Positive & Energetic",
            "emoji": "🔥",
            "color": "#10b981",
            "score": 0.85,
            "summary": "High collaborative enthusiasm."
        }
    elif casual_score > 0:
        return {
            "vibe": "Relaxed & Casual",
            "emoji": "☕",
            "color": "#06d6c7",
            "score": 0.7,
            "summary": "Friendly, informal conversation."
        }
    else:
        return {
            "vibe": "Active & Synchronized",
            "emoji": "🌐",
            "color": "#06d6c7",
            "score": 0.6,
            "summary": "Standard quantum communication channel."
        }


# ─────────────────────────────────────────────────────────────
# 3. Contextual Smart Replies
# ─────────────────────────────────────────────────────────────

def ai_smart_reply(recent_messages: List[str]) -> List[str]:
    """Generates 3 context-aware quick reply chips."""
    if not recent_messages:
        return ["Understood", "Sounds good!", "Could you clarify?"]

    last_msg = recent_messages[-1].strip().lower()

    # Try Gemini if configured
    gemini_prompt = (
        f"The user received this chat message: '{last_msg}'. "
        "Generate exactly 3 short, natural, relevant 1-to-4 word quick reply options formatted as a JSON array of strings: [\"reply1\", \"reply2\", \"reply3\"]. Output only valid JSON."
    )
    res = _call_gemini(gemini_prompt)
    if res:
        try:
            match = re.search(r'\[.*\]', res, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                if isinstance(parsed, list) and len(parsed) >= 2:
                    return [str(x) for x in parsed[:3]]
        except Exception:
            pass

    # Built-in High Quality Contextual Heuristic
    if any(w in last_msg for w in ["call", "meet", "voice", "video"]):
        return ["I'm ready to call 📞", "Give me 5 minutes ⏳", "Can we chat here instead?"]
    elif any(w in last_msg for w in ["free", "available", "there", "busy"]):
        return ["Yes, I'm free!", "A bit busy right now", "What's up?"]
    elif any(w in last_msg for w in ["done", "finished", "deployed", "ready", "complete"]):
        return ["Awesome job! 🚀", "Let me check it out", "Perfect, thank you!"]
    elif any(w in last_msg for w in ["thanks", "thank you", "thx"]):
        return ["You're welcome! 😊", "Anytime!", "Glad to help!"]
    elif any(w in last_msg for w in ["how are you", "how's it going", "what's up"]):
        return ["Doing well, you?", "All good here! ⚡", "Busy but great!"]
    elif "?" in last_msg:
        return ["Yes, definitely", "Not at the moment", "Let me look into that"]
    elif any(w in last_msg for w in ["send", "file", "document", "link"]):
        return ["Sending it now 📎", "Received, thanks!", "Let me review this"]
    else:
        return ["Sounds great! 👍", "Got it, thanks!", "Let's do it! 🚀"]


# ─────────────────────────────────────────────────────────────
# 4. Tone Polisher / Rewriter
# ─────────────────────────────────────────────────────────────

def ai_polish_text(text: str, tone: str = "cyberpunk") -> str:
    """
    Transforms text into requested tone:
    - 'cyberpunk' (Futuristic, high-tech, neon vibe)
    - 'executive' (Crisp, formal, professional)
    - 'friendly' (Warm, engaging, expressive)
    - 'concise' (Ultra-short, direct to the point)
    """
    if not text.strip():
        return text

    gemini_prompt = f"Rewrite this chat draft in a '{tone}' tone. Maintain the core meaning. Draft: '{text}'"
    res = _call_gemini(gemini_prompt)
    if res:
        return res.replace('"', '').strip()

    t = text.strip()
    tone = tone.lower()

    if tone == "cyberpunk":
        return f"⚡ Uplink confirmed: {t} — transmitting across encrypted frequency."
    elif tone == "executive":
        return f"Greetings. Regarding our prior discussion: {t}. Please advise at your convenience."
    elif tone == "friendly":
        return f"Hey there! 😊 Just wanted to share: {t}! Hope you're having a wonderful day! ✨"
    elif tone == "concise":
        # Strip filler words
        clean = re.sub(r'\b(just|actually|basically|kind of|sort of|maybe|perhaps)\b', '', t, flags=re.IGNORECASE)
        clean = re.sub(r'\s+', ' ', clean).strip()
        return clean if clean else t
    return t


# ─────────────────────────────────────────────────────────────
# 5. Chat Summarizer
# ─────────────────────────────────────────────────────────────

def ai_summarize_chat(messages: List[str]) -> str:
    """Summarizes chat messages into key takeaways."""
    if not messages:
        return "No message history available to summarize."

    clean_msgs = [m.strip() for m in messages if m.strip()]
    if len(clean_msgs) <= 2:
        return "Chat summary: Brief exchange with no extended action items."

    gemini_prompt = (
        "Summarize the following chat conversation into 2-4 concise, bullet-point key takeaways and action items:\n"
        + "\n".join(clean_msgs)
    )
    res = _call_gemini(gemini_prompt)
    if res:
        return res

    # Built-in Smart Summarizer
    topics = []
    has_call = any("call" in m.lower() or "video" in m.lower() for m in clean_msgs)
    has_tech = any("code" in m.lower() or "error" in m.lower() or "deploy" in m.lower() for m in clean_msgs)
    has_files = any("file" in m.lower() or "sent" in m.lower() for m in clean_msgs)

    if has_call:
        topics.append("📞 **Voice/Video Calling**: Audio/video communication was coordinated.")
    if has_tech:
        topics.append("💻 **Technical Discussion**: Topics involving development, deployment, or system state were addressed.")
    if has_files:
        topics.append("📎 **File Transfer**: Documents or data assets were exchanged over P2P channel.")

    if not topics:
        topics.append(f"💬 **General Exchange**: {len(clean_msgs)} messages exchanged regarding ongoing coordination.")

    topics.append("✅ **Channel Status**: End-to-end encrypted session active.")

    return "📋 **Conversation Summary**:\n" + "\n".join(topics)


# ─────────────────────────────────────────────────────────────
# 6. Polyglot Real-Time Translator
# ─────────────────────────────────────────────────────────────

LANG_CODES = {
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "ta": "Tamil",
    "hi": "Hindi",
    "ja": "Japanese",
    "zh": "Chinese",
    "ar": "Arabic",
    "ru": "Russian",
    "pt": "Portuguese",
    "it": "Italian",
    "en": "English"
}

# Offline phrase mappings for common chat interactions
TRANSLATION_DICT = {
    "hello": {"es": "Hola", "fr": "Bonjour", "de": "Hallo", "ta": "வணக்கம் (Vanakkam)", "hi": "नमस्ते (Namaste)", "ja": "こんにちは (Konnichiwa)", "zh": "你好 (Nǐ hǎo)", "ru": "Привет", "ar": "مرحبا"},
    "how are you": {"es": "¿Cómo estás?", "fr": "Comment allez-vous?", "de": "Wie geht es dir?", "ta": "எப்படி இருக்கிறீர்கள்?", "hi": "आप कैसे हैं?", "ja": "お元気ですか？", "zh": "你好吗？", "ru": "Как дела?", "ar": "كيف حالك؟"},
    "thank you": {"es": "Gracias", "fr": "Merci", "de": "Danke", "ta": "நன்றி (Nandri)", "hi": "धन्यवाद (Dhanyawad)", "ja": "ありがとう (Arigatou)", "zh": "谢谢 (Xièxiè)", "ru": "Спасибо", "ar": "شكرا"},
    "yes": {"es": "Sí", "fr": "Oui", "de": "Ja", "ta": "ஆம் (Aam)", "hi": "हाँ (Haan)", "ja": "はい (Hai)", "zh": "是 (Shì)", "ru": "Да", "ar": "نعم"},
    "no": {"es": "No", "fr": "Non", "de": "Nein", "ta": "இல்லை (Illai)", "hi": "नहीं (Nahin)", "ja": "いいえ (Iie)", "zh": "不 (Bù)", "ru": "Нет", "ar": "لا"},
    "goodbye": {"es": "Adiós", "fr": "Au revoir", "de": "Auf Wiedersehen", "ta": "போய் வருகிறேன்", "hi": "अलविदा", "ja": "さようなら (Sayounara)", "zh": "再见 (Zàijiàn)", "ru": "До свидания", "ar": "وداعا"}
}

def ai_translate(text: str, target_lang: str = "es") -> Dict[str, str]:
    """Translates text to target language."""
    target_name = LANG_CODES.get(target_lang.lower(), target_lang)
    
    gemini_prompt = f"Translate the following text into {target_name}. Only output the translated text without extra comments:\n'{text}'"
    res = _call_gemini(gemini_prompt)
    if res:
        return {"original": text, "target_lang": target_lang, "language_name": target_name, "translated": res.strip()}

    # Built-in Dictionary Check
    lower_text = text.strip().lower().rstrip(".!?,")
    if lower_text in TRANSLATION_DICT and target_lang in TRANSLATION_DICT[lower_text]:
        translated = TRANSLATION_DICT[lower_text][target_lang]
    else:
        translated = f"[{target_name} Translation]: {text}"

    return {
        "original": text,
        "target_lang": target_lang,
        "language_name": target_name,
        "translated": translated
    }
