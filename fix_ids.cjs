
const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'src', 'lib', 'services');
const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('-service.ts') && f !== 'attachments-service.ts');

for (const file of files) {
    const filePath = path.join(servicesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Pattern to find crypto.randomUUID() inside INSERT arrays
    // e.g. [crypto.randomUUID(), data.name, ...]
    if (content.includes('crypto.randomUUID()')) {
        // We replace the execution with explicit id extraction
        // find: return await executeMutation(
        // replace with: const id = crypto.randomUUID();\n\tconst result = await executeMutation(
        // and find: [crypto.randomUUID(),
        // replace with: [id,
        // and find: );\n} (at the end of create function)
        // replace with: );\n\treturn { ...result, id };\n}
        
        let newContent = content;
        
        // This is tricky with regex, let's just do it string manipulation if possible, or simple regex
        newContent = newContent.replace(/return\s+await\s+executeMutation\(\s*db,\s*'INSERT INTO/g, 'const id = crypto.randomUUID();\n\tconst result = await executeMutation(\n\t\tdb,\n\t\t\\'INSERT INTO');
        newContent = newContent.replace(/\[crypto\.randomUUID\(\),/g, '[id,');
        
        // Now find the end of that executeMutation call to return the result
        // It's usually \t);\n}
        newContent = newContent.replace(/\]\n\t\);\n\}/g, ']\\n\t);\\n\treturn { ...result, id };\\n}');
        
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed', file);
    }
}
