-- Esquema final que coincide EXACTAMENTE con el código de la aplicación

-- Tabla de empresas (esquema que usa el código)
CREATE TABLE companies (
  id                TEXT PRIMARY KEY,
  razon_social      TEXT NOT NULL,
  ruc               TEXT NOT NULL UNIQUE,
  address           TEXT,
  phone             TEXT,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

-- Tabla de stands (esquema que usa el código)
CREATE TABLE stands (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  location          TEXT,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

-- Tabla de responsables (esquema que usa el código)
CREATE TABLE responsible_persons (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

-- Tabla de detalles de operación (esquema que usa el código)
CREATE TABLE operation_details (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT,
  type              TEXT NOT NULL CHECK (type IN ('income','expense')),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
