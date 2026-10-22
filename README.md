# Sultana WhatsApp Agent

A free AI sales assistant for **Sultana Food Industry** on WhatsApp, powered by Google Gemini (free tier).

It answers customers in Bahasa Melayu or English, explains the laddoo, desserts,
drinks and wedding packages, collects order details (product, quantity, event
date, delivery area), and sends each enquiry to the owner's WhatsApp. When a
customer complains, wants to pay, asks for a person or asks something it doesn't
know, it hands the chat to a human and goes quiet in that chat.

It never quotes prices or confirms dates; the team does that.

## How it works

```
Customer on WhatsApp ──► Meta WhatsApp Cloud API ──► /api/webhook (Vercel)
                                                        │
                                                        ├─ Gemini (answers, uses tools)
                                                        │    • record_order_enquiry → alert owner
                                                        │    • handoff_to_human     → alert owner, pause bot
                                                        └─ Redis (chat memory, leads, dedupe)
```

| File | What it is |
|---|---|
| `src/business.ts` | **What the bot knows**: products, packages, policies. Edit this. |
| `src/agent.ts` | System prompt (tone, rules), tools, Gemini call |
| `src/handler.ts` | Per-message flow, owner alerts, owner commands |
| `src/whatsapp.ts` | WhatsApp Cloud API: parse webhook, verify signature, send |
| `src/store.ts` | Memory: Upstash Redis, or in-memory for local testing |
| `api/webhook.ts` | The Vercel endpoint |
| `scripts/chat.ts` | Chat with the bot in your terminal |

## 1. Try it in the terminal (5 minutes)

Needs Node 20+ and a free Gemini API key: go to https://aistudio.google.com/apikey,
sign in with a Google account and click **Create API key**. No credit card needed.

```bash
npm install
cp .env.example .env        # put your GEMINI_API_KEY in it
npm run chat
```

Try: "Assalamualaikum, nak tempah laddoo untuk walimah 500 orang bulan Disember".

## 2. Set up WhatsApp (Meta)

1. Go to https://developers.facebook.com → **My Apps → Create app → Business**, add the **WhatsApp** product.
2. In **WhatsApp → API Setup** note the **Phone number ID** and a temporary **access token**.
   For production, create a permanent token: Business Settings → **System users** → add a system
   user with `whatsapp_business_messaging` and `whatsapp_business_management`, then generate a token.
3. Add your real business number (it must not be active in the WhatsApp app at the same time,
   unless you use Meta's coexistence onboarding for the WhatsApp Business app).
4. Copy the **App secret** from App settings → Basic.

## 3. Deploy on Vercel

1. Import this repo at https://vercel.com/new (framework preset: **Other**).
2. **Storage** tab → add **Upstash Redis** (Marketplace). This sets the Redis env vars for you.
3. **Settings → Environment Variables**: add everything from `.env.example`.
4. Deploy. Your webhook URL is `https://<your-project>.vercel.app/api/webhook`.
5. Back in Meta: **WhatsApp → Configuration → Webhook → Edit**: paste the URL and your
   `WHATSAPP_VERIFY_TOKEN`, click **Verify and save**, then **subscribe to `messages`**.
6. Message your business number from another phone. 🎉

## Linked-device mode (bot + staff on one number, unofficial)

Runs the bot on your existing WhatsApp Business app number as a linked device,
like WhatsApp Web, so customers who message that number get bot replies and
staff can still reply from the app. **This is not the official API and is against
WhatsApp's terms: the number can be banned.** Use it only as a stopgap until
coexistence through the official API is set up.

It needs a computer that stays on (it keeps a live connection, so it can't run
on Vercel):

```bash
npm install
cp .env.example .env     # only GEMINI_API_KEY is required in this mode
npm run linked           # scan the QR: WhatsApp Business > Linked devices > Link a device
```

Or `LINK_WITH_CODE=60123456789 npm run linked` to get a pairing code instead of a QR.
The login is saved in `auth_linked/`; delete that folder to link again.

- Replies only to people who message first, in private chats (never groups or status).
- Waits a few seconds and shows "typing…" before replying; at most
  `MAX_REPLIES_PER_MINUTE` replies per minute (default 15).
- **When anyone replies from the phone app, the bot goes quiet in that chat** for
  `HANDOFF_HOURS`.
- Alerts go to your own "Message yourself" chat (or `ALERT_WHATSAPP_NUMBER`). Send
  `/pause`, `/resume`, `/reset <number>` in that chat.

## Owner alerts and commands

New enquiries and handoffs are sent to `OWNER_WHATSAPP_NUMBER` with a `wa.me` link to the customer.
When a customer asks for a person, the bot tells them a team member will contact them from
`STAFF_CONTACT_NUMBER` (defaults to the owner number), pauses itself for that chat, and sends
you a link to message or call the customer from your own phone.

> **WhatsApp rule:** a business number can only send free-form messages to someone who
> messaged it in the last 24 hours. Send "hi" to the bot number from the owner phone each
> morning to keep alerts flowing. (Next step: an approved message template for alerts.)

From the owner number, send:

- `/pause 60123456789`: bot stops replying to that customer (you take over)
- `/resume 60123456789`: bot replies again
- `/reset 60123456789`: forget that customer's conversation

Leads are also saved in Redis under the `leads` list.

## Changing what the bot says

- Products, packages, policies: `src/business.ts`
- Tone, rules, when to hand off: `SYSTEM_PROMPT` in `src/agent.ts`
- Model: `GEMINI_MODEL` env var (default `gemini-flash-latest`, Google's current free Flash model)

## Free tier limits

Everything here can run at RM0: WhatsApp Cloud API replies to customers who message
first are free, and Gemini, Vercel and Upstash have free plans. The catch:

- **Gemini free tier has daily request limits**, set per project and shown in
  Google AI Studio. Each customer message uses 1-3 requests. If the limit is hit, the
  customer gets a polite "our team will reply shortly" message and **you get an alert
  with their message**, so no order is lost. Limits reset daily.
- **On the free tier Google may use the chats to improve its products** (and human
  reviewers may read them). Don't let the bot ask for sensitive data; it only needs
  name, date, quantity and area. Turning on billing in AI Studio removes this.
- Vercel's free Hobby plan is meant for non-commercial use; Cloudflare Workers' free
  plan allows commercial use if you want to move later.

## Development

```bash
npm run typecheck
npm test
npm run dev     # local webhook on :3000; expose with a tunnel for Meta
```

## Ideas for next steps

- Price list in `business.ts` once you want the bot to quote
- Read photos and voice notes (currently it asks customers to type)
- Message template for owner alerts, Google Sheets export of leads
- Link the "Order on WhatsApp" buttons on the website to this number
