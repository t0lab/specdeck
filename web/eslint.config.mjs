import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // shadcn-generated primitives are vendored code we regenerate via
  // `shadcn add`, not hand-authored app code. The one-time setState-in-effect
  // sync they use (carousel select, mobile-breakpoint probe) is an accepted
  // shadcn pattern; relax only that rule here so generated files stay
  // lint-clean across updates. App code keeps the rule.
  {
    files: ["src/components/ui/**", "src/hooks/use-mobile.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
