-- Esquema robusto propuesto por el profesor
-- Claves: un solo estado, timestamps en UTC, business_date en Lima, saldos derivados, FKs + CHECKs

-- Tabla de cajas
CREATE TABLE cash_boxes (
  id                TEXT PRIMARY KEY,         -- usa UUID o cuid
  name              TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('empty','open','closed','reopened')),
  opening_amount    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (opening_amount >= 0),
  current_amount    NUMERIC(12,2) DEFAULT 0,  -- saldo actual calculado
  opened_at_utc     TEXT,                     -- ISO UTC (nullable si 'empty')
  original_opened_at_utc TEXT,                -- primera apertura (nullable)
  closed_at_utc     TEXT,                     -- nullable
  reopened_at_utc   TEXT,                     -- nullable (última reapertura)
  reopen_notes      TEXT,                     -- notas de reapertura (nullable)
  business_date     TEXT,                     -- 'YYYY-MM-DD' en America/Lima (nullable si 'empty')
  created_at_utc    TEXT NOT NULL,
  updated_at_utc    TEXT NOT NULL
);

CREATE INDEX idx_cash_boxes_business_date ON cash_boxes(business_date);
CREATE INDEX idx_cash_boxes_status ON cash_boxes(status);

-- Regla: una sola caja "activa" (open/reopened) por business_date
CREATE TRIGGER trg_one_open_box_per_day
BEFORE INSERT ON cash_boxes
BEGIN
  SELECT
    CASE
      WHEN NEW.status IN ('open','reopened') AND NEW.business_date IS NOT NULL AND
           EXISTS (
             SELECT 1 FROM cash_boxes
             WHERE business_date = NEW.business_date
               AND status IN ('open','reopened')
           )
      THEN RAISE(ABORT, 'Solo puede haber 1 caja abierta/reaperturada por día de negocio')
    END;
END;

CREATE TRIGGER trg_one_open_box_per_day_update
BEFORE UPDATE ON cash_boxes
BEGIN
  SELECT
    CASE
      WHEN NEW.status IN ('open','reopened') AND NEW.business_date IS NOT NULL AND
           EXISTS (
             SELECT 1 FROM cash_boxes
             WHERE business_date = NEW.business_date
               AND status IN ('open','reopened')
               AND id <> NEW.id
           )
      THEN RAISE(ABORT, 'Solo puede haber 1 caja abierta/reaperturada por día de negocio')
    END;
END;

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
  image                 TEXT,  -- URL o path de imagen adjunta (compatibilidad)
  attachments_json      TEXT,  -- JSON array de archivos adjuntos
  is_reopen_operation   BOOLEAN DEFAULT 0,  -- Si es operación de reapertura
  created_at_utc        TEXT NOT NULL,     -- evento
  updated_at_utc        TEXT NOT NULL,
  business_date         TEXT NOT NULL      -- 'YYYY-MM-DD' (America/Lima) calculado al crear
);

CREATE INDEX idx_ops_cashbox ON operations(cash_box_id);
CREATE INDEX idx_ops_business_date ON operations(business_date);

-- Tabla de saldos pendientes
CREATE TABLE pending_balances (
  id                    TEXT PRIMARY KEY,
  cash_box_id           TEXT NOT NULL REFERENCES cash_boxes(id) ON DELETE CASCADE,
  amount                NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date                  TEXT NOT NULL,                     -- 'YYYY-MM-DD' (America/Lima)
  status                TEXT NOT NULL CHECK (status IN ('pending','transferred','returned','handled')),
  notes                 TEXT,                              -- Notas opcionales
  handled_at_utc        TEXT,                              -- Timestamp cuando se manejó
  created_at_utc        TEXT NOT NULL,
  updated_at_utc        TEXT NOT NULL
);

CREATE INDEX idx_pending_balances_cash_box ON pending_balances(cash_box_id);
CREATE INDEX idx_pending_balances_date ON pending_balances(date);
CREATE INDEX idx_pending_balances_status ON pending_balances(status);
CREATE INDEX idx_pending_balances_date_status ON pending_balances(date, status);

-- Tablas de catálogos
CREATE TABLE companies (
  id                TEXT PRIMARY KEY,
  razon_social      TEXT NOT NULL,
  ruc               TEXT NOT NULL,
  address           TEXT,
  phone             TEXT,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at_utc    TEXT NOT NULL,
  updated_at_utc    TEXT NOT NULL
);

CREATE TABLE stands (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  location          TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at_utc    TEXT NOT NULL,
  updated_at_utc    TEXT NOT NULL
);

CREATE TABLE responsible_persons (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at_utc    TEXT NOT NULL,
  updated_at_utc    TEXT NOT NULL
);

CREATE TABLE operation_details (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT,
  type              TEXT NOT NULL CHECK (type IN ('income','expense')),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at_utc    TEXT NOT NULL,
  updated_at_utc    TEXT NOT NULL
);

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
