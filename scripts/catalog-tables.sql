-- Crear solo las tablas de catálogos que faltan

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
