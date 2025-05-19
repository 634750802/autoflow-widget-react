import { bufferedReadableStreamTransformer, handleErrors, handleResponse, requestUrl } from './api-utils.ts';
import { type BootstrapStatus, bootstrapStatusSchema, type FeedbackParams, type PostChatParams, type PublicWebsiteSettings } from './autoflow-types.ts';
import { parseStreamPart } from './protocol.js';
import type { ScriptConfig } from './resolve-script-config.ts';

export async function getBootstrapStatus (config: ScriptConfig): Promise<BootstrapStatus> {
  return await fetch(requestUrl(config, `/api/v1/system/bootstrap-status`), {
    headers: {},
    credentials: 'include',
  }).then(handleResponse(bootstrapStatusSchema));
}

export async function getPublicSiteSettings (config: ScriptConfig): Promise<PublicWebsiteSettings> {
  return fetch(requestUrl(config, `/api/v1/site-config`), {
    credentials: 'include',
  }).then(handleErrors).then(res => res.json());
}

export async function* chat (config: ScriptConfig, { chat_id, chat_engine, content, headers: headersInit, signal }: PostChatParams, onResponse?: (response: Response) => void) {
  const headers = new Headers(headersInit);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(requestUrl(config, `/api/v1/chats`), {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      chat_id,
      chat_engine,
      stream: true,
      messages: [{
        'role': 'user',
        content,
      }],
    }),
    signal,
  }).then(handleErrors);

  onResponse?.(response);

  if (!response.body) {
    throw new Error(`${response.status} ${response.statusText} Empty response body`);
  }

  const reader = response.body.pipeThrough(bufferedReadableStreamTransformer()).getReader();

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }

    if (!!chunk.value.trim()) {
      yield parseStreamPart(chunk.value);
    }
  }
}

export async function postFeedback (config: ScriptConfig, chatMessageId: number, feedback: FeedbackParams) {
  return await fetch(requestUrl(config, `/api/v1/chat-messages/${chatMessageId}/feedback`), {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(feedback),
  }).then(handleErrors);
}
