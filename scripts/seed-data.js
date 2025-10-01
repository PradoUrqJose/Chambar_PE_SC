import { execSync } from 'child_process';

console.log('🌱 Sembrando datos iniciales...');

try {
	// Crear caja principal
	execSync('wrangler d1 execute chambar-dev --command "INSERT INTO cash_boxes (name, status) VALUES (\'Caja Principal\', \'closed\')"', { stdio: 'inherit' });
	console.log('✅ Caja Principal creada');

	// Crear stands de ejemplo
	execSync('wrangler d1 execute chambar-dev --command "INSERT INTO stands (name, location, status) VALUES (\'Stand A\', \'Zona Norte\', \'active\')"', { stdio: 'inherit' });
	execSync('wrangler d1 execute chambar-dev --command "INSERT INTO stands (name, location, status) VALUES (\'Stand B\', \'Zona Sur\', \'active\')"', { stdio: 'inherit' });
	console.log('✅ Stands creados');

	// Crear personas responsables
	execSync('wrangler d1 execute chambar-dev --command "INSERT INTO responsible_persons (name, email, phone) VALUES (\'Juan Pérez\', \'juan@example.com\', \'999888777\')"', { stdio: 'inherit' });
	execSync('wrangler d1 execute chambar-dev --command "INSERT INTO responsible_persons (name, email, phone) VALUES (\'María García\', \'maria@example.com\', \'999888666\')"', { stdio: 'inherit' });
	console.log('✅ Personas responsables creadas');

	// Crear detalles de operación
	execSync('wrangler d1 execute chambar-dev --command "INSERT INTO operation_details (name, type, category) VALUES (\'Venta de productos\', \'income\', \'ventas\')"', { stdio: 'inherit' });
	execSync('wrangler d1 execute chambar-dev --command "INSERT INTO operation_details (name, type, category) VALUES (\'Pago a proveedor\', \'expense\', \'compras\')"', { stdio: 'inherit' });
	console.log('✅ Detalles de operación creados');

	console.log('🎉 ¡Datos iniciales sembrados correctamente!');
} catch (error) {
	console.error('❌ Error sembrando datos:', error.message);
	process.exit(1);
}
