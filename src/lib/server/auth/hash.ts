// Servicio de hash compatible con Cloudflare Workers
// Usa Web Crypto API en lugar de librerías nativas

// Función para generar salt aleatorio
function generateSalt(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(16));
}

// Función para convertir ArrayBuffer a string base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

// Función para convertir string base64 a ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

// Función para hashear contraseña usando PBKDF2 (compatible con Cloudflare)
export async function hashPassword(password: string): Promise<string> {
	const salt = generateSalt();
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveBits']
	);
	
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: salt,
			iterations: 100000, // 100k iteraciones para seguridad
			hash: 'SHA-256'
		},
		key,
		256 // 256 bits = 32 bytes
	);
	
	// Combinar salt + hash y convertir a base64
	const combined = new Uint8Array(salt.length + derivedBits.byteLength);
	combined.set(salt, 0);
	combined.set(new Uint8Array(derivedBits), salt.length);
	
	return arrayBufferToBase64(combined.buffer);
}

// Función para verificar contraseña
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
	try {
		// Verificar si es el formato nuevo con separadores $
		if (hashedPassword.includes('$')) {
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
					hash: 'SHA-256'
				},
				await crypto.subtle.importKey('raw', passwordBuffer, { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']),
				{ name: 'AES-GCM', length: 256 },
				true,
				['encrypt', 'decrypt']
			);

			const hashBuffer = await crypto.subtle.exportKey('raw', key);
			const newHashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

			return newHashBase64 === storedHashBase64;
		}

		// Formato antiguo (compatibilidad)
		const combined = base64ToArrayBuffer(hashedPassword);
		const salt = new Uint8Array(combined, 0, 16);
		const storedHash = new Uint8Array(combined, 16);
		
		const key = await crypto.subtle.importKey(
			'raw',
			new TextEncoder().encode(password),
			'PBKDF2',
			false,
			['deriveBits']
		);
		
		const derivedBits = await crypto.subtle.deriveBits(
			{
				name: 'PBKDF2',
				salt: salt,
				iterations: 100000,
				hash: 'SHA-256'
			},
			key,
			256
		);
		
		const computedHash = new Uint8Array(derivedBits);
		
		// Comparar hashes de forma segura
		if (storedHash.length !== computedHash.length) {
			return false;
		}
		
		let isEqual = true;
		for (let i = 0; i < storedHash.length; i++) {
			if (storedHash[i] !== computedHash[i]) {
				isEqual = false;
			}
		}
		
		return isEqual;
	} catch (error) {
		console.error('Error verifying password:', error);
		return false;
	}
}
