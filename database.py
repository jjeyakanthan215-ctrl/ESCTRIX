import sqlite3
import hashlib
import bcrypt
import os
import random
import json
import logging
import urllib.request
from contextlib import contextmanager
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# Database Engine Configuration: Supabase PostgreSQL / SQLite
# ─────────────────────────────────────────────────────────────
# When deployed on Render, set SUPABASE_DB_URL (or standard DATABASE_URL)
# in Render environment variables for permanent cloud persistence across restarts.
# When running locally without cloud DB configured, falls back seamlessly to SQLite.
SUPABASE_DB_URL = os.environ.get('SUPABASE_DB_URL', '').strip() or os.environ.get('DATABASE_URL', '').strip()
DB_FILE = os.environ.get('DB_PATH', 'users.db')

# Safety switch: Account pruning is disabled by default to protect all accounts from deletion.
# Only enabled if explicitly set to true in environment variables.
ENABLE_ACCOUNT_PRUNING = os.environ.get('ENABLE_ACCOUNT_PRUNING', 'false').strip().lower() in ('true', '1', 'yes')

# Firebase Cloud Database configuration (optional auxiliary sync)
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

_pg_pool = None
IS_POSTGRES = False

if SUPABASE_DB_URL:
    try:
        import psycopg2
        from psycopg2 import pool
        from psycopg2.extras import RealDictCursor

        pg_url = SUPABASE_DB_URL
        if pg_url.startswith('postgres://'):
            pg_url = 'postgresql://' + pg_url[11:]

        _pg_pool = pool.ThreadedConnectionPool(1, 10, pg_url)
        IS_POSTGRES = True
        logger.info("Connected to Supabase PostgreSQL cloud database! Accounts will persist permanently.")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase PostgreSQL connection pool: {e}. Falling back to SQLite.")
        _pg_pool = None
        IS_POSTGRES = False


def generate_account_id() -> str:
    """Generate a permanent, unique 6-digit public Account ID."""
    num = random.randint(100000, 999999)
    return f"ESC-{num}"


@contextmanager
def get_db_cursor(commit: bool = False):
    """
    Context manager yielding (cursor, is_postgres).
    Handles connection pooling, dict row formatting, and transaction commit/rollback.
    """
    global _pg_pool, IS_POSTGRES
    if IS_POSTGRES and _pg_pool:
        conn = _pg_pool.getconn()
        try:
            from psycopg2.extras import RealDictCursor
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                yield cur, True
                if commit:
                    conn.commit()
        except Exception:
            if commit:
                conn.rollback()
            raise
        finally:
            _pg_pool.putconn(conn)
    else:
        conn = sqlite3.connect(DB_FILE, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            cur = conn.cursor()
            yield cur, False
            if commit:
                conn.commit()
        except Exception:
            if commit:
                conn.rollback()
            raise
        finally:
            conn.close()


def _format_query(query: str, is_postgres: bool) -> str:
    """Translate standard '?' parameter markers to '%s' for PostgreSQL."""
    if is_postgres:
        return query.replace('?', '%s')
    return query


def init_db():
    """Initialize database schemas for both Supabase PostgreSQL and SQLite."""
    global IS_POSTGRES

    if IS_POSTGRES and _pg_pool:
        with get_db_cursor(commit=True) as (cur, _):
            # 1. Users table
            cur.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    account_id VARCHAR(32) UNIQUE,
                    username VARCHAR(64) UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    display_name VARCHAR(128),
                    bio TEXT DEFAULT '',
                    avatar_color VARCHAR(128),
                    avatar_photo TEXT DEFAULT '',
                    role VARCHAR(32) DEFAULT 'user',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            ''')
            cur.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users (LOWER(username));')
            cur.execute('CREATE INDEX IF NOT EXISTS idx_users_account_id ON users (LOWER(account_id));')
            cur.execute('CREATE INDEX IF NOT EXISTS idx_users_display_name ON users (LOWER(display_name));')

            # 2. Contacts table
            cur.execute('''
                CREATE TABLE IF NOT EXISTS contacts (
                    id SERIAL PRIMARY KEY,
                    owner_username VARCHAR(64) NOT NULL,
                    contact_account_id VARCHAR(32) NOT NULL,
                    contact_username VARCHAR(64) NOT NULL,
                    contact_name VARCHAR(128) DEFAULT '',
                    status VARCHAR(32) DEFAULT 'added',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT unique_owner_contact UNIQUE (owner_username, contact_username)
                );
            ''')
            cur.execute('CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts (owner_username);')
            cur.execute('CREATE INDEX IF NOT EXISTS idx_contacts_target ON contacts (contact_username);')

            # 3. Offline messages queue
            cur.execute('''
                CREATE TABLE IF NOT EXISTS offline_messages (
                    id SERIAL PRIMARY KEY,
                    recipient_username VARCHAR(64) NOT NULL,
                    sender_username VARCHAR(64) NOT NULL,
                    space_name VARCHAR(128) NOT NULL,
                    payload TEXT NOT NULL,
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            ''')
            cur.execute('CREATE INDEX IF NOT EXISTS idx_offline_recipient ON offline_messages (recipient_username);')

            # 4. Saved messages (Encrypted Cloud Vault)
            cur.execute('''
                CREATE TABLE IF NOT EXISTS saved_messages (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(64) NOT NULL,
                    content TEXT NOT NULL,
                    msg_type VARCHAR(32) DEFAULT 'text',
                    file_meta TEXT DEFAULT '',
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            ''')
            cur.execute('CREATE INDEX IF NOT EXISTS idx_saved_messages_user ON saved_messages (username);')

            # 5. Direct messages (1-on-1 Persistent Chat History)
            cur.execute('''
                CREATE TABLE IF NOT EXISTS direct_messages (
                    id SERIAL PRIMARY KEY,
                    sender_username VARCHAR(64) NOT NULL,
                    recipient_username VARCHAR(64) NOT NULL,
                    content TEXT NOT NULL,
                    msg_type VARCHAR(32) DEFAULT 'text',
                    file_meta TEXT DEFAULT '',
                    vanish INT DEFAULT 0,
                    is_read INT DEFAULT 0,
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            ''')
            cur.execute('CREATE INDEX IF NOT EXISTS idx_dm_users ON direct_messages (sender_username, recipient_username);')

            # 6. Passkey biometric credentials
            cur.execute('''
                CREATE TABLE IF NOT EXISTS passkey_credentials (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(64) NOT NULL,
                    credential_id TEXT UNIQUE NOT NULL,
                    public_key TEXT NOT NULL,
                    sign_count INT DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            ''')
            cur.execute('CREATE INDEX IF NOT EXISTS idx_passkey_username ON passkey_credentials (username);')

            # Safe migrations for PostgreSQL columns
            for col, col_type in [
                ("role", "VARCHAR(32) DEFAULT 'user'"),
                ("account_id", "VARCHAR(32)"),
                ("display_name", "VARCHAR(128)"),
                ("bio", "TEXT DEFAULT ''"),
                ("avatar_color", "VARCHAR(128)"),
                ("avatar_photo", "TEXT DEFAULT ''"),
                ("last_login_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
            ]:
                try:
                    cur.execute(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {col_type};")
                except Exception:
                    pass

    else:
        # SQLite schema setup
        db_dir = os.path.dirname(DB_FILE)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

        with get_db_cursor(commit=True) as (cur, _):
            # Core users table
            cur.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_id TEXT UNIQUE,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    display_name TEXT,
                    bio TEXT DEFAULT '',
                    avatar_color TEXT,
                    avatar_photo TEXT DEFAULT '',
                    role TEXT DEFAULT 'user',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Offline encrypted message queue
            cur.execute('''
                CREATE TABLE IF NOT EXISTS offline_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    recipient_username TEXT NOT NULL,
                    sender_username TEXT NOT NULL,
                    space_name TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Saved Messages (Encrypted Cloud Vault)
            cur.execute('''
                CREATE TABLE IF NOT EXISTS saved_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    content TEXT NOT NULL,
                    msg_type TEXT DEFAULT 'text',
                    file_meta TEXT DEFAULT '',
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Persistent Contacts
            cur.execute('''
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

            # Direct Messages (1-on-1 Chat History)
            cur.execute('''
                CREATE TABLE IF NOT EXISTS direct_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sender_username TEXT NOT NULL,
                    recipient_username TEXT NOT NULL,
                    content TEXT NOT NULL,
                    msg_type TEXT DEFAULT 'text',
                    file_meta TEXT DEFAULT '',
                    vanish INTEGER DEFAULT 0,
                    is_read INTEGER DEFAULT 0,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Passkey biometric credentials
            cur.execute('''
                CREATE TABLE IF NOT EXISTS passkey_credentials (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    credential_id TEXT UNIQUE NOT NULL,
                    public_key TEXT NOT NULL,
                    sign_count INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # SQLite migrations
            contact_cols = [c[1] for c in cur.execute("PRAGMA table_info(contacts)").fetchall()]
            if "status" not in contact_cols:
                try:
                    cur.execute("ALTER TABLE contacts ADD COLUMN status TEXT DEFAULT 'added'")
                except Exception:
                    pass

            columns = [c[1] for c in cur.execute("PRAGMA table_info(users)").fetchall()]
            for col, col_type in [
                ("role", "TEXT DEFAULT 'user'"),
                ("account_id", "TEXT"),
                ("display_name", "TEXT"),
                ("bio", "TEXT DEFAULT ''"),
                ("avatar_color", "TEXT"),
                ("avatar_photo", "TEXT DEFAULT ''"),
                ("created_at", "TEXT"),
                ("last_login_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
            ]:
                if col not in columns:
                    try:
                        cur.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
                    except Exception:
                        pass

    # Ensure default system admin user exists without overwriting existing data
    create_user('ESCTRIX_Admin', 'Esctrix@215', role='admin', display_name='ESCTRIX Commander')


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_user(username: str, password: str, role: str = 'user', display_name: str = '') -> bool:
    """Create a new user with a permanent Account ID and profile."""
    # Safety: If 3rd parameter was provided as a display name instead of a role ('user'/'admin')
    if role not in ('user', 'admin') and not display_name:
        display_name = role
        role = 'user'

    account_id = generate_account_id()
    disp_name = display_name.strip() if display_name else username
    avatar = random.choice(AVATAR_COLORS)

    try:
        with get_db_cursor(commit=True) as (cur, is_pg):
            sql = _format_query(
                '''INSERT INTO users (account_id, username, password_hash, display_name, bio, avatar_color, role)
                   VALUES (?, ?, ?, ?, ?, ?, ?)''',
                is_pg
            )
            cur.execute(sql, (account_id, username, hash_password(password), disp_name, 'Decentralized & Quantum Secured 🚀', avatar, role))

        _sync_user_to_firebase(account_id, username, disp_name)
        return True
    except Exception as e:
        logger.debug(f"User creation notice for '{username}': {e}")
        return False


def verify_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Verify a user's password.
    Returns full user profile dictionary on success, or None on failure.
    """
    row = None
    with get_db_cursor(commit=False) as (cur, is_pg):
        sql = _format_query('SELECT id, account_id, username, password_hash, display_name, bio, avatar_color, role FROM users WHERE username = ?', is_pg)
        cur.execute(sql, (username,))
        row = cur.fetchone()

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
                with get_db_cursor(commit=True) as (up_cur, is_pg):
                    up_sql = _format_query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', is_pg)
                    up_cur.execute(up_sql, (row['id'],))
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
        with get_db_cursor(commit=True) as (cur, is_pg):
            sql = _format_query("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE username = ?", is_pg)
            cur.execute(sql, (username,))
    except Exception as e:
        logger.error(f"Error updating user activity timestamp: {e}")


def prune_inactive_users(days: int = 7) -> int:
    """
    Purge user accounts that have been inactive for more than `days`.
    DISABLED BY DEFAULT to prevent accidental account deletion.
    Only executes if ENABLE_ACCOUNT_PRUNING=true is set in environment.
    """
    if not ENABLE_ACCOUNT_PRUNING:
        logger.debug("Account pruning is disabled by default. Skipping prune.")
        return 0

    try:
        with get_db_cursor(commit=True) as (cur, is_pg):
            if is_pg:
                cutoff_query = f"NOW() - INTERVAL '{days} days'"
            else:
                cutoff_query = f"datetime('now', '-{days} days')"

            cur.execute(f"""
                SELECT username FROM users 
                WHERE (role IS NULL OR role != 'admin')
                  AND username != 'ESCTRIX_Admin'
                  AND (
                      (last_login_at IS NOT NULL AND last_login_at < {cutoff_query})
                      OR (last_login_at IS NULL AND created_at IS NOT NULL AND created_at < {cutoff_query})
                  )
            """)
            inactive_users = [r['username'] for r in cur.fetchall()]

            if not inactive_users:
                return 0

            logger.info(f"Auto-pruning {len(inactive_users)} inactive users: {inactive_users}")
            for u in inactive_users:
                del_contacts = _format_query("DELETE FROM contacts WHERE owner_username = ? OR contact_username = ?", is_pg)
                del_offline = _format_query("DELETE FROM offline_messages WHERE recipient_username = ? OR sender_username = ?", is_pg)
                del_saved = _format_query("DELETE FROM saved_messages WHERE username = ?", is_pg)
                del_dm = _format_query("DELETE FROM direct_messages WHERE sender_username = ? OR recipient_username = ?", is_pg)
                del_user = _format_query("DELETE FROM users WHERE username = ?", is_pg)

                cur.execute(del_contacts, (u, u))
                cur.execute(del_offline, (u, u))
                cur.execute(del_saved, (u,))
                cur.execute(del_dm, (u, u))
                cur.execute(del_user, (u,))

            return len(inactive_users)
    except Exception as e:
        logger.error(f"Failed to prune inactive users: {e}")
        return 0


def get_user_profile(username: str) -> Optional[Dict[str, Any]]:
    """Fetch user profile by username."""
    with get_db_cursor(commit=False) as (cur, is_pg):
        sql = _format_query('SELECT account_id, username, display_name, bio, avatar_color, avatar_photo, role, created_at FROM users WHERE username = ?', is_pg)
        cur.execute(sql, (username,))
        row = cur.fetchone()
        if row:
            return dict(row)
    return None


def update_user_profile(username: str, display_name: str, bio: str, avatar_color: str = '', avatar_photo: Optional[str] = None) -> bool:
    """Update display name, bio, avatar color, and avatar photo."""
    with get_db_cursor(commit=True) as (cur, is_pg):
        if avatar_photo is not None and avatar_color:
            sql = _format_query('UPDATE users SET display_name = ?, bio = ?, avatar_color = ?, avatar_photo = ? WHERE username = ?', is_pg)
            cur.execute(sql, (display_name, bio, avatar_color, avatar_photo, username))
        elif avatar_photo is not None:
            sql = _format_query('UPDATE users SET display_name = ?, bio = ?, avatar_photo = ? WHERE username = ?', is_pg)
            cur.execute(sql, (display_name, bio, avatar_photo, username))
        elif avatar_color:
            sql = _format_query('UPDATE users SET display_name = ?, bio = ?, avatar_color = ? WHERE username = ?', is_pg)
            cur.execute(sql, (display_name, bio, avatar_color, username))
        else:
            sql = _format_query('UPDATE users SET display_name = ?, bio = ? WHERE username = ?', is_pg)
            cur.execute(sql, (display_name, bio, username))
        return cur.rowcount > 0


def search_users(query: str) -> List[Dict[str, Any]]:
    """Search registered users by username, account_id, or display_name."""
    raw = query.strip()
    if not raw:
        return []
    clean_q = raw.lstrip('@')
    q_wildcard = f"%{clean_q}%"
    q_prefix = f"{clean_q}%"

    with get_db_cursor(commit=False) as (cur, is_pg):
        sql = _format_query(
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
            is_pg
        )
        cur.execute(sql, (q_wildcard, q_wildcard, q_wildcard, clean_q, q_prefix, q_prefix))
        rows = cur.fetchall()
        return [dict(r) for r in rows]


def get_total_users() -> int:
    with get_db_cursor(commit=False) as (cur, is_pg):
        cur.execute('SELECT COUNT(*) as count FROM users')
        row = cur.fetchone()
        return row['count'] if row else 0


def get_all_users() -> List[Dict[str, Any]]:
    with get_db_cursor(commit=False) as (cur, is_pg):
        cur.execute('SELECT id, account_id, username, display_name, role, created_at FROM users ORDER BY id ASC')
        rows = cur.fetchall()
        return [dict(r) for r in rows]


def update_user_role(target_username: str, new_role: str) -> bool:
    """Promote or demote a user role ('admin' or 'user')."""
    if target_username == 'ESCTRIX_Admin' and new_role != 'admin':
        return False
    if new_role not in ['admin', 'user']:
        return False
    with get_db_cursor(commit=True) as (cur, is_pg):
        sql = _format_query('UPDATE users SET role = ? WHERE username = ?', is_pg)
        cur.execute(sql, (new_role, target_username))
        return cur.rowcount > 0


def reset_user_password(target_username: str, new_password: str) -> bool:
    """Reset a user's password."""
    if not new_password or len(new_password) < 4:
        return False
    with get_db_cursor(commit=True) as (cur, is_pg):
        sql = _format_query('UPDATE users SET password_hash = ? WHERE username = ?', is_pg)
        cur.execute(sql, (hash_password(new_password), target_username))
        return cur.rowcount > 0


def delete_user(username: str) -> bool:
    if username == 'ESCTRIX_Admin':
        return False
    with get_db_cursor(commit=True) as (cur, is_pg):
        sql = _format_query('DELETE FROM users WHERE username = ?', is_pg)
        cur.execute(sql, (username,))
        return cur.rowcount > 0


# ─────────────────────────────────────────────────────────────
# Saved Messages (Personal Encrypted Cloud Vault)
# ─────────────────────────────────────────────────────────────

def add_saved_message(username: str, content: str, msg_type: str = 'text', file_meta: str = '') -> Optional[int]:
    """Store an entry in the user's personal Saved Messages vault."""
    with get_db_cursor(commit=True) as (cur, is_pg):
        if is_pg:
            cur.execute(
                'INSERT INTO saved_messages (username, content, msg_type, file_meta) VALUES (%s, %s, %s, %s) RETURNING id',
                (username, content, msg_type, file_meta)
            )
            row = cur.fetchone()
            return row['id'] if row else None
        else:
            cur.execute(
                'INSERT INTO saved_messages (username, content, msg_type, file_meta) VALUES (?, ?, ?, ?)',
                (username, content, msg_type, file_meta)
            )
            return cur.lastrowid


def get_saved_messages(username: str) -> List[Dict[str, Any]]:
    """Retrieve all saved personal messages."""
    with get_db_cursor(commit=False) as (cur, is_pg):
        sql = _format_query(
            'SELECT id, content, msg_type, file_meta, timestamp FROM saved_messages WHERE username = ? ORDER BY timestamp ASC',
            is_pg
        )
        cur.execute(sql, (username,))
        rows = cur.fetchall()
        return [dict(r) for r in rows]


def delete_saved_message(username: str, message_id: int) -> bool:
    with get_db_cursor(commit=True) as (cur, is_pg):
        sql = _format_query('DELETE FROM saved_messages WHERE username = ? AND id = ?', is_pg)
        cur.execute(sql, (username, message_id))
        return cur.rowcount > 0


# ─────────────────────────────────────────────────────────────
# Contacts & Friends
# ─────────────────────────────────────────────────────────────

def add_contact(owner_username: str, contact_username: str) -> Dict[str, Any]:
    """Add a contact to the user's permanent contact list with mutual friendship detection."""
    if 'admin' in contact_username.lower() or contact_username == 'ESCTRIX_Admin':
        return {"status": "error", "message": "Cannot add admin accounts."}
    if owner_username == contact_username:
        return {"status": "error", "message": "Cannot add yourself as a contact."}

    profile = get_user_profile(contact_username)
    if not profile or profile.get('role') == 'admin':
        return {"status": "error", "message": "User not found."}

    with get_db_cursor(commit=True) as (cur, is_pg):
        # Check if other user already added this user
        chk_sql = _format_query('SELECT id FROM contacts WHERE owner_username = ? AND contact_username = ?', is_pg)
        cur.execute(chk_sql, (contact_username, owner_username))
        other_row = cur.fetchone()
        is_mutual = bool(other_row)
        new_status = 'mutual' if is_mutual else 'added'

        if is_mutual:
            up_sql = _format_query('UPDATE contacts SET status = ? WHERE owner_username = ? AND contact_username = ?', is_pg)
            cur.execute(up_sql, ('mutual', contact_username, owner_username))

        # Modern SQLite and PostgreSQL both support ON CONFLICT
        insert_sql = _format_query(
            '''INSERT INTO contacts (owner_username, contact_account_id, contact_username, contact_name, status)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(owner_username, contact_username) DO UPDATE SET
                   contact_account_id = excluded.contact_account_id,
                   contact_name = excluded.contact_name,
                   status = excluded.status''',
            is_pg
        )
        cur.execute(insert_sql, (owner_username, profile['account_id'], contact_username, profile['display_name'], new_status))

        return {
            "status": "success",
            "relation": new_status,
            "is_mutual": is_mutual,
            "contact": profile
        }


def get_contacts(owner_username: str) -> List[Dict[str, Any]]:
    """Retrieve all saved contacts for a user with full profile info and avatar."""
    with get_db_cursor(commit=False) as (cur, is_pg):
        sql = _format_query(
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
            is_pg
        )
        cur.execute(sql, (owner_username,))
        rows = cur.fetchall()
        return [dict(r) for r in rows]


def get_incoming_friend_adds(username: str) -> List[Dict[str, Any]]:
    """Retrieve all users who added this user as a friend, but whom this user hasn't added back yet."""
    with get_db_cursor(commit=False) as (cur, is_pg):
        sql = _format_query(
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
            is_pg
        )
        cur.execute(sql, (username, username))
        rows = cur.fetchall()
        return [dict(r) for r in rows]


def is_friend(user_a: str, user_b: str) -> bool:
    """Check if two users have a friend connection (either added or mutual)."""
    if not user_a or not user_b or user_a == user_b:
        return False
    with get_db_cursor(commit=False) as (cur, is_pg):
        sql = _format_query(
            '''SELECT 1 FROM contacts 
               WHERE (owner_username = ? AND contact_username = ?)
                  OR (owner_username = ? AND contact_username = ?) LIMIT 1''',
            is_pg
        )
        cur.execute(sql, (user_a, user_b, user_b, user_a))
        row = cur.fetchone()
        return bool(row)


def get_friends_count(owner_username: str) -> int:
    """Return the total number of contacts added by a user."""
    with get_db_cursor(commit=False) as (cur, is_pg):
        sql = _format_query('SELECT COUNT(*) as count FROM contacts WHERE owner_username = ?', is_pg)
        cur.execute(sql, (owner_username,))
        row = cur.fetchone()
        return row['count'] if row else 0


# ─────────────────────────────────────────────────────────────
# Offline Messages
# ─────────────────────────────────────────────────────────────

def store_offline_message(recipient: str, sender: str, space_name: str, payload: str) -> bool:
    """Store an encrypted message for an offline user."""
    try:
        with get_db_cursor(commit=True) as (cur, is_pg):
            sql = _format_query(
                'INSERT INTO offline_messages (recipient_username, sender_username, space_name, payload) VALUES (?, ?, ?, ?)',
                is_pg
            )
            cur.execute(sql, (recipient, sender, space_name, payload))
            return True
    except Exception as e:
        logger.error(f"Error storing offline message: {e}")
        return False


def get_offline_messages(username: str) -> List[Dict[str, Any]]:
    """Retrieve all queued messages for a user."""
    with get_db_cursor(commit=False) as (cur, is_pg):
        sql = _format_query(
            'SELECT id, sender_username, space_name, payload, timestamp FROM offline_messages WHERE recipient_username = ? ORDER BY timestamp ASC',
            is_pg
        )
        cur.execute(sql, (username,))
        rows = cur.fetchall()
        return [{"id": r['id'], "sender": r['sender_username'], "space_name": r['space_name'], "payload": r['payload'], "timestamp": r['timestamp']} for r in rows]


def delete_offline_messages(username: str) -> bool:
    """Delete all queued messages for a user after retrieval."""
    try:
        with get_db_cursor(commit=True) as (cur, is_pg):
            sql = _format_query('DELETE FROM offline_messages WHERE recipient_username = ?', is_pg)
            cur.execute(sql, (username,))
            return True
    except Exception as e:
        logger.error(f"Error deleting offline messages: {e}")
        return False


# ─────────────────────────────────────────────────────────────
# Direct Messages Persistence & History
# ─────────────────────────────────────────────────────────────

def store_direct_message(
    sender_username: str,
    recipient_username: str,
    content: str,
    msg_type: str = 'text',
    file_meta: str = '',
    vanish: int = 0
) -> Optional[Dict[str, Any]]:
    """Store a 1-on-1 direct chat message."""
    try:
        with get_db_cursor(commit=True) as (cur, is_pg):
            if is_pg:
                cur.execute(
                    '''INSERT INTO direct_messages (sender_username, recipient_username, content, msg_type, file_meta, vanish)
                       VALUES (%s, %s, %s, %s, %s, %s) RETURNING *''',
                    (sender_username, recipient_username, content, msg_type, file_meta, 1 if vanish else 0)
                )
                row = cur.fetchone()
                return dict(row) if row else None
            else:
                cur.execute(
                    '''INSERT INTO direct_messages (sender_username, recipient_username, content, msg_type, file_meta, vanish)
                       VALUES (?, ?, ?, ?, ?, ?)''',
                    (sender_username, recipient_username, content, msg_type, file_meta, 1 if vanish else 0)
                )
                msg_id = cur.lastrowid
                cur.execute('SELECT * FROM direct_messages WHERE id = ?', (msg_id,))
                row = cur.fetchone()
                return dict(row) if row else None
    except Exception as e:
        logger.error(f"Error storing direct message: {e}")
        return None


def get_direct_chat_history(user_a: str, user_b: str, limit: int = 100) -> List[Dict[str, Any]]:
    """Retrieve 1-on-1 chat history between two users."""
    try:
        with get_db_cursor(commit=False) as (cur, is_pg):
            sql = _format_query(
                '''SELECT id, sender_username, recipient_username, content, msg_type, file_meta, vanish, is_read, timestamp
                   FROM direct_messages
                   WHERE (sender_username = ? AND recipient_username = ?)
                      OR (sender_username = ? AND recipient_username = ?)
                   ORDER BY id ASC
                   LIMIT ?''',
                is_pg
            )
            cur.execute(sql, (user_a, user_b, user_b, user_a, limit))
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Error fetching direct chat history: {e}")
        return []


def mark_direct_messages_read(reader_username: str, sender_username: str) -> bool:
    """Mark all unread direct messages from a sender as read."""
    try:
        with get_db_cursor(commit=True) as (cur, is_pg):
            sql = _format_query(
                '''UPDATE direct_messages 
                   SET is_read = 1 
                   WHERE recipient_username = ? AND sender_username = ? AND is_read = 0''',
                is_pg
            )
            cur.execute(sql, (reader_username, sender_username))
            return True
    except Exception as e:
        logger.error(f"Error marking messages read: {e}")
        return False


# ─────────────────────────────────────────────────────────────
# Passkey / WebAuthn Biometric Credentials
# ─────────────────────────────────────────────────────────────

def save_passkey_credential(username: str, credential_id: str, public_key: str) -> bool:
    """Register or update a WebAuthn biometric credential for a user."""
    try:
        with get_db_cursor(commit=True) as (cur, is_pg):
            sql = _format_query(
                '''INSERT INTO passkey_credentials (username, credential_id, public_key)
                   VALUES (?, ?, ?)
                   ON CONFLICT(credential_id) DO UPDATE SET
                   public_key = excluded.public_key,
                   username = excluded.username''',
                is_pg
            )
            cur.execute(sql, (username, credential_id, public_key))
            return True
    except Exception as e:
        logger.error(f"Error saving passkey credential: {e}")
        return False


def get_passkey_credential(credential_id: str) -> Optional[Dict[str, Any]]:
    """Fetch credential by credential_id."""
    try:
        with get_db_cursor(commit=False) as (cur, is_pg):
            sql = _format_query('SELECT * FROM passkey_credentials WHERE credential_id = ?', is_pg)
            cur.execute(sql, (credential_id,))
            row = cur.fetchone()
            return dict(row) if row else None
    except Exception as e:
        logger.error(f"Error retrieving passkey credential: {e}")
        return None


def get_user_passkeys(username: str) -> List[Dict[str, Any]]:
    """Retrieve all passkey credentials registered to a username."""
    try:
        with get_db_cursor(commit=False) as (cur, is_pg):
            sql = _format_query('SELECT credential_id, created_at FROM passkey_credentials WHERE username = ?', is_pg)
            cur.execute(sql, (username,))
            return [dict(row) for row in cur.fetchall()]
    except Exception as e:
        logger.error(f"Error fetching user passkeys: {e}")
        return []


def delete_passkey_credential(credential_id: str, username: str) -> bool:
    """Delete a passkey credential."""
    try:
        with get_db_cursor(commit=True) as (cur, is_pg):
            sql = _format_query('DELETE FROM passkey_credentials WHERE credential_id = ? AND username = ?', is_pg)
            cur.execute(sql, (credential_id, username))
            return True
    except Exception as e:
        logger.error(f"Error deleting passkey: {e}")
        return False


# ─────────────────────────────────────────────────────────────
# Firebase Auxiliary Sync Helper (Optional)
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
