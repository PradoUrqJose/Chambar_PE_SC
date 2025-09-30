<!-- Componente de gráfico de líneas -->
<!-- Utiliza Chart.js para crear gráficos de líneas interactivos -->

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
	export let fillArea: boolean = false;
	
	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;
	
	// Función para formatear valores monetarios
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('es-PE', {
			style: 'currency',
			currency: 'PEN'
		}).format(value / 100);
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
		
		// Preparar datos para Chart.js
		const chartData = {
			labels: data.map(item => item.label),
			datasets: [{
				label: title,
				data: data.map(item => item.value),
				borderColor: data[0]?.color || '#3B82F6',
				backgroundColor: fillArea ? 
					`${data[0]?.color || '#3B82F6'}20` : 
					'rgba(59, 130, 246, 0.1)',
				borderWidth: 3,
				fill: fillArea,
				tension: 0.4,
				pointBackgroundColor: data[0]?.color || '#3B82F6',
				pointBorderColor: '#ffffff',
				pointBorderWidth: 2,
				pointRadius: 6,
				pointHoverRadius: 8
			}]
		};
		
		const config = {
			type: 'line' as const,
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
						display: showLegend
					},
					tooltip: {
						callbacks: {
							label: function(context: any) {
								return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
							}
						}
					}
				},
				scales: {
					x: {
						grid: {
							display: false
						}
					},
					y: {
						beginAtZero: true,
						grid: {
							color: 'rgba(0, 0, 0, 0.1)'
						},
						ticks: {
							callback: function(value: any) {
								return formatCurrency(value);
							}
						}
					}
				},
				animation: {
					duration: 1000,
					easing: 'easeInOutQuart' as const
				},
				interaction: {
					intersect: false,
					mode: 'index' as const
				}
			}
		};
		
		chart = new Chart(ctx, config);
	}
	
	// Función para actualizar el gráfico
	function updateChart() {
		if (chart && data.length) {
			chart.data.labels = data.map(item => item.label);
			chart.data.datasets[0].data = data.map(item => item.value);
			chart.data.datasets[0].borderColor = data[0]?.color || '#3B82F6';
			chart.data.datasets[0].backgroundColor = fillArea ? 
				`${data[0]?.color || '#3B82F6'}20` : 
				'rgba(59, 130, 246, 0.1)';
			chart.data.datasets[0].pointBackgroundColor = data[0]?.color || '#3B82F6';
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
