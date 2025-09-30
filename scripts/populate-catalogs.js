// Script para poblar catálogos en D1
import { generateId } from 'lucia';

const catalogs = {
    operationDetails: [
        { name: 'Venta de productos', description: 'Venta de productos del stand', type: 'sale', active: true },
        { name: 'Servicios', description: 'Prestación de servicios', type: 'service', active: true },
        { name: 'Alquiler de espacio', description: 'Alquiler de espacio del stand', type: 'rental', active: true },
        { name: 'Otros', description: 'Otras operaciones', type: 'other', active: true }
    ],
    responsiblePersons: [
        { name: 'Juan Pérez', position: 'Encargado', active: true },
        { name: 'María García', position: 'Supervisora', active: true },
        { name: 'Carlos López', position: 'Gerente', active: true }
    ],
    stands: [
        { name: 'Stand A1', location: 'Zona Norte', active: true },
        { name: 'Stand B2', location: 'Zona Sur', active: true },
        { name: 'Stand C3', location: 'Zona Central', active: true }
    ],
    companies: [
        { 
            name: 'Empresa Demo S.A.C.', 
            ruc: '20123456789', 
            address: 'Av. Principal 123', 
            contactPerson: 'Ana Torres', 
            phone: '987654321', 
            email: 'contacto@empresademo.com',
            active: true 
        },
        { 
            name: 'Comercial ABC S.R.L.', 
            ruc: '20987654321', 
            address: 'Jr. Comercio 456', 
            contactPerson: 'Luis Mendoza', 
            phone: '987123456', 
            email: 'ventas@comercialabc.com',
            active: true 
        }
    ]
};

function generateSQL() {
    let sql = '';
    
    // Operation Details
    catalogs.operationDetails.forEach(item => {
        const id = generateId(15);
        sql += `INSERT INTO operation_details (id, name, description, type, active, created_at) VALUES ('${id}', '${item.name}', '${item.description}', '${item.type}', ${item.active ? 1 : 0}, ${Date.now()});\n`;
    });
    
    // Responsible Persons
    catalogs.responsiblePersons.forEach(item => {
        const id = generateId(15);
        sql += `INSERT INTO responsible_persons (id, name, position, active, created_at) VALUES ('${id}', '${item.name}', '${item.position}', ${item.active ? 1 : 0}, ${Date.now()});\n`;
    });
    
    // Stands
    catalogs.stands.forEach(item => {
        const id = generateId(15);
        sql += `INSERT INTO stands (id, name, location, active, created_at) VALUES ('${id}', '${item.name}', '${item.location}', ${item.active ? 1 : 0}, ${Date.now()});\n`;
    });
    
    // Companies
    catalogs.companies.forEach(item => {
        const id = generateId(15);
        sql += `INSERT INTO companies (id, name, ruc, address, contact_person, phone, email, active, created_at) VALUES ('${id}', '${item.name}', '${item.ruc}', '${item.address}', '${item.contactPerson}', '${item.phone}', '${item.email}', ${item.active ? 1 : 0}, ${Date.now()});\n`;
    });
    
    return sql;
}

const sql = generateSQL();
console.log('SQL para poblar catálogos:');
console.log(sql);
