import fs from 'fs';
import { beforeEach } from 'vitest';
import type { BootstrapStatus, PublicWebsiteSettings } from '../../src/utils/autoflow-types.ts';
import { mockFetch } from './mock-fetches.ts';

export function mockNormalBootstrapStatus () {
  mockFetch('/api/v1/system/bootstrap-status', async (): Promise<Response> => {

    return Response.json({
      need_migration: {},
      required: {
        default_chat_engine: true,
        default_embedding_model: true,
        default_llm: true,
        knowledge_base: true,
      },
      optional: {
        langfuse: true,
        default_reranker: true,
      },
    } satisfies BootstrapStatus);
  });
}

export function mockNormalSiteConfig () {
  mockFetch('/api/v1/site-config', async (): Promise<Response> => {
    return Response.json({
      'title': 'Test Title',
      'description': 'Test Description',
      'homepage_title': '',
      'homepage_example_questions': [],
      'homepage_footer_links': [],
      'logo_in_dark_mode': 'test-logo-dark',
      'logo_in_light_mode': 'test-logo-light',
      'social_github': null,
      'social_twitter': null,
      'social_discord': null,
      'custom_js_example_questions': ['Test Example Question 1', 'Test Example Question 2'],
      'custom_js_button_label': 'Test Button Label',
      'custom_js_button_img_src': 'Test Button Image',
      'custom_js_logo_src': 'Test Logo Src',
      'ga_id': null,
      'max_upload_file_size': null,
      'enable_post_verifications': false,
      'enable_post_verifications_for_widgets': false,
    } satisfies PublicWebsiteSettings);
  });
}

export function mockNormals () {
  beforeEach(() => {
    mockNormalBootstrapStatus();
    mockNormalSiteConfig();
  });
}

export function mockChat (filename: string) {
  mockFetch('/api/v1/chats', async () => {
    return new Response(new ReadableStream({
      type: 'bytes',
      start: controller => {
        const readStream = fs.createReadStream(filename);

        readStream.on('data', data => {
          controller.enqueue(data as Buffer<ArrayBufferLike>);
        });

        readStream.on('end', () => {
          controller.close();
        });
      },
    }));
  });
}

interface ControlledChatStream {
  readonly next: (n: number) => boolean;
}

let currentChat: ControlledChatStream | undefined;

export function getCurrentChat () {
  return currentChat;
}

export function mockChatDetailed (filename: string) {
  mockFetch('/api/v1/chats', async () => {
    return new Response(new ReadableStream({
      start: async controller => {
        const encoder = new TextEncoder();

        if (currentChat) {
          throw new Error('You can mock a detailed chat once for same time.');
        }


        let i = 0;
        const content = await fs.promises.readFile(filename, { encoding: 'utf-8' });

        const lines = content.split('\n');
        const total = lines.length;

        currentChat = {
          next,
        };

        function next (n: number) {
          let j = i;
          for (; j < Math.min(i + n, total); j++) {
            controller.enqueue(encoder.encode(lines[j] + '\n'));
          }
          i = j;
          if (j >= total) {
            controller.close();
            currentChat = undefined;
          }
          return j < total;
        }
      },
    }));
  });

  return {
    next () {},
  };
}
