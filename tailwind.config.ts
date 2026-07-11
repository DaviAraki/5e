import type { Config } from "tailwindcss";

/**
 * 5etools design tokens.
 * Dark-first; light theme provided via [data-theme="light"] overrides.
 * School / damage-type colors mirror the legacy site's semantic palette so
 * stat blocks remain recognizable.
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Surface scale (dark default)
        bg: {
          DEFAULT: "#0e1116",
          subtle: "#151a21",
          raised: "#1c232c",
          overlay: "#232c37",
        },
        border: {
          DEFAULT: "#2a3340",
          subtle: "#222a35",
          strong: "#3a4655",
        },
        fg: {
          DEFAULT: "#e6edf3",
          muted: "#9aa7b4",
          faint: "#6b7785",
        },
        accent: {
          DEFAULT: "#7c5cff",
          hover: "#8e72ff",
          subtle: "#1e1838",
        },
        school: {
          A: "#7ab098", // abjuration
          V: "#9b59b6", // evocation
          N: "#5dade2", // necromancy
          T: "#48c9b0", // transmutation
          C: "#e74c3c", // conjuration
          D: "#f39c12", // divination
          I: "#3498db", // illusion
          E: "#ec7bc8", // enchantment
        },
        damage: {
          acid: "#7ab098",
          fire: "#e74c3c",
          cold: "#5dade2",
          lightning: "#f1c40f",
          poison: "#48c9b0",
          necrotic: "#5dade2",
          radiant: "#ffd700",
          force: "#9b59b6",
          psychic: "#ec7bc8",
          thunder: "#9aa7b4",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Scrumish", "Georgia", "serif"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        pop: "0 8px 24px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
