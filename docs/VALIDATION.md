# Validation record — 17 October 2026

- Angular optimized build and strict template/TypeScript compilation passed.
- Seven automated tests passed: six scoring scenarios and one API integration test covering authentication, channel validation, origin rejection, upload, metadata listing, byte-range media transport, share pages, revocation, expiry and persistence across restart.
- Local production HTTP server returned 200 for the Angular shell and generated service-worker manifest.
- npm installation reported zero known dependency vulnerabilities at installation time.
- API media tests use a container-header fixture; they do not prove that recorded video decodes.
- Browser automation was unavailable, so visual layout, browser recording, actual playback, mobile installation and offline behavior have not been exercised in a browser during this session.
- FFmpeg was not found on PATH. No Dahua credentials, exact model numbers or reachable hardware were supplied. Real NVR capture, sustained recording, camera positioning and multi-channel load remain installation acceptance tests.

Before venue use, test a complete real recording → stop → replay → download → remote share journey. Test camera permission denial, network loss, tab closure, expired links, daylight/night framing and server disk capacity. Use an HTTPS origin and a configured operator key for shared network deployment.
