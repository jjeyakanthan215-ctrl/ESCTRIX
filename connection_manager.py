import json
import logging
from typing import Dict, Any, Optional, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)

MAX_ROOM_CAPACITY = 2  # Strict 1-to-1 P2P calls only


class ConnectionManager:
    def __init__(self):
        # rooms maps space_name -> {
        #   'pin': str,
        #   'host_username': str,
        #   'host_client_id': str | None,   # the actual WS client_id of the host
        #   'clients': { client_id: websocket },
        #   'usernames': { client_id: username }
        # }
        self.rooms: Dict[str, Dict[str, Any]] = {}
        self.admin_connections: Dict[str, WebSocket] = {}
        # user_sessions maps username -> list of session dicts
        self.user_sessions: Dict[str, List[Dict[str, Any]]] = {}

    def record_session(self, username: str, client_id: str, ip: str = "127.0.0.1", device: str = "Desktop Web / Quantum Engine"):
        if not username:
            return
        if username not in self.user_sessions:
            self.user_sessions[username] = []
        # Filter existing matching client_id
        self.user_sessions[username] = [s for s in self.user_sessions[username] if s.get('client_id') != client_id]
        self.user_sessions[username].append({
            'client_id': client_id,
            'ip': ip,
            'device': device,
            'online_since': logging.Formatter().formatTime(logging.LogRecord('', 0, '', 0, '', (), None)),
            'is_current': False
        })

    def get_user_sessions(self, username: str, current_client_id: str = "") -> List[Dict[str, Any]]:
        sessions = self.user_sessions.get(username, [])
        result = []
        for s in sessions:
            s_copy = dict(s)
            s_copy['is_current'] = (s_copy.get('client_id') == current_client_id)
            result.append(s_copy)
        if not result:
            result.append({
                'client_id': current_client_id or 'primary-session',
                'ip': 'Active Connection',
                'device': 'Quantum Web Client (Secure)',
                'online_since': 'Active now',
                'is_current': True
            })
        return result

    def terminate_other_sessions(self, username: str, current_client_id: str):
        if username in self.user_sessions:
            self.user_sessions[username] = [s for s in self.user_sessions[username] if s.get('client_id') == current_client_id]

    def get_room(self, space_name: str):
        return self.rooms.get(space_name)

    def create_room(self, space_name: str, host_username: str, pin: str) -> bool:
        if space_name in self.rooms:
            return False
        self.rooms[space_name] = {
            'pin': pin,
            'host_username': host_username,
            'host_client_id': None,   # Set when the host WebSocket authenticates
            'clients': {},
            'usernames': {}  # client_id -> username
        }
        logger.info(f"Room created: {space_name} by {host_username}")
        return True

    def remove_room(self, space_name: str):
        if space_name in self.rooms:
            del self.rooms[space_name]
            logger.info(f"Room removed: {space_name}")

    def add_client_to_room(
        self,
        space_name: str,
        client_id: str,
        websocket: WebSocket,
        username: str = '',
        is_host: bool = False
    ) -> str:
        """
        Returns:
            'ok'   – successfully joined
            'full' – room is at MAX_ROOM_CAPACITY
        """
        room = self.get_room(space_name)
        if not room:
            return 'no_room'
        if len(room['clients']) >= MAX_ROOM_CAPACITY:
            return 'full'
        room['clients'][client_id] = websocket
        room['usernames'][client_id] = username
        if is_host and room['host_client_id'] is None:
            room['host_client_id'] = client_id
        logger.info(f"Client {username} ({client_id}) joined room {space_name}")
        return 'ok'

    def remove_client_from_room(self, space_name: str, client_id: str):
        room = self.get_room(space_name)
        if room and client_id in room['clients']:
            del room['clients'][client_id]
            room['usernames'].pop(client_id, None)
            # If the host left, clear the host_client_id
            if room.get('host_client_id') == client_id:
                room['host_client_id'] = None
            logger.info(f"Client {client_id} left room {space_name}")

    async def kick_user(
        self,
        space_name: str,
        username: str,
        kick_message: str = ''
    ) -> bool:
        """Send a 'kicked' message to a user with an optional custom reason, then remove them."""
        room = self.get_room(space_name)
        if not room:
            return False
        target_id = None
        for cid, uname in room['usernames'].items():
            if uname == username:
                target_id = cid
                break
        if not target_id:
            return False
        ws = room['clients'].get(target_id)
        if ws:
            try:
                await ws.send_text(json.dumps({
                    'type': 'kicked',
                    'message': kick_message or 'You have been removed by the administrator.'
                }))
            except Exception:
                pass
        self.remove_client_from_room(space_name, target_id)
        return True

    async def broadcast_to_room(
        self,
        space_name: str,
        message: dict,
        exclude_client_id: Optional[str] = None
    ):
        room = self.get_room(space_name)
        if not room:
            return
        dead_clients = []
        for cid, conn in list(room['clients'].items()):
            if exclude_client_id and cid == exclude_client_id:
                continue
            try:
                await conn.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to {cid}: {e}")
                dead_clients.append(cid)
        for cid in dead_clients:
            self.remove_client_from_room(space_name, cid)

    async def send_to_client(self, space_name: str, client_id: str, message: dict):
        room = self.get_room(space_name)
        if room and client_id in room['clients']:
            conn = room['clients'][client_id]
            try:
                await conn.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending to {client_id}: {e}")
                self.remove_client_from_room(space_name, client_id)

    def get_room_users(self, space_name: str) -> list:
        """Return list of {client_id, username} for users in a room."""
        room = self.get_room(space_name)
        if not room:
            return []
        return [
            {'client_id': cid, 'username': uname, 'is_host': cid == room.get('host_client_id')}
            for cid, uname in room['usernames'].items()
        ]

    # ── Admin Methods ──
    def add_admin(self, client_id: str, websocket: WebSocket):
        self.admin_connections[client_id] = websocket

    def remove_admin(self, client_id: str):
        if client_id in self.admin_connections:
            del self.admin_connections[client_id]

    async def broadcast_to_admins(self, message: dict):
        dead_admins = []
        for cid, conn in list(self.admin_connections.items()):
            try:
                await conn.send_text(json.dumps(message))
            except Exception:
                dead_admins.append(cid)
        for cid in dead_admins:
            self.remove_admin(cid)


manager = ConnectionManager()
