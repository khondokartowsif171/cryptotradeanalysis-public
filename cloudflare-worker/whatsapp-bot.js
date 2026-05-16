// == Aura CryptoX — WhatsApp Price Alert Bot ==
// Deploy on Cloudflare Workers dashboard
// Required secrets:
//   WHATSAPP_TOKEN    — Permanent WhatsApp Cloud API token
//   WHATSAPP_PHONE    — Your WhatsApp Business Phone Number ID
//   BOT_TOKEN         — Secret token to verify requests from frontend

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const headers = corsHeaders();
    headers['Content-Type'] = 'application/json';

    try {
      // POST /api/subscribe — user subscribes from frontend
      if (url.pathname === '/api/subscribe' && request.method === 'POST') {
        const body = await request.json();
        if (body.token !== env.BOT_TOKEN) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
        }
        const { phone, coin, threshold } = body;
        if (!phone || !coin || !threshold) {
          return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });
        }
        // Store in KV
        await env.ALERTS.put(phone, JSON.stringify({ phone, coin, threshold, createdAt: Date.now() }));
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // GET /api/subscribe/:phone — check subscription status
      if (url.pathname.startsWith('/api/subscribe/') && request.method === 'GET') {
        const phone = url.pathname.split('/').pop();
        const data = await env.ALERTS.get(phone);
        return new Response(JSON.stringify({ subscribed: !!data, data: data ? JSON.parse(data) : null }), { headers });
      }

      // POST /api/unsubscribe — user unsubscribes
      if (url.pathname === '/api/unsubscribe' && request.method === 'POST') {
        const body = await request.json();
        if (body.token !== env.BOT_TOKEN) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
        await env.ALERTS.delete(body.phone);
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // POST /api/send-alert — triggered by cron or external
      if (url.pathname === '/api/send-alert' && request.method === 'POST') {
        const body = await request.json();
        if (body.token !== env.BOT_TOKEN) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
        await sendWhatsApp(env, body.phone, body.message);
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // GET /api/check-prices — called by Cron Trigger every 5 min
      if (url.pathname === '/api/check-prices' && request.method === 'GET') {
        const results = [];
        const list = await env.ALERTS.list();
        for (const key of list.keys) {
          const data = JSON.parse(await env.ALERTS.get(key.name));
          const price = await fetchBinancePrice(data.coin);
          if (price <= parseFloat(data.threshold)) {
            const msg = `🚨 ${data.coin} Alert!\nPrice: $${price.toLocaleString()}\nYour threshold: $${data.threshold}\n\nFrom: Aura CryptoX`;
            await sendWhatsApp(env, data.phone, msg);
            results.push({ phone: data.phone, alerted: true, price });
          }
        }
        return new Response(JSON.stringify({ checked: list.keys.length, triggered: results.length }), { headers });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  },

  // Cron trigger (every 5 min)
  async scheduled(event, env) {
    const list = await env.ALERTS.list();
    for (const key of list.keys) {
      const data = JSON.parse(await env.ALERTS.get(key.name));
      const price = await fetchBinancePrice(data.coin);
      if (price <= parseFloat(data.threshold)) {
        const msg = `🚨 ${data.coin} Alert!\nPrice: $${price.toLocaleString()}\nYour threshold: $${data.threshold}\n\nFrom: Aura CryptoX`;
        await sendWhatsApp(env, data.phone, msg);
      }
    }
  },
};

async function fetchBinancePrice(coin) {
  const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin}USDT`);
  const data = await res.json();
  return parseFloat(data.price);
}

async function sendWhatsApp(env, phone, message) {
  const url = `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE}/messages`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message },
    }),
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
