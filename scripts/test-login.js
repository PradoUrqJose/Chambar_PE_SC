// Script para probar el login en producción

const PRODUCTION_URL = 'https://a150e203.chambar.pages.dev';

async function testLogin() {
    try {
        console.log('🧪 Probando login en producción...');
        
        // Crear FormData
        const formData = new URLSearchParams();
        formData.append('email', 'admin@chambar.com');
        formData.append('password', 'admin123');
        
        // Hacer la petición de login
        const response = await fetch(`${PRODUCTION_URL}/login?/login`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            redirect: 'manual' // No seguir redirecciones automáticamente
        });
        
        console.log('📊 Status:', response.status);
        console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.status === 302) {
            const location = response.headers.get('location');
            console.log('✅ Redirección detectada a:', location);
            
            if (location === '/dashboard') {
                console.log('🎉 ¡LOGIN EXITOSO!');
            } else {
                console.log('❌ Redirección incorrecta');
            }
        } else {
            const text = await response.text();
            console.log('📄 Respuesta:', text.substring(0, 500));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testLogin();
