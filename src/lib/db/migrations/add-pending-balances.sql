-- Migración: Agregar tabla pending_balances
-- Fecha: 2024-01-XX
-- Descripción: Tabla para manejar saldos pendientes entre cajas

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

-- Índices para optimizar consultas
CREATE INDEX idx_pending_balances_cash_box ON pending_balances(cash_box_id);
CREATE INDEX idx_pending_balances_date ON pending_balances(date);
CREATE INDEX idx_pending_balances_status ON pending_balances(status);

-- Índice compuesto para búsquedas eficientes
CREATE INDEX idx_pending_balances_date_status ON pending_balances(date, status);
