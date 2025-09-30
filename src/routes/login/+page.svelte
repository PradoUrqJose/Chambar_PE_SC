<!-- Página de login -->
<!-- Esta página permite a los usuarios iniciar sesión en el sistema -->

<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	
	// Variables reactivas para el formulario
	let email = 'admin@chambar.com';
	let password = 'admin123';
	let isLoading = false;
	let errorMessage = '';
	
	// Props del servidor
	export let form: ActionData;
	
	// Manejar cambios en el formulario
	$: if (form?.error) {
		errorMessage = form.error;
		isLoading = false;
	}
	
	// Función para manejar el envío del formulario
	async function handleSubmit() {
		isLoading = true;
		errorMessage = '';
	}
</script>

<svelte:head>
	<title>Iniciar Sesión - Chambar</title>
</svelte:head>

<!-- Contenedor principal con diseño centrado -->
<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<!-- Header -->
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Iniciar Sesión
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Sistema de Caja Administrativa
			</p>
		</div>
		
		<!-- Formulario de login -->
		<form 
			method="POST"
			action="?/login"
			use:enhance={handleSubmit}
			class="mt-8 space-y-6"
		>
			<!-- Mensaje de error -->
			{#if errorMessage}
				<div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
					{errorMessage}
				</div>
			{/if}
			
			<!-- Campos del formulario -->
			<div class="space-y-4">
				<!-- Email -->
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">
						Email
					</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						bind:value={email}
						class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="admin@chambar.com"
					/>
				</div>
				
				<!-- Contraseña -->
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">
						Contraseña
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						bind:value={password}
						class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="••••••••"
					/>
				</div>
			</div>
			
			<!-- Botón de envío -->
			<div>
				<button
					type="submit"
					disabled={isLoading}
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isLoading}
						<!-- Spinner de carga -->
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Iniciando sesión...
					{:else}
						Iniciar Sesión
					{/if}
				</button>
			</div>
			
			<!-- Información de desarrollo -->
			<div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
				<h3 class="text-sm font-medium text-blue-800">Credenciales de desarrollo:</h3>
				<p class="mt-1 text-sm text-blue-700">
					Email: <code class="bg-blue-100 px-1 rounded">admin@chambar.com</code><br>
					Contraseña: <code class="bg-blue-100 px-1 rounded">admin123</code>
				</p>
			</div>
		</form>
	</div>
</div>
