import { type parseStreamPart } from 'ai';

declare const _parseStreamPart: typeof parseStreamPart;

export type AppChatStreamState = 'CONNECTING' | 'TRACE' | 'SOURCE_NODES' | 'KG_RETRIEVAL' | 'REFINE_QUESTION' | 'SEARCH_RELATED_DOCUMENTS' | 'RERANKING' | 'GENERATE_ANSWER' | 'FINISHED' | 'FAILED' | 'UNKNOWN'

export type StackVMToolCall = { toolCallId: string, toolName: string, args: any, result?: any }

export type StackVMState = {
  task_id: string;
  branch: string;
  state: /**StackVM.ParsedState**/ unknown;
  seq_no: number;
  toolCalls: StackVMToolCall[];
};

export interface BaseAnnotation<S extends AppChatStreamState | StackVMState> {
  state: S;
  display?: string;
}

export { _parseStreamPart as parseStreamPart };
