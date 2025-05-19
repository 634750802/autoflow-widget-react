if (!Element.prototype.animate) {
  Element.prototype.animate = function (_keyframes: any[], options?: number | KeyframeAnimationOptions) {
    const animation: Animation = new EventTarget() as Animation;

    const duration = options ? (typeof options === 'number' ? options : ((options.delay ?? 0) + Number(options.duration ?? 0))) : 0;

    setTimeout(() => {
      animation.onfinish?.(new CustomEvent('finished', {}) as any);
    }, duration);

    return animation;
  };
}

if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function () {};
}