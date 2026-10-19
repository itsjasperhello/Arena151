# Arena 151 online server (Docker Desktop on Windows)

The server runs every online battle. Both phones connect to it, send their input, and draw what it sends back.

## 1. Start the server

Open **PowerShell** in this `server` folder (in File Explorer: open the folder, click the address bar, type `powershell`, press Enter) and run:

```powershell
docker compose up -d --build
```

The first build takes a minute or two. Check it is running by opening <http://localhost:8151/health> in a browser on this PC. You should see something like `{"ok":true,"game":"Arena 151","version":"14.1",...}`.

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

Each player always plays from the left as Red. Online battles can't be paused; if a Pokémon faints you have 20 seconds to pick the next one (then the best one is sent out for you). If someone leaves, the other player wins.

## Everyday commands

| What | Command (in this folder) |
|---|---|
| Start / update after changes | `docker compose up -d --build` |
| Watch the server log | `docker compose logs -f` |
| Stop | `docker compose down` |
| Restart | `docker compose restart` |

The container restarts on its own when Docker Desktop starts (`restart: unless-stopped`).

## Keeping the server and app in step

The app and server must be the same version (the app shows it on the start screen; the server shows it at `/health`). After you update the game, refresh the server's copy of the game logic and rebuild:

```powershell
python sync_game.py
docker compose up -d --build
```

## Playing on different networks (optional)

The setup above is for phones on the **same Wi-Fi** as the PC. To play from anywhere, your router has to forward **TCP port 8151** to this PC's IPv4 address, and the other player enters your **public** IP address (search "what is my IP"). Only do this if you're comfortable exposing a port on your home network; turn the forward off when you're not playing. Home internet addresses can change, so check it before each session.
