<script lang="ts">
	import type { PageData } from './$types';
	import { fade, slide, fly } from 'svelte/transition';
	
	let { data } = $props<{ data: PageData }>();
	
	const { stats, recentOperations, openBoxes, user } = data;

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('es-PE', {
			style: 'currency',
			currency: 'PEN',
			minimumFractionDigits: 2
		}).format(amount);
	}

	function getTimeAgo(dateStr: string) {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		
		if (diffMins < 1) return 'Hace un momento';
		if (diffMins < 60) return `Hace ${diffMins} min`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `Hace ${diffHours} h`;
		return date.toLocaleDateString();
	}
</script>

<svelte:head>
	<title>Panel de Control - Chambar</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Welcome Header -->
	<div class="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
		<div in:fly={{ y: -20, duration: 600 }}>
			<h1 class="text-4xl font-black text-gray-900 tracking-tight">
				¡Hola, <span class="text-blue-600">{user?.email?.split('@')[0]}</span>! 👋
			</h1>
			<p class="mt-2 text-lg text-gray-500 font-medium">
				Esto es lo que está pasando hoy en <span class="font-bold text-gray-900">Chambar</span>.
			</p>
		</div>
		
		<div class="flex items-center gap-3" in:fade={{ delay: 200 }}>
			<a href="/cash-boxes" class="inline-flex items-center px-5 py-2.5 bg-white border border-gray-200 text-sm font-bold text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 transition-all active:scale-95">
				<svg class="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
				Ver Cajas
			</a>
			<a href="/operations" class="inline-flex items-center px-5 py-2.5 bg-blue-600 text-sm font-bold text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
				<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
				Nueva Operación
			</a>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
		<!-- Income Today -->
		<div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-xl hover:shadow-green-500/5 transition-all duration-300" in:fly={{ y: 20, delay: 100 }}>
			<div class="flex items-center justify-between mb-4">
				<div class="p-3 bg-green-50 rounded-2xl text-green-600 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
				</div>
				<span class="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase tracking-wider">Hoy</span>
			</div>
			<p class="text-sm font-bold text-gray-400 uppercase tracking-widest">Ingresos</p>
			<p class="text-3xl font-black text-gray-900 mt-1">{formatCurrency(stats.incomeToday)}</p>
		</div>

		<!-- Expense Today -->
		<div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300" in:fly={{ y: 20, delay: 200 }}>
			<div class="flex items-center justify-between mb-4">
				<div class="p-3 bg-red-50 rounded-2xl text-red-600 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" /></svg>
				</div>
				<span class="text-[10px] font-black bg-red-100 text-red-700 px-2 py-1 rounded-full uppercase tracking-wider">Hoy</span>
			</div>
			<p class="text-sm font-bold text-gray-400 uppercase tracking-widest">Egresos</p>
			<p class="text-3xl font-black text-gray-900 mt-1">{formatCurrency(stats.expenseToday)}</p>
		</div>

		<!-- Open Boxes -->
		<div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300" in:fly={{ y: 20, delay: 300 }}>
			<div class="flex items-center justify-between mb-4">
				<div class="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
				</div>
				<span class="text-xs font-bold text-blue-700">{stats.openBoxesCount} Activas</span>
			</div>
			<p class="text-sm font-bold text-gray-400 uppercase tracking-widest">Cajas Abiertas</p>
			<p class="text-3xl font-black text-gray-900 mt-1">{stats.openBoxesCount}</p>
		</div>

		<!-- Total Balance -->
		<div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300" in:fly={{ y: 20, delay: 400 }}>
			<div class="flex items-center justify-between mb-4">
				<div class="p-3 bg-purple-50 rounded-2xl text-purple-600 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
				</div>
				<div class="flex -space-x-2">
					<div class="w-6 h-6 rounded-full bg-blue-400 border-2 border-white"></div>
					<div class="w-6 h-6 rounded-full bg-purple-400 border-2 border-white"></div>
				</div>
			</div>
			<p class="text-sm font-bold text-gray-400 uppercase tracking-widest">Saldo en Cajas</p>
			<p class="text-3xl font-black text-gray-900 mt-1">{formatCurrency(stats.totalBalance)}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Recent Activity Feed -->
		<div class="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100" in:fade={{ delay: 500 }}>
			<div class="flex items-center justify-between mb-8">
				<h3 class="text-xl font-black text-gray-900 flex items-center gap-3">
					<span class="w-2 h-8 bg-blue-600 rounded-full"></span>
					Actividad Reciente
				</h3>
				<a href="/operations" class="text-sm font-bold text-blue-600 hover:underline">Ver todo</a>
			</div>
			
			<div class="space-y-6">
				{#each recentOperations as op}
					<div class="flex items-center gap-5 p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
						<div class="w-12 h-12 rounded-2xl flex items-center justify-center {op.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} group-hover:scale-110 transition-transform">
							{#if op.type === 'income'}
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
							{:else}
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>
							{/if}
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-bold text-gray-900 truncate">{op.description}</p>
							<p class="text-xs text-gray-400 font-medium">{getTimeAgo(op.createdAt)}</p>
						</div>
						<div class="text-right">
							<p class="text-base font-black {op.type === 'income' ? 'text-green-600' : 'text-red-600'}">
								{op.type === 'income' ? '+' : '-'}{formatCurrency(op.amount)}
							</p>
						</div>
					</div>
				{:else}
					<div class="py-12 text-center">
						<div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
						</div>
						<p class="text-gray-400 font-medium">No hay actividad reciente</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Active Boxes Column -->
		<div class="space-y-8" in:fade={{ delay: 600 }}>
			<div class="bg-gray-900 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
				<div class="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
				<h3 class="text-xl font-black mb-6 relative z-10 flex items-center gap-3">
					<span class="w-2 h-8 bg-blue-400 rounded-full"></span>
					Cajas Abiertas
				</h3>
				
				<div class="space-y-4 relative z-10">
					{#each openBoxes as box}
						<div class="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/20 transition-all">
							<div class="flex justify-between items-start mb-2">
								<span class="text-xs font-black uppercase tracking-widest text-blue-300">{box.name}</span>
								<span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
							</div>
							<p class="text-2xl font-black">{formatCurrency(box.currentAmount)}</p>
							<p class="text-[10px] text-white/50 font-medium mt-1">Apertura: {new Date(box.openedAtUtc).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
						</div>
					{:else}
						<p class="text-white/40 text-sm italic py-4">No hay cajas abiertas actualmente</p>
					{/each}
				</div>

				<a href="/cash-boxes" class="mt-8 w-full py-4 bg-white text-gray-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-all active:scale-95 text-sm uppercase tracking-tighter">
					Gestionar Cajas
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
				</a>
			</div>

			<!-- System Status -->
			<div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
				<h3 class="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Estado del Sistema</h3>
				<div class="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
					<div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
						<div class="w-3 h-3 rounded-full bg-green-500"></div>
					</div>
					<div>
						<p class="text-sm font-bold text-gray-900">Operativo</p>
						<p class="text-[10px] text-gray-400 font-black uppercase">D1 + R2 Conectados</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		background-color: #fcfcfc;
	}
</style>