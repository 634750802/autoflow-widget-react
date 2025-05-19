import { createContext, type ReactNode, use, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import cn from '../utils/cn.ts';
import { RootContext } from './root-provider.tsx';

const transitionFunction = 'cubic-bezier(0.4, 0, 0.2, 1)';

export interface DialogProps {
  id: string;
  className?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  zIndexBase?: number;
}

const ParentDialogContext = createContext<number>(0);

export function Dialog ({ id, className, open, onOpenChange, children, zIndexBase = 1000 }: DialogProps) {
  const { shadowRoot } = use(RootContext);
  const dialogs = use(ParentDialogContext);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;

    if (!open || !dialog) {
      return;
    }
    const div = document.createElement('div');
    div.className = 'bg-black/50 fixed left-0 top-0 w-screen h-screen';
    div.style.zIndex = String(zIndexBase + dialogs * 2);
    div.animate([
      { opacity: 0 },
      { opacity: 1 },
    ], {
      easing: transitionFunction,
      duration: 200,
    });
    div.onclick = () => {
      onOpenChange(false);
    };
    shadowRoot.appendChild(div);

    dialog.animate([
      { opacity: 0, transform: 'scale3d(0.7, 0.7, 0.7)', display: 'block' },
      { opacity: 1, display: 'block' },
    ], {
      easing: transitionFunction,
      duration: 400,
    });

    return () => {
      dialog.animate([
        { opacity: 1, display: 'block' },
        { opacity: 0, transform: 'scale3d(0.7, 0.7, 0.7)', display: 'block' },
      ], {
        easing: transitionFunction,
        duration: 400,
      });

      const animation = div.animate([
        { opacity: 1 },
        { opacity: 0 },
      ], {
        easing: transitionFunction,
        duration: 200,
        delay: 200,
      });

      animation.onfinish = animation.oncancel = () => {
        div.remove();
      };
    };
  }, [open]);

  return (
    <ParentDialogContext value={dialogs + 1}>
      {createPortal(
        <dialog
          ref={ref}
          className={cn('fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-max max-w-xl bg-white rounded-xl shadow', className)}
          open={open}
          role="dialog"
          aria-modal={true}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-description`}
          style={{
            zIndex: zIndexBase + dialogs * 2 + 1,
          }}
        >
          {children}
        </dialog>,
        shadowRoot,
      )}
    </ParentDialogContext>
  );
}
