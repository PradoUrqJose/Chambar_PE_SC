-- Esquema completo para producción
-- Claves: un solo estado, timestamps en UTC, business_date en Lima, saldos derivados, FKs + CHECKs

-- Tabla de cajas
CREATE TABLE cash_boxes (
  id                TEXT PRIMARY KEY,         -- usa UUID o cuid
  name              TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('empty','open','closed','reopened')),
  opening_amount    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (opening_amount >= 0),
  opened_at_utc     TEXT,                     -- ISO UTC (nullable si 'empty')
  original_opened_at_utc TEXT,                -- primera apertura (nullable)
  closed_at_utc     TEXT,                     -- nullable
  reopened_at_utc   TEXT,                     -- nullable (última reapertura)
  business_date     TEXT,                     -- 'YYYY-MM-DD' en America/Lima (nullable si 'empty')
  created_at_utc    TEXT NOT NULL,
  updated_at_utc    TEXT NOT NULL
);

CREATE INDEX idx_cash_boxes_business_date ON cash_boxes(business_date);
CREATE INDEX idx_cash_boxes_status ON cash_boxes(status);

-- Tabla de empresas
CREATE TABLE companies (
  id                TEXT PRIMARY KEY,
  razonSocial       TEXT NOT NULL,
  ruc               TEXT NOT NULL UNIQUE,
  address           TEXT,
  phone             TEXT,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  createdAt         TEXT NOT NULL,
  updatedAt         TEXT NOT NULL
);

-- Tabla de stands
CREATE TABLE stands (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  location          TEXT,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  createdAt         TEXT NOT NULL,
  updatedAt         TEXT NOT NULL
);

-- Tabla de responsables
CREATE TABLE responsible_persons (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  createdAt         TEXT NOT NULL,
  updatedAt         TEXT NOT NULL
);

-- Tabla de detalles de operación
CREATE TABLE operation_details (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT,
  type              TEXT NOT NULL CHECK (type IN ('income','expense')),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  createdAt         TEXT NOT NULL,
  updatedAt         TEXT NOT NULL
);

-- Tabla de operaciones tipo "ledger"
CREATE TABLE operations (
  id                    TEXT PRIMARY KEY,
  cash_box_id           TEXT NOT NULL REFERENCES cash_boxes(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount                NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description           TEXT NOT NULL,
  operation_detail_id   TEXT,  -- FK a catálogo si aplica
  responsible_person_id TEXT,  -- FK a catálogo si aplica
  stand_id              TEXT,  -- FK a catálogo si aplica
  company_id            TEXT,  -- FK a catálogo si aplica
  created_at_utc        TEXT NOT NULL,     -- evento
  updated_at_utc        TEXT NOT NULL,
  business_date         TEXT NOT NULL      -- 'YYYY-MM-DD' (America/Lima) calculado al crear
);

CREATE INDEX idx_ops_cashbox ON operations(cash_box_id);
CREATE INDEX idx_ops_business_date ON operations(business_date);

-- Vista para calcular saldo derivado
CREATE VIEW cash_box_balances AS
SELECT
  cb.id,
  cb.name,
  cb.status,
  cb.opening_amount,
  cb.opening_amount
    + COALESCE(SUM(CASE WHEN o.type='income'  THEN o.amount END), 0)
    - COALESCE(SUM(CASE WHEN o.type='expense' THEN o.amount END), 0)
  AS current_amount,
  cb.business_date,
  cb.opened_at_utc,
  cb.closed_at_utc,
  cb.reopened_at_utc
FROM cash_boxes cb
LEFT JOIN operations o ON o.cash_box_id = cb.id
GROUP BY cb.id;
