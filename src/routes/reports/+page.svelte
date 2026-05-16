<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { createChart, ColorType, HistogramSeries } from "lightweight-charts";
  import type { IChartApi, ISeriesApi } from "lightweight-charts";

  let { data } = $props<{ data: any }>();

  let isLoading = $state(true);
  let errorMessage = $state("");
  
  // Datos crudos
  let operations = $state<any[]>([]);
  let companies = $state<any[]>([]);
  let stands = $state<any[]>([]);
  let responsiblePersons = $state<any[]>([]);
  let operationDetails = $state<any[]>([]);

  // Referencia al contenedor del gráfico principal
  let mainChartContainer = $state<HTMLDivElement>();
  let mainChart: IChartApi | undefined;
  let mainSeries: ISeriesApi<"Histogram"> | undefined;

  // Datos procesados para métricas y listas
  let mainChartData = $state<any[]>([]);
  let distributionData = $state({
    byCategory: [] as { name: string; value: number; percentage: number; type: 'income' | 'expense' }[],
    byCompany: [] as { name: string; value: number; percentage: number }[],
    byStand: [] as { name: string; value: number; percentage: number }[],
    byResponsible: [] as { name: string; value: number; percentage: number }[]
  });

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

  // Cargar datos desde las APIs
  async function loadData() {
    try {
      isLoading = true;
      let url = "/api/operations";
      if (startDate && endDate) url += `?startDate=${startDate}&endDate=${endDate}`;

      const [opsRes, compsRes, standsRes, respRes, detRes] = await Promise.all([
        fetch(url),
        fetch("/api/catalogs/companies"),
        fetch("/api/catalogs/stands"),
        fetch("/api/catalogs/responsible-persons"),
        fetch("/api/catalogs/operation-details")
      ]);

      if (opsRes.ok) {
        const data = await opsRes.json();
        operations = Array.isArray(data) ? data : data.operations || [];
      }
      if (compsRes.ok) companies = await compsRes.json();
      if (standsRes.ok) stands = await standsRes.json();
      if (respRes.ok) responsiblePersons = await respRes.json();
      if (detRes.ok) operationDetails = await detRes.json();

      processChartData();
      isLoading = false;

      await tick();
      recreateCharts();
    } catch (error) {
      errorMessage = "Error al cargar los datos";
      console.error(error);
    } finally {
      isLoading = false;
    }
  }

  // Procesar datos para agrupaciones y rankings
  function processChartData() {
    // 1. Balance Diario (Histograma)
    const opsByDate = operations.reduce((acc, op) => {
      const date = op.businessDate || op.createdAt.split("T")[0];
      if (!acc[date]) acc[date] = { income: 0, expense: 0 };
      if (op.type === "income") acc[date].income += op.amount;
      else acc[date].expense += op.amount;
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    const dates = Object.keys(opsByDate).sort();
    mainChartData = dates.map(date => ({
      time: date,
      value: opsByDate[date].income - opsByDate[date].expense,
      color: (opsByDate[date].income - opsByDate[date].expense) >= 0 ? '#10B981' : '#EF4444'
    }));

    // 2. Gastos por Categoría
    const byCategoryRaw = operations.filter(op => op.type === 'expense').reduce((acc, op) => {
      const detail = operationDetails.find(d => d.id === op.operationDetailId)?.name || 'Sin categoría';
      acc[detail] = (acc[detail] || 0) + op.amount;
      return acc;
    }, {} as Record<string, number>);

    distributionData.byCategory = Object.entries(byCategoryRaw)
      .map(([name, value]) => ({
        name,
        value,
        type: 'expense' as const,
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    // 3. Ingresos por Empresa
    const byCompanyRaw = operations.filter(op => op.type === 'income').reduce((acc, op) => {
      const company = companies.find(c => c.id === op.companyId)?.businessName || 'General';
      acc[company] = (acc[company] || 0) + op.amount;
      return acc;
    }, {} as Record<string, number>);

    distributionData.byCompany = Object.entries(byCompanyRaw)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalIncome > 0 ? (value / totalIncome) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    // 4. Actividad por Stand (Balance Neto por Stand)
    const byStandRaw = operations.reduce((acc, op) => {
      const stand = stands.find(s => s.id === op.standId)?.name || 'Sin stand';
      if (!acc[stand]) acc[stand] = 0;
      if (op.type === 'income') acc[stand] += op.amount;
      else acc[stand] -= op.amount;
      return acc;
    }, {} as Record<string, number>);

    distributionData.byStand = Object.entries(byStandRaw)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (totalIncome + Math.abs(totalExpense)) > 0 ? (Math.abs(value) / (totalIncome + Math.abs(totalExpense))) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    // 5. Ranking de Responsables
    const byRespRaw = operations.reduce((acc, op) => {
      const resp = responsiblePersons.find(r => r.id === op.responsiblePersonId)?.name || 'Sin asignar';
      acc[resp] = (acc[resp] || 0) + op.amount;
      return acc;
    }, {} as Record<string, number>);

    distributionData.byResponsible = Object.entries(byRespRaw)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (totalIncome + totalExpense) > 0 ? (value / (totalIncome + totalExpense)) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }

  // Visualización del gráfico principal
  function createMainChart() {
    if (!mainChartContainer || mainChartData.length === 0) return;

    mainChart = createChart(mainChartContainer, {
      width: mainChartContainer.clientWidth,
      height: 350,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748b",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "#f1f5f9" },
      },
      timeScale: { borderColor: "#f1f5f9" }
    });

    mainSeries = mainChart.addSeries(HistogramSeries, {
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    mainSeries.setData(mainChartData);
    mainChart.timeScale().fitContent();
  }

  function recreateCharts() {
    if (mainChart) mainChart.remove();
    createMainChart();
  }

  function resizeCharts() {
    if (mainChart && mainChartContainer) {
      mainChart.applyOptions({ width: mainChartContainer.clientWidth });
    }
  }

  onMount(async () => {
    initializeDates();
    await loadData();
    window.addEventListener("resize", resizeCharts);
  });

  onDestroy(() => {
    if (mainChart) mainChart.remove();
    window.removeEventListener("resize", resizeCharts);
  });
</script>

<svelte:head>
  <title>Análisis de Negocio - Chambar</title>
</svelte:head>

<div class="min-h-screen bg-gray-50/50">
  <div class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Header Premium -->
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">Análisis de Negocio</h1>
          <p class="mt-1 text-gray-500 font-medium">Visualiza el rendimiento financiero de tus operaciones</p>
        </div>
        
        <div class="flex flex-wrap items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200/50">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-gray-400 uppercase ml-2">Periodo</span>
            <input type="date" bind:value={startDate} class="bg-white px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none" />
            <span class="text-gray-400">→</span>
            <input type="date" bind:value={endDate} class="bg-white px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button
            onclick={loadData}
            class="px-5 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-all shadow-sm active:scale-95"
          >
            Filtrar
          </button>
        </div>
      </div>
    </div>

    {#if isLoading}
      <div class="flex flex-col items-center justify-center py-32">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-b-blue-600"></div>
        <p class="mt-4 text-gray-500 font-bold animate-pulse tracking-wider uppercase text-xs">Cargando Inteligencia...</p>
      </div>
    {:else}
      <!-- Métricas en Tarjetas -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Ingresos -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:border-green-200 transition-all">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ingresos Totales</p>
              <p class="text-3xl font-black text-green-600">S/. {totalIncome.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
            <div class="p-3 bg-green-50 rounded-xl group-hover:rotate-12 transition-transform">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Egresos -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:border-red-200 transition-all">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Egresos Totales</p>
              <p class="text-3xl font-black text-red-600">S/. {totalExpense.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
            <div class="p-3 bg-red-50 rounded-xl group-hover:rotate-12 transition-transform">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Balance -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:border-blue-200 transition-all">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Balance Neto</p>
              <p class="text-3xl font-black {netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}">S/. {netProfit.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
            <div class="p-3 bg-blue-50 rounded-xl group-hover:rotate-12 transition-transform">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Volumen -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:border-purple-200 transition-all">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Volumen</p>
              <p class="text-3xl font-black text-purple-600">{totalOperations}</p>
              <p class="text-[10px] font-bold text-gray-400 uppercase">Operaciones</p>
            </div>
            <div class="p-3 bg-purple-50 rounded-xl group-hover:rotate-12 transition-transform">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráfico Principal (Daily Balance) -->
      <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <h3 class="text-xl font-black text-gray-900">Balance de Operaciones Diarias</h3>
        </div>
        <div bind:this={mainChartContainer} class="w-full h-80"></div>
      </div>

      <!-- Análisis de Distribución (Barras de Progreso) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Gastos por Detalle -->
        <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 class="text-xl font-black text-gray-900 mb-6 flex items-center justify-between">
            Distribución de Gastos
            <span class="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full uppercase tracking-tighter">Por Categoría</span>
          </h3>
          <div class="space-y-6">
            {#each distributionData.byCategory.slice(0, 6) as cat}
              <div>
                <div class="flex justify-between items-end mb-2">
                  <span class="text-sm font-bold text-gray-700">{cat.name}</span>
                  <span class="text-xs font-black text-red-600">S/. {cat.value.toFixed(2)} ({cat.percentage.toFixed(1)}%)</span>
                </div>
                <div class="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-red-500 rounded-full transition-all duration-1000" style="width: {cat.percentage}%"></div>
                </div>
              </div>
            {:else}
              <div class="py-12 text-center text-gray-400 italic">No se encontraron egresos en este periodo</div>
            {/each}
          </div>
        </div>

        <!-- Ingresos por Empresa -->
        <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 class="text-xl font-black text-gray-900 mb-6 flex items-center justify-between">
            Concentración de Ingresos
            <span class="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full uppercase tracking-tighter">Por Empresa</span>
          </h3>
          <div class="space-y-6">
            {#each distributionData.byCompany.slice(0, 6) as comp}
              <div>
                <div class="flex justify-between items-end mb-2">
                  <span class="text-sm font-bold text-gray-700">{comp.name}</span>
                  <span class="text-xs font-black text-green-600">S/. {comp.value.toFixed(2)} ({comp.percentage.toFixed(1)}%)</span>
                </div>
                <div class="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-green-500 rounded-full transition-all duration-1000" style="width: {comp.percentage}%"></div>
                </div>
              </div>
            {:else}
              <div class="py-12 text-center text-gray-400 italic">No se encontraron ingresos en este periodo</div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Rankings Finales -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Top Responsables -->
        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 class="text-lg font-black text-gray-900">Top Responsables</h3>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div class="divide-y divide-gray-50">
            {#each distributionData.byResponsible.slice(0, 5) as resp, i}
              <div class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div class="flex items-center gap-4">
                  <span class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-[10px] font-black text-gray-400">{i + 1}</span>
                  <span class="text-sm font-bold text-gray-700">{resp.name}</span>
                </div>
                <span class="text-sm font-black text-blue-600">S/. {resp.value.toLocaleString()}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Top Stands -->
        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 class="text-lg font-black text-gray-900">Actividad por Stand</h3>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div class="divide-y divide-gray-50">
            {#each distributionData.byStand.slice(0, 5) as stand, i}
              <div class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div class="flex items-center gap-4">
                  <span class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-[10px] font-black text-gray-400">{i + 1}</span>
                  <span class="text-sm font-bold text-gray-700">{stand.name}</span>
                </div>
                <span class="text-sm font-black text-purple-600">S/. {stand.value.toLocaleString()}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(.tv-lightweight-charts) {
    font-family: 'Inter', sans-serif !important;
  }
</style>
