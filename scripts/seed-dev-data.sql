-- Script para poblar la base de datos de desarrollo
-- Inserta datos iniciales para testing

-- Usuario admin
INSERT INTO users (id, email, password_hash, role, created_at) VALUES 
('admin-dev-001', 'admin@chambar.com', 'pbkdf2_sha256$100000$BOgmzvw8ifxY9EGqaLg==$iufsuqOup6MEpG5LYEqknIecR//gGQM=', 'admin', unixepoch('now') * 1000);

-- Detalles de operación
INSERT INTO operation_details (id, name, description, type, active, created_at) VALUES 
('detail-001', 'Venta de productos', 'Ventas generales de productos', 'income', 1, unixepoch('now') * 1000),
('detail-002', 'Servicios prestados', 'Servicios diversos prestados', 'income', 1, unixepoch('now') * 1000),
('detail-003', 'Gasto de oficina', 'Gastos administrativos y de oficina', 'expense', 1, unixepoch('now') * 1000),
('detail-004', 'Compra de materiales', 'Compra de materiales e insumos', 'expense', 1, unixepoch('now') * 1000);

-- Responsables
INSERT INTO responsible_persons (id, name, email, phone, active, created_at) VALUES 
('person-001', 'Administrador', 'admin@chambar.com', '+51 999 999 999', 1, unixepoch('now') * 1000),
('person-002', 'Cajero Principal', 'cajero@chambar.com', '+51 999 999 998', 1, unixepoch('now') * 1000);

-- Stands
INSERT INTO stands (id, name, description, location, active, created_at) VALUES 
('stand-001', 'Stand Principal', 'Stand principal de ventas', 'Planta baja', 1, unixepoch('now') * 1000),
('stand-002', 'Stand Secundario', 'Stand secundario de ventas', 'Planta alta', 1, unixepoch('now') * 1000);

-- Empresas
INSERT INTO companies (id, name, ruc, address, phone, email, active, created_at) VALUES 
('company-001', 'Cliente General', '20123456789', 'Lima, Perú', '+51 1 234 5678', 'cliente@general.com', 1, unixepoch('now') * 1000),
('company-002', 'Empresa ABC S.A.C.', '20567890123', 'Av. Principal 123, Lima', '+51 1 345 6789', 'contacto@empresaabc.com', 1, unixepoch('now') * 1000);

-- Caja de desarrollo (abierta)
INSERT INTO cash_boxes (id, date, status, opened_by, initial_amount, opening_notes, opened_at, created_at) VALUES 
('cashbox-dev-001', date('now'), 'open', 'admin-dev-001', 10000, 'Caja de desarrollo abierta', unixepoch('now') * 1000, unixepoch('now') * 1000);
