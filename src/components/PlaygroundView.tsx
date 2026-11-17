import { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Terminal,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  T5_TASK_PRESETS,
  OFFICIAL_T5_EXAMPLES,
  type DecodingParams,
  type GenerateResponse,
  type HistoryRun,
  type T5Example,
  type T5TaskId,
} from '../types/t5';

interface PlaygroundViewProps {
  history: HistoryRun[];
  onAddHistory: (run: HistoryRun) => void;
  onClearHistory: () => void;
  onInspectInTokenizer: (text: string) => void;
}

export function PlaygroundView({
  history,
  onAddHistory,
  onClearHistory,
  onInspectInTokenizer,
}: PlaygroundViewProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<T5TaskId>('translation_en_to_de');
  const [inputText, setInputText] = useState<string>('My name is Wolfgang and I live in Berlin');
  const [params, setParams] = useState<DecodingParams>(T5_TASK_PRESETS[0].defaults);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showTokenStrip, setShowTokenStrip] = useState<boolean>(true);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);

  const activePreset = T5_TASK_PRESETS.find((t) => t.id === selectedTaskId) ?? T5_TASK_PRESETS[0];

  const handleSelectTask = (taskId: T5TaskId) => {
    const preset = T5_TASK_PRESETS.find((t) => t.id === taskId) ?? T5_TASK_PRESETS[0];
    setSelectedTaskId(taskId);
    setParams({ ...preset.defaults });
    setError(null);

    const matchingExample = OFFICIAL_T5_EXAMPLES.find((ex) => ex.taskId === taskId);
    if (matchingExample) {
      setInputText(matchingExample.text);
    }
  };

  const runInference = async (overrideTaskId?: T5TaskId, overrideText?: string) => {
    const targetTaskId = overrideTaskId ?? selectedTaskId;
    const preset = T5_TASK_PRESETS.find((t) => t.id === targetTaskId) ?? activePreset;
    const textToRun = (overrideText ?? inputText).trim();

    if (!textToRun) {
      setError('Enter input text before running inference.');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: preset.prefix,
          text: textToRun,
          ...params,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Inference request failed.');
      }

      const typed = data as GenerateResponse;
      setResult(typed);

      onAddHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        taskLabel: preset.shortLabel,
        taskId: preset.id,
        prefix: preset.prefix,
        inputText: textToRun,
        outputText: typed.outputText,
        inputTokenCount: typed.inputTokens.length,
        outputTokenCount: typed.outputTokens.length,
        latencyMs: typed.latencyMs,
        tokensPerSec: typed.tokensPerSec,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to run T5-small inference.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleLoadExample = (example: T5Example) => {
    const preset = T5_TASK_PRESETS.find((t) => t.id === example.taskId) ?? T5_TASK_PRESETS[0];
    setSelectedTaskId(example.taskId);
    setParams({ ...preset.defaults });
    setInputText(example.text);
    void runInference(example.taskId, example.text);
  };

  const handleRestoreHistory = (run: HistoryRun) => {
    setSelectedTaskId(run.taskId);
    setInputText(run.inputText);
    const preset = T5_TASK_PRESETS.find((t) => t.id === run.taskId);
    if (preset) {
      setParams({ ...preset.defaults });
    }
  };

  const handleCopyOutput = async () => {
    if (!result?.outputText) return;
    await navigator.clipboard.writeText(result.outputText);
    setCopiedOutput(true);
    window.setTimeout(() => setCopiedOutput(false), 1600);
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8">
      {/* Editorial Space Header */}
      <section className="flex flex-col gap-3 border-b border-zinc-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl text-balance">
            Text-to-Text Transfer Transformer Demo
          </h1>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-zinc-600">
            <span>60M parameters</span>
            <span aria-hidden="true">·</span>
            <span>Encoder-Decoder (6 + 6 layers)</span>
            <span aria-hidden="true">·</span>
            <span>32,128 SentencePiece vocab</span>
            <span aria-hidden="true">·</span>
            <span>Apache 2.0</span>
          </div>
        </div>

        <a
          href="https://huggingface.co/google-t5/t5-small"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap shrink-0"
        >
          View Hugging Face Model Card
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </section>

      {/* Task Selector Segmented Control */}
      <section aria-label="Task selector" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-zinc-100 p-1">
          {T5_TASK_PRESETS.map((preset) => {
            const active = preset.id === selectedTaskId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectTask(preset.id)}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  active
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {preset.shortLabel}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-zinc-600">{activePreset.description}</p>
      </section>

      {/* Main Two-Column Inference Workspace */}
      <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        {/* Left Pane: Input & Generation Controls */}
        <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="t5-input" className="text-sm font-medium text-zinc-900">
                Source Input
              </label>
              <div className="flex items-center gap-3 text-xs text-zinc-500 tabular-nums">
                <span>{wordCount} words</span>
                <span aria-hidden="true">·</span>
                <span>{inputText.length} chars</span>
                {inputText && (
                  <button
                    type="button"
                    onClick={() => setInputText('')}
                    className="cursor-pointer text-zinc-500 hover:text-zinc-900 whitespace-nowrap shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {activePreset.prefix && (
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                <span className="text-xs text-zinc-500">Task prefix</span>
                <code className="font-mono text-xs font-medium text-zinc-900">
                  {activePreset.prefix}
                </code>
              </div>
            )}

            <textarea
              id="t5-input"
              rows={7}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  void runInference();
                }
              }}
              placeholder={activePreset.placeholder}
              className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />

            {/* Collapsible Decoding Parameters */}
            <div className="border-t border-zinc-200 pt-3">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-between py-1 text-xs font-medium text-zinc-700 hover:text-zinc-900"
              >
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
                  Decoding Parameters
                  <span className="font-mono font-normal text-zinc-500">
                    ({params.doSample ? `sample · T=${params.temperature}` : `beams=${params.numBeams}`} · max={params.maxNewTokens})
                  </span>
                </span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                )}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-700">Max New Tokens</span>
                        <span className="font-mono text-zinc-900 tabular-nums">{params.maxNewTokens}</span>
                      </div>
                      <input
                        type="range"
                        min={16}
                        max={300}
                        step={8}
                        value={params.maxNewTokens}
                        onChange={(e) =>
                          setParams((p) => ({ ...p, maxNewTokens: Number(e.target.value) }))
                        }
                        className="w-full accent-blue-600"
                      />
                    </label>

                    <label className="block space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-700">Beam Width</span>
                        <span className="font-mono text-zinc-900 tabular-nums">
                          {params.doSample ? '1 (sampling)' : params.numBeams}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={6}
                        step={1}
                        disabled={params.doSample}
                        value={params.numBeams}
                        onChange={(e) =>
                          setParams((p) => ({ ...p, numBeams: Number(e.target.value) }))
                        }
                        className="w-full accent-blue-600 disabled:opacity-40"
                      />
                    </label>

                    <label className="block space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-700">No Repeat N-gram</span>
                        <span className="font-mono text-zinc-900 tabular-nums">
                          {params.noRepeatNgramSize}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={5}
                        step={1}
                        value={params.noRepeatNgramSize}
                        onChange={(e) =>
                          setParams((p) => ({ ...p, noRepeatNgramSize: Number(e.target.value) }))
                        }
                        className="w-full accent-blue-600"
                      />
                    </label>

                    <label className="block space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-700">Length Penalty</span>
                        <span className="font-mono text-zinc-900 tabular-nums">
                          {params.lengthPenalty.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.4}
                        max={2.5}
                        step={0.1}
                        value={params.lengthPenalty}
                        onChange={(e) =>
                          setParams((p) => ({ ...p, lengthPenalty: Number(e.target.value) }))
                        }
                        className="w-full accent-blue-600"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-3">
                    <div className="flex items-center gap-4">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-700">
                        <input
                          type="checkbox"
                          checked={params.doSample}
                          onChange={(e) =>
                            setParams((p) => ({ ...p, doSample: e.target.checked }))
                          }
                          className="h-4 w-4 rounded border-zinc-300 accent-blue-600"
                        />
                        Stochastic Sampling
                      </label>

                      {params.doSample && (
                        <label className="inline-flex items-center gap-2 text-xs text-zinc-700">
                          <span>Temp</span>
                          <input
                            type="number"
                            min={0.1}
                            max={2.0}
                            step={0.1}
                            value={params.temperature}
                            onChange={(e) =>
                              setParams((p) => ({ ...p, temperature: Number(e.target.value) }))
                            }
                            className="w-16 rounded border border-zinc-200 px-2 py-1 font-mono text-xs tabular-nums"
                          />
                        </label>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setParams({ ...activePreset.defaults })}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      Reset task defaults
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-zinc-200 pt-4">
            <span className="text-xs text-zinc-500">
              Press <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[11px]">Ctrl/⌘ + Enter</kbd> to run
            </span>
            <button
              type="button"
              disabled={isRunning || !inputText.trim()}
              onClick={() => void runInference()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {isRunning ? 'Running inference...' : 'Run Inference'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Right Pane: Model Output & Token Diagnostics */}
        <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-medium text-zinc-900">Generated Output</h2>
              <div className="flex items-center gap-3">
                {result?.outputText && (
                  <>
                    <button
                      type="button"
                      onClick={() => onInspectInTokenizer(result.fullPrompt)}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 whitespace-nowrap shrink-0"
                    >
                      <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                      Inspect Tokens
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCopyOutput()}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 whitespace-nowrap shrink-0"
                    >
                      {copiedOutput ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void runInference()}
                  className="cursor-pointer text-xs font-medium text-red-700 underline whitespace-nowrap shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {isRunning ? (
              <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 min-h-[172px]">
                <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200" />
                <div className="h-4 w-4/6 animate-pulse rounded bg-zinc-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200" />
                <p className="pt-4 text-xs text-zinc-500">
                  Executing T5ForConditionalGeneration encoder-decoder pass...
                </p>
              </div>
            ) : result ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3.5 min-h-[172px]">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-900">
                  {result.outputText || '(empty output)'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-start justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/70 px-5 py-8 min-h-[172px]">
                <p className="text-sm font-medium text-zinc-800">Ready for text-to-text inference</p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-zinc-600">
                  Run the current prompt or pick an official example below. The backend loads the quantized ONNX weights of T5-Small (60M params) and returns exact SentencePiece token counts and beam-search latency.
                </p>
                <button
                  type="button"
                  onClick={() => void runInference()}
                  className="mt-4 cursor-pointer rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-100"
                >
                  Run Current Example
                </button>
              </div>
            )}

            {/* SentencePiece Token Breakdown */}
            {result && (
              <div className="border-t border-zinc-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTokenStrip((v) => !v)}
                  className="flex w-full cursor-pointer items-center justify-between py-1 text-xs font-medium text-zinc-700 hover:text-zinc-900"
                >
                  <span>
                    SentencePiece Tokenization ({result.inputTokens.length} in · {result.outputTokens.length} out)
                  </span>
                  {showTokenStrip ? (
                    <ChevronUp className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  )}
                </button>

                {showTokenStrip && (
                  <div className="mt-2.5 space-y-2.5">
                    <div>
                      <p className="mb-1.5 text-xs text-zinc-500">Encoder input tokens</p>
                      <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                        {result.inputTokens.slice(0, 32).map((item, idx) => (
                          <span
                            key={`in-${idx}-${item.id}`}
                            title={`ID: ${item.id}`}
                            className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-zinc-800"
                          >
                            {item.token}
                            <span className="ml-1 text-[10px] text-zinc-400">{item.id}</span>
                          </span>
                        ))}
                        {result.inputTokens.length > 32 && (
                          <span className="px-1.5 py-0.5 text-zinc-500">
                            +{result.inputTokens.length - 32} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1.5 text-xs text-zinc-500">Decoder output tokens</p>
                      <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                        {result.outputTokens.slice(0, 32).map((item, idx) => (
                          <span
                            key={`out-${idx}-${item.id}`}
                            title={`ID: ${item.id}`}
                            className="rounded border border-blue-200 bg-blue-50/60 px-1.5 py-0.5 text-zinc-900"
                          >
                            {item.token}
                            <span className="ml-1 text-[10px] text-blue-600">{item.id}</span>
                          </span>
                        ))}
                        {result.outputTokens.length > 32 && (
                          <span className="px-1.5 py-0.5 text-zinc-500">
                            +{result.outputTokens.length - 32} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Numeric Run Telemetry Footer */}
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-4">
            <div>
              <div className="text-xs text-zinc-500">Latency</div>
              <div className="mt-0.5 font-mono text-sm font-medium text-zinc-900 tabular-nums">
                {result ? `${result.latencyMs} ms` : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Throughput</div>
              <div className="mt-0.5 font-mono text-sm font-medium text-zinc-900 tabular-nums">
                {result ? `${result.tokensPerSec} tok/s` : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Input Tokens</div>
              <div className="mt-0.5 font-mono text-sm font-medium text-zinc-900 tabular-nums">
                {result ? result.inputTokens.length : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Output Tokens</div>
              <div className="mt-0.5 font-mono text-sm font-medium text-zinc-900 tabular-nums">
                {result ? result.outputTokens.length : '—'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Official Model Card & Widget Examples (gr.Examples pattern) */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Official Model Examples
          </h2>
          <span className="text-xs text-zinc-500">Click any row to populate and execute</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="divide-y divide-zinc-200">
            {OFFICIAL_T5_EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleLoadExample(ex)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-900">{ex.label}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ex.sourceNote}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-zinc-600">{ex.text}</p>
                </div>
                <span className="text-xs font-medium text-blue-600 whitespace-nowrap shrink-0">
                  Run example
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Inference History Data Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-base font-semibold text-zinc-900">
            Session Inference Log
          </h2>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Clear log
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-6 text-sm text-zinc-600">
            No runs logged in this session yet. Execute a prompt above to record latency and token throughput.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600">
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Task</th>
                  <th className="px-4 py-2.5">Input</th>
                  <th className="px-4 py-2.5">Output</th>
                  <th className="px-4 py-2.5 text-right">Tokens (In/Out)</th>
                  <th className="px-4 py-2.5 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {history.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => handleRestoreHistory(run)}
                    className="cursor-pointer transition-colors hover:bg-zinc-50"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-500 whitespace-nowrap tabular-nums">
                      {run.timestamp}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium text-zinc-900 whitespace-nowrap">
                      {run.taskLabel}
                    </td>
                    <td className="max-w-[260px] truncate px-4 py-2.5 text-zinc-700">
                      {run.inputText}
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-2.5 text-zinc-900">
                      {run.outputText}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-zinc-700 whitespace-nowrap tabular-nums">
                      {run.inputTokenCount} / {run.outputTokenCount}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-zinc-900 whitespace-nowrap tabular-nums">
                      {run.latencyMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
