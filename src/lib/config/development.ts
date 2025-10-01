// Configuración para desarrollo local
export const DEV_CONFIG = {
	// Simular servicios de Cloudflare
	R2_PUBLIC_DOMAIN: 'localhost:5173',
	CLOUDFLARE_ACCOUNT_HASH: 'dev-account-hash',
	
	// Cache settings
	CACHE_MAX_SIZE: 10 * 1024 * 1024, // 10MB para desarrollo
	CACHE_MAX_AGE: 60 * 60 * 1000, // 1 hora para desarrollo
	
	// Compression settings
	COMPRESSION_ENABLED: true,
	COMPRESSION_QUALITY: 0.8,
	COMPRESSION_MAX_WIDTH: 1920,
	COMPRESSION_MAX_HEIGHT: 1080,
	COMPRESSION_MAX_SIZE_KB: 500,
	
	// Thumbnail settings
	THUMBNAIL_ENABLED: true,
	THUMBNAIL_WIDTH: 300,
	THUMBNAIL_HEIGHT: 200,
	THUMBNAIL_QUALITY: 80,
	THUMBNAIL_FORMAT: 'webp' as const,
	
	// Lazy loading settings
	LAZY_LOADING_ENABLED: true,
	LAZY_LOADING_ROOT_MARGIN: '50px',
	LAZY_LOADING_THRESHOLD: 0.1,
	
	// Debug settings
	DEBUG_MODE: true,
	LOG_COMPRESSION_STATS: true,
	LOG_CACHE_STATS: true,
	LOG_THUMBNAIL_GENERATION: true
};

// Función para obtener configuración según el entorno
export function getConfig(platform?: App.Platform) {
	if (platform?.env) {
		// Producción - usar variables de entorno reales
		return {
			R2_PUBLIC_DOMAIN: platform.env.R2_PUBLIC_DOMAIN || 'localhost:5173',
			CLOUDFLARE_ACCOUNT_HASH: platform.env.CLOUDFLARE_ACCOUNT_HASH || 'dev-account-hash',
			CACHE_MAX_SIZE: parseInt(platform.env.CACHE_MAX_SIZE || '52428800'),
			CACHE_MAX_AGE: parseInt(platform.env.CACHE_MAX_AGE || '86400000'),
			COMPRESSION_ENABLED: platform.env.COMPRESSION_ENABLED !== 'false',
			COMPRESSION_QUALITY: parseFloat(platform.env.COMPRESSION_QUALITY || '0.8'),
			COMPRESSION_MAX_WIDTH: parseInt(platform.env.COMPRESSION_MAX_WIDTH || '1920'),
			COMPRESSION_MAX_HEIGHT: parseInt(platform.env.COMPRESSION_MAX_HEIGHT || '1080'),
			COMPRESSION_MAX_SIZE_KB: parseInt(platform.env.COMPRESSION_MAX_SIZE_KB || '500'),
			THUMBNAIL_ENABLED: platform.env.THUMBNAIL_ENABLED !== 'false',
			THUMBNAIL_WIDTH: parseInt(platform.env.THUMBNAIL_WIDTH || '300'),
			THUMBNAIL_HEIGHT: parseInt(platform.env.THUMBNAIL_HEIGHT || '200'),
			THUMBNAIL_QUALITY: parseInt(platform.env.THUMBNAIL_QUALITY || '80'),
			THUMBNAIL_FORMAT: (platform.env.THUMBNAIL_FORMAT || 'webp') as 'webp' | 'jpeg' | 'png',
			LAZY_LOADING_ENABLED: platform.env.LAZY_LOADING_ENABLED !== 'false',
			LAZY_LOADING_ROOT_MARGIN: platform.env.LAZY_LOADING_ROOT_MARGIN || '50px',
			LAZY_LOADING_THRESHOLD: parseFloat(platform.env.LAZY_LOADING_THRESHOLD || '0.1'),
			DEBUG_MODE: platform.env.DEBUG_MODE === 'true',
			LOG_COMPRESSION_STATS: platform.env.LOG_COMPRESSION_STATS === 'true',
			LOG_CACHE_STATS: platform.env.LOG_CACHE_STATS === 'true',
			LOG_THUMBNAIL_GENERATION: platform.env.LOG_THUMBNAIL_GENERATION === 'true'
		};
	}
	
	// Desarrollo - usar configuración local
	return DEV_CONFIG;
}
