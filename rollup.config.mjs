import { userscriptMeta } from './src/meta.js';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/bilibili-web-optimizer.user.js',
    format: 'iife',
    banner: userscriptMeta,
  },
};
