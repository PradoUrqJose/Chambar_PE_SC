// Script para debuggear la verificación de contraseñas
import crypto from 'crypto';

const saltLength = 16;
const iterations = 100000;
const keyLength = 32;
const hashAlgorithm = 'SHA-256';

async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(saltLength));
    const passwordBuffer = new TextEncoder().encode(password);

    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: iterations,
            hash: hashAlgorithm
        },
        await crypto.subtle.importKey('raw', passwordBuffer, { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']),
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    const hashBuffer = await crypto.subtle.exportKey('raw', key);

    const saltBase64 = Buffer.from(salt).toString('base64');
    const hashBase64 = Buffer.from(new Uint8Array(hashBuffer)).toString('base64');

    return `pbkdf2_sha256$${iterations}$${saltBase64}$${hashBase64}`;
}

async function verifyPassword(password, hashedPassword) {
    const parts = hashedPassword.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') {
        console.error('Formato de hash de contraseña inválido');
        return false;
    }

    const storedIterations = parseInt(parts[1]);
    const storedSaltBase64 = parts[2];
    const storedHashBase64 = parts[3];

    const salt = Uint8Array.from(atob(storedSaltBase64), c => c.charCodeAt(0));
    const passwordBuffer = new TextEncoder().encode(password);

    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: storedIterations,
            hash: hashAlgorithm
        },
        await crypto.subtle.importKey('raw', passwordBuffer, { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']),
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    const hashBuffer = await crypto.subtle.exportKey('raw', key);
    const newHashBase64 = Buffer.from(new Uint8Array(hashBuffer)).toString('base64');

    return newHashBase64 === storedHashBase64;
}

async function testPassword() {
    const password = 'admin123';
    console.log('🔐 Probando contraseña:', password);
    
    // Generar nuevo hash
    const newHash = await hashPassword(password);
    console.log('🔑 Hash generado:', newHash);
    
    // Verificar con el hash de la base de datos
    const dbHash = 'pbkdf2_sha256$100000$DjZ2vHy1lFzlQLJ1jNqi1A==$5SL11EbChHrBJZQVfd/7KCFw4Qkj0nk44cuzlaMKhV0=';
    console.log('🗄️ Hash en BD:', dbHash);
    
    const isValid = await verifyPassword(password, dbHash);
    console.log('✅ Verificación:', isValid);
    
    // Probar con el hash generado
    const isValidNew = await verifyPassword(password, newHash);
    console.log('✅ Verificación con hash nuevo:', isValidNew);
}

testPassword();
