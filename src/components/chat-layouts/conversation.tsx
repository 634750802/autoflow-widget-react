import { Loader2Icon, ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import { cloneElement, type ReactElement, type ReactNode, useContext, useState } from 'react';
import { type ChatMessage, isIncomingMessage } from '../../store/ask.ts';
import { postFeedback } from '../../utils/api.ts';
import type { FeedbackParams } from '../../utils/autoflow-types.ts';
import cn from '../../utils/cn.ts';
import { Dialog } from '../dialog.tsx';
import { Remark } from '../remark.tsx';
import { RootContext } from '../root-provider.tsx';

export interface ConversationLayoutProps {
  className?: string,
  messages: ChatMessage[],
  assistantName: string
  assistantAvatar: ReactElement<{ className?: string }>
  userName?: string
  userAvatar?: ReactElement<{ className?: string }>
  onFeedbackSubmitted?: (message: ChatMessage, action: 'like' | 'dislike') => void
}

export function ConversationLayout ({ messages, assistantName, assistantAvatar, userAvatar, userName, onFeedbackSubmitted, className }: ConversationLayoutProps) {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      {messages.map(message => {
        if (message.role === 'assistant') {
          return (
            <ConversationItem key={message.id} avatar={assistantAvatar} name={assistantName} position="left" messageId={message.id} allowFeedback={!message.incoming} disableFeedback={message.isFeedbackSubmitted} highlightedType={message.feedback} onFeedbackSubmitted={(action) => onFeedbackSubmitted?.(message, action)}>
              <Remark content={message.content} className="bg-zinc-100" />
              {isIncomingMessage(message) && (
                <p className="text-disabled-foreground text-xs">
                  <Loader2Icon className="mr-1 animate-spin size-3 inline-flex" />
                  {message.totalSteps > 0 && `[${message.currentStep}/${message.totalSteps}] `}
                  {message.statusMessage}
                </p>
              )}
            </ConversationItem>
          );
        } else {
          return (
            <ConversationItem key={message.id} avatar={userAvatar} name={userName} position="right" messageId={message.id}>
              <Remark content={message.content} className="bg-sky-100" />
            </ConversationItem>
          );
        }
      })}
    </div>
  );
}

function ConversationItem ({
  position,
  avatar,
  name,
  children,
  messageId,
  allowFeedback,
  disableFeedback,
  highlightedType,
  onFeedbackSubmitted,
}: {
  position: 'left' | 'right',
  avatar?: ReactElement<{ className?: string }>,
  name?: ReactNode,
  children: ReactNode,
  messageId: number,
  allowFeedback?: boolean
  disableFeedback?: boolean
  highlightedType?: 'like' | 'dislike';
  onFeedbackSubmitted?: (action: 'like' | 'dislike') => void
}) {
  return (
    <div className={cn('flex gap-2', position === 'right' ? 'justify-start flex-row-reverse text-right' : 'justify-start')}>
      {avatar && <div className="size-9 shrink-0 rounded-full overflow-hidden">
        {cloneElement(avatar, { className: cn('size-full', avatar.props.className) })}
      </div>}
      <div className="space-y-1">
        {name && <div className="text-xs text-disabled-foreground">{name}</div>}
        {children}
        {allowFeedback && <FeedbackItem chatMessageId={messageId} submitted={!!disableFeedback} highlightedType={highlightedType} onSubmitted={onFeedbackSubmitted} />}
      </div>
    </div>
  );
}

export function FeedbackItem ({ chatMessageId, highlightedType, submitted, onSubmitted }: { chatMessageId: number, highlightedType?: 'like' | 'dislike', submitted: boolean, onSubmitted?: (action: 'like' | 'dislike') => void }) {
  const [feedback, setFeedback] = useState<FeedbackParams>();
  const [open, setOpen] = useState(false);
  const { scriptConfig } = useContext(RootContext);

  const handleSubmit = () => {
    if (feedback) {
      postFeedback(scriptConfig, chatMessageId, feedback)
        .finally(() => {
          onSubmitted?.(feedback.feedback_type);
          setOpen(false);
        });
    }
  };

  return (
    <div className="flex gap-2">
      <button className={cn('text-disabled-foreground hover:text-green-500 transition-colors cursor-pointer aria-disabled:pointer-events-none', highlightedType === 'like' && 'text-green-500', highlightedType === 'dislike' && 'hidden')} disabled={submitted} onClick={() => {
        setFeedback({ feedback_type: 'like', comment: '' });
        setOpen(true);
      }}>
        <ThumbsUpIcon className="size-4" />
      </button>
      <button className={cn('text-disabled-foreground hover:text-red-500 transition-colors cursor-pointer aria-disabled:pointer-events-none', highlightedType === 'dislike' && 'text-red-500', highlightedType === 'like' && 'hidden')} disabled={submitted} onClick={() => {
        setFeedback({ feedback_type: 'dislike', comment: '' });
        setOpen(true);
      }}>
        <ThumbsDownIcon className="size-4" />
      </button>
      <Dialog id="feedback" onOpenChange={setOpen} open={open} zIndexBase={2000} className="max-w-lg p-4 space-y-4">
        <div className="flex items-center gap-4 w-full">
          <button className={cn('text-sm flex-1 rounded p-2 flex items-center justify-center gap-2 bg-zinc-50 text-disabled-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors cursor-pointer', feedback?.feedback_type === 'like' ? ' text-green-500 bg-green-500/10' : '')} disabled={submitted} onClick={() => setFeedback(feedback => ({ feedback_type: 'like' as const, comment: feedback?.comment ?? '' }))}>
            Like
            <ThumbsUpIcon className="size-4" />
          </button>
          <button className={cn('text-sm flex-1 rounded p-2 flex items-center justify-center gap-2 bg-zinc-50 text-disabled-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer', feedback?.feedback_type === 'dislike' ? ' text-red-500 bg-red-500/10' : '')} disabled={submitted} onClick={() => setFeedback(feedback => ({ feedback_type: 'dislike' as const, comment: feedback?.comment ?? '' }))}>
            Dislike
            <ThumbsDownIcon className="size-4" />
          </button>
        </div>
        <textarea className="h-36 w-full border rounded-lg p-2 text-sm resize-none" placeholder="Input your feedback..." value={feedback?.comment ?? ''} onChange={ev => {
          setFeedback(feedback => ({ feedback_type: feedback?.feedback_type ?? 'like', comment: ev.target.value }));
        }} />
        <button className="w-full p-2 bg-zinc-100 text-zinc-700 rounded cursor-pointer transition-colors hover:bg-zinc-200 hover:text-zinc-900 text-sm" onClick={handleSubmit}>
          Submit Feedback
        </button>
      </Dialog>
    </div>
  );
}