

CREATE TABLE cash_boxes (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('empty','open','closed','reopened')),
  opening_amount    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (opening_amount >= 0),
  opened_at_utc     TEXT,
  original_opened_at_utc TEXT,
  closed_at_utc     TEXT,
  reopened_at_utc   TEXT,
  reopen_notes      TEXT,
  business_date     TEXT,
  created_at_utc    TEXT NOT NULL,
  updated_at_utc    TEXT NOT NULL
, current_amount NUMERIC(12,2) DEFAULT 0);

CREATE INDEX idx_cash_boxes_business_date ON cash_boxes(business_date);

CREATE INDEX idx_cash_boxes_status ON cash_boxes(status);

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

CREATE TABLE operations (
  id                    TEXT PRIMARY KEY,
  cash_box_id           TEXT NOT NULL REFERENCES cash_boxes(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount                NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description           TEXT NOT NULL,
  operation_detail_id   TEXT,
  responsible_person_id TEXT,
  stand_id              TEXT,
  company_id            TEXT,
  created_at_utc        TEXT NOT NULL,
  updated_at_utc        TEXT NOT NULL,
  business_date         TEXT NOT NULL
, image TEXT, is_reopen_operation BOOLEAN DEFAULT 0, attachments_json TEXT);

CREATE INDEX idx_ops_cashbox ON operations(cash_box_id);

CREATE INDEX idx_ops_business_date ON operations(business_date);

CREATE TABLE pending_balances (
  id                    TEXT PRIMARY KEY,
  cash_box_id           TEXT NOT NULL REFERENCES cash_boxes(id) ON DELETE CASCADE,
  amount                NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date                  TEXT NOT NULL,
  status                TEXT NOT NULL CHECK (status IN ('pending','transferred','returned','handled')),
  notes                 TEXT,
  handled_at_utc        TEXT,
  created_at_utc        TEXT NOT NULL,
  updated_at_utc        TEXT NOT NULL
);

CREATE INDEX idx_pending_balances_cash_box ON pending_balances(cash_box_id);

CREATE INDEX idx_pending_balances_date ON pending_balances(date);

CREATE INDEX idx_pending_balances_status ON pending_balances(status);

CREATE INDEX idx_pending_balances_date_status ON pending_balances(date, status);

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

CREATE TABLE companies (id TEXT PRIMARY KEY, razon_social TEXT NOT NULL, ruc TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')), created_at_utc TEXT NOT NULL, updated_at_utc TEXT NOT NULL);

CREATE TABLE stands (id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')), created_at_utc TEXT NOT NULL, updated_at_utc TEXT NOT NULL);

CREATE TABLE responsible_persons (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')), created_at_utc TEXT NOT NULL, updated_at_utc TEXT NOT NULL);

CREATE TABLE operation_details (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, type TEXT NOT NULL CHECK (type IN ('income','expense')), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')), created_at_utc TEXT NOT NULL, updated_at_utc TEXT NOT NULL);
