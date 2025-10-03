-- Migración: Agregar columna reopen_notes a cash_boxes
-- Fecha: 2024-01-XX
-- Descripción: Columna para almacenar notas de reapertura de cajas

ALTER TABLE cash_boxes ADD COLUMN reopen_notes TEXT;
