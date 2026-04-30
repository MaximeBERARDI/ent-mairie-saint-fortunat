import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        green: { DEFAULT: '#6ab123', light: '#f2f9e8', mid: '#c4e18a' },
        slate: { DEFAULT: '#4d5e6c', light: '#f0f3f5', dark: '#2e3b45' },
        terra: { DEFAULT: '#c4793a', light: '#fdf4ec' },
        bg: '#f4f6f1',
        border: '#dde4e9',
        fg: '#1f2a31',
        muted: '#4d5e6c',
        subtle: '#94aab7',
        ph: '#e2e6e3',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
