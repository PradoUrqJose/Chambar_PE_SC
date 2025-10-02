<script lang="ts">
  import * as XLSX from 'xlsx';
  import { exportMultipleSheets, type SheetData, type ExportOptions } from '$lib/utils/excel-export';

  interface Props {
    sheets: SheetData[];
    filename?: string;

    // Botón
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

  let {
    sheets = [],
    filename = 'reporte_completo',
    buttonText = 'Exportar Reporte Completo',
    buttonClass = 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors',
    showIcon = true,
    disabled = false,
    iconOnly = false,
    iconPath = '/excel-icon-multi.png',
    onExportStart = () => {},
    onExportComplete = () => {},
    onExportError = () => {}
  }: Props = $props();

  let isExporting = $state(false);

  async function exportToExcel() {
    if (disabled || isExporting || sheets.length === 0) return;

    try {
      isExporting = true;
      onExportStart();

      const exportedFilename = await exportMultipleSheets(sheets, filename);
      onExportComplete(exportedFilename);
    } catch (error) {
      console.error('Error al exportar múltiples hojas a Excel:', error);
      onExportError(error as Error);
    } finally {
      isExporting = false;
    }
  }
</script>

<button
  onclick={exportToExcel}
  disabled={disabled || isExporting || sheets.length === 0}
  class={iconOnly ? 'p-1' : buttonClass}
  title={sheets.length === 0 ? 'No hay datos para exportar' : 'Exportar reporte completo a Excel'}
>
  {#if isExporting}
    {#if iconOnly}
      <svg class="w-5 h-5 animate-spin text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    {:else}
      <svg class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Exportando...
    {/if}
  {:else if iconOnly}
    <img src={iconPath} alt="Exportar reporte completo" class="w-10 h-10 object-contain drop-shadow-sm" />
  {:else if showIcon}
    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    {buttonText}
  {:else}
    {buttonText}
  {/if}
</button>

<style>
  /* comportamiento de foco y outline: usamos :focus-visible para accesibilidad */
  button { outline: none; overflow: visible; }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  /* Icon PNG: transiciones y nitidez (igual que el primer componente) */
  button img {
    transition: transform 150ms ease, filter 150ms ease;
    will-change: transform, filter;
    cursor: pointer;
    border-radius: 6px;
  }

  /* Hover: halo suave (drop-shadow) + ligera escala */
  button:hover img {
    transform: scale(1.05);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
    transition: transform 150ms ease, filter 150ms ease;
  }

  /* Focus-visible y active: aplicar SVG stroke alrededor de la silueta del PNG (borde nítido) */
  button:focus-visible img,
  button:active img {
    filter: url('#png-stroke-multi') drop-shadow(0 2px 4px rgba(0,0,0,0.12));
    transform: scale(1.02);
    transition: transform 150ms ease, filter 150ms ease;
  }

  /* Active (clic) feedback: pequeña contracción */
  button:active img {
    transform: scale(0.97);
  }

  /* Disabled image */
  button:disabled img {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
