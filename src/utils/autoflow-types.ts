import { z } from 'zod';

export interface PublicWebsiteSettings {
  'title': string;
  'description': string;
  'homepage_title': string;
  'homepage_example_questions': string[];
  'homepage_footer_links': { text: string, href: string }[];
  'logo_in_dark_mode': string;
  'logo_in_light_mode': string;
  'social_github': string | null;
  'social_twitter': string | null;
  'social_discord': string | null;
  'custom_js_example_questions': string[];
  'custom_js_button_label': string;
  'custom_js_button_img_src': string;
  'custom_js_logo_src': string;
  'ga_id': string | null;
  'max_upload_file_size': number | null;
  'enable_post_verifications': boolean;
  'enable_post_verifications_for_widgets': boolean;
}

export interface RequiredBootstrapStatus {
  default_llm: boolean;
  default_embedding_model: boolean;
  default_chat_engine: boolean;
  knowledge_base: boolean;
}

export interface OptionalBootstrapStatus {
  langfuse: boolean;
  default_reranker: boolean;
}

export interface NeedMigrationStatus {
  chat_engines_without_kb_configured?: number[];
}

export interface BootstrapStatus {
  required: RequiredBootstrapStatus;
  optional: OptionalBootstrapStatus;
  need_migration: NeedMigrationStatus;
}

export function isBootstrapStatusPassed (bootstrapStatus: BootstrapStatus): boolean {
  return Object.values(bootstrapStatus.required).reduce((res, flag) => res && flag, true);
}

export interface PostChatParams {
  chat_id?: string;
  chat_engine?: string;
  content: string;

  headers?: HeadersInit;
  signal?: AbortSignal;
}

const requiredBootstrapStatusSchema = z.object({
  default_llm: z.boolean(),
  default_embedding_model: z.boolean(),
  default_chat_engine: z.boolean(),
  knowledge_base: z.boolean(),
});

const optionalBootstrapStatusSchema = z.object({
  langfuse: z.boolean(),
  default_reranker: z.boolean(),
});

const needMigrationStatusSchema = z.object({
  chat_engines_without_kb_configured: z.number().array().optional(),
});

export const bootstrapStatusSchema = z.object({
  required: requiredBootstrapStatusSchema,
  optional: optionalBootstrapStatusSchema,
  need_migration: needMigrationStatusSchema,
});

export interface FeedbackParams {
  feedback_type: 'like' | 'dislike';
  comment: string;
}