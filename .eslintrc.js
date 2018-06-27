module.exports = {
  'plugins': ["jest", "react"],
  'globals': {

  },
  'env': {
    'browser': true,
    'es6': true,
    'jest/globals': true
  },
  'extends': [
    'eslint:recommended',
    "plugin:react/recommended"
  ],
  "parserOptions": {
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  'rules': {
    'indent': [
      'error',
      2,
      {
        'SwitchCase': 1
      }
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'semi': [
      'error',
      'always'
    ],
    'object-curly-spacing': [
      'error',
      'always'
    ]
  }
};
