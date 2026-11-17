import { useEffect, useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import type { TokenItem } from '../types/t5';

interface TokenizerViewProps {
  initialText: string;
}

const TOKENIZER_PRESETS = [
  {
    label: 'German translation prompt',
    text: 'translate English to German: My name is Wolfgang and I live in Berlin',
  },
  {
    label: 'French accents & apostrophes',
    text: "translate English to French: L'architecture de la bibliothèque est remarquable.",
  },
  {
    label: 'Romanian diacritics',
    text: 'translate English to Romanian: Bună dimineața, vremea este frumoasă astăzi.',
  },
  {
    label: 'GLUE MNLI premise & hypothesis',
    text: 'mnli premise: The runner crossed the finish line first. hypothesis: Someone won the race.',
  },
];

export function TokenizerView({ initialText }: TokenizerViewProps) {
  const [text, setText] = useState<string>(initialText || TOKENIZER_PRESETS[0].text);
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [truncated, setTruncated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIds, setCopiedIds] = useState<boolean>(false);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (!text.trim()) {
        setTokens([]);
        setTruncated(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/tokenize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Tokenization failed');
        }
        setTokens(data.tokens ?? []);
        setTruncated(Boolean(data.truncated));
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unable to tokenize input.');
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [text]);

  const handleCopyIds = async () => {
    if (!tokens.length) return;
    await navigator.clipboard.writeText(JSON.stringify(tokens.map((t) => t.id)));
    setCopiedIds(true);
    window.setTimeout(() => setCopiedIds(false), 1600);
  };

  const charCount = text.length;
  const charsPerToken = tokens.length > 0 ? (charCount / tokens.length).toFixed(2) : '—';

  return (
    <div className="space-y-8">
      <section className="border-b border-zinc-200 pb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
          SentencePiece Tokenizer Inspector
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-zinc-600">
          <span>spiece.model</span>
          <span aria-hidden="true">·</span>
          <span>Vocab size 32,128</span>
          <span aria-hidden="true">·</span>
          <span>Max sequence length 512</span>
          <span aria-hidden="true">·</span>
          <span>Special tokens: &lt;pad&gt; (0), &lt;/s&gt; (1), &lt;unk&gt; (2)</span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-5">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="tokenizer-input" className="text-sm font-medium text-zinc-900">
              Text to Tokenize
            </label>
            {text && (
              <button
                type="button"
                onClick={() => setText('')}
                className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-900"
              >
                Clear
              </button>
            )}
          </div>

          <textarea
            id="tokenizer-input"
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type any prompt or sentence to inspect subword segmentation..."
            className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          />

          <div className="space-y-2 border-t border-zinc-200 pt-4">
            <p className="text-xs font-medium text-zinc-700">Sample Inputs</p>
            <div className="flex flex-col divide-y divide-zinc-100">
              {TOKENIZER_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setText(preset.text)}
                  className="cursor-pointer py-2 text-left text-xs text-zinc-700 transition-colors hover:text-blue-600"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-7">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-medium text-zinc-900">Subword Pieces &amp; Vocabulary IDs</h2>
              <button
                type="button"
                disabled={tokens.length === 0}
                onClick={() => void handleCopyIds()}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                {copiedIds ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    <span className="text-emerald-700">Copied IDs</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy input_ids</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {truncated && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs text-amber-900">
                Input exceeds T5-small context window (512 tokens). Tokens past position 512 are truncated during generation.
              </div>
            )}

            {loading && tokens.length === 0 ? (
              <div className="space-y-2 py-6">
                <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-100" />
                <div className="h-6 w-1/2 animate-pulse rounded bg-zinc-100" />
              </div>
            ) : tokens.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-sm text-zinc-600">
                Enter text on the left to inspect how SentencePiece segments subwords (`▁` denotes a leading space).
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2 font-mono text-xs">
                  {tokens.map((item, idx) => {
                    const isSpecial = item.id <= 2;
                    return (
                      <div
                        key={`${idx}-${item.id}`}
                        className={`flex items-center gap-1.5 rounded-md border px-2 py-1 ${
                          isSpecial
                            ? 'border-blue-200 bg-blue-50 text-blue-900'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-900'
                        }`}
                      >
                        <span>{item.token}</span>
                        <span className="text-[11px] text-zinc-400 tabular-nums">{item.id}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5">
                  <div className="mb-1 text-xs text-zinc-500">input_ids array</div>
                  <code className="block break-all font-mono text-xs text-zinc-800 tabular-nums">
                    [{tokens.map((t) => t.id).join(', ')}]
                  </code>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-zinc-200 pt-4">
            <div>
              <div className="text-xs text-zinc-500">Total Tokens</div>
              <div className="mt-0.5 font-mono text-sm font-medium text-zinc-900 tabular-nums">
                {tokens.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Characters</div>
              <div className="mt-0.5 font-mono text-sm font-medium text-zinc-900 tabular-nums">
                {charCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Chars / Token</div>
              <div className="mt-0.5 font-mono text-sm font-medium text-zinc-900 tabular-nums">
                {charsPerToken}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
