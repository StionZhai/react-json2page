module.exports = {
  "extends": [
    "@tencent/eslint-config-tencent",
    "@tencent/eslint-config-tencent/ts.js",
    "plugin:@typescript-eslint/recommended"
  ],
  "overrides": [{
    files: ['**/*.ts', '**/*.tsx', "**/*.js"],
  }],
  "globals": {
    "App": true,
    "getCurrentPages": true,
    "getApp": true,
    "wx": true,
    "requirePlugin": true,
    "console": true
  },
  "rules": {
    "no-multi-spaces": 2,
    "no-mixed-operators": [
      "error",
      {
        "groups": [
          [
            "%",
            "**"
          ],
          [
            "%",
            "+"
          ],
          [
            "%",
            "-"
          ],
          [
            "%",
            "*"
          ],
          [
            "%",
            "/"
          ],
          [
            "&",
            "|",
            "<<",
            ">>",
            ">>>"
          ],
          [
            "==",
            "!=",
            "===",
            "!=="
          ],
          [
            "&&",
            "||"
          ],
          [
            "*",
            "/"
          ]
        ],
        "allowSamePrecedence": false
      }
    ],
    "no-extra-boolean-cast": 0,
    "react/prop-types": 0,
    "no-else-return": 0,
    "no-multi-assign": "error",
    "prefer-destructuring": ["error", {"AssignmentExpression": {"array": false, "object": false}}],
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "radix": "off",
    //    "react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx", ".tsx"] }]
    "no-unused-vars": 0,
    "@typescript-eslint/semi": "error",
    "semi": [
      2,
      "always"
    ],
    "prefer-const": [
      "error",
      {
        "destructuring": "all"
      }
    ],
    //    "react-hooks/exhaustive-deps": 0,
    //    "no-unused-vars": "off",
    //    "@typescript-eslint/no-unused-vars": "off",
    //    "import/prefer-default-export": 0,
    "no-param-reassign": 0,
    "react/react-in-jsx-scope": 0,
    "no-empty": 0,
    "comma-dangle": [
      "error",
      "always-multiline"
    ],
    //    "global-require": 0,
    //    "react/jsx-tag-spacing": 0,
    //    "react/prop-types": 0,
    //    "lines-between-class-members": 0,
    //    "no-ex-assign": 0,
    //    "no-shadow": 0,
    //    "no-else-return": 0,
    //    "radix": 0,
    //    "default-case": 0,
    "no-underscore-dangle": 0,
    //    "no-restricted-properties": 0,
    //    "react/sort-comp": 0,
    //    "operator-assignment": 0,
    //    "react/prefer-stateless-function": 0,
    //    "react/jsx-boolean-value": 0,
    //    "no-multi-assign": 0,
    //    "react/style-prop-object": 0,
    //    "react/destructuring-assignment": 0,
    //    "react/no-array-index-key": 0,
    //    "no-bitwise": 0,
    //    "no-nested-ternary": 0,
    //    "consistent-return": 0,
    //    "no-await-in-loop": 0,
    "max-len": [
      "error",
      {
        "code": 120
      }
    ],
    //    "react/no-string-refs": 0,
    "no-plusplus": 0,
    // "@typescript-eslint/no-empty-function": 0,
    //    "prefer-promise-reject-errors": 0,
    //    "no-throw-literal": 0,
    //    "import/no-cycle": 0,
    //    "class-methods-use-this": 0,
    //    "array-callback-return": 0,
    //    "react/no-access-state-in-setstate": 0,
    "no-console": 0,
    "operator-linebreak": [
      2,
      "before"
    ],
    //    "no-continue": 0,
    //    "no-return-assign": 0,
    //    "react/no-multi-comp": 0,
    //    "prefer-destructuring": 0,
    //    "react/jsx-one-expression-per-line": 0,
    //    "no-unused-expressions": 0
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "sourceType": "module",
    "project": [
      "./packages/**/tsconfig.json"
    ],
    "tsconfigRootDir": __dirname,
    "ecmaVersion": 2018
  }
}
