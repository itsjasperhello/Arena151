# Arena 151 for iPhone

The iPhone app is the same game as the Android app (same game file, sprites, music and cries — the build copies them from `app/src/main/assets`). GitHub builds it on a Mac and gives you an `.ipa` file.

## 1. Build the IPA on GitHub

1. Push this repository (the `ios` folder and `.github/workflows/build-ipa.yml`).
2. Open your repository on GitHub → **Actions** → **Build iOS app (IPA)**. The first push starts it automatically; after that, click **Run workflow** whenever you want a new build (it does not run on every push, to save Mac build minutes).
3. When it shows a green check, open the run and download **Arena151-ipa-…** under *Artifacts*. Unzip it to get `Arena151-unsigned.ipa`.

If a run fails, open the failed step and send the last lines of its log.

## 2. Install it on the iPhone

iPhones only install apps signed for that phone. A sideloading tool signs the IPA with your own Apple ID while installing it:

* **Sideloadly** (Windows/Mac): connect the iPhone by USB, drag `Arena151-unsigned.ipa` into Sideloadly, enter your Apple ID, click **Start**.
* **AltStore** (Windows/Mac + the AltStore app on the phone): install AltServer on the PC, AltStore on the phone, then open the IPA from AltStore's **My Apps** tab.

Follow the tool's own setup instructions (Sideloadly and AltServer on Windows need Apple's iTunes and iCloud from Apple's website, not the Microsoft Store versions).

Then on the iPhone:

1. **Settings → Privacy & Security → Developer Mode → On** (iOS 16 and later; the phone restarts).
2. **Settings → General → VPN & Device Management** → tap your Apple ID → **Trust**.
3. Open **Arena 151**.

With a free Apple ID, sideloaded apps usually need re-signing every 7 days (AltStore can refresh automatically while the PC is on the same Wi-Fi), and the number of sideloaded apps is limited; a paid Apple Developer account extends this to a year. These are Apple's / the tools' rules and can change — check their current terms.

## Online play on iPhone

Same as Android: **ONLINE vs PLAYER**, enter the server address, host or join with the 4-letter code. The first time, iPhone asks to allow **Local Network** access — tap **Allow** (otherwise it can't reach your server on Wi-Fi). Tailscale works the same way as on Android.

## Notes

* Saving a game export opens the iPhone share sheet — choose **Save to Files**.
* Game sound plays even when the ring/silent switch is on silent; your own music keeps playing alongside it.
* The app version matches the game version (shown on the start screen); the build number is the GitHub run number.
