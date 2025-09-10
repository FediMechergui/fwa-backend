## Backend (Express + MongoDB + WhatsApp)

Endpoints:
- POST `/api/contact` — stores contact data in MongoDB and sends a WhatsApp message with the details.

Requirements:
- Node.js 18+
- MongoDB connection string
- WhatsApp session (whatsapp-web.js will prompt a QR on first run)

Setup:
1. Copy `.env.example` to `.env` and fill values.
2. Install deps: `npm i`
3. Start dev: `npm run dev`

Environment variables:
- `PORT` — default 4000
- `MONGODB_URI` — MongoDB connection string
- `WHATSAPP_TARGET` — phone number in international format, e.g. `21612345678`
- `CLIENT_ORIGIN` — allowed frontend origin for CORS, e.g. `http://localhost:8080`

Notes:
- On first run, a QR code will print in the server logs. Scan with WhatsApp on your phone. Session will be cached to `.wwebjs_auth/`.


