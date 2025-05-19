import { z, ZodError, type ZodType } from 'zod';
import { type ScriptConfig } from './resolve-script-config.ts';

export function requestUrl (config: ScriptConfig, pathname: string, searchParams?: object) {
  let url = config.apiBase + pathname;

  if (searchParams) {
    const usp = buildUrlParams(searchParams).toString();
    if (usp) {
      url += '?' + usp;
    }
  }

  return url;
}

export function buildUrlParams (object: object) {
  const usp = new URLSearchParams();

  for (let key of Object.keys(object)) {
    const value = (object as any)[key];

    if (value == null) {
      continue;
    }

    if (value instanceof Array) {
      for (let item of value) {
        usp.append(key, stringify(item));
      }
    } else {
      usp.append(key, stringify(value));
    }
  }

  return usp;
}

function stringify (item: any) {
  if (item instanceof Date) {
    return item.toISOString();
  } else {
    return String(item);
  }
}

export async function handleErrors (responseOrPromise: Response | PromiseLike<Response>): Promise<Response> {
  const response = await responseOrPromise;
  if (response.ok) {
    return response;
  }

  try {
    const jsonBody = await response.clone().json();
    return Promise.reject(normalizeServerErrors(response, jsonBody));
  } catch {
    try {
      const textBody = await response.clone().text();
      return Promise.reject(normalizeServerErrors(response, textBody));
    } catch {
      return Promise.reject(normalizeServerErrors(response, `${response.status} ${response.statusText}`));
    }
  }
}

export function handleResponse<S extends ZodType> (schema: S): ((responseOrPromise: Response | PromiseLike<Response>) => Promise<z.infer<S>>) {
  return async (responseOrPromise) => {
    const response = await Promise.resolve(responseOrPromise).then(handleErrors);
    const body = await response.json();

    try {
      return schema.parse(body);
    } catch (e) {
      console.error(e);
      console.error(`Cannot parse response json data for ${response.url} ${response.status}, check your frontend and backend versions.`, e);
      throw e;
    }
  };
}

export function handleNullableResponse<S extends ZodType> (schema: S): ((responseOrPromise: Response | PromiseLike<Response>) => Promise<z.infer<S> | null>) {
  return async (responseOrPromise) => {
    const response = await responseOrPromise;

    if (response.status === 404) {
      return null;
    }

    await handleErrors(response);
    const body = await response.json();

    try {
      return schema.parse(body);
    } catch (e) {
      console.error(e);
      console.error(`Cannot parse response json data for ${response.url} ${response.status}, check your frontend and backend versions.`, 2);
      throw e;
    }
  };
}

export class ServerError extends Error {
  public readonly response: Response;

  constructor (response: Response, message: string) {
    if (response.headers.get('Content-Type')?.includes('text/html') || message.trimStart().startsWith('<!DOCTYPE') || message.trimStart().startsWith('<html')) {
      message = `${response.status} ${response.statusText} HTML Error Page`;
    }
    super(message);
    this.response = response;
  }
}

export function isServerError (error: unknown, status?: number | number[]): error is ServerError {
  if (error instanceof ServerError) {
    if (status) {
      if (typeof status === 'number') {
        return error.response.status === status;
      } else {
        return status.includes(error.response.status);
      }
    }
  }

  return false;
}

export function normalizeServerErrors (response: Response, error: unknown): ServerError {
  if (error == null) {
    return new ServerError(response, 'No error detail');
  }

  if (typeof error === 'object') {
    if ('detail' in error && error.detail != null) {
      if (typeof error.detail === 'string') {
        return new ServerError(response, error.detail);
      }
      if (error.detail instanceof Array && error.detail[0] != null) {
        return new ServerError(response, error.detail[0].msg ?? String(error.detail[0]));
      }
    }
    if ('message' in error) {
      return new ServerError(response, String(error.message));
    }
  }

  console.error(error);

  return new ServerError(response, String(error));
}

export function bufferedReadableStreamTransformer (): TransformStream<any, string> {
  const decoder = new TextDecoder();
  const buffer: string[] = [];

  const appendTextChunk = (chunk: string) => {
    if (buffer.length > 0 && !buffer[buffer.length - 1].endsWith('\n')) {
      buffer[buffer.length - 1] += chunk;
    } else {
      buffer.push(chunk);
    }
  };

  const extractLines = () => {
    const lines: string[] = [];
    while (true) {
      const data = buffer.shift();
      if (data == null) break;

      if (buffer.length > 0) {
        // This branch might be never executed.
        lines.push(...data.split('\n'));
      } else {
        let start = 0, end: number = 0;

        while (start < data.length) {
          end = data.indexOf('\n', start);
          if (end === -1) {
            break;
          }

          lines.push(data.slice(start, end));
          start = end + 1;
        }

        if (start < data.length) {
          buffer.push(data.slice(start));
        }

        break;
      }
    }

    return lines;
  };

  return new TransformStream<any, string>({
    transform (chunk, controller) {
      const textChunk = decoder.decode(chunk, { stream: true });
      appendTextChunk(textChunk);
      extractLines().forEach(line => controller.enqueue(line));
    },
    flush (controller) {
      const lines = extractLines();
      lines.forEach(line => controller.enqueue(line));
      if (buffer.length > 0) {
        console.error('Stream is not finished, ignoring last chunk', buffer[0]);
      }
    },
  });
}

export function getErrorMessage (e: unknown) {
  if (!e) {
    return 'Unknown error';
  }
  if (typeof e !== 'object') {
    return String(e);
  }

  if (e instanceof ZodError) {
    return `JSON validation failed: ${e.format()._errors.join(', ')}.`;
  }

  return ((e as any).message) || ((e as any).name) || String(e);
}

export function getErrorName (error: unknown) {
  if (!error) {
    return 'UNKNOWN';
  }
  if (typeof error === 'object') {
    return error.constructor.name;
  }
  return String(error);
}
