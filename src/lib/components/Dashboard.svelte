<script lang="ts">
  interface Props {
    operations: any[];
    cashBoxes: any[];
    companies: any[];
    operationDetails: any[];
    responsiblePersons: any[];
    stands: any[];
  }

  let {
    operations = [],
    cashBoxes = [],
    companies = [],
    operationDetails = [],
    responsiblePersons = [],
    stands = []
  }: Props = $props();

  // Métricas calculadas
  let totalIncome = $derived(operations.filter(op => op.type === 'income').reduce((sum, op) => sum + op.amount, 0));
  let totalExpense = $derived(operations.filter(op => op.type === 'expense').reduce((sum, op) => sum + op.amount, 0));
  let netProfit = $derived(totalIncome - totalExpense);
  let totalOperations = $derived(operations.length);
  let openCashBoxes = $derived(cashBoxes.filter(cb => cb.status === 'open' || cb.status === 'reopened').length);

  // Datos procesados para gráficos simples
  let chartData = $derived(() => {
    // Agrupar operaciones por fecha
    const operationsByDate = operations.reduce((acc, op) => {
      const date = new Date(op.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { income: 0, expense: 0 };
      }
      if (op.type === 'income') {
        acc[date].income += op.amount;
      } else {
        acc[date].expense += op.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    const dates = Object.keys(operationsByDate).sort();
    let cumulativeIncome = 0;
    let cumulativeExpense = 0;

    return dates.map(date => {
      cumulativeIncome += operationsByDate[date].income;
      cumulativeExpense += operationsByDate[date].expense;
      const net = operationsByDate[date].income - operationsByDate[date].expense;
      
      return {
        date,
        income: cumulativeIncome,
        expense: cumulativeExpense,
        net,
        dailyIncome: operationsByDate[date].income,
        dailyExpense: operationsByDate[date].expense
      };
    });
  });

  // Datos por empresa
  let companyData = $derived(() => {
    const companyStats = operations.reduce((acc, op) => {
      if (op.companyId) {
        const company = companies.find(c => c.id === op.companyId);
        if (company) {
          if (!acc[company.razonSocial]) {
            acc[company.razonSocial] = { income: 0, expense: 0, operations: 0 };
          }
          if (op.type === 'income') {
            acc[company.razonSocial].income += op.amount;
          } else {
            acc[company.razonSocial].expense += op.amount;
          }
          acc[company.razonSocial].operations += 1;
        }
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number; operations: number }>);

    return Object.entries(companyStats)
      .map(([name, stats]) => ({
        name,
        income: (stats as { income: number; expense: number; operations: number }).income,
        expense: (stats as { income: number; expense: number; operations: number }).expense,
        net: (stats as { income: number; expense: number; operations: number }).income - (stats as { income: number; expense: number; operations: number }).expense,
        operations: (stats as { income: number; expense: number; operations: number }).operations
      }))
      .sort((a, b) => b.net - a.net)
      .slice(0, 10); // Top 10 empresas
  });

  // Datos para gráficos de barras simples
  let incomeChartData = $derived(chartData().slice(-7)); // Últimos 7 días
  let expenseChartData = $derived(chartData().slice(-7));
  let cashFlowChartData = $derived(chartData().slice(-7));

  // Función para generar gráfico de barras simple
  function generateBarChart(data: any[], maxValue: number, color: string) {
    if (data.length === 0) return '';
    
    const maxHeight = 200;
    const barWidth = Math.max(20, 300 / data.length);
    
    return data.map((item, index) => {
      const height = (item.value / maxValue) * maxHeight;
      const x = index * (barWidth + 5);
      const y = maxHeight - height;
      
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${height}" fill="${color}" opacity="0.8">
        <title>${item.label}: S/. ${item.value.toFixed(2)}</title>
      </rect>`;
    }).join('');
  }

  // Función para generar gráfico de línea simple
  function generateLineChart(data: any[], maxValue: number, color: string) {
    if (data.length === 0) return '';
    
    const maxHeight = 200;
    const width = 300;
    const height = maxHeight;
    const stepX = width / Math.max(1, data.length - 1);
    
    const points = data.map((item, index) => {
      const x = index * stepX;
      const y = height - (item.value / maxValue) * height;
      return `${x},${y}`;
    }).join(' L');
    
    return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" opacity="0.8">
      <title>Línea de tendencia</title>
    </polyline>`;
  }
</script>

<div class="dashboard-container p-6 bg-gray-50 min-h-screen">
  <!-- Header con métricas principales -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Dashboard de Operaciones</h1>
    
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Operaciones</p>
            <p class="text-2xl font-bold text-purple-600">{totalOperations}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Gráficos principales -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
    <!-- Gráfico de Ingresos -->
    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Evolución de Ingresos (Últimos 7 días)</h3>
      <div class="w-full h-80 flex items-center justify-center">
        {#if incomeChartData.length > 0}
          {@const maxIncome = Math.max(...incomeChartData.map((d: any) => d.dailyIncome))}
          {@const chartData = incomeChartData.map((d: any) => ({ value: d.dailyIncome, label: d.date }))}
          <svg width="300" height="200" class="border border-gray-200 rounded">
            <g transform="translate(20, 10)">
              {#each chartData as item, index}
                {@const height = (item.value / maxIncome) * 180}
                {@const x = index * 40}
                {@const y = 180 - height}
                <rect x={x} y={y} width="30" height={height} fill="#10b981" opacity="0.8">
                  <title>{item.label}: S/. {item.value.toFixed(2)}</title>
                </rect>
                <text x={x + 15} y="195" text-anchor="middle" class="text-xs fill-gray-600">
                  {new Date(item.label).getDate()}
                </text>
              {/each}
            </g>
          </svg>
        {:else}
          <p class="text-gray-500">No hay datos de ingresos</p>
        {/if}
      </div>
    </div>

    <!-- Gráfico de Egresos -->
    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Evolución de Egresos (Últimos 7 días)</h3>
      <div class="w-full h-80 flex items-center justify-center">
        {#if expenseChartData.length > 0}
          {@const maxExpense = Math.max(...expenseChartData.map((d: any) => d.dailyExpense))}
          {@const chartData = expenseChartData.map((d: any) => ({ value: d.dailyExpense, label: d.date }))}
          <svg width="300" height="200" class="border border-gray-200 rounded">
            <g transform="translate(20, 10)">
              {#each chartData as item, index}
                {@const height = (item.value / maxExpense) * 180}
                {@const x = index * 40}
                {@const y = 180 - height}
                <rect x={x} y={y} width="30" height={height} fill="#ef4444" opacity="0.8">
                  <title>{item.label}: S/. {item.value.toFixed(2)}</title>
                </rect>
                <text x={x + 15} y="195" text-anchor="middle" class="text-xs fill-gray-600">
                  {new Date(item.label).getDate()}
                </text>
              {/each}
            </g>
          </svg>
        {:else}
          <p class="text-gray-500">No hay datos de egresos</p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Gráficos secundarios -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
    <!-- Gráfico de Flujo de Caja -->
    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Flujo de Caja Diario (Últimos 7 días)</h3>
      <div class="w-full h-80 flex items-center justify-center">
        {#if cashFlowChartData.length > 0}
          {@const maxNet = Math.max(...cashFlowChartData.map((d: any) => Math.abs(d.net)))}
          {@const chartData = cashFlowChartData.map((d: any) => ({ value: d.net, label: d.date }))}
          <svg width="300" height="200" class="border border-gray-200 rounded">
            <g transform="translate(20, 10)">
              {#each chartData as item, index}
                {@const height = (Math.abs(item.value) / maxNet) * 90}
                {@const x = index * 40}
                {@const y = item.value >= 0 ? 90 - height : 90}
                <rect x={x} y={y} width="30" height={height} fill={item.value >= 0 ? "#10b981" : "#ef4444"} opacity="0.8">
                  <title>{item.label}: S/. {item.value.toFixed(2)}</title>
                </rect>
                <text x={x + 15} y="195" text-anchor="middle" class="text-xs fill-gray-600">
                  {new Date(item.label).getDate()}
                </text>
              {/each}
              <!-- Línea de referencia en y=90 -->
              <line x1="0" y1="90" x2="280" y2="90" stroke="#e5e7eb" stroke-dasharray="2,2" />
            </g>
          </svg>
        {:else}
          <p class="text-gray-500">No hay datos de flujo de caja</p>
        {/if}
      </div>
    </div>

    <!-- Gráfico de Empresas -->
    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Beneficio Neto por Empresa (Top 5)</h3>
      <div class="w-full h-80 flex items-center justify-center">
        {#if companyData().length > 0}
          {@const topCompanies = companyData().slice(0, 5)}
          {@const maxNet = Math.max(...topCompanies.map((c: any) => Math.abs(c.net)))}
          <svg width="300" height="200" class="border border-gray-200 rounded">
            <g transform="translate(20, 10)">
              {#each topCompanies as company, index}
                {@const height = (Math.abs(company.net) / maxNet) * 180}
                {@const x = index * 50}
                {@const y = company.net >= 0 ? 180 - height : 180}
                <rect x={x} y={y} width="40" height={height} fill={company.net >= 0 ? "#10b981" : "#ef4444"} opacity="0.8">
                  <title>{company.name}: S/. {company.net.toFixed(2)}</title>
                </rect>
                <text x={x + 20} y="195" text-anchor="middle" class="text-xs fill-gray-600" transform="rotate(-45, {x + 20}, 195)">
                  {company.name.substring(0, 8)}...
                </text>
              {/each}
            </g>
          </svg>
        {:else}
          <p class="text-gray-500">No hay datos de empresas</p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Tabla de empresas top -->
  <div class="bg-white rounded-lg shadow-sm border">
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">Top Empresas por Beneficio</h3>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Egresos</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beneficio Neto</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operaciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each companyData() as company}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {(company as any).name}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                S/. {(company as any).income.toFixed(2)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                S/. {(company as any).expense.toFixed(2)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium {(company as any).net >= 0 ? 'text-green-600' : 'text-red-600'}">
                S/. {(company as any).net.toFixed(2)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(company as any).operations}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  .dashboard-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>
