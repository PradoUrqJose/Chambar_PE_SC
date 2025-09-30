import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Tabla de usuarios
// Esta tabla almacena la información de los usuarios del sistema
export const users = sqliteTable('users', {
	// ID único del usuario (UUID generado por Lucia)
	id: text('id').primaryKey(),
	
	// Email único del usuario (usado para login)
	email: text('email').notNull().unique(),
	
	// Hash de la contraseña (nunca almacenamos contraseñas en texto plano)
	passwordHash: text('password_hash').notNull(),
	
	// Rol del usuario: 'admin' o 'cashier'
	role: text('role', { enum: ['admin', 'cashier'] }).notNull().default('cashier'),
	
	// Fecha de creación del usuario
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(unixepoch('now') * 1000)`),
});

// Tabla de sesiones
// Esta tabla almacena las sesiones activas de los usuarios
export const sessions = sqliteTable('sessions', {
	// ID único de la sesión (generado por Lucia)
	id: text('id').primaryKey(),
	
	// ID del usuario al que pertenece esta sesión
	userId: text('user_id').notNull().references(() => users.id, {
		// Si se elimina el usuario, se eliminan sus sesiones
		onDelete: 'cascade'
	}),
	
	// Fecha de expiración de la sesión
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
});

// Tabla de cajas administrativas
// Esta tabla controla el estado de las cajas diarias (abierta/cerrada)
export const cashBoxes = sqliteTable('cash_boxes', {
	// ID único de la caja
	id: text('id').primaryKey(),
	
	// Fecha de la caja (YYYY-MM-DD)
	date: text('date').notNull(),
	
	// Estado de la caja: 'open', 'closed', 'edited'
	status: text('status', { enum: ['open', 'closed', 'edited'] }).notNull().default('open'),
	
	// Usuario que abrió la caja
	openedBy: text('opened_by').notNull().references(() => users.id),
	
	// Usuario que cerró la caja (puede ser null si está abierta)
	closedBy: text('closed_by').references(() => users.id),
	
	// Monto inicial de la caja (en centavos para evitar decimales)
	initialAmount: integer('initial_amount').notNull().default(0),
	
	// Monto final de la caja (en centavos)
	finalAmount: integer('final_amount'),
	
	// Observaciones de apertura
	openingNotes: text('opening_notes'),
	
	// Observaciones de cierre
	closingNotes: text('closing_notes'),
	
	// Fecha y hora de apertura
	openedAt: integer('opened_at', { mode: 'timestamp_ms' }).notNull(),
	
	// Fecha y hora de cierre (puede ser null si está abierta)
	closedAt: integer('closed_at', { mode: 'timestamp_ms' }),
	
	// Flag para marcar si la caja fue editada retroactivamente
	editedFlag: integer('edited_flag', { mode: 'boolean' }).notNull().default(false),
	
	// Fecha de creación del registro
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(unixepoch('now') * 1000)`),
});

// Tabla de detalles de operación (catálogo)
// Esta tabla contiene los tipos de operaciones disponibles
export const operationDetails = sqliteTable('operation_details', {
	// ID único del detalle
	id: text('id').primaryKey(),
	
	// Nombre del detalle (ej: "Venta de productos", "Gasto de oficina")
	name: text('name').notNull(),
	
	// Descripción del detalle
	description: text('description'),
	
	// Tipo de operación: 'income' (ingreso) o 'expense' (egreso)
	type: text('type', { enum: ['income', 'expense'] }).notNull(),
	
	// Si está activo o no
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	
	// Fecha de creación
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(unixepoch('now') * 1000)`),
});

// Tabla de responsables
// Esta tabla contiene las personas responsables de las operaciones
export const responsiblePersons = sqliteTable('responsible_persons', {
	// ID único del responsable
	id: text('id').primaryKey(),
	
	// Nombre del responsable
	name: text('name').notNull(),
	
	// Email del responsable (opcional)
	email: text('email'),
	
	// Teléfono del responsable (opcional)
	phone: text('phone'),
	
	// Si está activo o no
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	
	// Fecha de creación
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(unixepoch('now') * 1000)`),
});

// Tabla de stands/ubicaciones
// Esta tabla contiene las ubicaciones donde se realizan las operaciones
export const stands = sqliteTable('stands', {
	// ID único del stand
	id: text('id').primaryKey(),
	
	// Nombre del stand
	name: text('name').notNull(),
	
	// Descripción del stand
	description: text('description'),
	
	// Ubicación física del stand
	location: text('location'),
	
	// Si está activo o no
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	
	// Fecha de creación
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(unixepoch('now') * 1000)`),
});

// Tabla de empresas
// Esta tabla contiene las empresas/clientes relacionados con las operaciones
export const companies = sqliteTable('companies', {
	// ID único de la empresa
	id: text('id').primaryKey(),
	
	// Nombre de la empresa
	name: text('name').notNull(),
	
	// RUC de la empresa (opcional)
	ruc: text('ruc'),
	
	// Dirección de la empresa
	address: text('address'),
	
	// Teléfono de la empresa
	phone: text('phone'),
	
	// Email de la empresa
	email: text('email'),
	
	// Si está activo o no
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	
	// Fecha de creación
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(unixepoch('now') * 1000)`),
});

// Tabla de operaciones (ingresos y egresos)
// Esta tabla registra todas las operaciones de caja
export const operations = sqliteTable('operations', {
	// ID único de la operación
	id: text('id').primaryKey(),
	
	// ID de la caja a la que pertenece
	cashBoxId: text('cash_box_id').notNull().references(() => cashBoxes.id),
	
	// Tipo de operación: 'income' (ingreso) o 'expense' (egreso)
	type: text('type', { enum: ['income', 'expense'] }).notNull(),
	
	// Monto de la operación (en centavos)
	amount: integer('amount').notNull(),
	
	// Moneda (por defecto PEN - Soles)
	currency: text('currency').notNull().default('PEN'),
	
	// ID del detalle de operación
	operationDetailId: text('operation_detail_id').notNull().references(() => operationDetails.id),
	
	// ID del responsable
	responsibleId: text('responsible_id').notNull().references(() => responsiblePersons.id),
	
	// ID del stand
	standId: text('stand_id').notNull().references(() => stands.id),
	
	// ID de la empresa (opcional)
	companyId: text('company_id').references(() => companies.id),
	
	// Descripción de la operación
	description: text('description'),
	
	// Número de voucher (opcional)
	voucherNumber: text('voucher_number'),
	
	// Método de pago: 'cash', 'card', 'transfer', 'check'
	paymentMethod: text('payment_method', { 
		enum: ['cash', 'card', 'transfer', 'check'] 
	}).notNull().default('cash'),
	
	// Si está activo o no
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	
	// Fecha y hora de la operación
	operationDate: integer('operation_date', { mode: 'timestamp_ms' }).notNull(),
	
	// Fecha de creación del registro
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(unixepoch('now') * 1000)`),
});

// Exportar tipos para TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type CashBox = typeof cashBoxes.$inferSelect;
export type NewCashBox = typeof cashBoxes.$inferInsert;
export type OperationDetail = typeof operationDetails.$inferSelect;
export type NewOperationDetail = typeof operationDetails.$inferInsert;
export type ResponsiblePerson = typeof responsiblePersons.$inferSelect;
export type NewResponsiblePerson = typeof responsiblePersons.$inferInsert;
export type Stand = typeof stands.$inferSelect;
export type NewStand = typeof stands.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Operation = typeof operations.$inferSelect;
export type NewOperation = typeof operations.$inferInsert;


