// Script para crear usuario admin en D1
import { hashPassword } from '../src/lib/server/auth/hash.js';

async function createAdmin() {
    try {
        const password = 'admin123';
        const hashedPassword = await hashPassword(password);
        
        console.log('Hash generado:', hashedPassword);
        
        // Crear el comando SQL
        const sql = `INSERT INTO users (id, email, password_hash, role, created_at) VALUES ('admin-001', 'admin@chambar.com', '${hashedPassword}', 'admin', ${Date.now()})`;
        
        console.log('Comando SQL:');
        console.log(sql);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

createAdmin();
