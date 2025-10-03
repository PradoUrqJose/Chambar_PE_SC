-- Solo las tablas principales que necesitan ser recreadas

-- Tabla de cajas (esquema que espera el código)
CREATE TABLE cash_boxes (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('empty','open','closed','reopened')),
  opening_amount    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (opening_amount >= 0),
  opened_at         TEXT,                     -- ISO UTC (nullable si 'empty')
  original_opened_at TEXT,                    -- primera apertura (nullable)
  closed_at         TEXT,                     -- nullable
  reopened_at       TEXT,                     -- nullable (última reapertura)
  business_date     TEXT,                     -- 'YYYY-MM-DD' en America/Lima (nullable si 'empty')
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE INDEX idx_cash_boxes_business_date ON cash_boxes(business_date);
CREATE INDEX idx_cash_boxes_status ON cash_boxes(status);

-- Tabla de operaciones (esquema que espera el código)
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
  created_at            TEXT NOT NULL,     -- evento
  updated_at            TEXT NOT NULL,
  business_date         TEXT NOT NULL      -- 'YYYY-MM-DD' (America/Lima) calculado al crear
);

CREATE INDEX idx_ops_cashbox ON operations(cash_box_id);
CREATE INDEX idx_ops_business_date ON operations(business_date);
