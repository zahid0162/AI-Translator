---
title: Google T5 Small Studio
emoji: 🔤
colorFrom: blue
colorTo: indigo
sdk: gradio
sdk_version: 5.50.0
app_file: app.py
short_description: Multi-task NLP demo for google-t5/t5-small
python_version: "3.12"
---

# google-t5/t5-small Interactive Space

Interactive multi-task text-to-text demonstration for [`google-t5/t5-small`](https://huggingface.co/google-t5/t5-small) (60M parameters, Apache-2.0).

## Supported Tasks

- **Translation**: English to German (`translate English to German:`), French (`translate English to French:`), and Romanian (`translate English to Romanian:`)
- **Summarization**: Abstractive summarization (`summarize:`)
- **Custom Text-to-Text Prefix**: Any T5 task prefix (`cola sentence:`, `sst2 sentence:`, `stsb sentence1: ... sentence2:`, `mnli premise: ... hypothesis:`)
- **SentencePiece Tokenization**: Inspect token IDs and subword pieces across the 32,128-token vocabulary

## Deploy with Hugging Face CLI

```bash
hf auth login
hf repos create <your-namespace>/t5-small-demo --type space --space-sdk gradio --public
hf upload <your-namespace>/t5-small-demo . --repo-type space --exclude "**/__pycache__/**"
```
