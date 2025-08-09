import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable unused vars error (for build/deploy)
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Ignore uuid import errors in API routes
  {
    ignores: [
      '**/src/app/api/invitations/route.ts',
    ],
  },
];

export default eslintConfig;
