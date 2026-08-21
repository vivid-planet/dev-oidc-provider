import eslintConfigCore from "@dextinity/eslint-config/core.js";

/** @type {import("eslint")} */
const config = [
    ...eslintConfigCore,
    {
        // These files aren't covered by tsconfig.json's "include" (it only covers src/**/*), so typescript-eslint's
        // typed-linting can't find a project for them. Let it fall back to a default, single-file project instead.
        files: ["eslint.config.mjs", "example/dev-oidc-provider.config.mts"],
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ["eslint.config.mjs", "example/dev-oidc-provider.config.mts"],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
];

export default config;
