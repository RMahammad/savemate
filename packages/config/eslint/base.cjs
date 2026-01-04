/**
 * Minimal ESLint v9 flat config (no TS parsing yet).
 * Keep this intentionally small for Milestone 1.
 */
module.exports = [
  {
    ignores: ["**/dist/**", "**/node_modules/**"],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-console": "off",
    },
  },
];
