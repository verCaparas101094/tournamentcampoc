# TournamentCam

Angular PWA for recording pickleball matches, replaying moments and sharing expiring watch links. Built from the supplied match-recap and elevated baseline camera references. No reference image is represented as a live camera feed.

## Run

Requires Node.js 22.12+ or compatible Node 24, npm, and FFmpeg for Dahua recording.

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd run build
npm.cmd run server
```

Open http://localhost:3000. For development, run `npm.cmd start` in another terminal and open http://localhost:4200; the Angular dev server proxies API/media requests to port 3000. Use `npm.cmd test` for scoring tests and `node --test tests/server.test.mjs` for API tests.

Browser recording needs a real camera, permission, and localhost or HTTPS. NVR recording needs configured hardware reachable from the server. FFmpeg is not bundled. No cameras, credentials or footage are preconfigured.

## Features

- Browser camera preview, court alignment overlay, recording and upload; recoverable download if upload fails.
- Server-side Dahua RTSP recording, channel selection 1–16, H.264 MP4 output, four-hour recording cap.
- Durable disk library, search, court filtering, playback speed, timestamp bookmarks and download.
- Random unguessable 14-day watch links, share-link revocation, separate one-hour operator playback tokens.
- Manual singles/doubles side-out scoring, opening 0–0–2, server rotation, targets 11/15/21, win by two and undo.
- Responsive interface, install manifest and Angular service-worker shell caching. Video/API content is not cached offline.
- Technical architecture, operator manual and physical camera placement guidance.

Read [User manual](docs/USER-MANUAL.md), [Technical guide](docs/TECHNICAL.md), and [Feature and validation record](docs/FEATURES.md).

## Deployment boundaries

This is a single-venue implementation with a shared operator key, not a multi-tenant SaaS service. Use HTTPS and a secure reverse proxy for remote access, set PUBLIC_ORIGIN to its actual reachable URL, and use a long OPERATOR_KEY. Default binding is loopback. Do not expose NVR ports to the internet. Back up `data/` and monitor disk space. Localhost share links only work on the recording server itself until deployment is configured.

Recordings are retained until an operator removes them; 14-day expiry applies to shared access links only. Automatic footage deletion, email delivery, PTZ movement, AI tracking, automatic highlights, clipping exports, tournament brackets and NVR historical archive import are not implemented. A 4K-capable NVR does not increase the native resolution of a 2 MP camera.
