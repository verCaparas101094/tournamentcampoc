# Dahua / NVR test setup manual

## Purpose

The camera test portal at /nvr-test requires NO application password. It exposes connection setup, camera testing, recording, replay and download of test clips only. The complete main application and its existing features are preserved at /app behind the owner's access password; visit /main-login or / to sign in. Regular match recordings and sharing APIs are not available through the public tester. Earlier recordings without the test-only marker remain in the protected main library.

## Install at the camera venue

1. Use a Windows computer on the same LAN as the Dahua NVR, with adequate disk space and Node.js 22.12+ or compatible Node 24.
2. Copy the application source and package-lock.json. Run `npm.cmd install`, then `npm.cmd run build`.
3. Configure the private .env file with ACCESS_PASSWORD_HASH. The owner must transfer it securely or generate a fresh access-password hash on the venue machine. Do not send NVR passwords in chat, commit .env, or copy existing recording files unnecessarily.
4. FFmpeg is required. The ffmpeg-static package provides a binary when its installation script is allowed. If missing, install a trusted FFmpeg build and set FFMPEG_PATH in .env to the full executable path.
5. Run `npm.cmd run server`, then open http://localhost:3000/nvr-test on that computer.

The server, not the viewer's browser, connects to the NVR. This developer computer cannot test an NVR at another venue just because someone there opens a webpage. Run the server at the venue or arrange authorized private network connectivity. Do not forward the NVR RTSP port to the public internet. No Azure deployment is included in this change.

## Main app sign-in (not required for camera testing)

Open /nvr-test directly to test the camera without signing in. You still need the Dahua device credentials. Only /main-login requires the owner's application password. Main-app sessions last eight hours and are reset when the server restarts. Ten unsuccessful login attempts per address trigger a ten-minute delay. The password is stored as a salted hash in .env, not in client JavaScript. NVR credentials entered in the test form stay in server memory and are not returned to the browser.

## Configure Dahua

Ask the venue technician for the NVR's LAN address, RTSP port, streaming account and the camera channel. Verify the camera shows a picture on the NVR monitor first.

- NVR address: for example 192.168.1.108, without http://, credentials, slashes or a port suffix.
- RTSP port: usually 554, but use the actual configured port.
- Username/password: the NVR account with permission to view the chosen channel. Use a dedicated account where possible.
- Channel: 1–16 for the NVR. For a direct camera IP, normally select channel 1.
- Stream: main stream for quality, substream for an initial lower-bandwidth check. Prefer H.264 in the Dahua encoding settings where supported; actual decode capability depends on the model and FFmpeg.

Click Save settings. Then click Test connection. The server connects over RTSP/TCP and attempts to decode a real frame; it does not merely check that a port is open. Allow up to approximately 22 seconds. After any changes, save and retest before recording.

Settings supplied by the form are global to this server and last until restart. Restarting falls back to any NVR_* values explicitly configured in .env. Leave the NVR password blank only to keep an already configured password. Changing settings is blocked while a test or recording is running.

## Record and verify

1. After a successful connection test, enter a short test name.
2. Click Start recording. Walk around the near and far ends of the court.
3. Wait 15–30 seconds, then click Stop & save and wait for finalization.
4. Under saved camera tests, select Replay / download. Check movement, angle, duration and seeking. Download a copy and open it with a local player as well.
5. Repeat under normal evening lighting. Verify both baselines, both sidelines, room around nearby players and net alignment. Camera mounting/aiming is physical; no PTZ or AI tracking is included.

This page has no live RTSP preview. Use the NVR monitor to aim the camera and the recorded test clip to validate browser playback. Audio is disabled. Test mode permits one recording at a time. Recording stops automatically at four hours. Connection-test success does not guarantee that subsequent recordings cannot fail; confirm each saved clip.

Closing the browser does not stop server-side recording. Sign in again and use Stop & save. The page polls every five seconds and recovers the running recording. If the server restarts mid-recording, the clip is marked interrupted; it is not silently treated as a valid complete file.

## Where files go

Recordings: data/media/ on the computer running the server.
Metadata: data/matches.json.
There is no automatic deletion. Monitor disk space. Downloads go to the browser's download folder. Test-page playback URLs expire after one hour. This test page does not create public share links; previously issued application share links keep their existing expiry/revocation behavior.

## Network access from another device

By default the server listens only on 127.0.0.1. For access from venue phones/tablets, an administrator must configure a LAN bind, firewall scope and preferably an HTTPS reverse proxy. Set PUBLIC_ORIGIN to the actual origin and COOKIE_SECURE=true when using HTTPS. Never use COOKIE_SECURE=true for plain HTTP localhost, because the browser will not send the session cookie over that connection. Do not expose this setup portal publicly without deployment review. All authenticated portal users can change this server's NVR settings.

## Troubleshooting

| Problem | Check |
| --- | --- |
| Incorrect access password | Use the application access password, not the NVR password. |
| FFmpeg unavailable | Check installation scripts or configure FFMPEG_PATH and restart. |
| Connection timeout | Verify the server is on the right LAN, IP address, port, firewall and RTSP service. |
| Credentials rejected | Verify NVR username/password and channel live-view permissions. |
| No frame decoded | Verify channel mapping and codec; try the substream; check the NVR's own monitor. |
| Start button disabled | Save settings and run a successful connection test first. |
| Recording failed | Check disk space, stream interruption and FFmpeg; run a new short test. |
| Old main page still appears | Close old app tabs; reopen /nvr-test and reload. The test portal unregisters old service workers. |

Report the model/firmware, channel, selected stream, visible error, test time and whether the NVR monitor works. Never include passwords in screenshots or support reports.
