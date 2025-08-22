# OINTment

Early documentation and starter UI for the Onboarding Insights Neural Toolset. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture, data model, and execution plan.

## Getting Started

```bash
npm install
npm run dev
```

The home page now links to key interfaces:

- **Upload ZIP / GitHub Repo** &mdash; manual ingestion or GitHub analysis at `/ingest`
- **View Matrix** &mdash; integration matrix prototype at `/matrix`
- **3D Map** &mdash; commit map at `/3d-map`

`npm test` runs a TypeScript type check.

*Binary assets such as `.ico` files are intentionally excluded.*

## GitHub App Integration

To analyze private repositories, authorize the app with GitHub.

1. Create a new GitHub App at <https://github.com/settings/apps/new> with the following settings:
   - **Homepage URL:** `http://localhost:3000`
   - **Callback URL:** `http://localhost:3000/api/github/callback`
   - **Webhook URL:** `http://localhost:3000/api/github/webhook`
   - **Repository permissions:** Contents – Read‑only, Metadata – Read‑only
   - **Event subscriptions:** Push (optional)
2. Install the app on the repositories you want to analyze.
3. Add environment variables to `.env.local`:

   ```bash
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   GITHUB_WEBHOOK_SECRET=your_webhook_secret
   ```

4. Start the dev server and visit `http://localhost:3000/api/github/auth` to connect your GitHub account. An OAuth token with `repo` scope will be stored in a cookie and used for subsequent API calls, enabling access to private repositories.

## Integration Matrix

The `/matrix` page inspects this project's `package.json` to list real dependencies.
For each dependency, the server resolves a homepage and displays its favicon via
Clearbit, providing a quick visual snapshot of the stack along with placeholder
readiness scores. Beneath the matrix, expandable widgets surface risk and
coverage details, a progress timeline, and a pie chart showing the distribution
of integration categories.

## Manual Ingestor

Upload a repository ZIP or point to a GitHub repo/branch at `/ingest` to trigger
an analysis run. Provide an API key for language model analysis via
`AIML_API_KEY` (uses [aimlapi.com](https://aimlapi.com) by default); analyses
prefer the `gpt-5-nano` model with automatic fallback to `gpt-4o` for
stability. Upload & Analyse, Roaster, and Vibe Killer all run on `gpt-5-nano`,
while OINT defaults to `gpt-5-nano` with a `gpt-4o` fallback. The last
ingest result along with your selected repo and branch are cached in the browser
so you can navigate away and return without losing context. Below the console,
AI‑extracted takeaways and metrics render in animated widgets.

Click a row on the Matrix page to drill into indicator explanations, improvement
tips and code references gathered from the repo.

The code reference API now searches the entire workspace using `ripgrep`,
surfacing up to twenty matching lines across TypeScript, JavaScript, and JSON
files instead of only showing `package.json` entries.
