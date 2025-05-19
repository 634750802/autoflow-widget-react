export default function () {
  return {
    postcssPlugin: "postcss-root-to-host",

    Root (root) {
      root.walk((node) => {
        if (node.selector) {
          if (node.selectors.includes(":root") && !node.selectors.includes(":host")) {
            node.selector = [...node.selectors, ':host'].join(", ");
          }
        }
      });
    },
  };
};

export const postcss = true;