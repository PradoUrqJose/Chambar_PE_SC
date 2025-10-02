<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { createChart, ColorType, LineSeries, CandlestickSeries, AreaSeries } from "lightweight-charts";
  import type { IChartApi, ISeriesApi, CandlestickData, LineData } from "lightweight-charts";
  import { ExcelExporter, ExcelMultiSheetExporter } from "$lib/components";
  import { getReportExportOptions, type SheetData } from "$lib/utils/excel-export";

  let { data } = $props<{ data: any }>();

  let isLoading = $state(true);
  let errorMessage = $state("");
  let successMessage = $state("");

  // Datos para los gráficos
  let operations = $state<any[]>([]);
  let companies = $state<any[]>([]);
  let stands = $state<any[]>([]);
  let responsiblePersons = $state<any[]>([]);
  let operationDetails = $state<any[]>([]);

  // Referencias a los contenedores de gráficos
  let mainChartContainer = $state<HTMLDivElement>();
  let candlestickChartContainer = $state<HTMLDivElement>();
  let incomeChartContainer = $state<HTMLDivElement>();
  let expenseChartContainer = $state<HTMLDivElement>();

  // Instancias de gráficos
  let mainChart: IChartApi | undefined;
  let candlestickChart: IChartApi | undefined;
  let incomeChart: IChartApi | undefined;
  let expenseChart: IChartApi | undefined;

  // Series de gráficos (pueden ser undefined hasta que se creen)
  let mainSeries: ISeriesApi<"Area"> | undefined;
  let candlestickSeries: ISeriesApi<"Candlestick"> | undefined;
  let incomeSeries: ISeriesApi<"Area"> | undefined;
  let expenseSeries: ISeriesApi<"Area"> | undefined;

  // Datos procesados para gráficos
  let mainChartData = $state<LineData[]>([]);
  let candlestickData = $state<CandlestickData[]>([]);
  let incomeData = $state<LineData[]>([]);
  let expenseData = $state<LineData[]>([]);

  // Filtros de fecha
  let startDate = $state("");
  let endDate = $state("");

  // Métricas calculadas
  let totalIncome = $derived(operations.filter((op) => op.type === "income").reduce((sum, op) => sum + op.amount, 0));
  let totalExpense = $derived(operations.filter((op) => op.type === "expense").reduce((sum, op) => sum + op.amount, 0));
  let netProfit = $derived(totalIncome - totalExpense);
  let totalOperations = $derived(operations.length);

  // Inicializar fechas por defecto (1 mes antes del día actual)
  function initializeDates() {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    endDate = today.toISOString().split("T")[0];
    startDate = oneMonthAgo.toISOString().split("T")[0];
  }

  // Cargar datos
  async function loadData() {
    try {
      isLoading = true;

      // Cargar datos desde las APIs
      await Promise.all([loadOperations(), loadCompanies(), loadStands(), loadResponsiblePersons(), loadOperationDetails()]);

      // Procesar datos para gráficos
      processChartData();

      // Ya procesamos datos: permitir que el DOM muestre los contenedores de charts
      // antes de intentar recrear las instancias.
      isLoading = false;

      // Esperar a que Svelte actualice el DOM (bind:this se resuelva)
      await tick();

      // Re-crear gráficas (ahora que el DOM ya está rendereado)
      await recreateCharts();
    } catch (error) {
      errorMessage = "Error al cargar los datos";
      console.error("Error loading data:", error);
    } finally {
      // por seguridad asegurar que isLoading quede en false
      isLoading = false;
    }
  }

  // Cargar operaciones
  async function loadOperations() {
    try {
      // Construir URL con parámetros de fecha si están disponibles
      let url = "/api/operations";
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }

      console.log("🔍 loadOperations - URL:", url);
      console.log("🔍 loadOperations - Fechas:", { startDate, endDate });

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        operations = Array.isArray(data) ? data : data.operations || [];
        console.log("🔍 loadOperations - Operaciones cargadas:", operations.length);
        console.log(
          "🔍 loadOperations - Fechas de operaciones:",
          operations.map((op) => ({
            id: op.id,
            businessDate: op.businessDate,
            createdAt: op.createdAt?.split("T")[0],
          }))
        );
      }
    } catch (error) {
      console.error("Error loading operations:", error);
    }
  }

  // Cargar empresas
  async function loadCompanies() {
    try {
      const response = await fetch("/api/catalogs/companies");
      if (response.ok) {
        companies = await response.json();
      }
    } catch (error) {
      console.error("Error loading companies:", error);
    }
  }

  // Cargar stands
  async function loadStands() {
    try {
      const response = await fetch("/api/catalogs/stands");
      if (response.ok) {
        stands = await response.json();
      }
    } catch (error) {
      console.error("Error loading stands:", error);
    }
  }

  // Cargar personas responsables
  async function loadResponsiblePersons() {
    try {
      const response = await fetch("/api/catalogs/responsible-persons");
      if (response.ok) {
        responsiblePersons = await response.json();
      }
    } catch (error) {
      console.error("Error loading responsible persons:", error);
    }
  }

  // Cargar detalles de operación
  async function loadOperationDetails() {
    try {
      const response = await fetch("/api/catalogs/operation-details");
      if (response.ok) {
        operationDetails = await response.json();
      }
    } catch (error) {
      console.error("Error loading operation details:", error);
    }
  }

  // Procesar datos para gráficos
  function processChartData() {
    // Agrupar operaciones por fecha
    const operationsByDate = operations.reduce(
      (acc, op) => {
        // Usar businessDate si existe, sino createdAt
        const date = op.businessDate || op.createdAt.split("T")[0];
        if (!acc[date]) {
          acc[date] = { income: 0, expense: 0, operations: [] };
        }
        acc[date].operations.push(op);
        if (op.type === "income") {
          acc[date].income += op.amount;
        } else {
          acc[date].expense += op.amount;
        }
        return acc;
      },
      {} as Record<string, { income: number; expense: number; operations: any[] }>
    );

    // Usar solo datos reales de operaciones

    const dates = Object.keys(operationsByDate).sort();

    // Debug: Log de fechas procesadas
    console.log("📅 Fechas procesadas:", {
      operationsCount: operations.length,
      datesFound: dates,
      operationsByDate: Object.keys(operationsByDate),
      sampleOperations: operations.slice(0, 3).map((op) => ({
        id: op.id,
        businessDate: op.businessDate,
        createdAt: op.createdAt,
        processedDate: op.businessDate || op.createdAt.split("T")[0],
      })),
    });

    let cumulativeIncome = 0;
    let cumulativeExpense = 0;

    // Datos para gráfico principal (línea de flujo de caja)
    mainChartData = dates.map((date) => {
      const net = operationsByDate[date].income - operationsByDate[date].expense;
      return {
        time: date,
        value: net,
      };
    });

    // Datos para gráfico de velas (OHLC por día)
    candlestickData = dates.map((date) => {
      const dayOps = operationsByDate[date].operations;
      const income = operationsByDate[date].income;
      const expense = operationsByDate[date].expense;

      // Simular OHLC basado en operaciones del día
      const open = dayOps.length > 0 ? dayOps[0].amount : income * 0.8;
      const close = income - expense;
      const high = Math.max(income, expense, open, close) * 1.1;
      const low = Math.min(income, expense, open, close) * 0.9;

      return {
        time: date,
        open: open,
        high: high,
        low: low,
        close: close,
      };
    });

    // Datos para gráfico de ingresos acumulados
    incomeData = dates.map((date) => {
      cumulativeIncome += operationsByDate[date].income;
      return {
        time: date,
        value: cumulativeIncome,
      };
    });

    // Datos para gráfico de egresos acumulados
    expenseData = dates.map((date) => {
      cumulativeExpense += operationsByDate[date].expense;
      return {
        time: date,
        value: cumulativeExpense,
      };
    });
  }

  // Crear gráfico principal (Standard Time-based Chart)
  function createMainChart() {
    console.log("📊 createMainChart called", {
      container: !!mainChartContainer,
      dataLength: mainChartData.length,
      data: mainChartData,
    });

    if (!mainChartContainer) {
      console.log("❌ mainChartContainer no disponible");
      return;
    }

    console.log("📏 Tamaño del contenedor:", {
      width: mainChartContainer.clientWidth,
      height: mainChartContainer.clientHeight,
      offsetWidth: mainChartContainer.offsetWidth,
      offsetHeight: mainChartContainer.offsetHeight,
    });

    mainChart = createChart(mainChartContainer, {
      width: mainChartContainer.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: "white" },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "#cccccc",
      },
      timeScale: {
        borderColor: "#cccccc",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    mainSeries = mainChart.addSeries(AreaSeries, {
      lineColor: "#3b82f6",
      lineWidth: 3, // Línea más gruesa para debug
      title: "Flujo de Caja Diario",
      // Agregar área con degradado azul más visible
      topColor: "rgba(59, 130, 246, 0.8)", // Más opaco para debug
      bottomColor: "rgba(59, 130, 246, 0.2)", // Menos transparente para debug
    }) as ISeriesApi<"Area">;

    console.log("✅ Serie principal creada:", {
      series: !!mainSeries,
      dataToSet: mainChartData.length,
      data: mainChartData,
      firstDataPoint: mainChartData[0],
      lastDataPoint: mainChartData[mainChartData.length - 1],
    });

    mainSeries.setData(mainChartData);
    mainChart.timeScale().fitContent();

    console.log("✅ Datos establecidos y escala ajustada");

    // Verificar que el gráfico se renderice
    setTimeout(() => {
      if (mainChartContainer) {
        console.log("🔍 Verificando renderizado del gráfico:", {
          containerHasContent: mainChartContainer.children.length > 0,
          containerInnerHTML: mainChartContainer.innerHTML.length,
          chartExists: !!mainChart,
        });
      }
    }, 500);
  }

  // Crear gráfico de velas (Candlestick Chart)
  function createCandlestickChart() {
    if (!candlestickChartContainer) return;

    candlestickChart = createChart(candlestickChartContainer, {
      width: candlestickChartContainer.clientWidth,
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: "white" },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "#cccccc",
      },
      timeScale: {
        borderColor: "#cccccc",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    candlestickSeries = candlestickChart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    }) as ISeriesApi<"Candlestick">;

    candlestickSeries.setData(candlestickData);
    candlestickChart.timeScale().fitContent();
  }

  // Crear gráfico de ingresos
  function createIncomeChart() {
    if (!incomeChartContainer) return;

    incomeChart = createChart(incomeChartContainer, {
      width: incomeChartContainer.clientWidth,
      height: 250,
      layout: {
        background: { type: ColorType.Solid, color: "white" },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "#cccccc",
      },
      timeScale: {
        borderColor: "#cccccc",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    incomeSeries = incomeChart.addSeries(AreaSeries, {
      lineColor: "#10b981",
      lineWidth: 2,
      title: "Ingresos Acumulados",
      // Agregar área con degradado verde
      topColor: "rgba(16, 185, 129, 0.3)",
      bottomColor: "rgba(16, 185, 129, 0.0)",
    }) as ISeriesApi<"Area">;

    incomeSeries.setData(incomeData);
    incomeChart.timeScale().fitContent();
  }

  // Crear gráfico de egresos
  function createExpenseChart() {
    if (!expenseChartContainer) return;

    expenseChart = createChart(expenseChartContainer, {
      width: expenseChartContainer.clientWidth,
      height: 250,
      layout: {
        background: { type: ColorType.Solid, color: "white" },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "#cccccc",
      },
      timeScale: {
        borderColor: "#cccccc",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    expenseSeries = expenseChart.addSeries(AreaSeries, {
      lineColor: "#ef4444",
      lineWidth: 2,
      title: "Egresos Acumulados",
      // Agregar área con degradado rojo
      topColor: "rgba(239, 68, 68, 0.3)",
      bottomColor: "rgba(239, 68, 68, 0.0)",
    }) as ISeriesApi<"Area">;

    expenseSeries.setData(expenseData);
    expenseChart.timeScale().fitContent();
  }

  // Redimensionar gráficos
  function resizeCharts() {
    if (mainChart && mainChartContainer) {
      mainChart.applyOptions({ width: mainChartContainer.clientWidth });
    }
    if (candlestickChart && candlestickChartContainer) {
      candlestickChart.applyOptions({ width: candlestickChartContainer.clientWidth });
    }
    if (incomeChart && incomeChartContainer) {
      incomeChart.applyOptions({ width: incomeChartContainer.clientWidth });
    }
    if (expenseChart && expenseChartContainer) {
      expenseChart.applyOptions({ width: expenseChartContainer.clientWidth });
    }
  }

  // Eliminar instancias viejas y recrear gráficos usando los contenedores actuales
  async function recreateCharts() {
    console.log("recreateCharts: before remove - containers:", {
      main: !!mainChartContainer,
      candlestick: !!candlestickChartContainer,
      income: !!incomeChartContainer,
      expense: !!expenseChartContainer,
    });

    // eliminar instancias antiguas si existen
    try {
      if (mainChart) {
        mainChart.remove();
        mainChart = undefined;
        mainSeries = undefined;
      }
      if (candlestickChart) {
        candlestickChart.remove();
        candlestickChart = undefined;
        candlestickSeries = undefined;
      }
      if (incomeChart) {
        incomeChart.remove();
        incomeChart = undefined;
        incomeSeries = undefined;
      }
      if (expenseChart) {
        expenseChart.remove();
        expenseChart = undefined;
        expenseSeries = undefined;
      }
    } catch (err) {
      console.warn("Error al remover charts antiguos:", err);
    }

    // esperar a que Svelte haya reinsertado los nodos en el DOM
    await tick();

    console.log("recreateCharts: after tick - containers:", {
      main: !!mainChartContainer,
      candlestick: !!candlestickChartContainer,
      income: !!incomeChartContainer,
      expense: !!expenseChartContainer,
    });

    // crear de nuevo los charts con los datos ya procesados
    createMainChart();
    createCandlestickChart();
    createIncomeChart();
    createExpenseChart();
  }

  // Preparar datos para exportación
  function getOperationsForExport() {
    return operations.map((op) => ({
      ...op,
      type: op.type === "income" ? "Ingreso" : "Egreso",
      amount: `${op.type === "income" ? "+" : "-"}S/. ${op.amount.toFixed(2)}`,
      createdAt: new Date(op.createdAt).toLocaleDateString("es-PE"),
      attachments: op.attachments && op.attachments.length > 0 ? `${op.attachments.length} archivo(s)` : "Sin archivos",
    }));
  }

  // Preparar datos para exportación múltiple
  function getMultiSheetData(): SheetData[] {
    return [
      {
        name: "Operaciones",
        data: getOperationsForExport(),
        columns: [
          { key: "type", label: "Tipo", type: "text" as const },
          { key: "description", label: "Descripción", type: "text" as const },
          { key: "amount", label: "Monto", type: "text" as const },
          { key: "createdAt", label: "Fecha", type: "date" as const },
          { key: "attachments", label: "Archivos", type: "text" as const },
        ],
      },
      {
        name: "Empresas",
        data: companies,
        columns: [
          { key: "razonSocial", label: "Razón Social", type: "text" as const },
          { key: "ruc", label: "RUC", type: "text" as const },
          { key: "status", label: "Estado", type: "text" as const },
        ],
      },
      {
        name: "Stands",
        data: stands,
        columns: [
          { key: "name", label: "Nombre", type: "text" as const },
          { key: "location", label: "Ubicación", type: "text" as const },
          { key: "status", label: "Estado", type: "text" as const },
        ],
      },
      {
        name: "Responsables",
        data: responsiblePersons,
        columns: [
          { key: "name", label: "Nombre", type: "text" as const },
          { key: "email", label: "Email", type: "email" as const },
          { key: "phone", label: "Teléfono", type: "phone" as const },
          { key: "status", label: "Estado", type: "text" as const },
        ],
      },
    ];
  }

  onMount(async () => {
    initializeDates();
    await loadData();

    // Redimensionar en resize
    if (typeof window !== "undefined") {
      window.addEventListener("resize", resizeCharts);
    }
  });

  onDestroy(() => {
    if (mainChart) mainChart.remove();
    if (candlestickChart) candlestickChart.remove();
    if (incomeChart) incomeChart.remove();
    if (expenseChart) expenseChart.remove();
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", resizeCharts);
    }
  });

  // Actualizar datos de gráficos cuando cambien las operaciones
  $effect(() => {
    if (operations.length > 0 && mainSeries && candlestickSeries && incomeSeries && expenseSeries) {
      // Procesar datos sin modificar variables de estado
      const operationsByDate = operations.reduce(
        (acc, op) => {
          const date = op.businessDate || op.createdAt.split("T")[0];
          if (!acc[date]) {
            acc[date] = { income: 0, expense: 0, operations: [] };
          }
          acc[date].operations.push(op);
          if (op.type === "income") {
            acc[date].income += op.amount;
          } else {
            acc[date].expense += op.amount;
          }
          return acc;
        },
        {} as Record<string, { income: number; expense: number; operations: any[] }>
      );

      const dates = Object.keys(operationsByDate).sort();
      let cumulativeIncome = 0;
      let cumulativeExpense = 0;

      // Datos para gráfico principal
      const mainData = dates.map((date) => {
        const net = operationsByDate[date].income - operationsByDate[date].expense;
        return { time: date, value: net };
      });

      // Datos para gráfico de velas
      const candlestickData = dates.map((date) => {
        const income = operationsByDate[date].income;
        const expense = operationsByDate[date].expense;
        return {
          time: date,
          open: 0,
          high: income,
          low: -expense,
          close: income - expense,
        };
      });

      // Datos para ingresos acumulados
      const incomeData = dates.map((date) => {
        cumulativeIncome += operationsByDate[date].income;
        return { time: date, value: cumulativeIncome };
      });

      // Datos para egresos acumulados
      const expenseData = dates.map((date) => {
        cumulativeExpense += operationsByDate[date].expense;
        return { time: date, value: cumulativeExpense };
      });

      // Actualizar series
      mainSeries.setData(mainData);
      candlestickSeries.setData(candlestickData);
      incomeSeries.setData(incomeData);
      expenseSeries.setData(expenseData);

      // Ajustar escalas
      if (mainChart) mainChart.timeScale().fitContent();
      if (candlestickChart) candlestickChart.timeScale().fitContent();
      if (incomeChart) incomeChart.timeScale().fitContent();
      if (expenseChart) expenseChart.timeScale().fitContent();
    }
  });
</script>

<svelte:head>
  <title>Reportes - Chambar</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Reportes</h1>
          <p class="mt-2 text-gray-600">Análisis y reportes del sistema de gestión de caja</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <label for="startDate" class="text-sm font-medium text-gray-700">Desde:</label>
            <input
              type="date"
              id="startDate"
              bind:value={startDate}
              class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div class="flex items-center gap-2">
            <label for="endDate" class="text-sm font-medium text-gray-700">Hasta:</label>
            <input
              type="date"
              id="endDate"
              bind:value={endDate}
              class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            on:click={async () => {
              await loadData();
            }}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Filtrar
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- Mensajes de feedback -->
  {#if errorMessage}
    <div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
      <div class="flex">
        <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        {errorMessage}
      </div>
    </div>
  {/if}

  {#if successMessage}
    <div class="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
      <div class="flex">
        <svg class="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        {successMessage}
      </div>
    </div>
  {/if}

  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      <span class="ml-2 text-gray-600">Cargando reportes...</span>
    </div>
  {:else}
    <!-- Métricas principales -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 rounded-lg">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Ingresos Totales</p>
            <p class="text-2xl font-bold text-green-600">S/. {totalIncome.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="flex items-center">
          <div class="p-2 bg-red-100 rounded-lg">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Egresos Totales</p>
            <p class="text-2xl font-bold text-red-600">S/. {totalExpense.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 rounded-lg">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Beneficio Neto</p>
            <p class="text-2xl font-bold {netProfit >= 0 ? 'text-green-600' : 'text-red-600'}">
              S/. {netProfit.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 rounded-lg">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Operaciones</p>
            <p class="text-2xl font-bold text-purple-600">{totalOperations}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfico principal (Standard Time-based Chart) -->
    <div class="bg-white p-6 rounded-lg shadow-sm border mb-8">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Flujo de Caja Diario</h3>
      {#if operations.length === 0}
        <div class="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div class="flex">
            <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <p class="text-sm text-gray-700">
                <strong>No hay operaciones:</strong> Realiza operaciones en el sistema de caja para ver los gráficos.
              </p>
            </div>
          </div>
        </div>
      {/if}
      <div bind:this={mainChartContainer} class="w-full h-96" style="min-height: 400px; background-color: #f9fafb; border: 1px solid #e5e7eb;"></div>
    </div>

    <!-- Gráfico de velas (Candlestick Chart) -->
    <div class="bg-white p-6 rounded-lg shadow-sm border mb-8">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Análisis de Velas por Día</h3>
      {#if operations.length === 0}
        <div class="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div class="flex">
            <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              ></path>
            </svg>
            <div>
              <p class="text-sm text-gray-700">
                <strong>No hay operaciones:</strong> Realiza operaciones en el sistema de caja para ver los gráficos.
              </p>
            </div>
          </div>
        </div>
      {/if}
      <div bind:this={candlestickChartContainer} class="w-full h-80" style="min-height: 320px; background-color: #f9fafb; border: 1px solid #e5e7eb;"></div>
    </div>

    <!-- Gráficos secundarios -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Gráfico de Ingresos -->
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Evolución de Ingresos</h3>
        <div bind:this={incomeChartContainer} class="w-full h-64" style="min-height: 256px; background-color: #f9fafb; border: 1px solid #e5e7eb;"></div>
      </div>

      <!-- Gráfico de Egresos -->
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Evolución de Egresos</h3>
        <div bind:this={expenseChartContainer} class="w-full h-64" style="min-height: 256px; background-color: #f9fafb; border: 1px solid #e5e7eb;"></div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Estilos para los gráficos de TradingView */
  :global(.tv-lightweight-charts) {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
</style>
