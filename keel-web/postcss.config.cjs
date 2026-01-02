// keel-web/postcss.config.cjs
// PostCSS configuration for Keel Web
// - Tailwind PostCSS plugin (new package): @tailwindcss/postcss
// - Autoprefixer for cross-browser CSS compatibility
//
// NOTE:
// Tailwind's PostCSS plugin moved out of 'tailwindcss'.
// If you use 'tailwindcss' here, Vite will throw:
// "trying to use tailwindcss directly as a PostCSS plugin..."

module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
