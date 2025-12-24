/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border-color))",
                input: "hsl(var(--border-color))",
                ring: "var(--primary-color)",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "var(--primary-color)",
                    foreground: "var(--text-white)",
                },
                secondary: {
                    DEFAULT: "var(--secondary-color)",
                    foreground: "var(--text-primary)",
                },
                destructive: {
                    DEFAULT: "var(--danger-color)",
                    foreground: "var(--text-white)",
                },
                muted: {
                    DEFAULT: "var(--bg-secondary)",
                    foreground: "var(--text-secondary)",
                },
                accent: {
                    DEFAULT: "var(--primary-color)",
                    foreground: "var(--text-white)",
                },
                popover: {
                    DEFAULT: "var(--bg-card)",
                    foreground: "var(--text-primary)",
                },
                card: {
                    DEFAULT: "var(--bg-card)",
                    foreground: "var(--text-primary)",
                },
            },
            borderRadius: {
                lg: "var(--radius-lg)",
                md: "var(--radius-md)",
                sm: "var(--radius-sm)",
            },
        },
    },
    plugins: [],
}
