-- Migración inicial para Chambar
-- Crea todas las tablas necesarias para el sistema

-- Tabla de usuarios
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'cashier' NOT NULL,
    created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL
);

-- Tabla de sesiones
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de cajas
CREATE TABLE cash_boxes (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'open' NOT NULL,
    opened_by TEXT NOT NULL,
    closed_by TEXT,
    initial_amount INTEGER DEFAULT 0 NOT NULL,
    final_amount INTEGER,
    opening_notes TEXT,
    closing_notes TEXT,
    opened_at INTEGER NOT NULL,
    closed_at INTEGER,
    edited_flag INTEGER DEFAULT 0 NOT NULL,
    created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL,
    FOREIGN KEY (opened_by) REFERENCES users(id),
    FOREIGN KEY (closed_by) REFERENCES users(id)
);

-- Tabla de detalles de operación
CREATE TABLE operation_details (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    active INTEGER DEFAULT 1 NOT NULL,
    created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL
);

-- Tabla de responsables
CREATE TABLE responsible_persons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    active INTEGER DEFAULT 1 NOT NULL,
    created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL
);

-- Tabla de stands
CREATE TABLE stands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    active INTEGER DEFAULT 1 NOT NULL,
    created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL
);

-- Tabla de empresas
CREATE TABLE companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ruc TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    active INTEGER DEFAULT 1 NOT NULL,
    created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL
);

-- Tabla de operaciones
CREATE TABLE operations (
    id TEXT PRIMARY KEY,
    cash_box_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'PEN' NOT NULL,
    operation_detail_id TEXT NOT NULL,
    responsible_id TEXT NOT NULL,
    stand_id TEXT NOT NULL,
    company_id TEXT,
    description TEXT,
    voucher_number TEXT,
    payment_method TEXT DEFAULT 'cash' NOT NULL,
    active INTEGER DEFAULT 1 NOT NULL,
    operation_date INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL,
    FOREIGN KEY (cash_box_id) REFERENCES cash_boxes(id),
    FOREIGN KEY (operation_detail_id) REFERENCES operation_details(id),
    FOREIGN KEY (responsible_id) REFERENCES responsible_persons(id),
    FOREIGN KEY (stand_id) REFERENCES stands(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Índices para optimización
CREATE UNIQUE INDEX users_email_unique ON users (email);
CREATE INDEX cash_boxes_date_idx ON cash_boxes (date);
CREATE INDEX operations_cash_box_id_idx ON operations (cash_box_id);
CREATE INDEX operations_operation_date_idx ON operations (operation_date);
CREATE INDEX operations_type_idx ON operations (type);
