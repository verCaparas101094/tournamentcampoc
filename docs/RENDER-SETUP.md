# Fix Render login deployment

The Publish Directory setting in the screenshot identifies a Static Site deployment. Static hosting does not execute server/index.mjs, /auth/login, /main-login, /nvr-test or the API. An Angular fallback rewrite cannot implement password protection. Use a Node Web Service serving both the frontend and API from the same origin.

1. Push these source changes, including server/, docs/, package.json, package-lock.json and angular.json, to the repository connected to Render. Do not commit .env.
2. Create a new Render Web Service from the same repository. Choose Node runtime. Leave Root Directory blank when package.json is at the repository root.
3. Build command: `npm ci --include=dev && npm run build`.
4. Start command: `npm run server`. Do NOT use `npm start`, which is the Angular development server.
5. Configure environment values:

| Variable | Value |
| --- | --- |
| NODE_VERSION | 24.19.0 |
| HOST | 0.0.0.0 |
| ACCESS_PASSWORD | The owner's requested main-app password, entered privately in Render |
| COOKIE_SECURE | true |
| PUBLIC_ORIGIN | Exact new service URL, e.g. https://your-service.onrender.com, no trailing slash |

Render supplies PORT; the server already respects it. If using ACCESS_PASSWORD_HASH instead, do not also set ACCESS_PASSWORD; the hash takes precedence. The private local .env does not transfer automatically to Render. The plaintext environment secret is converted to a salted hash at startup and is not exposed to browser code.

6. Deploy, then use the NEW Web Service URL:
   - / or /main-login: main application login.
   - /main-page: alias to the main login page.
   - /app: full application after login.
   - /nvr-test: password-free camera testing only.
7. Verify the login request returns 200 and a Secure, HttpOnly cookie. If it returns 403, check PUBLIC_ORIGIN against the URL used in the browser. If login fails, check the environment secret and whether an older ACCESS_PASSWORD_HASH is overriding it.

render.yaml provides the same Web Service configuration for Blueprint deployments. It does not create or purchase resources until deployed through Render. No remote deployment was performed as part of this fix.

## Existing static site

Use the new Web Service URL for access. Once verified, disable the old static deployment or point its domain at the Web Service through Render's domain configuration. The old static site can still expose the Angular interface; it cannot enforce the new server-side login. Do not continue distributing its URL as the protected application.

## Camera and storage boundaries

Render's server cannot reach a venue's private LAN IP (such as 192.168.1.108) without private connectivity. The current camera tester must run at the venue or on a server with an authorized route to that NVR. Hosting the UI on Render does not make the browser proxy the local camera. Do not expose the NVR's RTSP port publicly to work around this.

The current application stores media and metadata on local disk. Do not use ephemeral deployment storage for recordings you need to retain. A persistent disk or object-storage integration is required before hosted recording use; the provided Blueprint does not provision one. In-memory sessions reset on restart and assume one server instance.

Public camera testing intentionally permits changing the connected server's NVR settings and accessing its test clips. Limit that service to the intended testing environment. The full match library, browser uploads and sharing APIs remain behind main-app authentication.

Reference: https://render.com/docs/deploy-node-express-app and https://render.com/docs/web-services
