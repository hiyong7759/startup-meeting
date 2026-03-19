export type LlmMode = 'cli' | 'api';

export interface LlmConfig {
  mode: LlmMode;
  apiKey?: string;
  serverUrl?: string;
}

export interface LlmRequest {
  system: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
}

export interface LlmResponse {
  text: string;
  model: string;
  tokensUsed?: number;
}

let config: LlmConfig = {
  mode: 'cli',
  serverUrl: 'http://localhost:3001',
};

export function configureLlm(newConfig: Partial<LlmConfig>): void {
  config = { ...config, ...newConfig };
}

export function getLlmConfig(): LlmConfig {
  return { ...config };
}

// Non-streaming: wait for full response (used for setup/evaluation)
export async function callLlm(request: LlmRequest): Promise<LlmResponse> {
  const serverUrl = config.serverUrl ?? 'http://localhost:3001';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-llm-mode': config.mode,
  };

  if (config.mode === 'api' && config.apiKey) {
    headers['x-api-key'] = config.apiKey;
  }

  const response = await fetch(`${serverUrl}/api/llm`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      system: request.system,
      message: request.userMessage,
      model: request.model ?? 'sonnet',
      maxTokens: request.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
    throw new Error(error.error ?? `LLM proxy error: ${response.status}`);
  }

  const data = await response.json() as { text: string; model: string; tokensUsed?: number };
  return { text: data.text, model: data.model, tokensUsed: data.tokensUsed };
}

// Streaming: get chunks in real-time via SSE (used for meeting dialogue)
// Pass an AbortSignal to cancel mid-stream (e.g. user interrupts)
export async function callLlmStream(
  request: LlmRequest,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<LlmResponse> {
  const serverUrl = config.serverUrl ?? 'http://localhost:3001';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) {
    headers['x-api-key'] = config.apiKey;
  }

  const response = await fetch(`${serverUrl}/api/llm/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      system: request.system,
      message: request.userMessage,
      model: request.model ?? 'haiku',
      maxTokens: request.maxTokens ?? 1024,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM stream error: ${response.status} ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body for streaming');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;

      try {
        const event = JSON.parse(jsonStr) as { type: string; text?: string; error?: string };
        if (event.type === 'chunk' && event.text) {
          fullText += event.text;
          onChunk(event.text);
        } else if (event.type === 'done') {
          if (event.text) fullText = event.text;
        } else if (event.type === 'error') {
          throw new Error(event.error ?? 'Stream error');
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }

  return { text: fullText, model: request.model ?? 'haiku' };
}
