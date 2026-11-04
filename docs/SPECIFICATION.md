# RWA Lens — verified product specification

Research date: 2026-11-05 (Asia/Bangkok). Independent, read-only analytics. Scope: Project 1 only; launch-token terms await the founder.

## Verified behavior

- [Issuer overview](https://docs.robinhood.com/chain/stock-tokens/): RHJ stock tokens are tokenised debt securities, not legal/beneficial ownership of the underlying shares. Primary issuance/redemption is for onboarded Authorised Participants; wallet holdings do not establish direct redemption rights. Jurisdiction restrictions include the US, UK, Canada and Switzerland; consult the [prospectus and Final Terms](https://docs.robinhood.com/rhj), not this app, for eligibility.
- [Network](https://docs.robinhood.com/chain/connecting/): mainnet chain ID 4663, testnet 46630. Public RPC is rate-limited and explicitly not recommended for production. This release reads mainnet only.
- [Canonical registry](https://docs.robinhood.com/chain/contracts/) and [API schema](https://docs.robinhood.com/chain/stock-token-apis/): identify by chain and deployed contract. Live registry returned 203 assets in the smoke test; do not pin this count. Balance, decimals, multiplier and pause state use one RPC block per page. Registry/on-chain multiplier disagreements leave share equivalents unverified.
- [Oracle mechanics](https://docs.robinhood.com/chain/oracles-and-price-feeds/): multiplier is scaled by 1e18. Raw balances do not change for multiplier-based splits/dividends. Chainlink prices are per token and already multiplier-adjusted. REST equity bid/ask prices require multiplying by share equivalents. Live release uses REST midpoint, explicitly indicative and non-executable, denominated USD.
- Corporate actions: live endpoint uses `corpActions`; splits, reverse splits, cash and stock dividends are active types. Other action enums are forward-compatible, not evidence of supported economic processing. Events explain issuer adjustments; they never mutate balances. Oracle pauses suppress valuation.
- Underlying session, token restrictions, venue availability and user eligibility are independent. Unknown remains unknown; token ownership never establishes trade permissions.
- [Classic Stock Tokens](https://robinhood.com/eu/en/support/articles/about-stock-tokens/) in the Europe brokerage app are distinct, non-withdrawable derivative contracts. They are excluded from public-wallet scanning.

## Calculations and assumptions

Integer fixed-point arithmetic uses 18 decimal places; extra precision is rejected. Token units = raw / 10^decimals. Share equivalents = token units × on-chain verified multiplier. USD indicative value = share equivalents × ((equity bid + ask) / 2). No double multiplier. Rounding truncates below fixed-point precision and display cents; balances are never converted to JavaScript floating point.

Conservative freshness policy: quotes must be no older than 120 seconds, no more than 30 seconds in the future, valid positive non-crossed USD bid/ask, exact deployed identity, unambiguous, and oracle not paused. Missing, stale, paused and conflicting positions are excluded from priced totals. Outside trading hours this can produce unavailable prices rather than silently carrying forward a close. No FX or cost-basis live integration exists.

Read up to 24 registry entries per page, four assets concurrently, two attempts per upstream read, eight-second per-request timeout. User must continue the scan to cover the full registry; each page has its own block and timestamp, so aggregate valuation is an observed multi-block snapshot, not an atomic chain snapshot. Unsupported registry pagination is rejected. Failures and missing action data are surfaced. Unknown non-registry tokens are outside the scan, not classified by symbol.

## Model and boundaries

AssetIdentity = chainId + lowercase contract; registry supplies issuer identity, name and pending ratio. Position = raw integer, decimals, block, ratio observation, token units, share equivalents, Price and five independent availability fields (including price state). Price = value, unit (share/token), currency, source, timestamp, pause/conflict flags. Corporate event = issuer record with provenance and observation timestamp; process date is not assumed to be announcement or dividend payable date.

`ratioAt` replays absolute ratio records with stable IDs and monotonically increasing correction revisions, without changing balances. Historical ratio records require an archival source; this utility is tested but historical valuations are not exposed. Current display always rereads issuer/chain state instead of applying events locally, making duplicate/corrected upstream records non-incremental.

## Unsupported / not yet production-ready

Dedicated RPC, shared durable rate-limit/cache storage, external monitoring, authoritative market calendar (holidays/DST/early closes), exchange/venue quotes, eligibility verification, live FX, cost basis, persistent corporate-action audit/history storage, archival balance/price reconciliation and direct redemption are not configured. Session/calendar information remains unknown across weekends, holidays and DST instead of guessing. Do not interpret UI connectivity as permission to trade.

Launch token: no contract is deployed by this app, and no token purchase, claim, approval, signature or transaction flow is included. Name/ticker, chain, supply, allocation, vesting, utility and launch date await founder confirmation. No fictional tokenomics are published as terms.

Demo fixtures use explicitly fictional instruments, balances, addresses and prices; they are frontend-only and never used by the live API.
