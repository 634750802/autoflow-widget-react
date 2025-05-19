export interface ScriptConfig {
  src: string;
  apiBase: string | undefined;
  controlled: boolean;
  trigger: true | HTMLElement | null;
  chatEngine: string | undefined;
  measurementId: string | undefined;
}

export function resolveScriptConfig (document: Document): ScriptConfig {
  const script = document.currentScript as HTMLScriptElement ?? document.querySelector('script[data-api-base]') as HTMLScriptElement;
  if (!script) {
    throw new Error('Cannot locate document.currentScript');
  }

  const src = script.src;
  const apiBase = script.dataset.apiBase;
  const controlled = script.dataset.controlled === 'true';
  const trigger = controlled ? true : document.getElementById('tidb-ai-trigger');
  const chatEngine = script.dataset.chatEngine;
  const measurementId = script.dataset.measurementId;

  return {
    src,
    apiBase,
    controlled,
    trigger,
    chatEngine,
    measurementId,
  };
}