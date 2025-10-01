// Funciones helper para manejo de fechas en zona horaria de Perú
// Basado en las recomendaciones del profesor

/**
 * Convierte un timestamp UTC a business_date en zona horaria de Perú
 * @param isoUtc - Timestamp en formato ISO UTC
 * @returns Business date en formato YYYY-MM-DD (America/Lima)
 */
export function toBusinessDate(isoUtc: string): string {
  return new Date(isoUtc).toLocaleDateString('en-CA', { 
    timeZone: 'America/Lima' 
  });
}

/**
 * Convierte una fecha a business_date en zona horaria de Perú
 * @param date - Objeto Date
 * @returns Business date en formato YYYY-MM-DD (America/Lima)
 */
export function toBusinessDateFromDate(date: Date): string {
  return date.toLocaleDateString('en-CA', { 
    timeZone: 'America/Lima' 
  });
}

/**
 * Crea un timestamp UTC en zona horaria de Perú (evita desfase de días)
 * @param date - Objeto Date
 * @returns Timestamp ISO UTC
 */
export function toPeruISOString(date: Date): string {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  ).toISOString();
}

/**
 * Obtiene la fecha actual en zona horaria de Perú
 * @returns Business date actual en formato YYYY-MM-DD
 */
export function getCurrentBusinessDate(): string {
  return toBusinessDateFromDate(new Date());
}

/**
 * Valida que una fecha esté en formato business_date (YYYY-MM-DD)
 * @param dateStr - String de fecha a validar
 * @returns true si es válido, false si no
 */
export function isValidBusinessDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr + 'T00:00:00');
  return !isNaN(date.getTime());
}
