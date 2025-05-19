export default {
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            'pre > code': {
              color: 'var(--tw-prose-code)',
              fontFamily: 'var(--font-mono)',
            },
          },
        },
      },
    },
  },
} satisfies import('tailwindcss').Config;