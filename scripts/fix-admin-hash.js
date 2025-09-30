// Script para arreglar el hash del admin en D1
import { execSync } from 'child_process';

const correctHash = 'pbkdf2_sha256$100000$RD+BOgmzvw8ifxY9EGqaLg==$B25mh7sILKn+iufsuqOup6MEpG5LYEqknIecR//gGQM=';

console.log('Hash correcto:', correctHash);

// Crear el comando SQL con escape correcto
const sqlCommand = `UPDATE users SET password_hash = '${correctHash}' WHERE email = 'admin@chambar.com'`;

console.log('Comando SQL:', sqlCommand);

// Ejecutar el comando
try {
    const result = execSync(`npx wrangler d1 execute chambar-db --command="${sqlCommand}" --remote`, { 
        encoding: 'utf8',
        stdio: 'inherit'
    });
    console.log('✅ Hash actualizado correctamente');
} catch (error) {
    console.error('❌ Error:', error.message);
}
