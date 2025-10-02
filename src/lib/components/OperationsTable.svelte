<script lang="ts">
  import type { Operation } from "$lib/services/operations-service";
  import AttachmentsPreview from "./AttachmentsPreview.svelte";
  import Pagination from "./Pagination.svelte";

  interface Props {
    operations: Operation[];
    rowsPerPage: number;
    onRowsPerPageChange: (value: number) => void;
    onAddOperation: () => void;
    // Paginación
    currentPage?: number;
    onPageChange?: (page: number) => void;
    showPagination?: boolean;
    // Nuevos props para tabla general de operaciones
    showAddButton?: boolean;
    defaultRowsPerPage?: number;
    showCashBoxInfo?: boolean;
    cashBoxes?: any[];
    // Catálogos para mostrar nombres
    companies?: any[];
    operationDetails?: any[];
    responsiblePersons?: any[];
    stands?: any[];
    // Funcionalidad CRUD
    onEditOperation?: (operation: Operation) => void;
    onDeleteOperation?: (operation: Operation) => void;
    showActions?: boolean;
  }

  let {
    operations,
    rowsPerPage,
    onRowsPerPageChange,
    onAddOperation,
    currentPage = 1,
    onPageChange = () => {},
    showPagination = true,
    // Nuevos props con valores por defecto
    showAddButton = true,
    defaultRowsPerPage = 5,
    showCashBoxInfo = false,
    cashBoxes = [],
    // Catálogos
    companies = [],
    operationDetails = [],
    responsiblePersons = [],
    stands = [],
    // Funcionalidad CRUD
    onEditOperation = () => {},
    onDeleteOperation = () => {},
    showActions = false,
  }: Props = $props();

  // Calcular operaciones paginadas
  let paginatedOperations = $derived.by(() => {
    if (!showPagination) return operations;

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return operations.slice(start, end);
  });

  let totalPages = $derived.by(() => Math.ceil(operations.length / rowsPerPage));

  // Calcular colspan dinámico
  let tableColspan = $derived.by(() => {
    let base = showCashBoxInfo ? 10 : 8; // 8 columnas base + 2 de caja si se muestra
    return showActions ? base + 1 : base;
  });

  // Función para formatear fecha en zona horaria de Perú
  function formatDatePeru(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Lima",
    });
  }

  function formatTimePeru(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Lima",
    });
  }

  // Opciones para filas por página
  const rowsPerPageOptions = [5, 10, 20, 30, 50];

  // Función para obtener información de la caja por ID
  function getCashBoxInfo(cashBoxId: string) {
    const cashBox = cashBoxes.find((cb) => cb.id === cashBoxId);
    return cashBox || null;
  }

  // Obtener nombre de empresa
  function getCompanyName(companyId: string | null) {
    if (!companyId) return '';
    const company = companies.find(c => c.id === companyId);
    return company ? company.razonSocial : '';
  }

  // Obtener nombre de detalle de operación
  function getOperationDetailName(operationDetailId: string | null) {
    if (!operationDetailId) return '';
    const detail = operationDetails.find(d => d.id === operationDetailId);
    return detail ? detail.name : '';
  }

  // Obtener nombre de responsable
  function getResponsiblePersonName(responsiblePersonId: string | null) {
    if (!responsiblePersonId) return '';
    const person = responsiblePersons.find(p => p.id === responsiblePersonId);
    return person ? person.name : '';
  }

  // Obtener nombre de stand
  function getStandName(standId: string | null) {
    if (!standId) return '';
    const stand = stands.find(s => s.id === standId);
    return stand ? stand.name : '';
  }

  // Función para formatear fecha de caja
  function formatCashBoxDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Lima",
    });
  }

  // Función para obtener el color del estado de la caja
  function getStatusColor(status: string): string {
    switch (status) {
      case "open":
        return "text-green-600 bg-green-100";
      case "closed":
        return "text-gray-600 bg-gray-100";
      case "reopened":
        return "text-yellow-600 bg-yellow-100";
      case "empty":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  }

  // Función para obtener el texto del estado de la caja
  function getStatusText(status: string): string {
    switch (status) {
      case "open":
        return "Abierta";
      case "closed":
        return "Cerrada";
      case "reopened":
        return "Reabierta";
      case "empty":
        return "Vacía";
      default:
        return "Desconocido";
    }
  }
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200">
  <!-- Header de la tabla -->
  <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-semibold text-gray-900">
        {showCashBoxInfo ? "Todas las Operaciones" : "Operaciones del Día"}
      </h3>
      <div class="flex items-center gap-4">
        <!-- Selector de filas por página -->
        <div class="flex items-center gap-2">
          <label for="rowsPerPage" class="text-sm font-medium text-gray-700">Mostrar:</label>
          <select
            id="rowsPerPage"
            bind:value={rowsPerPage}
            onchange={(e) => {
              const target = e.target as HTMLSelectElement;
              onRowsPerPageChange(parseInt(target.value));
            }}
            class="appearance-none px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-7"
          >
            {#each rowsPerPageOptions as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </div>

        <!-- Botón Agregar Operación (condicional) -->
        {#if showAddButton}
          <button
            onclick={onAddOperation}
            class="px-4 py-2 bg-[#17a34b] text-white rounded-lg hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-medium text-sm flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Agregar Operación
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Tabla de operaciones -->
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"> Tipo </th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"> Descripción </th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"> Monto </th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"> Empresa </th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"> Operación </th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"> Responsable </th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"> Stand </th>
          {#if showCashBoxInfo}
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"> Estado de Caja </th>
          {/if}
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"> Fecha </th>
          <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"> Archivos </th>
          {#if showActions}
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"> Acciones </th>
          {/if}
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#if operations.length === 0}
          <tr>
            <td colspan={tableColspan} class="px-4 py-8 text-center text-gray-500"> No hay operaciones para mostrar </td>
          </tr>
        {:else}
          {#each paginatedOperations as operation}
            {@const cashBoxInfo = getCashBoxInfo(operation.cashBoxId)}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3 border-r border-gray-200">
                <div class="flex items-center gap-2">
                  {#if operation.type === "income"}
                    <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    <span class="text-green-600 font-medium text-sm">Ingreso</span>
                  {:else}
                    <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                    <span class="text-red-600 font-medium text-sm">Egreso</span>
                  {/if}
                </div>
              </td>
              <td class="px-4 py-3 border-r border-gray-200">
                <div class="text-sm text-gray-900 max-w-xs truncate" title={operation.description}>
                  {operation.description}
                </div>
              </td>
              <td class="px-4 py-3 border-r border-gray-200">
                <div class="text-sm font-medium {operation.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                  {operation.type === "income" ? "+" : "-"}S/. {operation.amount.toFixed(2)}
                </div>
              </td>
              <td class="px-4 py-3 border-r border-gray-200">
                <div class="text-sm text-gray-900">
                  {getCompanyName(operation.companyId || null)}
                </div>
              </td>
              <td class="px-4 py-3 border-r border-gray-200">
                <div class="text-sm text-gray-900">
                  {getOperationDetailName(operation.operationDetailId || null)}
                </div>
              </td>
              <td class="px-4 py-3 border-r border-gray-200">
                <div class="text-sm text-gray-900">
                  {getResponsiblePersonName(operation.responsiblePersonId || null)}
                </div>
              </td>
              <td class="px-4 py-3 border-r border-gray-200">
                <div class="text-sm text-gray-900">
                  {getStandName(operation.standId || null)}
                </div>
              </td>
              {#if showCashBoxInfo}
                <td class="px-4 py-3 border-r border-gray-200">
                  <div class="text-sm">
                    {#if cashBoxInfo}
                      <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(cashBoxInfo.status)}">
                        {getStatusText(cashBoxInfo.status)}
                      </span>
                    {:else}
                      <span class="text-gray-500">N/A</span>
                    {/if}
                  </div>
                </td>
              {/if}
              <td class="px-4 py-3 border-r border-gray-200">
                <div class="text-sm text-gray-900">
                  {formatDatePeru(operation.createdAt)}
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <AttachmentsPreview attachments={operation.attachments || []} />
              </td>
              {#if showActions}
                <td class="px-4 py-3 text-center">
                  <div class="flex justify-center space-x-2">
                    <button onclick={() => onEditOperation(operation)} class="text-blue-600 hover:text-blue-900 p-1 rounded" title="Editar operación" aria-label="Editar operación">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button onclick={() => onDeleteOperation(operation)} class="text-red-600 hover:text-red-900 p-1 rounded" title="Eliminar operación" aria-label="Eliminar operación">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              {/if}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Paginación -->
  {#if showPagination && totalPages > 1}
    <Pagination {currentPage} {totalPages} totalItems={operations.length} itemsPerPage={rowsPerPage} {onPageChange} showInfo={true} />
  {:else if operations.length > 0}
    <!-- Footer con información (sin paginación) -->
    <div class="px-6 py-3 bg-gray-50 border-t border-gray-200">
      <div class="flex justify-between items-center text-sm text-gray-700">
        <span>
          Mostrando {Math.min(rowsPerPage, operations.length)} de {operations.length} operaciones
        </span>
        {#if operations.length > rowsPerPage}
          <span class="text-blue-600 font-medium"> Usa el selector para ver más operaciones </span>
        {/if}
      </div>
    </div>
  {/if}
</div>
