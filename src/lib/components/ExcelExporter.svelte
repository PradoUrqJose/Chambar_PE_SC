<script lang="ts">
  import * as XLSX from "xlsx";
  import { onMount } from "svelte";

  // ============================================================================
  // INTERFACES Y TIPOS
  // ============================================================================

  interface Column {
    key: string;
    label: string;
    type?: "text" | "badge" | "email" | "phone" | "date" | "custom";
    badgeConfig?: {
      values: Record<string, { text: string; class: string }>;
    };
    formatter?: (value: any, item: any) => string;
    width?: string;
  }

  interface ExportOptions {
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

  interface Props {
    // Datos a exportar
    data: any[];
    columns: Column[];

    // Configuración de exportación
    exportOptions?: ExportOptions;

    // Configuración del botón
    buttonText?: string;
    buttonClass?: string;
    showIcon?: boolean;
    disabled?: boolean;
    iconOnly?: boolean;
    iconPath?: string;

    // Callbacks
    onExportStart?: () => void;
    onExportComplete?: (filename: string) => void;
    onExportError?: (error: Error) => void;
  }

  // ============================================================================
  // PROPS Y ESTADO
  // ============================================================================

  let {
    data = [],
    columns = [],
    exportOptions = {},
    buttonText = "Exportar a Excel",
    buttonClass = "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors",
    showIcon = true,
    disabled = false,
    iconOnly = false,
    iconPath = "/excel-icon.png",
    onExportStart = () => {},
    onExportComplete = () => {},
    onExportError = () => {},
  }: Props = $props();

  // Estado interno
  let isExporting = $state(false);

  // ============================================================================
  // CONFIGURACIÓN POR DEFECTO
  // ============================================================================

  const defaultOptions: ExportOptions = {
    filename: "export",
    sheetName: "Datos",
    includeHeaders: true,
    dateFormat: "DD/MM/YYYY",
    numberFormat: "#,##0.00",
  };

  // ============================================================================
  // FUNCIONES DE UTILIDAD
  // ============================================================================

  // Formatear valor según tipo de columna
  function formatValue(value: any, column: Column, item: any): string {
    if (column.formatter) {
      return column.formatter(value, item);
    }

    switch (column.type) {
      case "date":
        return value ? new Date(value).toLocaleDateString("es-PE") : "";
      case "badge":
        if (column.badgeConfig && value) {
          const config = column.badgeConfig.values[value];
          return config ? config.text : value;
        }
        return value || "";
      case "email":
      case "phone":
      case "text":
      default:
        return value || "";
    }
  }

  // Formatear datos para Excel
  function formatDataForExcel(data: any[], columns: Column[]): any[][] {
    const result: any[][] = [];

    // Agregar encabezados si está habilitado
    if (exportOptions.includeHeaders !== false) {
      const headers = columns.map((col) => col.label);
      result.push(headers);
    }

    // Agregar datos
    data.forEach((item) => {
      const row = columns.map((column) => {
        const value = item[column.key];
        return formatValue(value, column, item);
      });
      result.push(row);
    });

    return result;
  }

  // Crear libro de trabajo con estilos
  function createWorkbook(data: any[][], options: ExportOptions) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Configurar ancho de columnas
    const colWidths = columns.map((col) => ({
      wch: col.width ? parseInt(col.width) : 15,
    }));
    ws["!cols"] = colWidths;

    // Aplicar estilos básicos para mejorar la apariencia
    if (data.length > 0) {
      const headerRange = XLSX.utils.decode_range(ws["!ref"] || "A1");
      
      // Estilos para encabezados
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
      
      // Estilos para datos (filas alternadas)
      for (let row = 1; row <= data.length; row++) {
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
          ws[cellAddress].s = {
            fill: { fgColor: { rgb: row % 2 === 0 ? "F8F9FA" : "FFFFFF" } },
            border: {
              top: { style: "thin", color: { rgb: "E0E0E0" } },
              bottom: { style: "thin", color: { rgb: "E0E0E0" } },
              left: { style: "thin", color: { rgb: "E0E0E0" } },
              right: { style: "thin", color: { rgb: "E0E0E0" } }
            },
            alignment: { vertical: "center" }
          };
        }
      }
    }

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, options.sheetName || "Datos");

    return wb;
  }

  // ============================================================================
  // FUNCIÓN PRINCIPAL DE EXPORTACIÓN
  // ============================================================================

  async function exportToExcel() {
    if (disabled || isExporting || data.length === 0) {
      return;
    }

    try {
      isExporting = true;
      onExportStart();

      // Combinar opciones con valores por defecto
      const options = { ...defaultOptions, ...exportOptions };

      // Formatear datos
      const formattedData = formatDataForExcel(data, columns);

      // Crear libro de trabajo
      const workbook = createWorkbook(formattedData, options);

      // Generar nombre de archivo con timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const filename = `${options.filename}_${timestamp}.xlsx`;

      // Exportar archivo
      XLSX.writeFile(workbook, filename);

      // Callback de éxito
      onExportComplete(filename);
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      onExportError(error as Error);
    } finally {
      isExporting = false;
    }
  }

  // ============================================================================
  // FUNCIONES DE UTILIDAD PÚBLICAS
  // ============================================================================

  // Función para exportar con datos personalizados
  export function exportCustomData(customData: any[], customColumns: Column[], customOptions?: ExportOptions) {
    const originalData = data;
    const originalColumns = columns;
    const originalOptions = exportOptions;

    // Temporalmente cambiar los datos
    data = customData;
    columns = customColumns;
    exportOptions = { ...exportOptions, ...customOptions };

    // Exportar
    exportToExcel().finally(() => {
      // Restaurar datos originales
      data = originalData;
      columns = originalColumns;
      exportOptions = originalOptions;
    });
  }

  // Función para exportar múltiples hojas
  export function exportMultipleSheets(
    sheets: Array<{
      name: string;
      data: any[];
      columns: Column[];
    }>,
    filename: string = "export"
  ) {
    try {
      const wb = XLSX.utils.book_new();

      sheets.forEach((sheet) => {
        const formattedData = formatDataForExcel(sheet.data, sheet.columns);
        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
      });

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const finalFilename = `${filename}_${timestamp}.xlsx`;

      XLSX.writeFile(wb, finalFilename);
      onExportComplete(finalFilename);
    } catch (error) {
      console.error("Error al exportar múltiples hojas:", error);
      onExportError(error as Error);
    }
  }
</script>

<!-- ============================================================================
  COMPONENTE EXCELEXPORTER
============================================================================ -->

<button
  onclick={exportToExcel}
  disabled={disabled || isExporting || data.length === 0}
  class={iconOnly ? "p-1" : buttonClass}
  title={data.length === 0 ? "No hay datos para exportar" : "Exportar a Excel"}
>
  {#if isExporting}
    {#if iconOnly}
      <svg class="w-10 h-10 animate-spin text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    {:else}
      <svg class="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Exportando...
    {/if}
  {:else if iconOnly}
    <img src={iconPath} alt="Exportar a Excel" class="w-12 h-12 object-contain drop-shadow-sm" />
  {:else if showIcon}
    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
    {buttonText}
  {:else}
    {buttonText}
  {/if}
</button>

<!-- ============================================================================
  ESTILOS ADICIONALES
============================================================================ -->

<style>
  /* evita el outline por defecto del button (usamos :focus-visible para accesibilidad) */
  button {
    outline: none;
  }

  button:focus-visible img,
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Estilos para iconos PNG - Efectos en la imagen, no en el botón */
  button img {
    transition:
      transform 150ms ease,
      filter 150ms ease;
    /* opcional: mejor nitidez en PNG si hay transform */
    will-change: transform, filter;
    cursor: pointer;
  }

  /* hover mantiene el drop-shadow suave; no pisa el stroke en focus */
  button:hover img {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
    transform: scale(1.05);
    transition:
      transform 150ms ease,
      filter 150ms ease;
  }
  /* active (clic) ligera contracción si quieres feedback) */
  button:active img {
    transform: scale(0.97);
  }

  button:disabled img {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* si el botón tiene overflow:hidden la sombra/stroke puede cortarse */
  button {
    /* asegúrate de NO usar overflow:hidden si quieres ver el borde */
    overflow: visible;
  }
</style>
