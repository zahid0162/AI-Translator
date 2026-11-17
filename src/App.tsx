/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { TopBar } from './components/TopBar';
import { PlaygroundView } from './components/PlaygroundView';
import { TokenizerView } from './components/TokenizerView';
import { ModelCardView } from './components/ModelCardView';
import { SpaceDeployView } from './components/SpaceDeployView';
import type { HistoryRun, SpaceTab } from './types/t5';

export default function App() {
  const [activeTab, setActiveTab] = useState<SpaceTab>('playground');
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [tokenizerSeedText, setTokenizerSeedText] = useState<string>(
    'translate English to German: My name is Wolfgang and I live in Berlin',
  );

  const handleAddHistory = (run: HistoryRun) => {
    setHistory((prev) => [run, ...prev].slice(0, 20));
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleInspectInTokenizer = (text: string) => {
    setTokenizerSeedText(text);
    setActiveTab('tokenizer');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      <TopBar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-8">
        {activeTab === 'playground' && (
          <PlaygroundView
            history={history}
            onAddHistory={handleAddHistory}
            onClearHistory={handleClearHistory}
            onInspectInTokenizer={handleInspectInTokenizer}
          />
        )}
        {activeTab === 'tokenizer' && <TokenizerView initialText={tokenizerSeedText} />}
        {activeTab === 'model-card' && <ModelCardView />}
        {activeTab === 'space-files' && <SpaceDeployView />}
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-6 py-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>google-t5/t5-small interactive Space · Apache 2.0</span>
          <div className="flex items-center gap-4">
            <a
              href="https://huggingface.co/google-t5/t5-small"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-900 hover:underline"
            >
              Model Weights
            </a>
            <a
              href="https://huggingface.co/docs/hub/spaces"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-900 hover:underline"
            >
              Spaces Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
