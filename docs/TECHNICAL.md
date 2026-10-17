# Technical implementation and deployment

## Architecture

Angular 21 standalone components and signals → same-origin Express 5 API → local disk metadata and media. Browser mode uses getUserMedia/MediaRecorder, sends multipart video, and persists it on the server. NVR mode spawns FFmpeg with an argument array (no shell) and reads the selected Dahua RTSP stream. It transcodes video to H.264/yuv420p fragmented MP4 for browser playback and recovery. Audio is excluded in both modes.

```
Browser camera → MediaRecorder → POST /api/matches → data/media
Dahua camera → 16-channel NVR → RTSP → FFmpeg → data/media
Angular library → temporary media token → HTML video player
Shared watch link → expiry/revocation check → range-capable media response
```

Angular service worker caches only shell assets. `/api`, `/media`, `/watch` are excluded from navigation fallback. Metadata and videos are not cached by the service worker. Downloaded copies are independent of link expiry. The application uses responsive CSS and system-font fallback if optional Google fonts are unavailable.

## Hardware configuration

Exact Dahua camera and NVR model numbers and firmware were not supplied, so compatibility has not been hardware-certified. Verify RTSP channel mapping with your NVR documentation. The implemented URL format is:

`rtsp://USER:PASSWORD@NVR_HOST:554/cam/realmonitor?channel=1&subtype=0`

The main stream is subtype 0; channels run 1–16 in this application. Set NVR_HOST to a hostname or IPv4 address without scheme or port. Credentials are URL-encoded server-side. A dedicated least-privilege streaming account is recommended. RTSP stays on the private venue network; expose only the authenticated application via HTTPS. The host executing FFmpeg necessarily sees its RTSP arguments; restrict host access.

A 2 MP camera is typically a 1080-class input, but use the model’s actual supported modes. NVR 4K output capability does not upgrade camera sensor resolution. CPU capacity is important because each active channel is transcoded. Up to 16 channels are selectable, but 16 simultaneous encodes are not capacity-certified. Benchmark before deployment. At 4 Mbps one hour of source video is approximately 1.8 GB; actual output depends on FFmpeg’s encoder and scene complexity.

## Environment

| Variable | Description |
| --- | --- |
| PORT | HTTP port, default 3000. |
| HOST | Bind address, default 127.0.0.1. Non-loopback requires a 24-character operator key. |
| OPERATOR_KEY | Shared administrative API secret, passed in x-operator-key; stored in browser sessionStorage. |
| PUBLIC_ORIGIN | Absolute external app origin for generated links and trusted write origins. |
| NVR_HOST | NVR host, no scheme or port. |
| NVR_USER / NVR_PASSWORD | Private RTSP account. Never committed or returned through API. |
| FFMPEG_PATH | FFmpeg executable path or command on PATH. |

Run `npm.cmd run build` then `npm.cmd run server`. Serve the single origin through a TLS reverse proxy. Forward Range headers and allow recording uploads with an appropriate request limit and timeout. Production camera permission and PWA installation require HTTPS, except localhost development. Set PUBLIC_ORIGIN before creating share links. Restrict operator API routes to venue staff; the shared key is a minimal single-venue authentication scheme, not individual account management. Apply proxy rate limits for public endpoints and operator login attempts. Do not distribute the operator key to players.

## API contract

All `/api` routes require x-operator-key when configured. Mutation routes reject unrelated browser origins. No permissive CORS is enabled.

| Endpoint | Behavior |
| --- | --- |
| GET /api/health | Server reachability and presence of NVR settings (not a live camera probe). |
| GET /api/matches | Metadata newest first; no internal file paths. |
| POST /api/matches | Multipart `video` and JSON-string `metadata`; MP4/WebM, maximum 2 GB. |
| POST /api/recordings/start | JSON match metadata, begins selected RTSP capture. |
| POST /api/recordings/:id/stop | Finalizes FFmpeg and saves score/moment metadata. |
| GET /api/matches/:id/play | One-hour playback token URL. |
| POST /api/matches/:id/share | New 256-bit random link, 14-day expiry. |
| DELETE /api/matches/:id/share | Revokes all shared watch links for the match. |
| GET /watch/:token | Public match recap, video player, download. |
| GET /media/:token | Validates token and serves range-capable media. |

Metadata fields: title, court (integer 1–16), duration (seconds), score (text), marks (time and label). Server-generated fields: UUID, creation timestamp, source, file and status. States: recording → ready/failed, or interrupted after restart. Token expiry is checked on every request, not by a scheduler. Existing streams/downloads cannot be remotely recalled after access is granted.

## Storage and reliability

`data/matches.json` stores metadata and bearer tokens. Saves use a temporary file and rename. Videos live in `data/media/`; no static route exposes that directory. Only one server process may manage a data directory. This is not a transactional database: power loss, disk failure or crashes can leave orphaned files. Back up the entire directory, limit access, monitor free space and test restores. Tokens are secrets; protect metadata backups as well as media.

Browser uploads stream to temporary disk files, then receive container-signature and metadata checks. This is basic validation, not a full media security scanner. Browser capture accumulates chunks in memory and has no durable offline queue. NVR recordings have a four-hour FFmpeg cap. A successful start means the child process remained alive during the startup window, not a guarantee that frames will keep arriving. Failed jobs are marked accordingly. After restart, inspect interrupted fragmented MP4 files with FFmpeg before manual recovery; do not mark corrupt files ready.

Automatic deletion is not provided. To remove recordings administratively: stop the application, back up the data, remove the corresponding media file and metadata entry plus its links, then restart. A production extension should implement a transactional database, authenticated delete/audit UI, quotas, retention jobs, resumable chunk uploads and object storage. Do not run multiple instances against the JSON store.

## Verification and references

Run `npm.cmd test` for the scoring engine and `node --test tests/server.test.mjs` for API integration. Build checks Angular strict templates and TypeScript. Hardware tests require an actual camera/NVR and FFmpeg; test at least ten minutes, finalization, seek, download, lost RTSP, disk full and concurrency before venue use. Browser-device testing must include desktop Chromium and target mobile browsers, permission denial, background suspension, upload interruption and offline shell reopening.

- [USA Pickleball current official rules](https://usapickleball.org/rules/)
- [USA Pickleball rule summary](https://usapickleball.org/rules/summary/)
- [USA Pickleball side-out scoring](https://usapickleball.org/blog-category/pickleball-scoring-positioning-side-out-scoring/)
- [Dahua RTSP via VLC documentation](https://www.dahuawiki.com/index.php?curid=732&title=Remote_Access%2FRTSP_via_VLC)

Rules checked against the official 2026 rulebook landing page and current summary. Implemented scoring is traditional side-out, not rally scoring or every sanctioned tournament variation.
