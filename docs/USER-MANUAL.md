# Operator and player manual

## 1. Prepare the court

Mount the camera securely outside the playing/run-off area, centered behind a baseline. A starting trial height of 3–4 metres often gives useful coverage, but this is a framing suggestion rather than a hardware specification. The correct setback depends on lens field of view and venue clearance. Ask an installer to select the safe final mount.

Check both baselines, both sidelines, the full net and space around moving players. In the provided screenshots a close player reaches the edge of the image: leave more near-baseline margin when framing. Avoid pointing into floodlights. Verify clarity with a moving ball in actual evening lighting. A 2 MP camera should record its native supported resolution; start with H.264 at the highest stable supported frame rate and test exposure for motion blur.

Use Camera setup → Open framing guide. The overlay is a visual aid, not calibration, automatic court recognition or PTZ control. A fixed Dahua camera must be physically aimed. Keep the full court in view instead of chasing the ball.

## 2. Connect

The administrator runs the recording server and configures Dahua credentials in `.env`. Enter only the application operator key in Camera setup. The “configuration present” status means credentials exist, not that the camera has passed a connection test. The first recording attempts the actual connection.

Browser camera: choose Browser camera, press Enable camera and allow permission. Microphone audio is deliberately not requested. A phone/browser cannot directly connect to an RTSP NVR stream.

Dahua: choose Dahua / NVR and the channel corresponding to the court. There is no in-app NVR live preview in this version. Confirm framing on the NVR monitor or vendor client before starting.

## 3. Record

Name the match, select court, singles or doubles, and the target score. Confirm players know they are being recorded according to your venue policy. Press Start recording. Mark moment stores the current timestamp; it does not create a separate video clip.

Browser capture needs this page to stay open and the device awake. Mobile operating systems may suspend recording in the background. Stop & save finalizes and uploads the file. Wait for “Match saved” before closing. If upload fails, Retry save or Download backup. Recordings are held in browser memory until upload; use NVR mode for long sessions. Browser uploads are capped at 2 GB. If device memory is exhausted, recovery is not guaranteed.

NVR capture runs on the server after it starts, even if the browser closes, and stops automatically after four hours. If the controlling tab is lost, open Match library, refresh and use Stop & save on the recording card. A server restart marks unfinished records as interrupted instead of pretending they are complete. Keep the original NVR’s own continuous recording enabled as a separate backup.

## 4. Score a game

Choose the team that won the rally. Only the serving team earns a point; a receiving-team win changes server or causes a side-out. Doubles begins with the second server designation (0–0–2), so the first service turn has only one server. Later service turns have servers 1 and 2. Singles switches serving player after a lost service rally. The score call shows serving team score first, opponent score second, and server number for doubles.

The game ends at or above the chosen target with a lead of two. Undo reverses the last rally. Reset score begins another game. This release tracks team service turns, not individual player names/positions, time-outs, best-of-three match aggregates or end switches. Winning a game does not automatically stop recording. Manual score markers are an event log; undoing a score does not remove earlier markers.

Rules reminders: both the return of serve and the serving side’s next shot must bounce. Volleys cannot be made while touching the non-volley zone (kitchen), including its line; momentum after the volley also matters. No automatic rule enforcement or line calling is performed. Consult the [current official rulebook](https://usapickleball.org/rules/) for full exceptions and tournament requirements.

## 5. Replay and share

Open Match library. Search the match name or filter by court. Ready matches can be played, downloaded and shared. The player supports native seeking/fullscreen, 0.25× to 2× playback, and jumping to saved markers. Slow motion slows recorded frames; it does not manufacture high-speed footage.

Share creates a bearer link valid for 14 days. Anyone possessing it can watch and download. Copy the displayed link and send it using your preferred messaging app. No email is automatically sent. Revoke links invalidates all share links for that match; already-downloaded copies remain with recipients. Expiry does not delete the recording. Ask the server administrator about backups and retention.

PUBLIC_ORIGIN must be a reachable HTTPS domain for remote recipients. A localhost URL is for local testing only. If a playback session expires after one hour, close and reopen the match to obtain a fresh operator playback link.

## 6. Install and offline use

After a production build is served over HTTPS, select Install app in Chromium or Share → Add to Home Screen on iOS. Browser support varies. Once loaded and cached, the application shell can reopen offline. Viewing the library, saving to the server, NVR recording and sharing need connectivity. Offline browser recording can be downloaded locally or uploaded after reconnection while the tab remains open; it is not persisted across reloads.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Server offline | Start server; check operator key and reverse proxy. |
| Camera permission denied | Enable permission in browser settings and use HTTPS/localhost. |
| Camera unavailable | Close other apps using it, reconnect, then enable again. |
| NVR start fails | Check FFmpeg, network route, RTSP credentials, channel and codec. |
| Saved NVR match fails | Check disk space, camera connection and four-hour limit; retain original NVR backup. |
| Upload fails | Keep tab open, download backup, then retry when server is reachable. |
| Share link fails remotely | Configure PUBLIC_ORIGIN and HTTPS access; do not use localhost. |
| Share link expired | Owner creates a new share link from the library. |

