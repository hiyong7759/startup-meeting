interface LlmRequestBody {
  system: string;
  message: string;
  model?: string;
  maxTokens?: number;
}

interface LlmResponseBody {
  text: string;
  model: string;
  mode: 'api';
  tokensUsed?: number;
}

const MODEL_MAP: Record<string, string> = {
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5-20251001',
  opus: 'claude-opus-4-6',
};

export async function apiHandler(body: LlmRequestBody, apiKey: string): Promise<LlmResponseBody> {
  const model = MODEL_MAP[body.model ?? 'sonnet'] ?? body.model ?? 'claude-sonnet-4-6';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: body.maxTokens ?? 1024,
      system: body.system,
      messages: [{ role: 'user', content: body.message }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API ${response.status}: ${errorText}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
    model: string;
    usage?: { input_tokens: number; output_tokens: number };
  };

  const text = data.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('');

  return {
    text,
    model: data.model,
    mode: 'api',
    tokensUsed: data.usage ? data.usage.input_tokens + data.usage.output_tokens : undefined,
  };
}
