import { useEffect, useState } from 'react';
import { Copy, Check, Download, Terminal } from 'lucide-react';

interface SpaceFileEntry {
  name: string;
  content: string;
}

const HF_CLI_STEPS = `# 1. Install the Hugging Face CLI (if not already installed)
curl -LsSf https://hf.co/cli/install.sh | bash

# 2. Authenticate with your Hugging Face account
hf auth login

# 3. Create the Gradio Space repository on Hugging Face Hub
hf repos create <your-username>/t5-small-demo --type space --space-sdk gradio --public

# 4. Upload the generated Space files (app.py, requirements.txt, README.md)
hf upload <your-username>/t5-small-demo ./hf_space --repo-type space --exclude "**/__pycache__/**"`;

export function SpaceDeployView() {
  const [files, setFiles] = useState<SpaceFileEntry[]>([]);
  const [activeFile, setActiveFile] = useState<string>('app.py');
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    fetch('/api/space-files')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const loaded = (data.files ?? []) as SpaceFileEntry[];
        setFiles(loaded);
        if (loaded.length > 0 && !loaded.some((f) => f.name === activeFile)) {
          setActiveFile(loaded[0].name);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const currentFile = files.find((f) => f.name === activeFile);

  const handleCopyFile = async () => {
    if (!currentFile) return;
    await navigator.clipboard.writeText(currentFile.content);
    setCopiedFile(currentFile.name);
    window.setTimeout(() => setCopiedFile(null), 1600);
  };

  const handleDownloadFile = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCli = async () => {
    await navigator.clipboard.writeText(HF_CLI_STEPS);
    setCopiedCli(true);
    window.setTimeout(() => setCopiedCli(false), 1600);
  };

  return (
    <div className="space-y-8">
      <section className="border-b border-zinc-200 pb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
          Hugging Face Space Bundle &amp; CLI Deploy
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-zinc-600">
          <span>Gradio SDK 5.50.0</span>
          <span aria-hidden="true">·</span>
          <span>Python 3.12</span>
          <span aria-hidden="true">·</span>
          <span>MCP Server Enabled (mcp_server=True)</span>
          <span aria-hidden="true">·</span>
          <span>Lazy Example Caching</span>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-zinc-700" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-zinc-900">
              Publish to Hugging Face Spaces via hf CLI
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void handleCopyCli()}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 whitespace-nowrap shrink-0"
          >
            {copiedCli ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span className="text-emerald-700">Copied commands</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy CLI steps</span>
              </>
            )}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-100">
          {HF_CLI_STEPS}
        </pre>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 px-5 py-3">
          <div className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 p-1">
            {files.map((file) => {
              const active = file.name === activeFile;
              return (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => setActiveFile(file.name)}
                  className={`cursor-pointer rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {file.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!currentFile}
              onClick={() => void handleCopyFile()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 whitespace-nowrap shrink-0"
            >
              {copiedFile === currentFile?.name ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copy file</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={!currentFile}
              onClick={handleDownloadFile}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Download {currentFile?.name ?? ''}</span>
            </button>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-2 py-8">
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
            </div>
          ) : currentFile ? (
            <pre className="max-h-[540px] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-relaxed text-zinc-900">
              {currentFile.content}
            </pre>
          ) : (
            <p className="text-sm text-zinc-600">No Space files found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
