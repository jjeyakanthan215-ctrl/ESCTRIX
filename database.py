import sqlite3
import hashlib
import bcrypt
import os
import random
import json
import logging
import urllib.request
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# On Render, use /data for persistent storage (set DB_PATH env var in Render dashboard).
# Falls back to local users.db for development.
DB_FILE = os.environ.get('DB_PATH', 'users.db')

# Firebase Cloud Database configuration (optional, for persistent multi-region cloud sync on Render)
FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID', '').strip()
FIREBASE_API_KEY = os.environ.get('FIREBASE_API_KEY', '').strip()

AVATAR_COLORS = [
    'linear-gradient(135deg, #8b5cf6, #06d6c7)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #3b82f6, #06d6c7)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #6366f1, #a855f7)'
]


def generate_account_id() -> str:
    """Generate a permanent, unique 6-digit public Account ID."""
    num = random.randint(100000, 999999)
    return f"ESC-{num}"


def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    # Ensure directory exists
    db_dir = os.path.dirname(DB_FILE)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

    conn = get_db()
    cursor = conn.cursor()

    # Core users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT UNIQUE,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            bio TEXT DEFAULT '',
            avatar_color TEXT,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Offline encrypted message queue
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS offline_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipient_username TEXT NOT NULL,
            sender_username TEXT NOT NULL,
            space_name TEXT NOT NULL,
            payload TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Saved Messages (Encrypted Personal Cloud Vault)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saved_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            content TEXT NOT NULL,
            msg_type TEXT DEFAULT 'text',
            file_meta TEXT DEFAULT '',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Persistent Contacts & Saved Chats
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_username TEXT NOT NULL,
            contact_account_id TEXT NOT NULL,
            contact_username TEXT NOT NULL,
            contact_name TEXT DEFAULT '',
            status TEXT DEFAULT 'added',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(owner_username, contact_username)
        )
    ''')

    # Run migrations for contacts table
    contact_cols = [c[1] for c in cursor.execute("PRAGMA table_info(contacts)").fetchall()]
    if "status" not in contact_cols:
        try:
            cursor.execute("ALTER TABLE contacts ADD COLUMN status TEXT DEFAULT 'added'")
        except Exception:
            pass

    # Run migrations for existing users table columns if needed
    columns = [c[1] for c in cursor.execute("PRAGMA table_info(users)").fetchall()]
    
    if "role" not in columns:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'")
        except Exception:
            pass

    if "account_id" not in columns:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN account_id TEXT")
        except Exception:
            pass

    if "display_name" not in columns:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN display_name TEXT")
        except Exception:
            pass

    if "bio" not in columns:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''")
        except Exception:
            pass

    if "avatar_color" not in columns:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN avatar_color TEXT")
        except Exception:
            pass

    if "avatar_photo" not in columns:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN avatar_photo TEXT DEFAULT ''")
        except Exception:
            pass

    if "created_at" not in columns:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN created_at TEXT")
        except Exception:
            pass

    if "last_login_at" not in columns:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN last_login_at DATETIME")
            cursor.execute("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE last_login_at IS NULL")
        except Exception as e:
            logger.error(f"Migration error for last_login_at: {e}")

    # Populate missing account_id, display_name, avatar_color for existing users
    cursor.execute("SELECT id, username, account_id, display_name, avatar_color FROM users")
    existing_users = cursor.fetchall()
    for u in existing_users:
        updates = []
        params = []
        if not u["account_id"]:
            updates.append("account_id = ?")
            params.append(generate_account_id())
        if not u["display_name"]:
            updates.append("display_name = ?")
            params.append(u["username"])
        if not u["avatar_color"]:
            updates.append("avatar_color = ?")
            params.append(random.choice(AVATAR_COLORS))
        
        if updates:
            params.append(u["id"])
            cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", tuple(params))

    # Ensure admin role is set for default admin users and purge any obsolete personal/test accounts
    cursor.execute("DELETE FROM users WHERE username IN ('HABIB_Admin', 'Gayathri')")
    cursor.execute("DELETE FROM contacts WHERE contact_username IN ('HABIB_Admin', 'ESCTRIX_Admin') OR contact_username LIKE '%Admin%'")
    cursor.execute("UPDATE users SET role = 'admin' WHERE username = 'ESCTRIX_Admin'")
    conn.commit()
    conn.close()

    # Create default admin user if not present (Stealth system account)
    create_user('ESCTRIX_Admin', 'Esctrix@215', role='admin', display_name='ESCTRIX Commander')


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_user(username: str, password: str, role: str = 'user', display_name: str = '') -> bool:
    """Create a new user with a permanent Account ID and profile."""
    conn = get_db()
    cursor = conn.cursor()
    account_id = generate_account_id()
    disp_name = display_name.strip() if display_name else username
    avatar = random.choice(AVATAR_COLORS)

    try:
        cursor.execute(
            '''INSERT INTO users (account_id, username, password_hash, display_name, bio, avatar_color, role)
               VALUES (?, ?, ?, ?, ?, ?, ?)''',
            (account_id, username, hash_password(password), disp_name, 'Decentralized & Quantum Secured 🚀', avatar, role)
        )
        conn.commit()
        
        # Also sync to Firebase if configured
        _sync_user_to_firebase(account_id, username, disp_name)
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def verify_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Verify a user's password.
    Returns full user profile dictionary on success, or None on failure.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, account_id, username, password_hash, display_name, bio, avatar_color, role FROM users WHERE username = ?', (username,))
    row = cursor.fetchone()
    conn.close()

    if row:
        stored_hash = row['password_hash']
        is_valid = False
        # Check for legacy SHA-256 hash (length 64, hex)
        if len(stored_hash) == 64 and not stored_hash.startswith('$'):
            legacy_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
            if stored_hash == legacy_hash:
                is_valid = True
        else:
            try:
                if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                    is_valid = True
            except ValueError:
                pass

        if is_valid:
            try:
                up_conn = get_db()
                up_conn.cursor().execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', (row['id'],))
                up_conn.commit()
                up_conn.close()
            except Exception:
                pass

            return {
                "id": row['id'],
                "account_id": row['account_id'],
                "username": row['username'],
                "display_name": row['display_name'] or row['username'],
                "bio": row['bio'] or '',
                "avatar_color": row['avatar_color'] or AVATAR_COLORS[0],
                "role": row['role']
            }
    return None


def touch_user_activity(username: str):
    """Update last_login_at timestamp to keep account active."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE username = ?", (username,))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Error updating user activity timestamp: {e}")


def prune_inactive_users(days: int = 7) -> int:
    """
    Purge user accounts that have been inactive (no login) for more than `days` (default 7).
    Never purges admin accounts (role == 'admin' or username == 'ESCTRIX_Admin').
    Also removes their associated contacts, offline messages, and personal vault notes.
    Returns the count of purged accounts.
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        cutoff_query = f"datetime('now', '-{days} days')"
        cursor.execute(f"""
            SELECT username FROM users 
            WHERE (role IS NULL OR role != 'admin')
              AND username != 'ESCTRIX_Admin'
              AND (
                  (last_login_at IS NOT NULL AND last_login_at < {cutoff_query})
                  OR (last_login_at IS NULL AND created_at IS NOT NULL AND created_at < {cutoff_query})
              )
        """)
        inactive_users = [r['username'] for r in cursor.fetchall()]

        if not inactive_users:
            return 0

        logger.info(f"Auto-pruning {len(inactive_users)} inactive users (inactive > {days} days): {inactive_users}")

        for u in inactive_users:
            cursor.execute("DELETE FROM contacts WHERE owner_username = ? OR contact_username = ?", (u, u))
            cursor.execute("DELETE FROM offline_messages WHERE recipient_username = ? OR sender_username = ?", (u, u))
            cursor.execute("DELETE FROM saved_messages WHERE username = ?", (u,))
            cursor.execute("DELETE FROM users WHERE username = ?", (u,))

        conn.commit()
        return len(inactive_users)
    except Exception as e:
        logger.error(f"Failed to prune inactive users: {e}")
        return 0
    finally:
        conn.close()


def get_user_profile(username: str) -> Optional[Dict[str, Any]]:
    """Fetch user profile by username."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT account_id, username, display_name, bio, avatar_color, avatar_photo, role, created_at FROM users WHERE username = ?', (username,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


def update_user_profile(username: str, display_name: str, bio: str, avatar_color: str = '', avatar_photo: Optional[str] = None) -> bool:
    """Update display name, bio, avatar color, and avatar photo."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        if avatar_photo is not None and avatar_color:
            cursor.execute('UPDATE users SET display_name = ?, bio = ?, avatar_color = ?, avatar_photo = ? WHERE username = ?',
                           (display_name, bio, avatar_color, avatar_photo, username))
        elif avatar_photo is not None:
            cursor.execute('UPDATE users SET display_name = ?, bio = ?, avatar_photo = ? WHERE username = ?',
                           (display_name, bio, avatar_photo, username))
        elif avatar_color:
            cursor.execute('UPDATE users SET display_name = ?, bio = ?, avatar_color = ? WHERE username = ?',
                           (display_name, bio, avatar_color, username))
        else:
            cursor.execute('UPDATE users SET display_name = ?, bio = ? WHERE username = ?',
                           (display_name, bio, username))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def search_users(query: str) -> List[Dict[str, Any]]:
    """Search registered users by username, account_id, or display_name (prioritizing exact and prefix username match)."""
    raw = query.strip()
    if not raw:
        return []
    clean_q = raw.lstrip('@')
    q_wildcard = f"%{clean_q}%"
    q_prefix = f"{clean_q}%"
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        '''SELECT account_id, username, display_name, bio, avatar_color, avatar_photo 
           FROM users 
           WHERE (role IS NULL OR role != 'admin')
             AND LOWER(username) NOT LIKE '%admin%'
             AND LOWER(display_name) NOT LIKE '%admin%'
             AND (LOWER(username) LIKE LOWER(?) OR LOWER(account_id) LIKE LOWER(?) OR LOWER(display_name) LIKE LOWER(?))
           ORDER BY 
             CASE 
               WHEN LOWER(username) = LOWER(?) THEN 1
               WHEN LOWER(username) LIKE LOWER(?) THEN 2
               WHEN LOWER(display_name) LIKE LOWER(?) THEN 3
               ELSE 4
             END,
             username ASC
           LIMIT 20''',
        (q_wildcard, q_wildcard, q_wildcard, clean_q, q_prefix, q_prefix)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_total_users() -> int:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) as count FROM users')
    row = cursor.fetchone()
    conn.close()
    return row['count'] if row else 0


def get_all_users():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, account_id, username, display_name, role, created_at FROM users ORDER BY id ASC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_user_role(target_username: str, new_role: str) -> bool:
    """Promote or demote a user role ('admin' or 'user')."""
    if target_username == 'ESCTRIX_Admin' and new_role != 'admin':
        return False
    if new_role not in ['admin', 'user']:
        return False
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('UPDATE users SET role = ? WHERE username = ?', (new_role, target_username))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def reset_user_password(target_username: str, new_password: str) -> bool:
    """Reset a user's password."""
    if not new_password or len(new_password) < 4:
        return False
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('UPDATE users SET password_hash = ? WHERE username = ?', (hash_password(new_password), target_username))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def delete_user(username: str) -> bool:
    if username == 'ESCTRIX_Admin':
        return False
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM users WHERE username = ?', (username,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


# ─────────────────────────────────────────────────────────────
# Saved Messages (Personal Encrypted Cloud Vault)
# ─────────────────────────────────────────────────────────────

def add_saved_message(username: str, content: str, msg_type: str = 'text', file_meta: str = '') -> Optional[int]:
    """Store an entry in the user's personal Saved Messages vault."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO saved_messages (username, content, msg_type, file_meta) VALUES (?, ?, ?, ?)',
            (username, content, msg_type, file_meta)
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_saved_messages(username: str) -> List[Dict[str, Any]]:
    """Retrieve all saved personal messages."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id, content, msg_type, file_meta, timestamp FROM saved_messages WHERE username = ? ORDER BY timestamp ASC',
        (username,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def delete_saved_message(username: str, message_id: int) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM saved_messages WHERE username = ? AND id = ?', (username, message_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()
def add_contact(owner_username: str, contact_username: str) -> Dict[str, Any]:
    """Add a contact to the user's permanent contact list with mutual friendship detection."""
    if 'admin' in contact_username.lower() or contact_username == 'ESCTRIX_Admin':
        return {"status": "error", "message": "Cannot add admin accounts."}
    if owner_username == contact_username:
        return {"status": "error", "message": "Cannot add yourself as a contact."}

    profile = get_user_profile(contact_username)
    if not profile or profile.get('role') == 'admin':
        return {"status": "error", "message": "User not found."}

    conn = get_db()
    cursor = conn.cursor()
    try:
        # Check if other user already added this user
        cursor.execute(
            'SELECT id FROM contacts WHERE owner_username = ? AND contact_username = ?',
            (contact_username, owner_username)
        )
        other_row = cursor.fetchone()
        is_mutual = bool(other_row)
        new_status = 'mutual' if is_mutual else 'added'

        if is_mutual:
            # Upgrade other user's record to mutual
            cursor.execute(
                'UPDATE contacts SET status = ? WHERE owner_username = ? AND contact_username = ?',
                ('mutual', contact_username, owner_username)
            )

        cursor.execute(
            '''INSERT OR REPLACE INTO contacts (owner_username, contact_account_id, contact_username, contact_name, status)
               VALUES (?, ?, ?, ?, ?)''',
            (owner_username, profile['account_id'], contact_username, profile['display_name'], new_status)
        )
        conn.commit()
        return {
            "status": "success",
            "relation": new_status,
            "is_mutual": is_mutual,
            "contact": profile
        }
    finally:
        conn.close()


def get_contacts(owner_username: str) -> List[Dict[str, Any]]:
    """Retrieve all saved contacts for a user with full profile info, status, and avatar photo."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        '''SELECT c.id, c.contact_account_id, c.contact_username, 
                  COALESCE(u.display_name, c.contact_name) as display_name,
                  COALESCE(u.avatar_color, '') as avatar_color,
                  COALESCE(u.avatar_photo, '') as avatar_photo,
                  COALESCE(u.bio, '') as bio,
                  COALESCE(c.status, 'added') as status,
                  c.created_at
           FROM contacts c
           LEFT JOIN users u ON c.contact_username = u.username
           WHERE c.owner_username = ?
             AND (u.role IS NULL OR u.role != 'admin')
             AND LOWER(c.contact_username) NOT LIKE '%admin%'
           ORDER BY c.created_at DESC''',
        (owner_username,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_incoming_friend_adds(username: str) -> List[Dict[str, Any]]:
    """Retrieve all users who added this user as a friend, but whom this user hasn't added back yet."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        '''SELECT c.owner_username as sender_username,
                  c.contact_account_id,
                  COALESCE(u.display_name, c.owner_username) as display_name,
                  COALESCE(u.avatar_color, '') as avatar_color,
                  COALESCE(u.avatar_photo, '') as avatar_photo,
                  COALESCE(u.bio, '') as bio,
                  u.account_id,
                  c.created_at
           FROM contacts c
           LEFT JOIN users u ON c.owner_username = u.username
           WHERE c.contact_username = ?
             AND c.owner_username NOT IN (
                 SELECT contact_username FROM contacts WHERE owner_username = ?
             )
           ORDER BY c.created_at DESC''',
        (username, username)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def is_friend(user_a: str, user_b: str) -> bool:
    """Check if two users have a friend connection (either added or mutual)."""
    if not user_a or not user_b or user_a == user_b:
        return False
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        '''SELECT 1 FROM contacts 
           WHERE (owner_username = ? AND contact_username = ?)
              OR (owner_username = ? AND contact_username = ?) LIMIT 1''',
        (user_a, user_b, user_b, user_a)
    )
    row = cursor.fetchone()
    conn.close()
    return bool(row)


def get_friends_count(owner_username: str) -> int:
    """Return the total number of contacts added by a user."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM contacts WHERE owner_username = ?', (owner_username,))
    count = cursor.fetchone()[0]
    conn.close()
    return count


# ─────────────────────────────────────────────────────────────
# Offline Messages
# ─────────────────────────────────────────────────────────────

def store_offline_message(recipient: str, sender: str, space_name: str, payload: str) -> bool:
    """Store an encrypted message for an offline user."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO offline_messages (recipient_username, sender_username, space_name, payload) VALUES (?, ?, ?, ?)',
            (recipient, sender, space_name, payload)
        )
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error storing offline message: {e}")
        return False
    finally:
        conn.close()


def get_offline_messages(username: str):
    """Retrieve all queued messages for a user."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id, sender_username, space_name, payload, timestamp FROM offline_messages WHERE recipient_username = ? ORDER BY timestamp ASC',
        (username,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r['id'], "sender": r['sender_username'], "space_name": r['space_name'], "payload": r['payload'], "timestamp": r['timestamp']} for r in rows]


def delete_offline_messages(username: str) -> bool:
    """Delete all queued messages for a user after they have been retrieved."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM offline_messages WHERE recipient_username = ?', (username,))
        conn.commit()
        return True
    finally:
        conn.close()


# ─────────────────────────────────────────────────────────────
# Firebase Cloud DB Sync Helper (Optional)
# ─────────────────────────────────────────────────────────────

def _sync_user_to_firebase(account_id: str, username: str, display_name: str):
    """If FIREBASE_PROJECT_ID is provided, sync account record via Firestore REST API."""
    if not FIREBASE_PROJECT_ID:
        return
    try:
        url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/users/{username}"
        if FIREBASE_API_KEY:
            url += f"?key={FIREBASE_API_KEY}"
        
        data = {
            "fields": {
                "account_id": {"stringValue": account_id},
                "username": {"stringValue": username},
                "display_name": {"stringValue": display_name},
                "synced_at": {"stringValue": str(os.environ.get('RENDER_GIT_COMMIT', 'live'))}
            }
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="PATCH"
        )
        urllib.request.urlopen(req, timeout=3)
        logger.info(f"User {username} successfully synced to Firebase Cloud Firestore.")
    except Exception as e:
        logger.debug(f"Firebase sync notice (non-fatal): {e}")
