// tailwind.config.cjs
const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#2563eb', // blue-600
					light: '#3b82f6', // blue-500
					dark: '#1d4ed8' // blue-700
				},
				secondary: {
					DEFAULT: '#1e293b', // slate-800
					light: '#94a3b8', // slate-400
					dark: '#0f172a' // slate-900
				},
				surface: {
					light: '#ffffff',
					dark: '#1e293b'
				},
				border: {
					light: '#e2e8f0',
					dark: '#334155'
				},
				text: {
					light: '#1e293b',
					dark: '#ffffff',
					muted: '#cbd5e1'
				}
			},
			fontFamily: {
				sans: ['Inter', ...fontFamily.sans]
			}
		}
	},
	plugins: [require('@tailwindcss/typography')]
};
