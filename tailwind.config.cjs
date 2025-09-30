const { skeleton } = require('@skeletonlabs/tw-plugin');

module.exports = {
	content: [
		"./src/**/*.{html,js,svelte,ts}"
	],
	theme: { extend: {} },
	plugins: [
		require("@tailwindcss/forms"),
		skeleton({
			themes: { preset: ["skeleton"] }
		})
	]
};

