import { useState } from 'react';
import { Copy, Check, ArrowUpRight } from 'lucide-react';

const ARCH_SPECS = [
  { param: 'architectures', value: 'T5ForConditionalGeneration', note: 'Encoder-Decoder Seq2Seq' },
  { param: 'parameters', value: '60,506,624 (~60M)', note: 'Smallest T5 v1.0 checkpoint' },
  { param: 'd_model', value: '512', note: 'Hidden representation dimension' },
  { param: 'd_ff', value: '2,048', note: 'Feed-forward inner dimension' },
  { param: 'd_kv', value: '64', note: 'Key/value projection per head' },
  { param: 'num_layers', value: '6', note: '6 encoder + 6 decoder blocks' },
  { param: 'num_heads', value: '8', note: 'Attention heads per layer' },
  { param: 'relative_attention_num_buckets', value: '32', note: 'Relative positional bias buckets' },
  { param: 'n_positions', value: '512', note: 'Nominal input context window' },
  { param: 'vocab_size', value: '32,128', note: 'SentencePiece unigram vocabulary' },
  { param: 'license', value: 'apache-2.0', note: 'Open permissive commercial license' },
];

const TASK_CONFIGS = [
  {
    task: 'summarization',
    prefix: 'summarize: ',
    beams: '4',
    minMax: '30 – 200',
    lengthPenalty: '2.0',
    noRepeatNgram: '3',
  },
  {
    task: 'translation_en_to_de',
    prefix: 'translate English to German: ',
    beams: '4',
    minMax: '0 – 300',
    lengthPenalty: '1.0',
    noRepeatNgram: '0',
  },
  {
    task: 'translation_en_to_fr',
    prefix: 'translate English to French: ',
    beams: '4',
    minMax: '0 – 300',
    lengthPenalty: '1.0',
    noRepeatNgram: '0',
  },
  {
    task: 'translation_en_to_ro',
    prefix: 'translate English to Romanian: ',
    beams: '4',
    minMax: '0 – 300',
    lengthPenalty: '1.0',
    noRepeatNgram: '0',
  },
];

const BIBTEX = `@article{2020t5,
  author  = {Colin Raffel and Noam Shazeer and Adam Roberts and Katherine Lee and Sharan Narang and Michael Matena and Yanqi Zhou and Wei Li and Peter J. Liu},
  title   = {Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer},
  journal = {Journal of Machine Learning Research},
  year    = {2020},
  volume  = {21},
  number  = {140},
  pages   = {1-67},
  url     = {http://jmlr.org/papers/v21/20-074.html}
}`;

export function ModelCardView() {
  const [copiedBib, setCopiedBib] = useState<boolean>(false);

  const handleCopyBib = async () => {
    await navigator.clipboard.writeText(BIBTEX);
    setCopiedBib(true);
    window.setTimeout(() => setCopiedBib(false), 1600);
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 border-b border-zinc-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
            Model Card: google-t5/t5-small
          </h1>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-zinc-600">
            <span>Authors: Colin Raffel et al.</span>
            <span aria-hidden="true">·</span>
            <span>Languages: English, French, Romanian, German</span>
            <span aria-hidden="true">·</span>
            <span>Pre-trained on C4 &amp; supervised multi-task mixture</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <a
            href="https://huggingface.co/google-t5/t5-small"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline whitespace-nowrap shrink-0"
          >
            HF Repository
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href="https://jmlr.org/papers/volume21/20-074/20-074.pdf"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline whitespace-nowrap shrink-0"
          >
            JMLR Paper
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <h2 className="font-display text-lg font-semibold text-zinc-900">
            Unified Text-to-Text Framework
          </h2>
          <p className="text-sm leading-relaxed text-zinc-700">
            T5 reframes every natural language processing task as a text-to-text sequence generation problem where both input and output are text strings. Unlike encoder-only BERT models that output span indices or class logits, T5 uses the same encoder-decoder architecture, maximum likelihood objective, and decoding pipeline across translation, summarization, question answering, and classification.
          </p>
          <p className="text-sm leading-relaxed text-zinc-700">
            T5-Small is the 60M-parameter baseline checkpoint. It was pre-trained on the Colossal Clean Crawled Corpus (C4) with a span-corruption denoising objective alongside a multi-task supervised mixture including WMT translation, CNN/DailyMail summarization, GLUE (CoLA, SST-2, MRPC, STS-B, QQP, MNLI, QNLI, RTE), and SuperGLUE (CB, COPA, WiC, MultiRC, ReCoRD, BoolQ).
          </p>
        </div>

        <div className="lg:col-span-7">
          <h2 className="mb-3 font-display text-lg font-semibold text-zinc-900">
            Architecture Configuration (config.json)
          </h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600">
                  <th className="px-4 py-2.5">Parameter</th>
                  <th className="px-4 py-2.5">Value</th>
                  <th className="px-4 py-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {ARCH_SPECS.map((row) => (
                  <tr key={row.param} className="hover:bg-zinc-50/70">
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-900">{row.param}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-medium text-blue-700 tabular-nums">
                      {row.value}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-600">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-zinc-900">
          Task-Specific Generation Defaults
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600">
                <th className="px-4 py-2.5">Task Key</th>
                <th className="px-4 py-2.5">Prompt Prefix</th>
                <th className="px-4 py-2.5 text-right">Num Beams</th>
                <th className="px-4 py-2.5 text-right">Length (Min–Max)</th>
                <th className="px-4 py-2.5 text-right">Length Penalty</th>
                <th className="px-4 py-2.5 text-right">No Repeat N-gram</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {TASK_CONFIGS.map((cfg) => (
                <tr key={cfg.task} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-900">{cfg.task}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-700">{cfg.prefix}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums">{cfg.beams}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums">{cfg.minMax}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums">{cfg.lengthPenalty}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums">{cfg.noRepeatNgram}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="font-display text-base font-semibold text-zinc-900">Citation</h2>
          <button
            type="button"
            onClick={() => void handleCopyBib()}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 whitespace-nowrap shrink-0"
          >
            {copiedBib ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span className="text-emerald-700">Copied BibTeX</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy BibTeX</span>
              </>
            )}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-relaxed text-zinc-800">
          {BIBTEX}
        </pre>
      </section>
    </div>
  );
}
