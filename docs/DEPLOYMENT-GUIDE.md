# RWA Lens — Vercel and VPS setup

The ZIPs contain source, not node_modules or secrets. Unzip into a new directory. Node.js 22 or newer and npm are required. Run `npm ci`, `npm run build`, then `npm start`. Visit http://127.0.0.1:3000. `npm start` serves both browser assets and API routes; never use a static-only server for live data.

## Environment

- `PORT`: local/VPS port, default 3000.
- `ROBINHOOD_RPC_URL`: optional dedicated Robinhood Chain mainnet RPC (chain ID 4663). Defaults to the documented public RPC, which has no production SLA.
- `ETHEREUM_RPC_URL`: optional Ethereum mainnet RPC (chain ID 1) for ENS. Defaults to PublicNode's public endpoint. A name resolving to an address does not establish holdings or trading eligibility. General social usernames and non-.eth names are unsupported. Offchain or unsupported ENS resolver cases may return unavailable.

Set secrets in the host environment. `.env.example` is documentation; the Node server does not automatically load `.env`. Never place provider keys in browser files.

## Vercel-ready ZIP

1. Extract `rwa-lens-vercel.zip`. It includes the root package.json, package-lock.json, vercel.json, public/, api/, lib/ and build scripts.
2. Import the files into a Git repository and use Vercel New Project, or run `npx vercel` from the extracted root with an authorized account. Choose the intended team and project. Framework preset: Other. Build command: `npm run build`. Output directory: `dist`. Node runtime: 22.x or newer supported runtime.
3. Set server environment variables in Project Settings for Preview and Production. No variables are required for the public read-only providers, but dedicated RPC endpoints are recommended before launch.
4. Deploy Preview first. Verify the homepage, `/api/activity`, ENS input and wallet scans, including pagination, unavailable states and freshness. Check function logs for provider failures without logging wallet addresses or secret URLs.
5. Stage a production build with `npx vercel --prod --skip-domain`, verify that URL, then promote that exact deployment with `npx vercel promote DEPLOYMENT_URL`.

The connected Vercel team previously denied creation of a project (403). The ZIP does not bypass account permissions. No static-only ZIP upload can provide these API functions.

## VPS (Ubuntu/Debian example)

Prerequisites: an existing VPS, SSH access, Node 22+ installed from an official distribution, npm, an unprivileged `rwalens` system user, a domain pointed to the VPS, and an installed Nginx reverse proxy. This guide does not buy or provision a server/domain. Adapt paths and account names to your host.

Unzip the full-project archive to `/opt/rwa-lens`, grant the service user ownership, and install/build as that user:

```sh
cd /opt/rwa-lens
npm ci
npm run build
npm test
```

Create `/etc/rwa-lens.env` owned by root with mode 600. It may contain `PORT=3000`, `ROBINHOOD_RPC_URL=https://YOUR_ENDPOINT`, and `ETHEREUM_RPC_URL=https://YOUR_ETH_MAINNET_ENDPOINT`. Omit either provider variable to use its public fallback. Do not put placeholder URLs into a running service.

Create `/etc/systemd/system/rwa-lens.service`:

```ini
[Unit]
Description=RWA Lens read-only portfolio app
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=rwalens
Group=rwalens
WorkingDirectory=/opt/rwa-lens
Environment=NODE_ENV=production
EnvironmentFile=/etc/rwa-lens.env
ExecStart=/usr/bin/node /opt/rwa-lens/server.mjs
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

Verify the Node executable path (`command -v node`) and update ExecStart if necessary. Then:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now rwa-lens
sudo systemctl status rwa-lens
curl -f http://127.0.0.1:3000/
sudo journalctl -u rwa-lens -n 50 --no-pager
```

Add this Nginx server block for the domain:

```nginx
server {
    listen 80;
    server_name lens.example.com;
    access_log off;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 130s;
    }
}
```

Replace the domain, run `sudo nginx -t`, then reload Nginx. For a typical Ubuntu/Debian host, install the distribution packages with `sudo apt update && sudo apt install nginx certbot python3-certbot-nginx`. Save the configuration as `/etc/nginx/conf.d/rwa-lens.conf`. Once DNS points to this server and ports 80/443 are reachable, obtain TLS with `sudo certbot --nginx -d lens.example.com --redirect`, then run `sudo certbot renew --dry-run`. Replace the example domain. Confirm HTTPS works before public use. Wallet browser integrations generally need a secure context. Open only SSH and HTTP/HTTPS on the host firewall; port 3000 is bound to loopback. Do not expose the Node port directly. Avoid retaining request URLs in access logs because they include public wallet addresses/ENS names.

## Verification and updates

- `npm run check`, `npm run lint`, `npm test`, `npm run build`.
- `npx playwright install chromium` then `BASE_URL=https://YOUR_HOST node tests/browser.mjs` for browser QA. Browser binaries are not included.
- Test `vitalik.eth` and compare the shown resolved address; unknown ENS names must error without inventing an address.
- Confirm the live block feed timestamps advance and a failed refresh shows LAST OBSERVED or UNAVAILABLE. The feed is real network activity, even when the portfolio tab shows fictional demo data.
- Wallet connection requests accounts only, never signing, transaction approval, a seed phrase or a private key.
- For updates, keep a copy of the previous release, install/build/test the new source, then restart `rwa-lens`. Roll back by restoring the previous source and lockfile, running npm ci, and restarting the service.

## Operational limits

Per-instance caches and rate limits are not distributed abuse control. Public RPC availability is not guaranteed. Production requires dedicated providers, monitoring and operational controls. No live eligibility verification, venue execution, historical valuation, persistent corporate-action audit store or cost-basis integration is included. Token launch economics await founder details. Do not infer production readiness from a successful build. The guide has not been executed against your VPS; no VPS access was supplied.
