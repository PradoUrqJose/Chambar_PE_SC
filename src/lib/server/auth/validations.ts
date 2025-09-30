// Validaciones para autenticación usando Zod
// Zod nos ayuda a validar datos de entrada de forma segura

import { z } from 'zod';

// Esquema para validar datos de login
export const loginSchema = z.object({
	email: z
		.string()
		.min(1, 'El email es requerido')
		.email('Formato de email inválido')
		.toLowerCase()
		.trim(),
	password: z
		.string()
		.min(1, 'La contraseña es requerida')
		.min(6, 'La contraseña debe tener al menos 6 caracteres')
});

// Esquema para validar datos de registro (futuro)
export const registerSchema = z.object({
	email: z
		.string()
		.min(1, 'El email es requerido')
		.email('Formato de email inválido')
		.toLowerCase()
		.trim(),
	password: z
		.string()
		.min(6, 'La contraseña debe tener al menos 6 caracteres')
		.max(100, 'La contraseña es demasiado larga'),
	confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
	message: 'Las contraseñas no coinciden',
	path: ['confirmPassword']
});

// Esquema para validar cambio de contraseña (futuro)
export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
	newPassword: z
		.string()
		.min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
		.max(100, 'La nueva contraseña es demasiado larga'),
	confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
	message: 'Las contraseñas no coinciden',
	path: ['confirmNewPassword']
});

// Tipos inferidos de los esquemas (para TypeScript)
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
