import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline, AutoTokenizer } from '@huggingface/transformers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_REPO_ID = 'Xenova/t5-small';
const DISPLAY_MODEL_ID = 'google-t5/t5-small';

type TokenItem = {
  token: string;
  id: number;
};

type Text2TextPipe = Awaited<ReturnType<typeof pipeline<'text2text-generation'>>>;
type TokenizerInstance = Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>>;

let pipePromise: Promise<Text2TextPipe> | null = null;
let tokenizerPromise: Promise<TokenizerInstance> | null = null;
let modelLoaded = false;
let modelLoadError: string | null = null;

function getTokenizer(): Promise<TokenizerInstance> {
  if (!tokenizerPromise) {
    tokenizerPromise = AutoTokenizer.from_pretrained(MODEL_REPO_ID).catch((err) => {
      tokenizerPromise = null;
      throw err;
    });
  }
  return tokenizerPromise;
}

function getPipeline(): Promise<Text2TextPipe> {
  if (!pipePromise) {
    modelLoadError = null;
    pipePromise = pipeline('text2text-generation', MODEL_REPO_ID, {
      dtype: 'q8',
    })
      .then((loadedPipe) => {
        modelLoaded = true;
        return loadedPipe;
      })
      .catch((err: unknown) => {
        modelLoadError = err instanceof Error ? err.message : 'Failed to load model';
        pipePromise = null;
        throw err;
      });
  }
  return pipePromise;
}

function buildTokenItems(tokenizer: TokenizerInstance, text: string): TokenItem[] {
  if (!text) return [];
  const encoded = tokenizer(text);
  const rawIds = Array.from(encoded.input_ids.data as Iterable<number | bigint>, (x) => Number(x));
  const rawPieces = tokenizer.tokenize(text);

  return rawIds.map((id, idx) => {
    if (id === 0) return { token: '<pad>', id };
    if (id === 1) return { token: '</s>', id };
    if (id === 2) return { token: '<unk>', id };
    if (idx < rawPieces.length) {
      return { token: rawPieces[idx], id };
    }
    const decoded = tokenizer.decode([id], { skip_special_tokens: false });
    return { token: decoded || `[${id}]`, id };
  });
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      modelId: DISPLAY_MODEL_ID,
      onnxRepo: MODEL_REPO_ID,
      modelLoaded,
      loading: Boolean(pipePromise && !modelLoaded),
      error: modelLoadError,
    });
  });

  app.post('/api/tokenize', async (req, res) => {
    try {
      const text = typeof req.body?.text === 'string' ? req.body.text : '';
      if (!text.trim()) {
        res.json({ tokens: [], count: 0 });
        return;
      }
      const boundedText = text.slice(0, 8000);
      const tokenizer = await getTokenizer();
      const tokens = buildTokenItems(tokenizer, boundedText);
      res.json({
        tokens,
        count: tokens.length,
        truncated: tokens.length > 512,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Tokenization failed';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/generate', async (req, res) => {
    try {
      const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
      const prefix = typeof req.body?.prefix === 'string' ? req.body.prefix : '';
      if (!rawText) {
        res.status(400).json({ error: 'Input text is required.' });
        return;
      }

      const maxNewTokens = Math.min(300, Math.max(8, Number(req.body?.maxNewTokens) || 128));
      const numBeams = Math.min(6, Math.max(1, Number(req.body?.numBeams) || 4));
      const noRepeatNgramSize = Math.min(5, Math.max(0, Number(req.body?.noRepeatNgramSize ?? 3)));
      const doSample = Boolean(req.body?.doSample);
      const temperature = Math.min(2.0, Math.max(0.1, Number(req.body?.temperature) || 1.0));
      const minLength = Math.min(maxNewTokens, Math.max(0, Number(req.body?.minLength) || 0));
      const lengthPenalty = Math.min(3.0, Math.max(0.2, Number(req.body?.lengthPenalty) || 1.0));

      const fullPrompt = prefix ? `${prefix}${rawText}` : rawText;

      const [pipe, tokenizer] = await Promise.all([getPipeline(), getTokenizer()]);
      const inputTokens = buildTokenItems(tokenizer, fullPrompt);

      const genOptions: Record<string, unknown> = {
        max_new_tokens: maxNewTokens,
        num_beams: doSample ? 1 : numBeams,
        do_sample: doSample,
        early_stopping: true,
        length_penalty: lengthPenalty,
      };

      if (noRepeatNgramSize > 0) {
        genOptions.no_repeat_ngram_size = noRepeatNgramSize;
      }
      if (minLength > 0) {
        genOptions.min_length = minLength;
      }
      if (doSample) {
        genOptions.temperature = temperature;
      }

      const t0 = performance.now();
      const result = await pipe(fullPrompt, genOptions);
      const latencyMs = Math.round(performance.now() - t0);

      const first = Array.isArray(result) ? result[0] : result;
      const outputText =
        first && typeof first === 'object' && 'generated_text' in first
          ? String((first as { generated_text: unknown }).generated_text ?? '')
          : '';

      const outputTokens = buildTokenItems(tokenizer, outputText);
      const tokensPerSec =
        latencyMs > 0 ? Number(((outputTokens.length / latencyMs) * 1000).toFixed(1)) : 0;

      res.json({
        outputText,
        fullPrompt,
        inputTokens,
        outputTokens,
        latencyMs,
        tokensPerSec,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Inference failed';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/space-files', (_req, res) => {
    const spaceDir = path.join(__dirname, 'hf_space');
    const files = ['README.md', 'app.py', 'requirements.txt'];
    const payload = files.map((name) => {
      const fullPath = path.join(spaceDir, name);
      const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
      return { name, content };
    });
    res.json({ files: payload });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`T5-Small Space server running on http://localhost:${PORT}`);
    // Pre-warm tokenizer and ONNX weights in background so first inference is fast.
    void Promise.all([getTokenizer(), getPipeline()]).catch((err) => {
      console.error('Background model warmup failed:', err);
    });
  });
}

void createApp();
