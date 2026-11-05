# RWA Lens

Read-only Robinhood Chain stock-token portfolio explorer, built with Node ESM, a vanilla browser UI, integer-safe domain functions and a Vercel Node API. The supplied GitHub repository was empty, so no prior stack or deployment configuration existed.

## Run

Node 22+ recommended. `npm ci`, `npm run dev`, then open http://127.0.0.1:3000. Enter a public EVM address; continue scanning until all registry pages are covered. The browser requests account access only when Connect wallet is selected. No transaction or signature methods are used.

Optional server-only environment variables: `ROBINHOOD_RPC_URL` (dedicated mainnet RPC endpoint), `PORT` (local server; default 3000). No secret belongs in frontend code. Public issuer registry/quotes/actions require no credentials in the verified smoke tests. Never commit `.env` or credential-bearing endpoints.

## Verify

- `npm run check`: strict TypeScript checks for JSDoc-typed domain/provider modules.
- `npm test`: deterministic domain, mocked-provider and API tests.
- `npm run build`: type checks and static asset build.
- `node tests/browser.mjs`: headless Chromium desktop/mobile flows; screenshots in `artifacts/`. Requires Playwright Chromium (`npx playwright install chromium` if absent). Set `BASE_URL` to verify a deployment.
- `npm run lint`: syntax checks of browser, API and server source.

See [the source-backed specification](docs/SPECIFICATION.md) for mechanics, assumptions and unavailable integrations. This is a functional review release; missing infrastructure and historical reconciliation prevent claiming full production readiness.

## Operations and deployment

Vercel builds static assets to `dist`, with `/api/portfolio` as a server-side function. Deploy preview, test its UI and API, then stage production and verify before promotion. Existing team: `jvar2`; project scope: `robinlens` only. Provider credentials remain on the server. CSP restricts scripts and requests to the app origin, and rendered provider text uses `textContent`.

Requests validate address, chain and scan cursor; API supports GET only. Per-instance rate limits and concurrency bounds are defensive, not a distributed abuse-control system. Logs emit provider-failure event/timestamp, not addresses, request bodies or endpoint credentials. Server-side caches are bounded and short-lived. Infrastructure access logs may record wallet query strings; configure retention/redaction at the host before a public launch. No wallet address is persisted in browser storage.

Corporate-action history storage and external monitoring are integration gaps. Financial values are unavailable rather than invented when reads fail. REST quotes are indicative underlier midpoints, never executable token quotes. Tokenomics page is pending founder-provided terms.

## Redesigned preview and portable releases

The dark animated interface adds a live block feed and read-only ENS (.eth) lookup. Enter `vitalik.eth` or an EVM address. ENS is resolved on Ethereum mainnet; portfolio reads remain on Robinhood Chain 4663. Social usernames are not supported. PublicNode is the public ENS RPC fallback; set server-only `ETHEREUM_RPC_URL` for a dedicated endpoint. Offchain CCIP-read resolvers are disabled; unsupported names return an unavailable/error state.

See [Vercel and VPS instructions](docs/DEPLOYMENT-GUIDE.md). `npm test` covers 14 unit/integration cases; `BASE_URL=http://127.0.0.1:3000 node tests/future-browser.mjs` verifies ENS-to-scan, explorer availability and read-only wallet methods. The live feed refreshes every 20 seconds while the page is visible.
