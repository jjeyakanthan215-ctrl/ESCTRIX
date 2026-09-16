-- ══════════════════════════════════════════════════════════════════
-- ESCTRIX Quantum — Supabase PostgreSQL Cloud Database Schema
-- ══════════════════════════════════════════════════════════════════
-- Instructions for Permanent Account Persistence:
-- 1. Open your free project dashboard at https://supabase.com
-- 2. Navigate to "SQL Editor" in the left navigation sidebar.
-- 3. Paste this entire script and click "Run".
-- 4. In Project Settings -> Database -> Connection String (URI), copy the URI.
-- 5. In your Render Dashboard, go to your Web Service -> Environment -> Add Environment Variable:
--       Key: SUPABASE_DB_URL
--       Value: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
-- 6. Done! All user accounts, profiles, contacts, and encrypted vaults will now persist permanently.
-- ══════════════════════════════════════════════════════════════════

-- 1. Core Users Table (Permanent User Accounts & Profiles)
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

CREATE INDEX IF NOT EXISTS idx_users_username ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_account_id ON users (LOWER(account_id));
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users (LOWER(display_name));

-- 2. Social Contacts & Friendships Table
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    owner_username VARCHAR(64) NOT NULL,
    contact_account_id VARCHAR(32) NOT NULL,
    contact_username VARCHAR(64) NOT NULL,
    contact_name VARCHAR(128) DEFAULT '',
    status VARCHAR(32) DEFAULT 'added', -- 'added' (one-way) or 'mutual' (friends)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_owner_contact UNIQUE (owner_username, contact_username)
);

CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts (owner_username);
CREATE INDEX IF NOT EXISTS idx_contacts_target ON contacts (contact_username);

-- 3. Offline Encrypted Message Queue
CREATE TABLE IF NOT EXISTS offline_messages (
    id SERIAL PRIMARY KEY,
    recipient_username VARCHAR(64) NOT NULL,
    sender_username VARCHAR(64) NOT NULL,
    space_name VARCHAR(128) NOT NULL,
    payload TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offline_recipient ON offline_messages (recipient_username);

-- 4. Saved Messages (Personal Encrypted Cloud Vault)
CREATE TABLE IF NOT EXISTS saved_messages (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    msg_type VARCHAR(32) DEFAULT 'text',
    file_meta TEXT DEFAULT '',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_messages_user ON saved_messages (username);

-- 5. Direct Messages (1-on-1 Persistent Chat History)
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

CREATE INDEX IF NOT EXISTS idx_dm_users ON direct_messages (sender_username, recipient_username);

-- 6. Passkey Biometric WebAuthn Credentials
CREATE TABLE IF NOT EXISTS passkey_credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    sign_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_passkey_username ON passkey_credentials (username);
