import { type Options as JsxOptions, toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { type ComponentRef, Fragment, type ReactNode, type Ref, Suspense, use, useEffect, useMemo, useState } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import rehypeStarryNight from 'rehype-starry-night';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { useStore } from 'zustand/react';
import { createStore, type StoreApi } from 'zustand/vanilla';
import cn from '../utils/cn';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStarryNight)
;

interface RenderTask {
  task: Promise<void> | undefined;
  nextTask: (() => Promise<void>) | undefined;
  input: string;
  output: ReactNode;

  _next (): void;
}

export interface RemarkProps {
  className?: string;
  content: string;
  ref?: Ref<ComponentRef<'article'>>;
}

export function Remark ({ className, content, ref }: RemarkProps) {
  const store = useMemo(() => {
    return createStore<RenderTask>((set, get, store) => ({
      task: undefined,
      nextTask: undefined,
      input: content,
      output: compile(content, store),
      _next () {
        const { _next, nextTask } = get();
        if (nextTask) {
          set({
            task: nextTask().then(() => _next()),
            nextTask: undefined,
          });
        } else {
          set({
            task: undefined,
          });
        }
      },
    }));
  }, []);

  const [firstContentPromise] = useState(() => compile(content, store).then(() => {}));

  return (
    <article ref={ref} className={cn('prose prose-sm prose-zinc prose-pre:bg-zinc-50 w-full max-w-md rounded py-1 px-3', className)}>
      <Suspense>
        <RemarkInternal store={store} content={content} firstRenderPromise={firstContentPromise} />
      </Suspense>
    </article>
  );
}

function RemarkInternal ({ store, firstRenderPromise, content }: { store: StoreApi<RenderTask>, firstRenderPromise?: Promise<void>, content: string }) {
  if (firstRenderPromise) {
    use(firstRenderPromise);
  }

  useEffect(() => {
    const current = store.getState();
    if (current.task) {
      store.setState({
        input: content,
        nextTask: () => compile(content, store).catch(() => {}),
      });
    } else {
      store.setState({
        input: content,
        task: compile(content, store),
      });
    }
  }, [content]);

  return useStore(store, state => state.output);
}

const options: Pick<JsxOptions, 'components'> = {};

async function compile (content: string, store?: StoreApi<RenderTask>) {
  const output = await processor.run(processor.parse(content));
  const nodes = toJsxRuntime(output, {
    jsx,
    jsxs,
    Fragment,
    ...options,
  });
  if (store) {
    store.setState(({ nextTask }) => {
      return {
        nextTask: undefined,
        task: nextTask?.(),
        output: nodes,
      };
    });
  }

  return nodes;
}
