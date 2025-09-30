// Script simple para generar hash de contraseña
import crypto from 'crypto';

const saltLength = 16;
const iterations = 100000;
const keyLength = 32;
const hashAlgorithm = 'SHA-256';

async function hashPassword(password) {
    const salt = crypto.randomBytes(saltLength);
    const passwordBuffer = Buffer.from(password, 'utf8');

    const key = crypto.pbkdf2Sync(password, salt, iterations, keyLength, hashAlgorithm);

    // Convertir salt y hash a base64 para almacenamiento
    const saltBase64 = salt.toString('base64');
    const hashBase64 = key.toString('base64');

    return `pbkdf2_sha256$${iterations}$${saltBase64}$${hashBase64}`;
}

async function main() {
    const password = 'admin123';
    const hashedPassword = await hashPassword(password);
    
    console.log('Hash generado:', hashedPassword);
    
    // Crear el comando SQL
    const sql = `INSERT INTO users (id, email, password_hash, role, created_at) VALUES ('admin-001', 'admin@chambar.com', '${hashedPassword}', 'admin', ${Date.now()})`;
    
    console.log('\nComando SQL:');
    console.log(sql);
}

main().catch(console.error);
