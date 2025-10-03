-- Datos iniciales para producción
-- Empresas
INSERT INTO companies (id, razonSocial, ruc, address, phone, status, createdAt, updatedAt) VALUES
('company-prod-1', 'EMPRESA DEMO S.A.C.', '20123456789', 'Av. Principal 123', '987654321', 'active', datetime('now'), datetime('now')),
('company-prod-2', 'NEGOCIOS EJEMPLO S.R.L.', '20987654321', 'Jr. Comercial 456', '987654322', 'active', datetime('now'), datetime('now'));

-- Stands
INSERT INTO stands (id, name, location, status, createdAt, updatedAt) VALUES
('stand-prod-1', 'Stand Principal', 'Zona A - Puesto 1', 'active', datetime('now'), datetime('now')),
('stand-prod-2', 'Stand Secundario', 'Zona B - Puesto 5', 'active', datetime('now'), datetime('now'));

-- Responsables
INSERT INTO responsible_persons (id, name, email, phone, status, createdAt, updatedAt) VALUES
('person-prod-1', 'Juan Pérez', 'juan@empresa.com', '987654321', 'active', datetime('now'), datetime('now')),
('person-prod-2', 'María García', 'maria@empresa.com', '987654322', 'active', datetime('now'), datetime('now'));

-- Detalles de operación
INSERT INTO operation_details (id, name, description, type, status, createdAt, updatedAt) VALUES
('detail-prod-1', 'Venta de Productos', 'Venta directa de productos al público', 'income', 'active', datetime('now'), datetime('now')),
('detail-prod-2', 'Gastos Operativos', 'Gastos generales de operación', 'expense', 'active', datetime('now'), datetime('now')),
('detail-prod-3', 'Servicios', 'Prestación de servicios', 'income', 'active', datetime('now'), datetime('now'));
