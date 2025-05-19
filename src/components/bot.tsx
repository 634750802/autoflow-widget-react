import { SendIcon } from 'lucide-react';
import { type FormEvent, type Ref, use, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { useStore } from 'zustand/react';
import { useAskStore } from '../store/ask.ts';
import { resolveAssetUrl } from '../utils/assets-util.ts';
import { AutoScroll, ManualScrollVoter, useRequestScroll } from './auto-scroll';
import { BotTrigger } from './bot-trigger.tsx';
import { ConversationLayout } from './chat-layouts/conversation.tsx';
import { Dialog } from './dialog.tsx';
import { RootContext } from './root-provider.tsx';

export default function Bot ({
  onNewChat,
  ref,
}: {
  onNewChat?: (id: string) => void,
  ref?: Ref<{ open: boolean, newChat: (content: string) => void }>
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);
  const { settings, scriptConfig } = use(RootContext);
  const [scrollTarget, setScrollTarget] = useState<HTMLElement | null>(null);
  const askStore = useAskStore();

  const hasMessage = useStore(askStore, state => state.messages.length !== 0);

  useImperativeHandle(ref, () => {
    return {
      get open () {
        return openRef.current;
      },
      set open (value: boolean) {
        openRef.current = value;
        setOpen(value);
      },
      newChat: (content: string) => {
        const state = askStore.getState();
        state.reset();
        state.post(scriptConfig, content, onNewChat);
      },
    };
  }, [askStore]);

  return (
    <>
      <BotTrigger
        onClick={() => {
          setOpen(true);
          openRef.current = true;
        }}
      />
      <Dialog
        id={id}
        open={open}
        onOpenChange={open => {
          setOpen(open);
          openRef.current = open;
        }}
        className="p-4"
      >
        <div className="space-y-1">
          <h6 id={`${id}-title`} className="flex p-4 pb-0 gap-2 items-center">
            <img className="h-8 inline-flex" src={resolveAssetUrl(scriptConfig, settings.logo_in_light_mode)} alt="logo" />
          </h6>
        </div>
        <AutoScroll target={scrollTarget} edgePixels={4}>
          <ManualScrollVoter />
          <div className="mt-4 overflow-x-hidden overflow-y-auto max-h-[60vh] space-y-4 pb-[74px]" ref={setScrollTarget}>
            {hasMessage ? (
              <ChatMessages />
            ) : <BotPlaceholder onAsk={question => askStore.getState().post(scriptConfig, question, onNewChat)} />}
          </div>
        </AutoScroll>
        <BotInputArea onAsk={question => askStore.getState().post(scriptConfig, question, onNewChat)} />
      </Dialog>
    </>
  );
}

function BotPlaceholder ({ onAsk }: { onAsk: (question: string) => void }) {
  const { settings } = use(RootContext);
  return (
    <ul className="flex gap-2 flex-wrap p-4">
      {settings.custom_js_example_questions.map((question, index) => (
        <li key={index}>
          <button
            className="px-2.5 py-1.5 cursor-pointer text-sm whitespace-nowrap rounded bg-secondary text-primary hover:bg-secondary/70 transition-colors"
            onClick={() => onAsk(question)}>
            {question}
          </button>
        </li>
      ))}
    </ul>
  );
}

function BotInputArea ({ onAsk }: { onAsk: (question: string) => void }) {
  const [empty, setEmpty] = useState(true);
  const askStore = useAskStore();

  const ref = useRef<HTMLTextAreaElement>(null);
  const disabled = useStore(askStore, state => !!(state.messages.length > 0 && state.messages[state.messages.length - 1].incoming) || !!state.error);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onAsk(ref.current!.value);
    ref.current!.value = '';
  };

  return (
    <form className="absolute left-8 bottom-8 w-[calc(100%-64px)] rounded-lg border bg-white transition-all shadow aria-disabled:bg-zinc-50" onSubmit={handleSubmit} aria-disabled={disabled}>
      <textarea name="message" disabled={disabled} ref={ref} className="block p-2 size-full resize-none outline-none text-sm" placeholder="Input question..." onChange={(e) => setEmpty(e.target.value.trim() === '')} />
      <button disabled={empty || disabled} className="absolute right-2 bottom-2 text-sm bg-primary text-primary-foreground p-2 rounded-lg cursor-pointer hover:bg-primary/90 transition-colors disabled:text-disabled-foreground disabled:bg-disabled disabled:cursor-not-allowed z-0" type="submit">
        <SendIcon className="size-4" />
        <span className="sr-only">Send</span>
      </button>
    </form>
  );
}

function ChatMessages ({}: {}) {
  const requestScroll = useRequestScroll();
  const { settings } = use(RootContext);
  const askStore = useAskStore();
  const { messages } = useStore(askStore);

  useEffect(() => {
    return askStore.subscribe(() => {
      requestScroll('bottom');
    });
  }, [askStore]);

  return (
    <ConversationLayout
      messages={messages}
      assistantName={settings.title}
      assistantAvatar={
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 745 745" fill="none">
          <circle cx="372.5" cy="372.5" r="372.5" fill="var(--color-primary)" strokeWidth="24"></circle>
          <rect x="298" y="172" width="150" height="150" rx="24" fill="var(--color-primary-foreground)"></rect>
          <rect x="298" y="422" width="150" height="150" rx="24" fill="var(--color-primary-foreground)"></rect>
        </svg>
      }
      onFeedbackSubmitted={(current, action) => {
        askStore.setState(({ messages }) => ({
          messages: messages.map(message => {
            if (message.id === current.id) {
              return {
                ...message,
                isFeedbackSubmitted: true,
                feedback: action,
              };
            } else {
              return message;
            }
          }) as typeof messages,
        }));
      }}
    />
  );
}
