# 📚 Virtual Study Room

A real-time, collaborative study platform where friends can create a room, study together with a synced Pomodoro timer, chat live, make 1:1 video calls with screen share, and get help from an AI study assistant that's aware of what the room is actually studying.

**🔗 Live demo:** [virtual-study-room-theta.vercel.app](https://virtual-study-room-theta.vercel.app/register)

> Built as a full-stack portfolio project to demonstrate real-time systems, authentication, peer-to-peer media, and AI integration — not just CRUD.

---

## ✨ Features

- **Rooms** — create a room with a unique, easy-to-read 6-character join code; join by code
- **Live presence** — see who's actually in the room right now, updating instantly as people join or leave
- **Synced Pomodoro timer** — one shared timer per room, server-authoritative so everyone sees the exact same countdown, survives a page refresh mid-session, and auto-switches between focus and break
- **Real-time chat** — messages appear instantly for everyone and are permanently saved
- **1:1 video calls + screen share** — peer-to-peer WebRTC audio/video, with the ability to share your screen mid-call
- **AI Study Assistant** — a Gemini-powered chat panel, scoped to the room: it knows the room's subject and the recent conversation, so "summarize what we've discussed" or "quiz me on this" actually works
- **Auth** — email/password and Google sign-in

---



<img width="959" height="437" alt="image" src="https://github.com/user-attachments/assets/2c556d9c-4a82-40f5-accd-a3ef328c10b5" />
<img width="959" height="437" alt="image" src="https://github.com/user-attachments/assets/5c4cd83a-63e7-4e86-9a7b-34dc6606397e" />
<img width="959" height="437" alt="image" src="https://github.com/user-attachments/assets/9bcb0bf1-bba1-4281-859a-527cf42e5d50" />




<img width="827" height="413" alt="image" src="https://github.com/user-attachments/assets/a487a165-25f9-43b8-aeb0-55a226602ef5" />
<img width="616" height="313" alt="image" src="https://github.com/user-attachments/assets/7ee4ccc7-7c84-4d41-8e07-d6951ddeb422" />



## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, TypeScript) |
| Styling | Tailwind CSS v4, custom design system |
| Client state | [Zustand](https://github.com/pmndrs/zustand) |
| Database | PostgreSQL ([Neon](https://neon.tech)) |
| ORM | [Prisma](https://www.prisma.io/) v7 |
| Auth | [Auth.js](https://authjs.dev/) v5 (Credentials + Google OAuth) |
| Real-time | Standalone [Socket.IO](https://socket.io/) server (Express) |
| Video/audio | WebRTC (peer-to-peer), signaled over the Socket.IO server |
| AI | [Vercel AI SDK](https://sdk.vercel.ai/) + Google [Gemini](https://ai.google.dev/) |
| Hosting | Vercel (app) · Cloudflare Tunnel (real-time server) · Neon (database) |

---

## 🏗️ Architecture

This project is **two separate applications** that work together, not one monolith:

```
Browser
   │
   ├──►  Next.js app (Vercel)  ───────►  PostgreSQL (Neon)
   │     • Pages & UI                     users, rooms, messages
   │     • Auth (Auth.js)
   │     • Server Actions
   │     • AI route (streaming)  ───────►  Gemini API
   │
   └──►  Socket.IO server (separately hosted)
         • Room presence
         • Synced Pomodoro timer
         • Chat relay
         • WebRTC signaling (offer/answer/ICE)

Once a call connects:
Browser A  ◄──────  direct peer-to-peer media  ──────►  Browser B
           (video / audio / screen — never touches either server)
```

**Why two servers?** The Next.js app is serverless — great for pages and API routes, but it can't hold a persistent, long-running connection. Socket.IO needs exactly that (an always-open connection per room) to push live updates instantly instead of everyone polling. So real-time state (presence, the timer, chat delivery, call signaling) lives in a small, independent Express + Socket.IO service, deployed and scaled separately from the main app.

**Why the AI route is server-authoritative:** the `/api/ai/study-assistant` route does **not** trust anything the browser claims about the room — it independently verifies the user is signed in, confirms they're actually a participant in that specific room, and loads the room's subject and recent chat directly from the database before calling Gemini. The client only ever sends a room code and a question.

---

## 🚀 Getting Started

This repo contains the **Next.js app**. The real-time server lives in a sibling repository, [`virtual-study-room-socket`](#).

### Prerequisites

- Node.js 18.18+
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) project)
- A [Google Cloud](https://console.cloud.google.com/) OAuth client (for Google sign-in)
- A [Gemini API key](https://aistudio.google.com/) (for the AI assistant)

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/virtual-study-room.git
cd virtual-study-room
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

AUTH_SECRET="generate-with-npx-auth-secret-or-crypto"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"

GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"

NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

### 3. Set up the database

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Run the real-time server (separate repo)

In a sibling folder:

```bash
git clone https://github.com/<your-username>/virtual-study-room-socket.git
cd virtual-study-room-socket
npm install
npm run dev
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll need **both** the app and the socket server running for real-time features (presence, timer, chat, calls) to work.

> **Windows note:** if `next dev` fails with a Turbopack/native-binding error, run `next dev --webpack` instead — this is a platform/security-policy issue on some Windows machines, unrelated to the project itself.

---

## 📁 Project Structure (high level)

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Auth.js route handler
│   │   └── ai/study-assistant/   # Streaming AI chat endpoint
│   ├── dashboard/                # Create/join a room
│   ├── room/[code]/              # The study room itself
│   ├── login/ register/
│   └── layout.tsx
├── components/                   # UI components (design system + feature components)
├── hooks/                        # Client hooks: socket connection, timer, chat, WebRTC
├── lib/
│   ├── actions/                  # Server Actions (room, chat, register)
│   ├── auth.ts                   # Auth.js config
│   └── prisma.ts                 # Prisma client singleton
└── generated/prisma/             # Generated Prisma client

prisma/
└── schema.prisma                 # Data model
```

---

## 🧠 Notable Design Decisions

- **Server-authoritative timer** — the Pomodoro timer's true state lives on the Socket.IO server, not in any client. Each client just renders "time remaining until the server's end timestamp," correcting for its own clock drift. This is what keeps everyone's countdown in sync and lets it survive a page refresh.
- **Room codes avoid ambiguous characters** (no `0`/`O`, `1`/`I`) so they're easy to read aloud or type from memory.
- **Chat is optimistic** — a sent message appears instantly for the sender while it saves to the database in the background, rather than waiting on a round trip.
- **WebRTC is peer-to-peer, signaling only goes through the server** — video/audio never touches either backend; the Socket.IO server's only role in a call is relaying the one-time connection handshake (offer/answer/ICE candidates).
- **AI context is loaded server-side, not client-side** — an earlier version trusted a context string sent from the browser, which went stale and was spoofable. The current version has the API route independently verify room membership and pull live data from the database on every request.

---

## ⚠️ Known Limitations

- Video calls use a public STUN server only — this works for most home/university networks (~85–90%), but some strict corporate NATs need a TURN relay to connect, which isn't configured yet.
- The AI Study Assistant's conversation is per-tab and isn't saved — refreshing clears it.
- No AI-generated end-of-session summary yet (the data model supports it; the feature itself isn't built).
- The real-time server isn't on a permanent host yet — see the architecture section for why it's deployed separately, and the repo's deployment notes for current hosting.

---

## 🗺️ Roadmap

- [ ] AI-generated session summaries (topics covered, follow-ups) saved per study session
- [ ] TURN server for more reliable cross-network video calls
- [ ] Shareable AI assistant answers visible to the whole room
- [ ] Rate limiting on the AI endpoint
- [ ] Permanent hosting for the real-time server

---

## 📄 License

MIT
