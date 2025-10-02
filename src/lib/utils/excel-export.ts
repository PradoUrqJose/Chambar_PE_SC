// ============================================================================
// UTILIDADES PARA EXPORTACIÓN A EXCEL
// ============================================================================

import * as XLSX from 'xlsx';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface Column {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'email' | 'phone' | 'date' | 'custom';
  badgeConfig?: {
    values: Record<string, { text: string; class: string }>;
  };
  formatter?: (value: any, item: any) => string;
  width?: string;
}

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  numberFormat?: string;
  customStyles?: {
    headerStyle?: any;
    dataStyle?: any;
  };
}

export interface SheetData {
  name: string;
  data: any[];
  columns: Column[];
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Formatea un valor según el tipo de columna
 */
export function formatValue(value: any, column: Column, item: any): string {
  if (column.formatter) {
    return column.formatter(value, item);
  }

  switch (column.type) {
    case 'date':
      return value ? new Date(value).toLocaleDateString('es-PE') : '';
    case 'badge':
      if (column.badgeConfig && value) {
        const config = column.badgeConfig.values[value];
        return config ? config.text : value;
      }
      return value || '';
    case 'email':
    case 'phone':
    case 'text':
    default:
      return value || '';
    }
}

/**
 * Formatea datos para Excel
 */
export function formatDataForExcel(data: any[], columns: Column[], includeHeaders: boolean = true): any[][] {
  const result: any[][] = [];

  // Agregar encabezados si está habilitado
  if (includeHeaders) {
    const headers = columns.map(col => col.label);
    result.push(headers);
  }

  // Agregar datos
  data.forEach(item => {
    const row = columns.map(column => {
      const value = item[column.key];
      return formatValue(value, column, item);
    });
    result.push(row);
  });

  return result;
}

/**
 * Crea un libro de trabajo con estilos
 */
export function createWorkbook(data: any[][], columns: Column[], options: ExportOptions = {}) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Configurar ancho de columnas
  const colWidths = columns.map(col => ({
    wch: col.width ? parseInt(col.width) : 15
  }));
  ws['!cols'] = colWidths;

  // Aplicar estilos si están definidos
  if (options.customStyles) {
    // Estilos para encabezados
    if (options.customStyles.headerStyle && data.length > 0) {
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) ws[cellAddress] = { v: '' };
        ws[cellAddress].s = options.customStyles.headerStyle;
      }
    }
  }

  // Agregar hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, options.sheetName || 'Datos');

  return wb;
}

// ============================================================================
// FUNCIONES PRINCIPALES DE EXPORTACIÓN
// ============================================================================

/**
 * Exporta datos a Excel con una sola hoja
 */
export function exportToExcel(
  data: any[],
  columns: Column[],
  options: ExportOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const defaultOptions: ExportOptions = {
        filename: 'export',
        sheetName: 'Datos',
        includeHeaders: true,
        dateFormat: 'DD/MM/YYYY',
        numberFormat: '#,##0.00'
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Formatear datos
      const formattedData = formatDataForExcel(data, columns, finalOptions.includeHeaders);

      // Crear libro de trabajo
      const workbook = createWorkbook(formattedData, columns, finalOptions);

      // Generar nombre de archivo con timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `${finalOptions.filename}_${timestamp}.xlsx`;

      // Exportar archivo
      XLSX.writeFile(workbook, filename);

      resolve(filename);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Exporta datos a Excel con múltiples hojas
 */
export function exportMultipleSheets(
  sheets: SheetData[],
  filename: string = 'export'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const wb = XLSX.utils.book_new();

      sheets.forEach(sheet => {
        const formattedData = formatDataForExcel(sheet.data, sheet.columns);
        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        
        // Configurar ancho de columnas
        const colWidths = sheet.columns.map(col => ({
          wch: col.width ? parseInt(col.width) : 15
        }));
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
      });

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const finalFilename = `${filename}_${timestamp}.xlsx`;
      
      XLSX.writeFile(wb, finalFilename);
      resolve(finalFilename);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Exporta una tabla HTML a Excel
 */
export function exportTableToExcel(
  tableElement: HTMLTableElement,
  filename: string = 'table_export'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const wb = XLSX.utils.table_to_book(tableElement);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const finalFilename = `${filename}_${timestamp}.xlsx`;
      
      XLSX.writeFile(wb, finalFilename);
      resolve(finalFilename);
    } catch (error) {
      reject(error);
    }
  });
}

// ============================================================================
// FUNCIONES DE CONFIGURACIÓN PREDEFINIDAS
// ============================================================================

/**
 * Configuración para exportar catálogos
 */
export function getCatalogExportOptions(catalogName: string): ExportOptions {
  return {
    filename: `catalogo_${catalogName}`,
    sheetName: catalogName.charAt(0).toUpperCase() + catalogName.slice(1),
    includeHeaders: true,
    customStyles: {
      headerStyle: {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4CAF50" } },
        alignment: { horizontal: "center" }
      }
    }
  };
}

/**
 * Configuración para exportar operaciones
 */
export function getOperationsExportOptions(): ExportOptions {
  return {
    filename: 'operaciones',
    sheetName: 'Operaciones',
    includeHeaders: true,
    customStyles: {
      headerStyle: {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2196F3" } },
        alignment: { horizontal: "center" }
      }
    }
  };
}

/**
 * Configuración para exportar reportes
 */
export function getReportExportOptions(reportName: string): ExportOptions {
  return {
    filename: `reporte_${reportName}`,
    sheetName: reportName.charAt(0).toUpperCase() + reportName.slice(1),
    includeHeaders: true,
    customStyles: {
      headerStyle: {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "FF9800" } },
        alignment: { horizontal: "center" }
      }
    }
  };
}

