import { act, queryByText, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, vitest } from 'vitest';
import { ReactBotRoot } from '../../src/library-next.ts';
import type { ScriptConfig } from '../../src/utils/resolve-script-config.ts';
import { getCurrentChat, mockChat, mockChatDetailed, mockNormals } from '../utils/preset-mocks.ts';

mockNormals();

const scriptConfig: ScriptConfig = {
  src: '',
  chatEngine: undefined,
  apiBase: 'https://example.com',
  trigger: null,
  controlled: false,
  measurementId: undefined,
};

async function prepare () {
  const dom = await act(() => {
    return render(<ReactBotRoot scriptConfig={scriptConfig} />);
  });

  const root = await vitest.waitUntil(() => dom.container.ownerDocument.querySelector('div[data-autoflow-widget]')?.shadowRoot);
  const trigger = await vitest.waitUntil(() => root.querySelector('button[data-autoflow-widget-component=trigger]')) as HTMLElement;
  const dialog = await vitest.waitUntil(() => root.querySelector('dialog'));

  return { root, trigger, dialog };
}

test('chatWithStackVM', async () => {
  mockChat('tests/stackvm.txt');

  const { dialog, trigger } = await prepare();

  act(() => {
    trigger.click();
  });

  expect(dialog).toBeVisible();

  expect(dialog).toHaveTextContent('Test Example Question 1');
  expect(dialog).toHaveTextContent('Test Example Question 2');

  await act(async () => {
    await userEvent.type(dialog.querySelector('textarea')!, 'what is tidb');
  });

  await act(async () => {
    queryByText(dialog, 'Ask Test Title')!.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  expect(dialog).toHaveTextContent('TiDB is a');
  expect(dialog).toHaveTextContent('from traditional database systems.');
});

test('chatWithStackVM detailed', async () => {
  mockChatDetailed('tests/stackvm.txt');

  const { dialog, trigger } = await prepare();

  act(() => {
    trigger.click();
  });

  await act(async () => {
    await userEvent.type(dialog.querySelector('textarea')!, 'what is tidb');
    queryByText(dialog, 'Ask Test Title')!.click();
    await vitest.waitUntil(() => getCurrentChat());
  });

  // Chat data not created.
  expect(dialog).toHaveTextContent('Connecting to https://example.com');

  // No annotation returned.
  await actNext(1);
  expect(dialog).toHaveTextContent('Thinking...');

  await actNext(1);
  expect(dialog).toHaveTextContent('[1/11] Thinking...');

  await actNext(2);
  expect(dialog).toHaveTextContent('[1/11] Calling tool: retrieve_knowledge_graph');

  await actNext(4);
  expect(dialog).toHaveTextContent('[2/11] Calling tool: vector_search');

  await actNext(4);
  expect(dialog).toHaveTextContent('[3/11] Calling tool: llm_generate');

  await actNext(4);
  expect(dialog).toHaveTextContent('[4/11] Calling tool: retrieve_knowledge_graph');

  await actNext(4);
  expect(dialog).toHaveTextContent('[5/11] Calling tool: vector_search');

  await actNext(Number.MAX_SAFE_INTEGER);
  expect(dialog.querySelector('svg.lucide-thumbs-up.size-4')).not.toBeFalsy();
});

async function actNext (n = 1) {
  await act(async () => {
    getCurrentChat()!.next(n);
    await new Promise(resolve => setTimeout(resolve, 100));
  });
}
