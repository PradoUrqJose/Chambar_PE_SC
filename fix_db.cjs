const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const servicesDir = path.join(__dirname, 'src', 'lib', 'services');

const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('-service.ts'));

for (const file of files) {
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix column names
  content = content.replace(/ORDER BY created_at/g, 'ORDER BY created_at_utc');
  content = content.replace(/updated_at =/g, 'updated_at_utc =');

  // Add crypto import if needed
  if (content.includes('INSERT INTO') && !content.includes('crypto')) {
    content = 'import { crypto } from "@@cloudflare/workers-types";\n' + content; // Actually, we can use standard crypto in D1 or just JS crypto.randomUUID()
    // SvelteKit exposes standard web crypto globally. We don't need to import it.
  }

  // Fix Companies
  content = content.replace(
    /'INSERT INTO companies \(razon_social, ruc\) VALUES \(\?, \?\)',\s*\[data\.razonSocial, data\.ruc\]/g,
    `'INSERT INTO companies (id, razon_social, ruc, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?)',
		[crypto.randomUUID(), data.razonSocial, data.ruc, new Date().toISOString(), new Date().toISOString()]`
  );

  // Fix Stands
  content = content.replace(
    /'INSERT INTO stands \(name, location, status\) VALUES \(\?, \?, \?\)',\s*\[data\.name, data\.location, data\.status \|\| 'active'\]/g,
    `'INSERT INTO stands (id, name, location, status, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?, ?)',
		[crypto.randomUUID(), data.name, data.location, data.status || 'active', new Date().toISOString(), new Date().toISOString()]`
  );

  // Fix Responsible Persons
  content = content.replace(
    /'INSERT INTO responsible_persons \(name, email, phone\) VALUES \(\?, \?, \?\)',\s*\[data\.name, data\.email, data\.phone\]/g,
    `'INSERT INTO responsible_persons (id, name, email, phone, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?, ?)',
		[crypto.randomUUID(), data.name, data.email, data.phone || null, new Date().toISOString(), new Date().toISOString()]`
  );

  // Fix Operation Details
  content = content.replace(
    /'INSERT INTO operation_details \(name, type, category\) VALUES \(\?, \?, \?\)',\s*\[data\.name, data\.type, data\.category\]/g,
    `'INSERT INTO operation_details (id, name, type, description, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?, ?)',
		[crypto.randomUUID(), data.name, data.type, data.category || '', new Date().toISOString(), new Date().toISOString()]`
  );

  // Fix Cash Boxes
  content = content.replace(
    /'INSERT INTO cash_boxes \(name, business_date\) VALUES \(\?, \?\)',\s*\[data\.name, data\.businessDate\]/g,
    `'INSERT INTO cash_boxes (id, name, status, business_date, created_at_utc, updated_at_utc) VALUES (?, ?, 'empty', ?, ?, ?)',
		[crypto.randomUUID(), data.name, data.businessDate, new Date().toISOString(), new Date().toISOString()]`
  );

  // Fix Operations
  content = content.replace(
    /'INSERT INTO operations \(type, amount, description, cash_box_id, operation_detail_id, responsible_person_id,\s*stand_id\) VALUES \(\?, \?, \?, \?, \?, \?, \?\)',\s*\[data\.type, data\.amount, data\.description, data\.cashBoxId, data\.operationDetailId, data\.responsiblePersonId, data\.standId\]/g,
    `'INSERT INTO operations (id, type, amount, description, cash_box_id, operation_detail_id, responsible_person_id, stand_id, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
		[crypto.randomUUID(), data.type, data.amount, data.description, data.cashBoxId, data.operationDetailId, data.responsiblePersonId, data.standId, new Date().toISOString(), new Date().toISOString()]`
  );

  fs.writeFileSync(filePath, content);
}

console.log("Fixes applied successfully.");
