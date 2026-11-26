# حواري — Arabic AI Conversation

A pink-and-white Arabic conversation learning website powered by an AI assistant. Built with Next.js App Router and ready for GitHub + Vercel.

## Features
- Practice Arabic conversation with an AI partner.
- CEFR-style levels A1, A2, B1, and B2 with adaptive AI responses.
- Choose an AI persona: teacher, friend, or native-speaker simulation.
- Microphone speech input (browser Web Speech API) and Arabic text-to-speech.
- AI-generated text-based evaluation for grammar, vocabulary, and relevance.
- Conversation history and vocabulary collection saved in browser localStorage.
- Starter conversation examples for greetings, introductions, café visits, shopping, and asking directions.
- Arabic-first RTL interface with optional Indonesian translations in example cards.
- Suggested prompts, clear chat, and responsive layout.
- API key stays on the server in a Vercel environment variable.

## Run locally
1. Install Node.js 18.17+.
2. Copy `.env.example` to `.env.local`.
3. Add your API key to `OPENAI_API_KEY`.
4. Run:
   ```bash
   npm install
   npm run dev
   ```
5. Open http://localhost:3000

## Deploy to Vercel
1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Add `OPENAI_API_KEY` in **Settings → Environment Variables**.
4. Optionally set `OPENAI_MODEL` (default: `gpt-4o-mini`).
5. Deploy.

Do not commit `.env.local` or expose your API key in client-side code.

## Customization
- Main UI: `app/page.tsx`
- Theme and layout: `app/globals.css`
- AI system prompt and API: `app/api/chat/route.ts`
- Conversation examples: `lib/examples.ts`

## Notes about learning features
- Microphone input requires browser permission and works best in Chrome/Edge over HTTPS (Vercel provides HTTPS).
- Text-to-speech voice availability depends on the browser and installed Arabic voices.
- Speaking evaluation in this version is an AI estimate based on the speech-recognition transcript, not acoustic pronunciation scoring.
- History and vocabulary are stored locally in the current browser/device. Add authentication and a database (e.g. Supabase/Postgres) if you need cross-device accounts and centralized student records.
