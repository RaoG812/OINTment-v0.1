# PM Control Suite

Early documentation and starter UI for a project manager control platform. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture, data model, and execution plan.

## Getting Started

```bash
npm install
npm run dev
```

The home page now links to key interfaces:

- **Upload ZIP** &mdash; manual ingestion at `/ingest`
- **View Matrix** &mdash; integration matrix prototype at `/matrix`

`npm test` runs a TypeScript type check.

*Binary assets such as `.ico` files are intentionally excluded.*

## Manual Ingestor

Upload a repository ZIP at `/ingest` to trigger an analysis run. Set `OPENAI_API_KEY` in your environment to enable GPT-5 summaries of the uploaded contents.
