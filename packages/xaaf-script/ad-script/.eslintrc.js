module.exports = {
    parser: '@typescript-eslint/parser', // Specifies the ESLint parser
    ignorePatterns: ['temp.js', 'src/**/*.js', 'lib/**','**/*.js', "node_modules", "**/*.[Ss]pec.ts","lib","integration"],
    extends: [
        'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/
        'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from 
        'plugin:prettier/recommended',
    ],
    plugins: ['prettier'],
    parserOptions: {
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
    },
    rules: {
        // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
        // e.g. "@typescript-eslint/explicit-function-return-type": "off",
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        "@typescript-eslint/explicit-member-accessibility": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "no-case-declarations": "off",
        "react/prop-types": "off",
        "jest/no-mocks-import": "off",
        "@typescript-eslint/ban-ts-ignore":"off",
        "indent": "off",
        "comma-dangle": ["error", {
            "arrays": "never",
            "objects": "never",
            "imports": "never",
            "exports": "never",
            "functions": "never"
        }],
        "semi": [2, "always"],
        "no-trailing-spaces": ["error", { "ignoreComments": true }],
        "quotes": ["error", "single"],
        "curly": "error",
        "padding-line-between-statements": [
            "error",
            { blankLine: "always", prev: "var", next: "return" }
        ]
    }
};
