export type SpaceTab = 'playground' | 'tokenizer' | 'model-card' | 'space-files';

export type T5TaskId =
  | 'translation_en_to_de'
  | 'translation_en_to_fr'
  | 'translation_en_to_ro'
  | 'summarization'
  | 'custom';

export interface TokenItem {
  token: string;
  id: number;
}

export interface DecodingParams {
  maxNewTokens: number;
  numBeams: number;
  noRepeatNgramSize: number;
  minLength: number;
  lengthPenalty: number;
  doSample: boolean;
  temperature: number;
}

export interface T5TaskPreset {
  id: T5TaskId;
  label: string;
  shortLabel: string;
  prefix: string;
  description: string;
  placeholder: string;
  defaults: DecodingParams;
}

export interface T5Example {
  id: string;
  taskId: T5TaskId;
  label: string;
  sourceNote: string;
  text: string;
}

export interface GenerateResponse {
  outputText: string;
  fullPrompt: string;
  inputTokens: TokenItem[];
  outputTokens: TokenItem[];
  latencyMs: number;
  tokensPerSec: number;
}

export interface HistoryRun {
  id: string;
  timestamp: string;
  taskLabel: string;
  taskId: T5TaskId;
  prefix: string;
  inputText: string;
  outputText: string;
  inputTokenCount: number;
  outputTokenCount: number;
  latencyMs: number;
  tokensPerSec: number;
}

export const T5_TASK_PRESETS: T5TaskPreset[] = [
  {
    id: 'translation_en_to_de',
    label: 'Translate English to German',
    shortLabel: 'EN → DE',
    prefix: 'translate English to German: ',
    description: 'WMT English-to-German machine translation using task_specific_params.',
    placeholder: 'My name is Wolfgang and I live in Berlin',
    defaults: {
      maxNewTokens: 200,
      numBeams: 4,
      noRepeatNgramSize: 3,
      minLength: 0,
      lengthPenalty: 1.0,
      doSample: false,
      temperature: 1.0,
    },
  },
  {
    id: 'translation_en_to_fr',
    label: 'Translate English to French',
    shortLabel: 'EN → FR',
    prefix: 'translate English to French: ',
    description: 'WMT English-to-French machine translation.',
    placeholder: 'Studies have been shown that owning a dog is good for you.',
    defaults: {
      maxNewTokens: 200,
      numBeams: 4,
      noRepeatNgramSize: 3,
      minLength: 0,
      lengthPenalty: 1.0,
      doSample: false,
      temperature: 1.0,
    },
  },
  {
    id: 'translation_en_to_ro',
    label: 'Translate English to Romanian',
    shortLabel: 'EN → RO',
    prefix: 'translate English to Romanian: ',
    description: 'WMT English-to-Romanian machine translation.',
    placeholder: 'The weather is warm and sunny across the coast today.',
    defaults: {
      maxNewTokens: 200,
      numBeams: 4,
      noRepeatNgramSize: 3,
      minLength: 0,
      lengthPenalty: 1.0,
      doSample: false,
      temperature: 1.0,
    },
  },
  {
    id: 'summarization',
    label: 'Summarize',
    shortLabel: 'Summarize',
    prefix: 'summarize: ',
    description: 'Abstractive summarization with length_penalty 2.0 and min_length 30.',
    placeholder: 'Paste an article or paragraph to summarize...',
    defaults: {
      maxNewTokens: 200,
      numBeams: 4,
      noRepeatNgramSize: 3,
      minLength: 30,
      lengthPenalty: 2.0,
      doSample: false,
      temperature: 1.0,
    },
  },
  {
    id: 'custom',
    label: 'Custom T5 Prefix',
    shortLabel: 'Custom Prefix',
    prefix: '',
    description: 'Raw text-to-text prompt for CoLA, SST-2, MNLI, STS-B, or custom prefixes.',
    placeholder: 'cola sentence: The book was written by a famous author.',
    defaults: {
      maxNewTokens: 128,
      numBeams: 4,
      noRepeatNgramSize: 3,
      minLength: 0,
      lengthPenalty: 1.0,
      doSample: false,
      temperature: 1.0,
    },
  },
];

export const OFFICIAL_T5_EXAMPLES: T5Example[] = [
  {
    id: 'wolfgang-de',
    taskId: 'translation_en_to_de',
    label: 'Wolfgang in Berlin (EN → DE)',
    sourceNote: 'HF Widget Example',
    text: 'My name is Wolfgang and I live in Berlin',
  },
  {
    id: 'sarah-de',
    taskId: 'translation_en_to_de',
    label: 'Sarah in London (EN → DE)',
    sourceNote: 'HF Widget Example',
    text: 'My name is Sarah and I live in London',
  },
  {
    id: 'dogs-fr',
    taskId: 'translation_en_to_fr',
    label: 'Owning a dog (EN → FR)',
    sourceNote: 'Model Card Example',
    text: 'Studies have been shown that owning a dog is good for you.',
  },
  {
    id: 'coast-ro',
    taskId: 'translation_en_to_ro',
    label: 'Coastal weather (EN → RO)',
    sourceNote: 'WMT16 Benchmark Style',
    text: 'The weather is warm and sunny across the coast today.',
  },
  {
    id: 'eiffel-sum',
    taskId: 'summarization',
    label: 'Eiffel Tower architecture (Summarize)',
    sourceNote: 'CNN/DailyMail Style',
    text: 'The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930.',
  },
  {
    id: 't5-paper-sum',
    taskId: 'summarization',
    label: 'Unified Text-to-Text abstract (Summarize)',
    sourceNote: 'T5 Paper Abstract',
    text: 'Transfer learning, where a model is first pre-trained on a data-rich task before being fine-tuned on a downstream task, has emerged as a powerful technique in natural language processing. The effectiveness of transfer learning has given rise to a diversity of approaches, methodology, and practice. In this paper, we explore the landscape of transfer learning techniques for NLP by introducing a unified framework that converts all text-based language problems into a text-to-text format.',
  },
  {
    id: 'cola-custom',
    taskId: 'custom',
    label: 'CoLA grammatical acceptability',
    sourceNote: 'GLUE CoLA',
    text: 'cola sentence: The book was written by a famous author.',
  },
  {
    id: 'sst2-custom',
    taskId: 'custom',
    label: 'SST-2 sentiment classification',
    sourceNote: 'GLUE SST-2',
    text: 'sst2 sentence: This film offers crisp cinematography and deeply memorable performances.',
  },
];
