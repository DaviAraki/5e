import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

/**
 * ESLint flat config for the React/TypeScript app. Type-checking is handled
 * separately by `tsc --noEmit` (the `typecheck` script); this config focuses
 * on lint rules via typescript-eslint's parser.
 */
export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "public/**", "scripts/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "*.config.{ts,js}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
);
