// Script final para arreglar el hash del admin
import { execSync } from 'child_process';

const correctHash = 'pbkdf2_sha256$100000$DjZ2vHy1lFzlQLJ1jNqi1A==$5SL11EbChHrBJZQVfd/7KCFw4Qkj0nk44cuzlaMKhV0=';

console.log('Hash correcto:', correctHash);

// Usar comillas simples y escapar correctamente
const sqlCommand = `UPDATE users SET password_hash = '${correctHash.replace(/'/g, "''")}' WHERE email = 'admin@chambar.com'`;

console.log('Comando SQL:', sqlCommand);

try {
    const result = execSync(`npx wrangler d1 execute chambar-db --command="${sqlCommand}" --remote`, { 
        encoding: 'utf8',
        stdio: 'inherit'
    });
    console.log('✅ Hash actualizado correctamente');
} catch (error) {
    console.error('❌ Error:', error.message);
}
