<script lang="ts">
	interface Props {
		src: string;
		alt: string;
		class?: string;
		placeholder?: string;
		onLoad?: () => void;
		onError?: () => void;
	}

	let { 
		src, 
		alt, 
		class: className = '', 
		placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxNkgxNlYyNEgyNFYxNkgxNloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+',
		onLoad,
		onError
	}: Props = $props();

	let imgRef = $state<HTMLImageElement | HTMLDivElement | null>(null);
	let isLoaded = $state(false);
	let isInView = $state(false);
	let hasError = $state(false);

	// Intersection Observer para lazy loading
	$effect(() => {
		if (!imgRef) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						isInView = true;
						observer.disconnect();
					}
				});
			},
			{
				rootMargin: '50px', // Cargar 50px antes de que sea visible
				threshold: 0.1
			}
		);

		observer.observe(imgRef);

		return () => {
			observer.disconnect();
		};
	});

	function handleLoad() {
		isLoaded = true;
		onLoad?.();
	}

	function handleError() {
		hasError = true;
		onError?.();
	}
</script>

<div class="relative {className}">
	<!-- Placeholder mientras carga -->
	{#if !isLoaded && !hasError}
		<img
			src={placeholder}
			alt=""
			class="w-full h-full object-cover animate-pulse bg-gray-200"
			aria-hidden="true"
		/>
	{/if}

	<!-- Imagen real -->
	{#if isInView}
		<img
			bind:this={imgRef}
			src={src}
			alt={alt}
			class="w-full h-full object-contain transition-opacity duration-300 {isLoaded ? 'opacity-100' : 'opacity-0'}"
			onload={handleLoad}
			onerror={handleError}
			loading="lazy"
		/>
	{:else}
		<!-- Div placeholder para el observer -->
		<div bind:this={imgRef} class="w-full h-full bg-gray-100"></div>
	{/if}

	<!-- Estado de error -->
	{#if hasError}
		<div class="absolute inset-0 flex items-center justify-center bg-gray-100">
			<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
			</svg>
		</div>
	{/if}

	<!-- Loading spinner -->
	{#if isInView && !isLoaded && !hasError}
		<div class="absolute inset-0 flex items-center justify-center bg-gray-100">
			<div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
		</div>
	{/if}
</div>
