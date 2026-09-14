import json
import logging
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import os

from contextlib import asynccontextmanager
from discovery import MDNSService
from security import generate_qr_base64
from database import (
    init_db, create_user, verify_user, get_total_users, get_all_users, delete_user,
    store_offline_message, get_offline_messages, delete_offline_messages,
    get_user_profile, update_user_profile, search_users,
    add_saved_message, get_saved_messages, delete_saved_message,
    add_contact, get_contacts, update_user_role, reset_user_password
)
from ai_engine import (
    ai_chat, ai_vibe_analysis, ai_smart_reply,
    ai_polish_text, ai_summarize_chat, ai_translate, GEMINI_AVAILABLE
)
from connection_manager import manager

logger = logging.getLogger(__name__)

# --- Configuration ---
ADMIN_USERS = [u.strip() for u in os.environ.get("ADMIN_USERS", "ESCTRIX_Admin").split(",") if u.strip()]
DEFAULT_PORT = int(os.environ.get("PORT", 8006))

def is_admin_authorized(username: Optional[str]) -> bool:
    """Check if the requesting user possesses Commander / Admin privileges."""
    if not username:
        return False
    clean_u = username.strip()
    if clean_u in ADMIN_USERS:
        return True
    profile = get_user_profile(clean_u)
    return bool(profile and profile.get("role") == "admin")

mdns_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database...")
    init_db()
    logger.info("ESCTRIX Quantum server online. Ready for connections...")
    yield
    # Shutdown
    if mdns_service:
        logger.info("Stopping mDNS service...")
        mdns_service.stop()

app = FastAPI(lifespan=lifespan)


class AuthData(BaseModel):
    username: str
    password: str
    display_name: Optional[str] = None


class ProfileUpdate(BaseModel):
    username: str
    display_name: str
    bio: str = ''
    avatar_color: str = ''
    avatar_photo: Optional[str] = None


class ContactAdd(BaseModel):
    owner_username: str
    contact_username: str


class SavedMessageCreate(BaseModel):
    username: str
    content: str
    msg_type: str = 'text'
    file_meta: str = ''


class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None


class AIVibeRequest(BaseModel):
    messages: List[str] = []


class AISmartReplyRequest(BaseModel):
    messages: List[str] = []


class AIPolishRequest(BaseModel):
    text: str
    tone: str = 'cyberpunk'


class AISummarizeRequest(BaseModel):
    messages: List[str] = []


class AITranslateRequest(BaseModel):
    text: str
    target_lang: str = 'es'


class HostStart(BaseModel):
    username: str
    space_name: str
    pin: str


class HostStop(BaseModel):
    space_name: str


class AdminAction(BaseModel):
    admin_username: str
    target_username: str
    space_name: str = ''
    kick_message: str = ''


class AdminBroadcast(BaseModel):
    admin_username: str
    message: str


class AdminRoleUpdate(BaseModel):
    admin_username: str
    target_username: str
    new_role: str


class AdminPasswordReset(BaseModel):
    admin_username: str
    target_username: str
    new_password: str


class OfflineMessage(BaseModel):
    recipient_username: str
    sender_username: str
    space_name: str
    payload: str


# Setup static files and templates
os.makedirs("frontend", exist_ok=True)
app.mount("/static", StaticFiles(directory="frontend"), name="static")
templates = Jinja2Templates(directory="frontend")


@app.get("/health")
async def health_check():
    """Render uses this to verify the service is running."""
    return {"status": "ok", "version": "2.0.0-quantum"}


@app.get("/", response_class=HTMLResponse)
@app.get("/index.html", response_class=HTMLResponse)
async def get_index(request: Request):
    return templates.TemplateResponse(
        request=request, name="index.html", context={
            "server_ip": mdns_service.ip if mdns_service else "127.0.0.1"
        }
    )


@app.get("/favicon.ico")
async def get_favicon():
    return FileResponse("frontend/icon-192.png", media_type="image/png")


@app.get("/manifest.json")
async def get_manifest():
    return FileResponse("frontend/manifest.json", media_type="application/manifest+json")


@app.get("/sw.js")
async def get_sw():
    return FileResponse("frontend/sw.js", media_type="application/javascript")


@app.get("/offline.html", response_class=HTMLResponse)
async def get_offline(request: Request):
    return templates.TemplateResponse(request=request, name="offline.html", context={})


# ─────────────────────────────────────────────────────────────
# Authentication & Identity
# ─────────────────────────────────────────────────────────────

@app.post("/api/auth/register")
async def register_user(data: AuthData):
    if create_user(data.username, data.password, display_name=data.display_name or data.username):
        user_profile = get_user_profile(data.username)
        return {"status": "success", "user": user_profile}
    return {"status": "error", "message": "That username is already taken. Please choose a different one."}


@app.post("/api/auth/login")
async def login_user(data: AuthData):
    user = verify_user(data.username, data.password)
    if user:
        return {"status": "success", "user": user, "role": user["role"]}
    return {"status": "error", "message": "Incorrect username or password. Please try again."}


# ─────────────────────────────────────────────────────────────
# User Profile & Contacts
# ─────────────────────────────────────────────────────────────

@app.get("/api/user/profile")
async def fetch_user_profile(username: str):
    profile = get_user_profile(username)
    if profile:
        return {"status": "success", "profile": profile}
    return {"status": "error", "message": "User not found"}


@app.post("/api/user/profile/update")
async def update_profile(data: ProfileUpdate):
    success = update_user_profile(data.username, data.display_name, data.bio, data.avatar_color, data.avatar_photo)
    if success:
        updated = get_user_profile(data.username)
        return {"status": "success", "profile": updated}
    return {"status": "error", "message": "Failed to update profile"}


@app.get("/api/user/search")
async def search_registered_users(q: str):
    if not q or len(q.strip()) < 1:
        return {"status": "success", "users": []}
    results = search_users(q)
    return {"status": "success", "users": results}


@app.get("/api/user/contacts")
async def fetch_contacts(username: str):
    contacts = get_contacts(username)
    return {"status": "success", "contacts": contacts}


@app.post("/api/user/contacts/add")
async def add_new_contact(data: ContactAdd):
    if add_contact(data.owner_username, data.contact_username):
        return {"status": "success"}
    return {"status": "error", "message": "User not found or already in contacts"}


class SessionTerminateRequest(BaseModel):
    username: str
    current_client_id: Optional[str] = ""


@app.get("/api/user/sessions")
async def get_sessions(username: str, current_client_id: str = ""):
    sessions = manager.get_user_sessions(username, current_client_id)
    return {"status": "success", "sessions": sessions}


@app.post("/api/user/sessions/terminate")
async def terminate_sessions(data: SessionTerminateRequest):
    manager.terminate_other_sessions(data.username, data.current_client_id)
    return {"status": "success", "message": "All other sessions terminated."}


# ─────────────────────────────────────────────────────────────
# Saved Messages (Personal Cloud Vault)
# ─────────────────────────────────────────────────────────────

@app.get("/api/user/saved_messages")
async def fetch_saved_messages(username: str):
    messages = get_saved_messages(username)
    return {"status": "success", "messages": messages}


@app.post("/api/user/saved_messages")
async def create_saved_message(data: SavedMessageCreate):
    msg_id = add_saved_message(data.username, data.content, data.msg_type, data.file_meta)
    if msg_id:
        return {"status": "success", "id": msg_id}
    return {"status": "error", "message": "Failed to save message"}


@app.delete("/api/user/saved_messages/{message_id}")
async def remove_saved_message(message_id: int, username: str):
    if delete_saved_message(username, message_id):
        return {"status": "success"}
    return {"status": "error", "message": "Failed to delete saved message"}


# ─────────────────────────────────────────────────────────────
# AI Suite Endpoints
# ─────────────────────────────────────────────────────────────

@app.post("/api/ai/chat")
async def handle_ai_chat(data: AIChatRequest):
    reply = ai_chat(data.message, data.history)
    return {"status": "success", "reply": reply}


@app.post("/api/ai/vibe")
async def handle_ai_vibe(data: AIVibeRequest):
    vibe = ai_vibe_analysis(data.messages)
    return {"status": "success", "vibe": vibe}


@app.post("/api/ai/smart_reply")
async def handle_ai_smart_reply(data: AISmartReplyRequest):
    replies = ai_smart_reply(data.messages)
    return {"status": "success", "replies": replies}


@app.post("/api/ai/polish")
async def handle_ai_polish(data: AIPolishRequest):
    polished = ai_polish_text(data.text, data.tone)
    return {"status": "success", "polished": polished}


@app.post("/api/ai/summarize")
async def handle_ai_summarize(data: AISummarizeRequest):
    summary = ai_summarize_chat(data.messages)
    return {"status": "success", "summary": summary}


@app.post("/api/ai/translate")
async def handle_ai_translate(data: AITranslateRequest):
    result = ai_translate(data.text, data.target_lang)
    return {"status": "success", **result}


# ─────────────────────────────────────────────────────────────
# Offline Messages
# ─────────────────────────────────────────────────────────────

@app.post("/api/messages/offline")
async def post_offline_message(data: OfflineMessage):
    if store_offline_message(data.recipient_username, data.sender_username, data.space_name, data.payload):
        return {"status": "success"}
    return {"status": "error", "message": "Failed to store message"}


@app.get("/api/messages/offline")
async def fetch_offline_messages(username: str):
    messages = get_offline_messages(username)
    if messages:
        delete_offline_messages(username)
    return {"status": "success", "messages": messages}


# ─────────────────────────────────────────────────────────────
# Admin & Hosting
# ─────────────────────────────────────────────────────────────

@app.get("/api/admin/stats")
async def get_admin_stats(username: str = None):
    if not is_admin_authorized(username):
        return {"status": "error", "message": "Unauthorized: Commander privileges required."}

    total_users = get_total_users()
    active_hosts_count = len(manager.rooms)

    total_connections = 0
    active_hosts_list = []

    for host_uname, room_data in manager.rooms.items():
        users_in_room = manager.get_room_users(host_uname)
        client_count = len(users_in_room)
        total_connections += client_count
        active_hosts_list.append({
            "hostname": host_uname,
            "clients": client_count,
            "users": users_in_room
        })

    return {
        "status": "success",
        "total_users": total_users,
        "active_hosts": active_hosts_count,
        "total_connections": total_connections,
        "active_hosts_list": active_hosts_list,
        "user_list": get_all_users(),
        "ai_engine_online": True,
        "gemini_active": GEMINI_AVAILABLE
    }


@app.post("/api/admin/update_role")
async def admin_change_role(data: AdminRoleUpdate):
    if not is_admin_authorized(data.admin_username):
        return {"status": "error", "message": "Unauthorized"}
    success = update_user_role(data.target_username, data.new_role)
    if success:
        return {"status": "success", "message": f"Updated @{data.target_username} role to {data.new_role}."}
    return {"status": "error", "message": "Cannot modify master root admin or invalid role specified."}


@app.post("/api/admin/reset_password")
async def admin_change_password(data: AdminPasswordReset):
    if not is_admin_authorized(data.admin_username):
        return {"status": "error", "message": "Unauthorized"}
    success = reset_user_password(data.target_username, data.new_password)
    if success:
        return {"status": "success", "message": f"Password for @{data.target_username} updated successfully."}
    return {"status": "error", "message": "Failed to update password (minimum 4 characters required)."}


@app.post("/api/admin/kick")
async def kick_user_from_room(data: AdminAction):
    if not is_admin_authorized(data.admin_username):
        return {"status": "error", "message": "Unauthorized"}
    success = await manager.kick_user(data.space_name, data.target_username, data.kick_message)
    if success:
        return {"status": "success", "message": f"{data.target_username} has been kicked."}
    return {"status": "error", "message": "User not found in room."}


@app.delete("/api/admin/delete_user")
async def delete_registered_user(data: AdminAction):
    if not is_admin_authorized(data.admin_username):
        return {"status": "error", "message": "Unauthorized"}
    success = delete_user(data.target_username)
    if success:
        return {"status": "success", "message": f"{data.target_username} deleted."}
    return {"status": "error", "message": "Cannot delete root admin or user not found."}


@app.post("/api/admin/broadcast")
async def admin_broadcast(data: AdminBroadcast):
    if not is_admin_authorized(data.admin_username):
        return {"status": "error", "message": "Unauthorized"}
    
    payload = {
        "type": "admin_broadcast",
        "message": data.message
    }
    for space_name in manager.rooms.keys():
        await manager.broadcast_to_room(space_name, payload)
    
    return {"status": "success", "message": "Broadcast sent to all active spaces."}


@app.post("/api/host/start")
async def start_hosting(data: HostStart):
    global mdns_service

    if not manager.create_room(data.space_name, data.username, data.pin):
        return {"status": "error", "message": "Space name already in use. Please choose a different name."}

    render_url = os.environ.get("RENDER_EXTERNAL_URL", "")
    is_cloud   = bool(render_url or os.environ.get("RENDER"))

    try:
        if is_cloud:
            connect_url = render_url or "https://esctrix.onrender.com"
        else:
            if mdns_service is None:
                port = DEFAULT_PORT
                mdns_service = MDNSService(port=port)
                mdns_service.start()
            connect_url = f"http://{mdns_service.ip}:{mdns_service.port}"
    except Exception:
        connect_url = render_url or f"http://localhost:{DEFAULT_PORT}"

    qr_base64 = generate_qr_base64(connect_url)

    return {
        "status": "success",
        "qr_code": qr_base64,
        "server_ip": connect_url
    }


@app.post("/api/host/stop")
async def stop_hosting(data: HostStop):
    await manager.broadcast_to_room(data.space_name, {"type": "host_disconnected"})
    manager.remove_room(data.space_name)
    return {"status": "success"}


# ─────────────────────────────────────────────────────────────
# WebSockets Signaling & Routing
# ─────────────────────────────────────────────────────────────

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    current_room = None

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # ── Auth ──
            if message.get("type") == "auth":
                space_name      = message.get("data", {}).get("host_username")
                provided_pin    = message.get("data", {}).get("pin")
                client_username = message.get("data", {}).get("username")

                # Auto-instantiate direct 1-to-1 rooms (P2P direct DM style)
                if space_name and (space_name.startswith("Direct-") or space_name.startswith("DM-")):
                    if not manager.get_room(space_name):
                        manager.create_room(space_name, client_username, "")

                room = manager.get_room(space_name)
                if not room:
                    await websocket.send_text(json.dumps({"type": "auth_fail", "reason": "no_room"}))
                    continue

                claiming_host = (client_username == room['host_username']) or (space_name and space_name.startswith("Direct-"))
                host_slot_taken = room['host_client_id'] is not None and not space_name.startswith("Direct-")

                if claiming_host and host_slot_taken and room['host_client_id'] != client_id:
                    await websocket.send_text(json.dumps({
                        "type": "auth_fail",
                        "reason": "host_taken",
                        "message": "This space name is already hosted by someone else. Please choose a different name."
                    }))
                    continue

                pin_ok = (room['pin'] == provided_pin) or (room['pin'] == '' and (provided_pin == '' or provided_pin is None)) or space_name.startswith("Direct-")

                if claiming_host or pin_ok:
                    result = manager.add_client_to_room(
                        space_name, client_id, websocket,
                        client_username, is_host=claiming_host
                    )

                    if result == "full":
                        await websocket.send_text(json.dumps({
                            "type": "auth_fail",
                            "reason": "full",
                            "message": "This space already has an active session. Only 2 members are allowed per space."
                        }))
                        continue

                    current_room = space_name
                    # Record user active session
                    client_ip = websocket.client.host if websocket.client else "127.0.0.1"
                    manager.record_session(client_username, client_id, client_ip)

                    existing_peers = [
                        {"client_id": cid, "username": uname}
                        for cid, uname in room['usernames'].items()
                        if cid != client_id
                    ]

                    await websocket.send_text(json.dumps({
                        "type": "auth_success",
                        "host_username": room['host_username'],
                        "space_name": space_name,
                        "your_client_id": client_id,
                        "existing_peers": existing_peers
                    }))

                    await manager.broadcast_to_room(
                        space_name,
                        {"type": "peer_joined", "username": client_username, "client_id": client_id},
                        exclude_client_id=client_id
                    )
                else:
                    await websocket.send_text(json.dumps({"type": "auth_fail", "reason": "wrong_pin"}))

            # ── Admin Auth ──
            elif message.get("type") == "admin_auth":
                username     = message.get("data", {}).get("username", "ESCTRIX_Admin")
                provided_pwd = message.get("data", {}).get("password")

                user = verify_user(username, provided_pwd)
                if user and user['role'] == 'admin':
                    manager.add_admin(client_id, websocket)
                    await websocket.send_text(json.dumps({"type": "admin_auth_success"}))
                else:
                    await websocket.send_text(json.dumps({"type": "auth_fail"}))

            # ── Admin Chat Log Forward ──
            elif message.get("type") == "admin_chat_log":
                await manager.broadcast_to_admins(message)

            # ── WebRTC Signaling & Dynamic Quantum Relay ──
            elif current_room and message.get("type") in [
                "offer", "answer", "candidate",
                "call_request", "call_accepted", "call_declined",
                "typing", "vibe_update", "message_delivered", "message_read", "burn_room"
            ]:
                target = message.get("target")

                if target:
                    await manager.send_to_client(current_room, target, {
                        **message,
                        "sender": client_id
                    })
                else:
                    payload = {
                        "type": message.get("type"),
                        "sender": client_id,
                        "data": message.get("data")
                    }
                    await manager.broadcast_to_room(current_room, payload, exclude_client_id=client_id)

    except WebSocketDisconnect:
        if current_room:
            manager.remove_client_from_room(current_room, client_id)
            await manager.broadcast_to_room(
                current_room,
                {"type": "peer_disconnected", "peer_id": client_id}
            )
        manager.remove_admin(client_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=DEFAULT_PORT, reload=False)

