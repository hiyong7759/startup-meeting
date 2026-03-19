import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

interface LlmRequestBody {
  system: string;
  message: string;
  model?: string;
  maxTokens?: number;
}

interface LlmResponseBody {
  text: string;
  model: string;
  mode: 'cli';
}

// Non-streaming: wait for full response
export async function cliHandler(body: LlmRequestBody): Promise<LlmResponseBody> {
  const model = body.model ?? 'sonnet';
  const fullPrompt = body.system
    ? `${body.system}\n\n---\n\n${body.message}`
    : body.message;

  try {
    const { stdout } = await execFileAsync('claude', [
      '--print',
      '--model', model,
      fullPrompt,
    ], {
      timeout: 120000,
      maxBuffer: 1024 * 1024,
      env: { ...process.env },
    });

    return { text: stdout.trim(), model, mode: 'cli' };
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error('Claude CLI not found. Install: npm install -g @anthropic-ai/claude-code');
    }
    throw error;
  }
}

// Streaming: parse stream-json output and yield text chunks
export function cliStreamHandler(
  body: LlmRequestBody,
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void,
  onError: (error: Error) => void,
): void {
  const model = body.model ?? 'haiku';
  const fullPrompt = body.system
    ? `${body.system}\n\n---\n\n${body.message}`
    : body.message;

  const proc = spawn('claude', [
    '--print',
    '--model', model,
    '--output-format', 'stream-json',
    '--verbose',
    fullPrompt,
  ], {
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let fullText = '';
  let buffer = '';

  proc.stdout.on('data', (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);

        // stream-json format: {"type":"assistant","message":{"content":[{"type":"text","text":"..."}]}}
        if (parsed.type === 'assistant' && parsed.message?.content) {
          for (const block of parsed.message.content) {
            if (block.type === 'text' && block.text) {
              // This is incremental — each assistant message contains the NEW text portion
              const newText = block.text;
              if (newText.length > fullText.length) {
                const chunk = newText.slice(fullText.length);
                fullText = newText;
                onChunk(chunk);
              } else if (newText && !fullText) {
                fullText = newText;
                onChunk(newText);
              }
            }
          }
        }

        // Final result
        if (parsed.type === 'result' && parsed.result) {
          fullText = parsed.result;
        }
      } catch {
        // Skip non-JSON lines
      }
    }
  });

  proc.stderr.on('data', (data: Buffer) => {
    console.error('[CLI stderr]', data.toString().slice(0, 200));
  });

  proc.on('close', () => {
    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        if (parsed.type === 'result' && parsed.result) {
          fullText = parsed.result;
        }
      } catch {
        // ignore
      }
    }
    onDone(fullText);
  });

  proc.on('error', (err) => {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      onError(new Error('Claude CLI not found'));
    } else {
      onError(err);
    }
  });
}
