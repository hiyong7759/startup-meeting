import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import { cliHandler, cliStreamHandler } from './cli-handler';
import { apiHandler } from './api-handler';

const app = new Hono();

app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5180'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'x-api-key', 'x-llm-mode'],
}));

app.get('/health', (c) => c.json({ status: 'ok', modes: ['cli', 'api'] }));

// Non-streaming endpoint (for setup/evaluation where we need full JSON)
app.post('/api/llm', async (c) => {
  const body = await c.req.json();
  const mode = c.req.header('x-llm-mode') ?? body.mode ?? 'cli';

  const start = Date.now();
  const model = body.model ?? 'sonnet';
  console.log(`[REQ] ${mode}/${model} — ${(body.message ?? '').slice(0, 60)}...`);

  try {
    if (mode === 'api') {
      const apiKey = c.req.header('x-api-key') ?? body.apiKey;
      if (!apiKey) {
        return c.json({ error: 'API key required for api mode' }, 400);
      }
      const result = await apiHandler(body, apiKey);
      console.log(`[RES] ${mode}/${model} — ${Date.now() - start}ms — ${result.text.slice(0, 80)}...`);
      return c.json(result);
    }

    const result = await cliHandler(body);
    console.log(`[RES] ${mode}/${model} — ${Date.now() - start}ms — ${result.text.slice(0, 80)}...`);
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ERR] ${mode}/${model} — ${Date.now() - start}ms — ${message}`);
    return c.json({ error: message }, 500);
  }
});

// Streaming endpoint (for meeting dialogue — real-time character speech)
app.post('/api/llm/stream', async (c) => {
  const body = await c.req.json();
  const model = body.model ?? 'haiku';
  const start = Date.now();
  console.log(`[STREAM] cli/${model} — ${(body.message ?? '').slice(0, 60)}...`);

  return streamSSE(c, async (stream) => {
    await new Promise<void>((resolve, reject) => {
      cliStreamHandler(
        body,
        (chunk) => {
          stream.writeSSE({ data: JSON.stringify({ type: 'chunk', text: chunk }) });
        },
        (fullText) => {
          console.log(`[STREAM DONE] cli/${model} — ${Date.now() - start}ms — ${fullText.slice(0, 80)}...`);
          stream.writeSSE({ data: JSON.stringify({ type: 'done', text: fullText }) });
          resolve();
        },
        (error) => {
          console.error(`[STREAM ERR] cli/${model} — ${Date.now() - start}ms — ${error.message}`);
          stream.writeSSE({ data: JSON.stringify({ type: 'error', error: error.message }) });
          reject(error);
        },
      );
    });
  });
});

const port = 3001;
console.log(`LLM Proxy Server running on http://localhost:${port}`);
console.log(`Modes: CLI (claude subprocess) | API (BYOK proxy)`);
console.log(`Endpoints: POST /api/llm (batch) | POST /api/llm/stream (SSE)`);

serve({ fetch: app.fetch, port });
