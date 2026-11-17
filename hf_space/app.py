import time
import torch
import gradio as gr
from transformers import T5ForConditionalGeneration, T5Tokenizer

MODEL_ID = "google-t5/t5-small"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

tokenizer = T5Tokenizer.from_pretrained(MODEL_ID)
model = T5ForConditionalGeneration.from_pretrained(MODEL_ID).to(DEVICE)
model.eval()

TASK_PREFIXES = {
    "Translate: English → German": "translate English to German: ",
    "Translate: English → French": "translate English to French: ",
    "Translate: English → Romanian": "translate English to Romanian: ",
    "Summarize": "summarize: ",
    "Custom Prefix (Raw T5 Prompt)": "",
}

CSS = """
#col-container { max-width: 1100px; margin: 0 auto; }
.dark .gradio-container { color: var(--body-text-color); }
"""


def run_t5(
    task: str,
    text: str,
    max_new_tokens: int = 128,
    num_beams: int = 4,
    no_repeat_ngram_size: int = 3,
    do_sample: bool = False,
    temperature: float = 1.0,
) -> tuple[str, str]:
    """Run text-to-text inference with google-t5/t5-small.

    Args:
        task: Selected T5 task preset or custom prefix mode.
        text: Input text (or full prefixed prompt in Custom Prefix mode).
        max_new_tokens: Maximum number of tokens to generate.
        num_beams: Beam search width (1 for greedy or sampling).
        no_repeat_ngram_size: Prevent repeating n-grams of this size (0 disables).
        do_sample: Enable stochastic sampling instead of deterministic beam search.
        temperature: Sampling temperature when do_sample is True.

    Returns:
        Tuple of (generated_text, diagnostics_summary).
    """
    if not text or not text.strip():
        return "", "Enter input text to run inference."

    prefix = TASK_PREFIXES.get(task, "")
    prompt = f"{prefix}{text.strip()}" if prefix else text.strip()

    t0 = time.perf_counter()
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512).to(DEVICE)

    gen_kwargs = {
        "max_new_tokens": int(max_new_tokens),
        "num_beams": 1 if do_sample else int(num_beams),
        "do_sample": bool(do_sample),
        "early_stopping": True,
    }
    if no_repeat_ngram_size > 0:
        gen_kwargs["no_repeat_ngram_size"] = int(no_repeat_ngram_size)
    if do_sample:
        gen_kwargs["temperature"] = float(temperature)

    with torch.no_grad():
        output_ids = model.generate(**inputs, **gen_kwargs)

    decoded = tokenizer.decode(output_ids[0], skip_special_tokens=True)
    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    in_tokens = int(inputs["input_ids"].shape[-1])
    out_tokens = int(output_ids.shape[-1])

    stats = (
        f"Prompt: `{prompt[:90]}{'...' if len(prompt) > 90 else ''}`  \n"
        f"Input tokens: **{in_tokens}** · Output tokens: **{out_tokens}** · "
        f"Latency: **{elapsed_ms:.0f} ms** · Device: **{DEVICE.upper()}**"
    )
    return decoded, stats


def inspect_tokens(text: str) -> str:
    """Tokenize text using google-t5/t5-small SentencePiece tokenizer."""
    if not text or not text.strip():
        return "Enter text to inspect tokens."
    encoded = tokenizer(text.strip())
    tokens = tokenizer.convert_ids_to_tokens(encoded["input_ids"])
    pairs = [f"{tok} ({tid})" for tok, tid in zip(tokens, encoded["input_ids"])]
    return "  |  ".join(pairs)


with gr.Blocks(theme=gr.themes.Citrus(), css=CSS, title="google-t5/t5-small Space") as demo:
    with gr.Column(elem_id="col-container"):
        gr.Markdown(
            "# google-t5/t5-small\n"
            "Unified text-to-text transformer (60M parameters, Apache 2.0) — "
            "[Model Card](https://huggingface.co/google-t5/t5-small) · "
            "[T5 Paper](https://jmlr.org/papers/volume21/20-074/20-074.pdf)"
        )

        with gr.Row():
            task = gr.Dropdown(
                choices=list(TASK_PREFIXES.keys()),
                value="Translate: English → German",
                label="Task Prefix",
                scale=2,
            )
            run_btn = gr.Button("Run T5-Small", variant="primary", scale=1)

        with gr.Row():
            text_in = gr.Textbox(
                label="Input Text",
                placeholder="My name is Wolfgang and I live in Berlin",
                lines=5,
            )
            text_out = gr.Textbox(label="Generated Output", lines=5, interactive=False)

        stats_md = gr.Markdown("")

        with gr.Accordion("Decoding Parameters", open=False):
            with gr.Row():
                max_new_tokens = gr.Slider(16, 300, value=128, step=8, label="Max New Tokens")
                num_beams = gr.Slider(1, 6, value=4, step=1, label="Num Beams")
                no_repeat_ngram_size = gr.Slider(0, 5, value=3, step=1, label="No Repeat N-gram")
            with gr.Row():
                do_sample = gr.Checkbox(label="Enable Sampling", value=False)
                temperature = gr.Slider(0.1, 2.0, value=1.0, step=0.1, label="Temperature")

        with gr.Accordion("SentencePiece Tokenizer Inspector", open=False):
            tok_out = gr.Markdown("Click **Inspect Tokens** to view subword IDs.")
            tok_btn = gr.Button("Inspect Tokens")
            tok_btn.click(inspect_tokens, inputs=[text_in], outputs=[tok_out])

        gr.Examples(
            examples=[
                ["Translate: English → German", "My name is Wolfgang and I live in Berlin"],
                ["Translate: English → German", "My name is Sarah and I live in London"],
                ["Translate: English → French", "Studies have been shown that owning a dog is good for you."],
                ["Translate: English → Romanian", "The weather is warm and sunny across the coast today."],
                [
                    "Summarize",
                    "The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930.",
                ],
                ["Custom Prefix (Raw T5 Prompt)", "cola sentence: The book was written by a famous author."],
            ],
            inputs=[task, text_in],
            outputs=[text_out, stats_md],
            fn=run_t5,
            cache_examples=True,
            cache_mode="lazy",
        )

        run_btn.click(
            run_t5,
            inputs=[task, text_in, max_new_tokens, num_beams, no_repeat_ngram_size, do_sample, temperature],
            outputs=[text_out, stats_md],
        )

if __name__ == "__main__":
    demo.launch(mcp_server=True)
