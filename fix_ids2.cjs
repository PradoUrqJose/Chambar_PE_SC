
const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'src', 'lib', 'services');
const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('-service.ts') && f !== 'attachments-service.ts');

for (const file of files) {
    const filePath = path.join(servicesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('crypto.randomUUID()')) {
        let newContent = content;
        
        newContent = newContent.replace(/return\s+await\s+executeMutation\(\s*db,\s*'INSERT INTO/g, 'const id = crypto.randomUUID();\n\tconst result = await executeMutation(\n\t\tdb,\n\t\t\\'INSERT INTO');
        newContent = newContent.replace(/\[crypto\.randomUUID\(\),/g, '[id,');
        
        // Fix the end of the create function
        newContent = newContent.replace(/\]\s*\);\s*\}/g, ']\n\t);\n\n\treturn { ...result, id };\n}');
        
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed', file);
    }
}
