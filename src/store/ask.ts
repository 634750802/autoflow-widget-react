import { createContext, createElement, type ReactNode, useContext, useState } from 'react';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { getErrorMessage } from '../utils/api-utils.ts';
import { chat } from '../utils/api.ts';
import type { AppChatStreamState, BaseAnnotation } from '../utils/protocol';
import type { ScriptConfig } from '../utils/resolve-script-config.ts';
import { parseState } from '../utils/stackvm/core';

export interface ChatMessage {
  id: number,
  role: 'user' | 'assistant',
  content: string
  isFeedbackSubmitted: boolean
  feedback?: 'like' | 'dislike'
  incoming?: boolean
}

export interface IncomingChatMessage extends ChatMessage {
  role: 'assistant',
  content: string,
  status: string,
  incoming: true,
  statusMessage: string,
  totalSteps: number,
  currentStep: number,
  protocol: 'autoflow' | 'StackVM'
}

export interface AskStore {
  chat_id: string | undefined;
  messages: [] | [...ChatMessage[], ChatMessage | IncomingChatMessage];
  abortController: AbortController | undefined;
  error: string | undefined;

  getIncomingMessage (): IncomingChatMessage | undefined;

  setIncomingMessage (message: IncomingChatMessage | undefined | ((prev: IncomingChatMessage) => IncomingChatMessage)): void;

  post (scriptConfig: ScriptConfig, message: string, onNewChat?: (id: string) => void): void;

  reset (): void;
}

export const createAskStore = () => {
  return createStore<AskStore>((_setState, _getState, store) => ({
    chat_id: undefined,
    abortController: undefined,
    messages: [],
    getIncomingMessage: getIncomingMessage.bind(store),
    setIncomingMessage: setIncomingMessage.bind(store),
    reset: reset.bind(store),
    post: post.bind(store),
    error: undefined,
  }));
};

const AskStoreContext = createContext<StoreApi<AskStore>>(null as any);

export function AskStoreProvider ({ children }: { children: ReactNode }) {
  const [store] = useState(createAskStore);

  return createElement(AskStoreContext, { value: store }, children);
}

export function useAskStore () {
  const store = useContext(AskStoreContext);
  if (!store) {
    throw new Error('AskStoreContext not found.');
  }
  return store;
}

function reset (this: StoreApi<AskStore>) {
  this.getState()?.abortController?.abort();
  this.setState({
    chat_id: undefined,
    abortController: undefined,
    messages: [],
    error: undefined,
  });
}

function getIncomingMessage (this: StoreApi<AskStore>) {
  const current = this.getState();
  if (current.messages.length) {
    const message = current.messages[current.messages.length - 1];
    if (message.incoming) {
      return message as IncomingChatMessage;
    }
  }
  return undefined;
}

function setIncomingMessage (this: StoreApi<AskStore>, message: IncomingChatMessage | ((prev: IncomingChatMessage) => IncomingChatMessage) | undefined) {
  if (message) {
    if (typeof message === 'object') {
      if (this.getState().getIncomingMessage()) {
        throw new Error('Cannot post message while asking question.');
      }
      this.setState(({ messages }) => ({
        messages: [...messages, message],
      }));
    } else {
      this.setState(({ messages }) => {
        if (messages.length === 0) {
          return {};
        }
        if (messages[messages.length - 1].incoming) {
          return {
            messages: [...messages.slice(0, -1), message(messages[messages.length - 1] as IncomingChatMessage)],
          };
        } else {
          return {};
        }
      });
    }
  } else {
    this.setState(({ messages }) => ({
      messages: messages.filter(message => !message.incoming) as [] | [...ChatMessage[], ChatMessage | IncomingChatMessage],
    }));
  }
}

function post (this: StoreApi<AskStore>, scriptConfig: ScriptConfig, message: string, onNewChat?: (id: string) => void) {
  const current = this.getState();
  if (current.getIncomingMessage()) {
    throw new Error('Cannot post message while asking question.');
  }
  if (current.error) {
    throw new Error('Cannot post message while error occurred.');
  }
  const { chat_id } = this.getState();

  const abortController = new AbortController();

  this.setState(({ messages }) => ({
    abortController,
    messages: [...messages, { id: Math.floor(Date.now() * Math.random()), role: 'user', content: message, isFeedbackSubmitted: false }, {
      id: Math.floor(Date.now() * Math.random()),
      role: 'assistant',
      content: '',
      status: 'connecting',
      statusMessage: `Connecting to ${scriptConfig.apiBase}`,
      error: undefined,
      protocol: 'autoflow',
      currentStep: 0,
      totalSteps: 0,
      isFeedbackSubmitted: false,
      incoming: true,
    }],
  }));

  (async () => {
    let isStackVM = false;
    const state = this.getState();
    for await (const part of chat(scriptConfig, { chat_id, chat_engine: scriptConfig.chatEngine, content: message, signal: abortController.signal })) {
      switch (part.type) {
        case 'text':
          state.setIncomingMessage(incomingMessage => ({
            ...incomingMessage,
            content: incomingMessage.content + part.value,
          }));
          break;
        case 'data': {
          const data = (part.value[0]! as any);
          const { chat, assistant_message } = data;
          const chat_id = chat.id;
          const message_id = assistant_message.id;
          const { chat_id: prevChatId } = this.getState();
          if (prevChatId !== chat_id) {
            onNewChat?.(chat_id);
          }
          isStackVM = !!chat.engine_options?.external_engine_config?.stream_chat_api_url;
          this.setState({
            chat_id,
          });
          state.setIncomingMessage((incomingMessage) => {
            return {
              ...incomingMessage,
              id: message_id,
              statusMessage: incomingMessage.content.length === 0 ? 'Thinking...' : incomingMessage.statusMessage,
              protocol: isStackVM ? 'StackVM' : 'autoflow',
            };
          });
          break;
        }
        case 'message_annotations': {
          if (!isStackVM) {
            const { display } = part.value[0]! as never as BaseAnnotation<AppChatStreamState>;
            if (display) {
              this.setState((incomingMessage) => ({
                ...incomingMessage,
                statusMessage: display,
              }));
            }
          } else {
            const raw = part.value[0]! as any;
            const state = parseState(raw.state);
            const step = state.current_plan[state.program_counter];
            if (step?.type === 'calling') {
              this.setState((incomingMessage) => ({
                ...incomingMessage,
                totalSteps: state.plan.steps.length,
                currentStep: state.program_counter,
              }));
            }
          }
        }
          break;
        case 'tool_call':
          if (isStackVM) {
            this.setState((incomingMessage) => ({
              ...incomingMessage,
              statusMessage: `Calling tool: ${part.value.toolName}`,
            }));
          }
          break;
        case 'error':
          this.setState(incomingMessage => ({
            ...incomingMessage,
            error: part.value,
          }));
          break;
        case 'finish_message':
          break;
      }
    }
    if (this.getState().getIncomingMessage()) {
      this.setState(({ messages }) => {
        return {
          messages: [...messages.slice(0, -1), { ...messages[messages.length - 1], incoming: false } as ChatMessage],
        };
      });
    }
  })().catch(error => {
    console.error(error);
    this.setState({
      error: getErrorMessage(error),
    });
  });
}

export function isIncomingMessage (message: ChatMessage | IncomingChatMessage): message is IncomingChatMessage {
  return !!message.incoming;
}