import js from "@eslint/js"
import globals from "globals"
import ts from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import { defineConfig } from "eslint/config"

export default defineConfig([
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    plugins: { js, ts },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: globals.browser,
    },
    extends: ["js/recommended", "plugin:@typescript-eslint/recommended"],
  },
])
