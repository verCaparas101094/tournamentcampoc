# Feature record

| Feature | Implementation | Limit |
| --- | --- | --- |
| Match recording | Browser MediaRecorder or server FFmpeg RTSP | Real devices and permissions required |
| Court camera angle | Framing overlay and physical placement guide | No automatic detection, PTZ or optical calibration |
| 16-channel NVR | Select channel 1–16 | Exact model not supplied; capacity not certified |
| Match recap | Share page with title, date, court, score, replay and download | No automatic email |
| Match library | Disk persistence, name search, court filter | Single server JSON metadata store |
| Replay | Native HTML video, speed controls, timestamp bookmarks | No exported clips or frame interpolation |
| Sharing | Random bearer links, 14 days, revocation | Reachable HTTPS origin needed for remote viewers |
| Retention | Footage persists; watch links expire | No automatic footage cleanup |
| Pickleball scoring | Singles/doubles traditional side-out, win by two, undo | Team-level manual entry, single game |
| Installable PWA | Manifest, icon, Angular service worker | Installation behavior depends on browser |
| Offline | Cached shell; local browser capture while tab remains open | No persisted offline media/library |
| Documentation | README, technical guide, user manual | Site installation requires operator configuration |

The references motivated an elevated baseline viewpoint, a replay-first experience and a match-ready recap with expiration messaging. Original TournamentCam styling uses deep green, pale court colors and lime recording controls. No third-party branding or example footage is shipped as if it were recorded by this application.
