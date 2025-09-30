<!-- Componente de gráfico de pastel -->
<!-- Utiliza Chart.js para crear gráficos de pastel interactivos -->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	
	// Registrar todos los componentes de Chart.js
	Chart.register(...registerables);
	
	// Props del componente
	export let data: Array<{ label: string; value: number; color?: string }> = [];
	export let title: string = '';
	export let height: number = 300;
	export let showLegend: boolean = true;
	export let showValues: boolean = true;
	export let showPercentage: boolean = true;
	
	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;
	
	// Colores por defecto para el gráfico de pastel
	const defaultColors = [
		'#3B82F6', // Azul
		'#EF4444', // Rojo
		'#10B981', // Verde
		'#F59E0B', // Amarillo
		'#8B5CF6', // Púrpura
		'#F97316', // Naranja
		'#06B6D4', // Cian
		'#84CC16', // Lima
		'#EC4899', // Rosa
		'#6B7280'  // Gris
	];
	
	// Función para formatear valores monetarios
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('es-PE', {
			style: 'currency',
			currency: 'PEN'
		}).format(value / 100);
	}
	
	// Función para calcular porcentajes
	function calculatePercentage(value: number, total: number): number {
		return total > 0 ? (value / total) * 100 : 0;
	}
	
	// Función para crear el gráfico
	function createChart() {
		if (!canvas || !data.length) return;
		
		// Destruir gráfico existente
		if (chart) {
			chart.destroy();
		}
		
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		
		// Calcular total para porcentajes
		const total = data.reduce((sum, item) => sum + item.value, 0);
		
		// Preparar datos para Chart.js
		const chartData = {
			labels: data.map(item => item.label),
			datasets: [{
				label: title,
				data: data.map(item => item.value),
				backgroundColor: data.map((item, index) => 
					item.color || defaultColors[index % defaultColors.length]
				),
				borderColor: '#ffffff',
				borderWidth: 2,
				hoverOffset: 4
			}]
		};
		
		const config = {
			type: 'pie' as const,
			data: chartData,
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: !!title,
						text: title,
						font: {
							size: 16,
							weight: 'bold' as const
						}
					},
					legend: {
						display: showLegend,
						position: 'bottom' as const,
						labels: {
							usePointStyle: true,
							padding: 20,
							generateLabels: function(chart: any) {
								const data = chart.data;
								if (data.labels.length && data.datasets.length) {
									return data.labels.map((label: string, i: number) => {
										const value = data.datasets[0].data[i];
										const percentage = calculatePercentage(value, total);
										return {
											text: `${label}: ${formatCurrency(value)} (${percentage.toFixed(1)}%)`,
											fillStyle: data.datasets[0].backgroundColor[i],
											strokeStyle: data.datasets[0].borderColor,
											lineWidth: data.datasets[0].borderWidth,
											pointStyle: 'circle',
											hidden: false,
											index: i
										};
									});
								}
								return [];
							}
						}
					},
					tooltip: {
						callbacks: {
							label: function(context: any) {
								const value = context.parsed;
								const percentage = calculatePercentage(value, total);
								return `${context.label}: ${formatCurrency(value)} (${percentage.toFixed(1)}%)`;
							}
						}
					}
				},
				animation: {
					duration: 1000,
					easing: 'easeInOutQuart' as const
				}
			}
		};
		
		chart = new Chart(ctx, config);
	}
	
	// Función para actualizar el gráfico
	function updateChart() {
		if (chart && data.length) {
			const total = data.reduce((sum, item) => sum + item.value, 0);
			
			chart.data.labels = data.map(item => item.label);
			chart.data.datasets[0].data = data.map(item => item.value);
			chart.data.datasets[0].backgroundColor = data.map((item, index) => 
				item.color || defaultColors[index % defaultColors.length]
			);
			chart.update('active');
		}
	}
	
	// Crear gráfico al montar
	onMount(() => {
		createChart();
	});
	
	// Destruir gráfico al desmontar
	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});
	
	// Actualizar cuando cambien los datos
	$: if (data && data.length) {
		updateChart();
	}
</script>

<div class="chart-container">
	<canvas 
		bind:this={canvas} 
		class="w-full"
		style="height: {height}px;"
	></canvas>
</div>

<style>
	.chart-container {
		position: relative;
		width: 100%;
	}
</style>
