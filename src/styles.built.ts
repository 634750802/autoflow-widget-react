import codeStyles from '@wooorm/starry-night/style/light?url';
import styles from './library.css?url';

export function injectStyles (shadowRoot: ShadowRoot) {
  const document = shadowRoot.ownerDocument;

  let insertScript: (src: string) => HTMLLinkElement;

  if (import.meta.env.DEV) {
    insertScript = (src: string) => {
      const link = document.createElement('link');
      link.href = src;
      return link;
    };
  } else {
    insertScript = (src: string) => {
      const link = document.createElement('link');
      if (src === '/library.css') {
        link.href = require('./library.css?url');
      } else {
        link.href = require('./light.css?url');
      }
      return link;
    };
  }

  const styleSheets = [
    insertScript(codeStyles),
    insertScript(styles),
  ];

  styleSheets.forEach(link => {
    shadowRoot.insertBefore(link, shadowRoot.firstChild);
  });
  return () => {
    styleSheets.forEach(link => link.remove());
  };
}