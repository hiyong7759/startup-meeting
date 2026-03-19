interface Env {
  ALLOWED_ORIGINS: string;
}

interface LlmRequestBody {
  system: string;
  message: string;
  model?: string;
  maxTokens?: number;
}

const MODEL_MAP: Record<string, string> = {
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5-20251001',
  opus: 'claude-opus-4-6',
};

function corsHeaders(origin: string, allowedOrigins: string): Record<string, string> {
  const allowed = allowedOrigins.split(',').map((o) => o.trim());
  const isAllowed = allowed.includes(origin) || allowed.includes('*');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const headers = corsHeaders(origin, env.ALLOWED_ORIGINS);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', mode: 'api' }, { headers });
    }

    if (url.pathname === '/api/llm' && request.method === 'POST') {
      return handleBatch(request, headers);
    }

    if (url.pathname === '/api/llm/stream' && request.method === 'POST') {
      return handleStream(request, headers);
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers });
  },
};

async function handleBatch(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return Response.json({ error: 'x-api-key header required' }, { status: 401, headers: corsHeaders });
  }

  const body = await request.json() as LlmRequestBody;
  const model = MODEL_MAP[body.model ?? 'sonnet'] ?? body.model ?? 'claude-sonnet-4-6';

  const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
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

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    return Response.json({ error: `Claude API ${apiResponse.status}: ${errorText}` }, {
      status: apiResponse.status,
      headers: corsHeaders,
    });
  }

  const data = await apiResponse.json() as {
    content: Array<{ type: string; text: string }>;
    model: string;
    usage?: { input_tokens: number; output_tokens: number };
  };

  const text = data.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('');

  return Response.json({
    text,
    model: data.model,
    tokensUsed: data.usage ? data.usage.input_tokens + data.usage.output_tokens : undefined,
  }, { headers: corsHeaders });
}

async function handleStream(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return Response.json({ error: 'x-api-key header required' }, { status: 401, headers: corsHeaders });
  }

  const body = await request.json() as LlmRequestBody;
  const model = MODEL_MAP[body.model ?? 'haiku'] ?? body.model ?? 'claude-haiku-4-5-20251001';

  const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
      stream: true,
    }),
  });

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    return Response.json({ error: `Claude API ${apiResponse.status}: ${errorText}` }, {
      status: apiResponse.status,
      headers: corsHeaders,
    });
  }

  // Transform Anthropic SSE stream -> our SSE format
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    const reader = apiResponse.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              const chunk = event.delta.text;
              fullText += chunk;
              await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`));
            }
          } catch {
            // skip malformed SSE events
          }
        }
      }

      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done', text: fullText })}\n\n`));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
