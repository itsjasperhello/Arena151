# Arena 151 for Android

A native Android app (Java + WebView) that runs the full Arena 151 game offline, in landscape and full screen, with touch controls.

- **Requires:** Android 8.0 (API 26) or newer.
- **App ID:** `com.arena151.game`
- **Version:** 14.6

## Build the APK on Windows (Android Studio)
1. Install **Android Studio** (free) from developer.android.com/studio. It includes the Android SDK and Java.
2. **File → Open…** and select this `Arena151_Android` folder. Wait for "Gradle sync" to finish. The first sync downloads Gradle 8.9 and the Android plugin and can take a few minutes.
   - If Android Studio offers to upgrade the Android Gradle Plugin, accepting is fine.
3. **Build → Build App Bundle(s) / APK(s) → Build APK(s).** When it finishes, click **locate**. The file is `app/build/outputs/apk/debug/app-debug.apk`.
4. **Or run it directly:** plug in your phone with USB debugging on (Settings → About phone → tap *Build number* 7 times → Developer options → *USB debugging*). Then press the green ▶ Run button.

Command line alternative (from this folder): `gradlew.bat assembleDebug`. That needs the Android SDK installed and `ANDROID_HOME` set; Android Studio does this for you.

## Build in the cloud instead (no Android Studio)
Push this folder to a GitHub repository. The included workflow `.github/workflows/build-apk.yml` builds both APKs on every push. Download them from the repository's **Actions** tab → latest run → **Artifacts → Arena151-apk**.

## Install on your phone
Copy the APK to the phone and open it. Android will ask you to allow installs from that source (Files or Chrome) the first time.

The release APK is signed with the debug key so it installs on your own devices. Create a proper signing key before publishing anywhere.

## Controls on the phone
| Control | Action |
|---|---|
| Joystick (bottom left) | Steer your Pokémon to dodge; let go and it moves on its own |
| Move buttons (bottom right) | Attack. The dark sweep shows each move's cooldown |
| Team strip (bottom centre) | Tap a healthy Pokémon to switch |
| **MEGA** | Appears and pulses when Mega Evolution is available |
| ❚❚ / ☰ | Pause / open the menu (teams, arena, saves, Watch mode, speed, camera, log) |
| Back button | Closes the menu, then pauses the battle; press again to exit |

- Leaving the app pauses the battle and autosaves.
- Vibration on crits, knockouts and Mega Evolution can be turned off in the menu.
- **Download save file** writes to `Downloads/Arena151` on the phone. **Open save file** lets you pick one.

## Your custom sprites
Copy animated GIFs into `app/src/main/assets/sprites/` before building:

- **Front:** `mew.gif`, facing left (toward the viewer).
- **Back:** `mew (1).gif`, facing right (away from the viewer).

The full list of names (including `nidoran-f`, `nidoran-m`, `mr-mime` and `farfetchd`) is in `SPRITE_FILE_NAMES.txt` in that folder.

- **Front or back:** the back sprite shows while a Pokémon moves up the screen; the front sprite shows otherwise.
- **Mirroring:** both views are mirrored so the Pokémon faces where it is heading.
- **Animation:** every GIF frame plays at its own speed.
- **Fallbacks:** if there's no back GIF, the front one is used for both views. If there's no GIF, a PNG with the same name is used.

## Trainers
Every `<Name>_trainer.png` (animated PNG) in `app/src/main/assets/sprites/` is a trainer option for either side, chosen in the team builder above each side's Pokémon list. Add a file, rebuild, and it appears automatically: the app lists the folder itself. Underscores become spaces (`Lt_Surge_trainer.png` shows as "Lt Surge"). Sprites are expected to face left; tick "Sprite faces right" under a picker for any that don't.

## Music
Put `<Stage_Name>.mp3` files (for example `Metro_Plaza.mp3`) in `app/src/main/assets/music/`; `Opening.mp3` plays on the start screen. See `MUSIC_FILE_NAMES.txt` there for the exact names.

## Cries
Put each Pokémon's cry in `app/src/main/assets/cry/` as `<sprite name>.mp3` (for example `pikachu.mp3`, `mr-mime.mp3`). See `CRY_FILE_NAMES.txt` there for all 151 names.

## Online battles
The `server` folder holds the online battle server (Docker). See `server/README_SERVER.md`.

## Updating the game
The game code lives in `web/` (the same source as the desktop build). After changing it, run:

```
python web/build.py
```

That rebuilds `app/src/main/assets/index.html`. Then rebuild the APK. Desktop and Android always run the same game.

## How it is put together
- `MainActivity.java` hosts a full-screen WebView.
- `WebViewAssetLoader` serves the bundled game from `https://appassets.androidplatform.net/assets/`. That gives the game a stable, secure origin, so autosaves persist and custom sprites load like normal web images. Nothing is downloaded at runtime.
- The game detects the `AndroidApp` bridge and switches to its touch layout. The bridge provides `saveFile` (MediaStore Downloads) and `vibrate`.
- The bridge also hooks the back button and app pause/resume.
- Screen stays on, the system bars are hidden (swipe from the edge to reveal them), and the layout extends under camera cut-outs.
- The fonts (Lilita One and Rubik, SIL Open Font License) are embedded in the game file, so it looks identical offline.

Fan-made educational prototype. Not affiliated with Nintendo, Game Freak, Creatures Inc. or The Pokémon Company.
