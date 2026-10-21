# Arena 151 online server (Docker Desktop on Windows)

The server runs every online battle. Both phones connect to it, send their input, and draw what it sends back.

## 1. Start the server

Open **PowerShell** in this `server` folder (in File Explorer: open the folder, click the address bar, type `powershell`, press Enter) and run:

```powershell
docker compose up -d --build
```

The first build takes a minute or two. Check it is running by opening <http://localhost:8151/health> in a browser on this PC. You should see something like `{"ok":true,"game":"Arena 151","version":"14.9",...}`.

## 2. Find this PC's address

```powershell
ipconfig
```

Look under your **Wi-Fi** (or **Ethernet**) adapter for **IPv4 Address**, for example `192.168.1.20`. That is the server address the phones will use.

## 3. Let phones through the Windows firewall

Run **PowerShell as Administrator** (right-click Start → Terminal (Admin)) and run once:

```powershell
New-NetFirewallRule -DisplayName "Arena 151 server" -Direction Inbound -Protocol TCP -LocalPort 8151 -Action Allow -Profile Private
```

Your home Wi-Fi must be set to a **Private** network in Windows (Settings → Network & internet → Wi-Fi → your network → Private). If Windows shows a firewall prompt for Docker, allow it on private networks.

Test from a phone on the same Wi-Fi: open `http://192.168.1.20:8151/health` (your address) in its browser. If you see the `"ok":true` text, the phones can reach the server.

## 4. Play

On both phones, on the start screen tap **ONLINE vs PLAYER**, enter the server address (e.g. `192.168.1.20`), then:

* **Host:** set your trainer and team on the left, choose the arena, tap **Host game**. A 4-letter code appears.
* **Friend:** set their trainer and team, type the code, tap **Join game**.

Each player always plays from the left as Red. Online battles can't be paused. If a Pokémon faints, its trainer has 15 seconds to pick the next one (both phones show the countdown; then the best one is sent out automatically). If neither player lands a hit for 90 seconds the battle is decided on remaining HP, with an on-screen warning 10 seconds before. If someone leaves, the other player wins.

## Tournaments (up to 16 players)

On the start screen's online panel, type your name, choose **Up to N players** (2–16) and tap **Host tournament**. Everyone else types the 4-letter code and taps **Join game**. The host's arena choice and time limit apply to every match.

When the host taps **START TOURNAMENT**, the server draws a random single-elimination bracket. If the player count isn't 2, 4, 8 or 16, some players get a first-round **bye** (picked at random). Each match starts by itself a few seconds after both players are known, so quick matches don't wait for slow ones. After each match, players return to the bracket; knocked-out players can keep watching the bracket until the champion is crowned.

* A player who leaves before their next match gives the opponent a **walkover**.
* A dropped connection gets the usual 20 seconds to reconnect, straight back into the tournament and their live match.
* If a match ends exactly tied on HP, a coin flip decides who advances (a bracket needs a winner).

## Connection drops

If a phone's connection stalls or drops mid-match, it reconnects to the same match by itself. While it's gone, the battle is paused and the other phone shows *"Opponent's connection dropped — waiting 20s"*; if it isn't back within 20 seconds, the other player wins. Each phone shows its ping under the timer during online battles (green is good; yellow or red means a weak Wi-Fi signal).

If a phone stops receiving battle updates while its connection still answers, it asks the server for a full update over the same connection (no reconnect, and the battle keeps going for the other player). A phone only reconnects when it hears nothing at all for 8 seconds. Each recovery is logged with its reason, so `docker compose logs` shows what happened.

## If a match ever gets stuck

Every match's battle code runs under a time limit. If a match's code ever runs for more than 0.4 seconds in one go (for example a bug that loops forever), that match is stopped, both players get a normal results screen decided by remaining HP, and every other match carries on untouched; in a tournament the bracket advances as usual. The server log then shows a line starting with `MATCH STOPPED` followed by an incident report (arena, Pokémon, moves in flight and the last inputs). Please send that line so the underlying bug can be fixed.

As a second safety net, if a whole battle worker ever stops responding for 5 seconds while the rest of the server is running, it is replaced automatically and its matches are ended the same way (`has not responded ... replacing it` in the log). Pauses of the whole server (Docker or Windows hiccups) are recognised and don't end any match.

## Capacity and performance

Battles run in a pool of worker threads, one per CPU core by default (up to 8), so a busy match never slows the others. Each battle uses about 4–5 ms of CPU per second. In testing, 100 simultaneous games (200 players) stayed connected with no player ever going a second without an update, even when squeezed onto a single core; at one worker's share of 100 games (13–25 games) a worker uses only 2–4 ms of every 16 ms tick. Each player uses roughly 25–55 KB/s of bandwidth.

To use more cores, set `WORKERS` in `docker-compose.yml` (for example `WORKERS=12`) and run `docker compose up -d --build`. Docker Desktop can use all of your PC's cores by default. <http://localhost:8151/health> shows how many games each worker is running and its tick time (`avgTickMs` well under 16 means plenty of headroom).

## Everyday commands

| What | Command (in this folder) |
|---|---|
| Start / update after changes | `docker compose up -d --build` |
| Watch the server log | `docker compose logs -f` |
| Check load per worker | open <http://localhost:8151/health> |
| Stop | `docker compose down` |
| Restart | `docker compose restart` |

The container restarts on its own when Docker Desktop starts (`restart: unless-stopped`).

## Keeping the server and app in step

The app and server must be the same version (the app shows it on the start screen; the server shows it at `/health`). After you update the game, refresh the server's copy of the game logic and rebuild:

```powershell
python sync_game.py
docker compose up -d --build
```

## Playing away from home

The game is built for this: your own Pokémon responds to the stick instantly (the phone predicts its movement and the server quietly corrects it), the opponent is drawn smoothly between updates even on a jittery connection, and phones reconnect by themselves when they switch between Wi-Fi and mobile data (you have 30 seconds). Pick one way to reach your PC from outside:

**Option 1 — Tailscale (recommended, private).** Install Tailscale on this PC and on every phone that will play, and sign in to the same account (or share the PC with friends' accounts). Nothing is exposed to the internet. In the app, use the PC's Tailscale address (it starts with `100.`, shown in the Tailscale app) as the server address, e.g. `100.101.102.103`. Check Tailscale's current plan terms for the number of users/devices you need.

**Option 2 — Cloudflare Tunnel (no port forwarding, encrypted).** Run `cloudflared tunnel --url http://localhost:8151` on this PC; it prints an `https://….trycloudflare.com` address. In the app, enter that address exactly as printed (the app turns it into a secure `wss://` connection). Quick tunnels get a new address each time they start; a named tunnel on your own domain keeps one address. Add `TRUST_PROXY=1` in `docker-compose.yml` when using this.

**Option 3 — Router port forwarding.** Forward **TCP port 8151** on your router to this PC's IPv4 address and play using your public IP (search "what is my IP"; a dynamic-DNS name keeps it stable). This exposes the server to the whole internet, so turn the forward off when you're not playing.

Whichever you choose, players only need the server address and the 4-letter game code. The server protects itself automatically: a cap on wrong game codes (no guessing other people's games), message-rate limits per connection, a server-wide connection cap, per-address limits for public internet addresses, and strict checks on everything a phone sends.

