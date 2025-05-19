import { afterEach, beforeEach, vitest } from 'vitest';

type MockedRequestResponses = Record<string, (request: Request) => Promise<Response>>

const handlers: MockedRequestResponses = {};

function mockFetches () {
  globalThis.fetch = vitest.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let requestUrlString: string;
    if (typeof input === 'string') {
      requestUrlString = input;
    } else if (input instanceof Request) {
      requestUrlString = input.url;
    } else {
      requestUrlString = input.toString();
    }

    const url = new URL(requestUrlString, 'https://example.com');

    const responseHandler = handlers[url.pathname];

    if (responseHandler) {
      return responseHandler(new Request(input instanceof Request ? input : url, init));
    } else {
      return Promise.resolve(new Response(null, { status: 404 }));
    }
  });
}

function unmockFetches () {
  Object.keys(handlers).forEach(key => {
    delete handlers[key];
  });
}

beforeEach(mockFetches);
afterEach(unmockFetches);

export function mockFetch (path: string, handler: (request: Request) => Promise<Response>) {
  handlers[path] = handler;
}
