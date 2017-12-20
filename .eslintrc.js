module.exports = {
  'globals': {

  },
  'env': {
    'browser': true,
    'es6': true
  },
  'extends': [
    'eslint:recommended'
  ],
  "parserOptions": {
    "sourceType": "module"
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
