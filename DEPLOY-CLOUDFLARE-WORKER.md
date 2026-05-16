# Aura CryptoX — WhatsApp Alert Bot

## Deploy to Cloudflare Workers

### Step 1: Create Worker

1. Go to https://dash.cloudflare.com → **Workers & Pages**
2. Click **Create Application** → **Worker**
3. Name: `cryptox-whatsapp-bot`
4. Click **Deploy**

### Step 2: Copy Code

Open the worker editor → Delete default code → Paste content from:

```
cloudflare-worker/whatsapp-bot.js
```

### Step 3: Add Environment Variables (Secrets)

Go to Worker → **Settings** → **Variables** → **Add**:

| Name | Value |
|---|---|
| `WHATSAPP_TOKEN` | Your WhatsApp Cloud API permanent token |
| `WHATSAPP_PHONE` | Your WhatsApp Business Phone Number ID |
| `BOT_TOKEN` | Random secret (e.g. `cryptox-bot-secret-2026`) |

### Step 4: Create KV Namespace

1. Workers → **KV** → **Create Namespace**
2. Name: `CRYPTOX_ALERTS`
3. Go to Worker → **Settings** → **Bindings** → **Add** → **KV Namespace**
4. Variable name: `ALERTS`
5. Select the KV namespace you created

### Step 5: Add Cron Trigger

Worker → **Triggers** → **Cron Triggers** → **Add**:

```
*/5 * * * *
```

(Every 5 minutes — checks prices and sends alerts)

### Step 6: Test

```bash
# Health check
curl https://cryptox-whatsapp-bot.YOUR_SUBDOMAIN.workers.dev/api/check-prices

# Subscribe (from frontend or test)
curl -X POST https://cryptox-whatsapp-bot.YOUR_SUBDOMAIN.workers.dev/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_BOT_TOKEN","phone":"88017XXXXXXXX","coin":"BTC","threshold":"75000"}'
```
