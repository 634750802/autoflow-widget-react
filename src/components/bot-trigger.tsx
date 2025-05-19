import { type MouseEvent as ReactMouseEvent, use, useEffect, useRef } from 'react';
import { resolveAssetUrl } from '../utils/assets-util.ts';
import { RootContext } from './root-provider.tsx';

export function BotTrigger ({ onClick }: { onClick?: (event: MouseEvent | ReactMouseEvent<HTMLButtonElement>) => void }) {
  const { settings, scriptConfig } = use(RootContext);
  const { trigger } = scriptConfig;
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  if (trigger) {
    if (trigger !== true) {
      useEffect(() => {
        const handleClick = (event: MouseEvent) => {
          if (!event.defaultPrevented) {
            onClickRef.current?.(event);
          }
        };
        trigger.addEventListener('click', handleClick);
        return () => {
          trigger.removeEventListener('click', handleClick);
        };
      }, [trigger]);
    }
  } else {
    return (
      <button className="fixed right-8 bottom-8 flex gap-2 items-center cursor-pointer bg-black text-primary-foreground px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-all disabled:text-disabled-foreground disabled:bg-disabled disabled:cursor-not-allowed z-50" onClick={onClick} data-autoflow-widget-component="trigger">
        <img className="h-6" src={resolveAssetUrl(scriptConfig, settings.custom_js_button_img_src)} alt={settings.custom_js_button_label} aria-hidden />
      </button>
    );
  }

  return null;
}