import tailwindcss from '@tailwindcss/postcss';
import transformer from 'postcss-rem-to-responsive-pixel';
import extractProperties from './postcss.plugin.extract-properties.js';
import rootToHost from './postcss.plugin.root-to-host.js';

export default {
  plugins: [
    tailwindcss(),
    extractProperties(),
    rootToHost(),
    transformer({
      rootValue: 16,
      propList: ['*'],
      transformUnit: 'px',
    }),
  ]
}