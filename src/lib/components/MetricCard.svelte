<!-- Componente de tarjeta de métrica -->
<!-- Muestra una métrica con icono, valor y descripción -->

<script lang="ts">
	// Props del componente
	export let title: string = '';
	export let value: number = 0;
	export let icon: string = '';
	export let color: string = 'blue';
	export let format: 'currency' | 'number' | 'percentage' = 'currency';
	export let trend: 'up' | 'down' | 'neutral' | null = null;
	export let trendValue: number = 0;
	export let description: string = '';
	
	// Función para formatear valores
	function formatValue(val: number): string {
		switch (format) {
			case 'currency':
				return new Intl.NumberFormat('es-PE', {
					style: 'currency',
					currency: 'PEN'
				}).format(val / 100);
			case 'percentage':
				return `${val.toFixed(1)}%`;
			case 'number':
			default:
				return val.toLocaleString('es-PE');
		}
	}
	
	// Función para obtener el color de la tendencia
	function getTrendColor(): string {
		switch (trend) {
			case 'up':
				return 'text-green-600';
			case 'down':
				return 'text-red-600';
			case 'neutral':
				return 'text-gray-600';
			default:
				return 'text-gray-400';
		}
	}
	
	// Función para obtener el icono de la tendencia
	function getTrendIcon(): string {
		switch (trend) {
			case 'up':
				return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6';
			case 'down':
				return 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6';
			case 'neutral':
				return 'M20 12H4';
			default:
				return '';
		}
	}
	
	// Función para obtener las clases de color
	function getColorClasses(): string {
		const colorMap = {
			blue: 'bg-blue-500',
			green: 'bg-green-500',
			red: 'bg-red-500',
			purple: 'bg-purple-500',
			orange: 'bg-orange-500',
			yellow: 'bg-yellow-500',
			indigo: 'bg-green-500',
			pink: 'bg-pink-500'
		};
		return colorMap[color as keyof typeof colorMap] || 'bg-green-500';
	}
</script>

<div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
	<div class="p-5">
		<div class="flex items-center">
			<div class="flex-shrink-0">
				<div class="w-8 h-8 {getColorClasses()} rounded-md flex items-center justify-center">
					{#if icon}
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icon}></path>
						</svg>
					{/if}
				</div>
			</div>
			<div class="ml-5 w-0 flex-1">
				<dl>
					<dt class="text-sm font-medium text-gray-500 truncate">
						{title}
					</dt>
					<dd class="text-lg font-medium text-gray-900">
						{formatValue(value)}
					</dd>
					{#if description}
						<dd class="text-xs text-gray-500 mt-1">
							{description}
						</dd>
					{/if}
				</dl>
			</div>
		</div>
	</div>
	
	{#if trend && trendValue !== 0}
		<div class="bg-gray-50 px-5 py-3">
			<div class="flex items-center">
				<div class="flex items-center {getTrendColor()}">
					{#if getTrendIcon()}
						<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getTrendIcon()}></path>
						</svg>
					{/if}
					<span class="text-sm font-medium">
						{formatValue(Math.abs(trendValue))}
					</span>
				</div>
				<span class="ml-2 text-sm text-gray-500">
					{trend === 'up' ? 'vs período anterior' : trend === 'down' ? 'vs período anterior' : 'sin cambios'}
				</span>
			</div>
		</div>
	{/if}
</div>
