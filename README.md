# PSPULSE // PS4 HOSTS

<p align="center">
  <strong>Offline-first PS4 host hub with firmware-specific exploit flows and GoldHEN integration.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-PlayStation%204-151515?style=for-the-badge&logo=playstation&logoColor=a294ff" alt="Platform: PlayStation 4">
  <img src="https://img.shields.io/badge/firmware-5.05--13.00-151515?style=for-the-badge&color=a294ff" alt="Firmware range: 5.05 to 13.00">
  <img src="https://img.shields.io/badge/mode-offline--first-151515?style=for-the-badge&color=242424" alt="Offline-first">
  <img src="https://img.shields.io/badge/UI-terminal-151515?style=for-the-badge&color=a294ff" alt="Terminal-style interface">
</p>

![PlayStation Pulse Host Selector](https://raw.githubusercontent.com/sudoBlackArch/sudoblackarch.github.io/refs/heads/main/assets/showcase.webp)

```text
$ ./launch --pspulse

[ ok ] 6 host routes detected
[ ok ] goldhen v2.4b18.12 / v2.4b18.5 staged
[ ok ] offline cache ready
[ ok ] gamepad navigation enabled
```

PlayStation Pulse is a self-contained collection of static PS4 host pages. One entry point, one firmware choice, then the matching exploit and GoldHEN flow — designed for local hosting, offline caching, and the PS4 browser.

> [!NOTE]
> This project is intended for educational, preservation, and research purposes. Use it at your own risk. It is not affiliated with or endorsed by Sony Interactive Entertainment.

<details>
<summary><b>$ cat contents</b></summary>

- [What this project provides](#what-this-project-provides)
- [Supported firmware flows](#supported-firmware-flows)
- [How the host works](#how-the-host-works)
- [GoldHEN versions](#goldhen-versions)
- [Payload tools](#payload-tools)
- [Offline caching](#offline-caching)
- [Using the host](#using-the-host)
- [Design system](#design-system)
- [Technical design](#technical-design)
- [Troubleshooting](#troubleshooting)
- [Safety and limitations](#safety-and-limitations)
- [Credits and attribution](#credits-and-attribution)

</details>

## What this project provides

- A unified terminal-style firmware router at [`index.html`](./index.html).
- Dedicated offline host pages for PS4 firmware 5.05 and 6.72.
- PSFree/Lapse host flows for firmware 7.00–8.52 and 9.00–9.60.
- A CSSFontFace UAF host flow for firmware 6.00–11.02.
- A SlopKit WebKit research flow for firmware 11.00–13.00.
- Repository-bundled GoldHEN v2.4b18.12 and v2.4b18.5 assets where the host supports both builds.
- AppCache-based offline operation with firmware-specific cache and manifest files.
- Firmware-specific payload utilities on the host branches that provide them.
- A single visual system — dark terminal aesthetic, violet accent, controller-friendly focus — across every selector, cache page, and exploit page.

## Supported firmware flows

| # | Firmware | Entry point | Exploit flow | GoldHEN | Utility payloads |
|---|---|---|---|---|---|
| 01 | **13.02–13.52** | `1352/index.html` | SlopKit WebKit (GoldHEN) | `v2.4b18.12` | Upstream payload only |
| 02 | **11.00–13.00** | `1300/version-selector.html` | SlopKit WebKit (Lapse / Poops) | `stable` or `latest` | Upstream payload only |
| 03 | **6.00–11.02** | `css/version-selector.html` | CSSFontFace UAF + Lapse/NetCtrl | `stable` or `latest` | No separate menu |
| 04 | **9.00–9.60** | `900/version-selector.html` | PSFree + Lapse | Version selector | Included |
| 05 | **7.00–8.52** | `700/version-selector.html` | PSFree + Lapse | Version selector | Included |
| 06 | **6.72** | `672/index.html` | Dedicated host | Directly on page | Included |
| 07 | **5.05** | `505/index.html` | Dedicated host | Directly on page | Included |

The root selector stores the selected firmware locally and routes to the correct branch. Always use the host intended for the exact firmware installed on the console.

Already-loaded guards: the 1300 chains check `getuid`/`setuid(0)` after the userland pivot and exit early with `ALREADY JAILBROKEN` instead of re-running the kernel exploit on an active jailbreak; the 700 and 900 PSFree branches poll the GoldHEN status endpoint (`http://127.0.0.1:9090/status`) for 1.5 s and skip the exploit entirely when GoldHEN answers. Re-opening a host after success is therefore safe by design.

## How the host works

```text
$ ./launch --select-host

  index.html ──► firmware router
                     │
      ┌──────────┬──┴─────┬────────┬────────┬────────┬────────┬─────────┐
      ▼          ▼        ▼        ▼        ▼        ▼        ▼         ▼
   FW 13.02  FW 11.00  FW 6.00  FW 9.00  FW 7.00  FW 6.72  FW 5.05
   -13.52    -13.00    -11.02   -9.60    -8.52    host     host
   selector  selector  selector selector selector
      │          │         │        │        │        │         │
      │          │      cache install (payload build choice)
      ▼          ▼        ▼        ▼        ▼        ▼         ▼
      └──────────┴────────┴───┬────┴────────┴────────┴─────────┘
                              ▼
                 exploit chain ──► HEN / GoldHEN + tools
```

The project is intentionally static. HTML pages provide the interface, JavaScript modules run the firmware-specific exploit chain, binary files provide GoldHEN/kernel-patch/payload assets, and AppCache files keep the selected flow available after the initial cache installation.

## GoldHEN versions

The repository contains two GoldHEN choices where supported:

- **GoldHEN v2.4b18.12** — a repository-bundled build exposed by the selectors.
- **GoldHEN v2.4b18.5** — a repository-bundled previous build.

The 7.00–8.52 and 9.00–9.60 branches select a GoldHEN build through their version selector and cache page. The CSSFontFace branch uses [`css/version-selector.html`](./css/version-selector.html), which routes to:

- [`css/latest/index.html`](./css/latest/index.html) for v2.4b18.12;
- [`css/stable/index.html`](./css/stable/index.html) for v2.4b18.5.

## Payload tools

Payload availability is firmware-specific.

### Hosts with utility payloads

Depending on the selected branch, the host pages provide tools such as:

- FTP Server;
- PS4Debug;
- App2USB;
- Backup and Restore;
- Enable Updates and Disable Updates;
- AppCache Install;
- History Blocker;
- PUP Decrypt;
- RIF Renamer;
- PSFree Fix on the PSFree branches;
- WebRTE on the branches that include it;
- Kernel Clock on the firmware host that provides it.

The exact list differs between 5.05, 6.72, 7.00–8.52, and 9.00–9.60. Payload buttons load the selected binary through the host's existing payload loader and may require a compatible payload receiver on the same network.

### CSSFontFace host scope

The CSSFontFace branch deliberately excludes the standalone utility-payload menu used by the other host branches. The CSSFontFace exploit flow is memory-intensive by nature, so removing additional payload tools helps preserve the memory headroom needed for a more stable exploit and GoldHEN launch. Its interface is focused on:

- exploit output with color-coded log lines (info / error / debug);
- Lapse or NetCtrl chain selection;
- Auto Jailbreak countdown, manual `Jailbreak`, and a `Reload` button for recovery after a failed attempt;
- automatic loading of the selected GoldHEN build.

The CSSFontFace implementation still contains the internal binary stage required to complete its selected exploit/GoldHEN flow. That internal stage is not a user-selectable utility payload and is not equivalent to the optional utility-payload set excluded from this host.

## Offline caching

All host branches use relative assets and browser application caching. Cache files must be served from the paths expected by their entry pages; do not rename or flatten the firmware directories after deployment.

| Branch | Cache flow |
|---|---|
| **5.05** | `505/cache.manifest` is attached to the host page and the page reports installation progress. |
| **6.72** | `672/cache.manifest` is attached to the host page and the page reports installation progress. |
| **7.00–8.52** | Select a build in `700/version-selector.html`, then use `cache.html` or `cache5.html` to install `PSPulse.cache` or `PSPulse5.cache`. |
| **9.00–9.60** | Select a build in `900/version-selector.html`, then use `cache.html` or `cache5.html` to install `PSPulse.manifest` or `PSPulse5.manifest`. |
| **CSSFontFace** | Select a build in `css/version-selector.html`; the chosen `stable` or `latest` page uses its own `cache.manifest` with per-file SHA-256 hashes. |
| **1300** | Select a build in `1300/version-selector.html`; the chosen `stable` or `latest` router page installs its own `cache.manifest` automatically, cache updates require a tap to reload. |
| **1352** | Open `1352/index.html` (GoldHEN `v2.4b18.12` for 13.02–13.52); the page installs its own `cache.manifest` automatically, cache updates require a tap to reload. |

After the first successful cache installation, close and reopen the PS4 browser when the page instructs you to do so. If a page still serves an older layout or script, clear the host's browser data and repeat the cache installation.

The repository also includes small generator scripts for rebuilding cache files after asset changes. Whenever a cached file changes, regenerate the corresponding manifest/cache and verify that every referenced relative path is available from the deployed host.

## Using the host

1. Serve the repository root through an HTTP or HTTPS static server. The PS4 browser should not be expected to run the complete flow from an unsupported `file://` URL.
2. Open the root [`index.html`](./index.html) in the PS4 browser.
3. Select the exact firmware range matching the console.
4. If the selected branch has a GoldHEN version selector, choose **Latest** or **Stable** and wait for the cache page to finish.
5. On the host page, wait for the ready/status message before starting the exploit.
6. After GoldHEN has loaded, use only the tools shown by that host branch.

For the CSSFontFace host, **Auto Jailbreak** is enabled by default. After the page loads it starts a five-second countdown and then runs the chain automatically, or press `Jailbreak` manually at any time. During the countdown you can still select `Lapse`/`NetCtrl` or switch Auto Jailbreak off (the choice persists in `localStorage`). On the very first visit the countdown waits until the AppCache install settles — the heavy exploit chain never runs on top of an unfinished cache download, which is what used to stall caching progress. If the cache errors, the page asks for a manual start instead of running blind.

The CSSFontFace page stores the selected chain in `localStorage` under `exploitChain` and the Auto Jailbreak preference under `autoJb`. The root selector and GoldHEN selectors also keep their selected values locally so the browser can preserve the last choice between page loads.

## Design system

Every page — root selector, version selectors, cache installers, and exploit hosts — shares one visual language built for a TV viewed from a couch and an old WebKit engine:

- **Palette** — near-black background `#151515`, panels `#1c1c1c`/`#242424`, single violet accent `#a294ff`, error `#ff9b9b`, warning `#e1bd72`.
- **Terminal aesthetic** — monospace type, `$ ./launch` kickers, `[ ok ]` boot lines, `//` separators, numbered routes.
- **Readable at distance** — large route titles (19–24 px), oversized page headings, nothing below 12 px.
- **Controller-first** — every interactive element is a real focusable element with a double focus ring (`2px bg + 4px accent`); arrow-key navigation with legacy `keyCode` fallbacks for older PS4 WebKit builds.
- **Zero overhead** — no frameworks, no external fonts or images, no transitions, no keyframes, no `backdrop-filter`; only static HTML, inline CSS, and small ES5 scripts.
- **Log legibility** — color-coded exploit output on the CSSFontFace host: info in accent, errors in red, debug dimmed.

## Technical design

### Root selector

The root page is a terminal-style host router rather than a dropdown. It supports pointer interaction and keyboard/gamepad navigation, stores `selectedFirmware`, and routes to the matching host branch.

### AppCache maintenance

AppCache is legacy browser technology, but it is part of the host's offline delivery model. Treat cache files as generated artifacts: after changing an HTML, JavaScript, binary, or patch asset, update the matching cache list/hash and test the first-load and cached-load paths separately.

## Troubleshooting

### The wrong page or an old version is loading

Clear the PS4 browser's site data for the host, close and reopen the browser, then start from the root selector. Confirm that the selected branch's cache file contains the current relative asset paths.

### The cache never finishes

Make sure the repository is served over HTTP/HTTPS, the manifest has the correct MIME/configuration on the server, and every listed file is reachable at the exact relative path. A stale AppCache can survive normal refreshes; clear site data before retrying.

### The exploit does not complete

Verify the console firmware and selected branch, close unrelated browser tabs, and retry from a clean browser state. On the CSSFontFace page the auto-start runs by itself after the cache settles; after any failure use `Reload` (the countdown restarts automatically) instead of re-running the chain over a dirty state. Exploit reliability can vary with browser memory, cached state, and console conditions.

### Out of memory during the exploit ("not enough RAM")

The CSSFontFace chain only wins when its heap spray lands well — this is a heap lottery, not a UI bug, and several failed attempts in a row are normal variance. To maximize the success rate:

1. Install the cache first, then **fully close the PS4 browser** (do not just navigate away).
2. Reopen the browser, open **only** the host page, and touch nothing while it runs.
3. Let the auto-start countdown run by itself; do not move the cursor during execution.
4. After any failure use **Reload** — the countdown restarts on its own.
5. If one chain keeps failing with out-of-memory on your firmware, try the other chain (`Lapse` vs `NetCtrl`) — their allocation patterns differ.

Raising timeouts does not help: out-of-memory happens *during* the spray itself, and the page is only ~10 KB against tens of megabytes of exploit allocations. Do not modify spray sizes or attempt counts — they are researcher-tuned upstream constants.

### The PS4 browser freezes

JavaScript cannot reliably recover a browser process that has stopped responding. Close and reopen the PS4 browser, then load the matching host again. Avoid adding repeated retry or reload loops; they can increase instability.

### A utility payload does not respond

Wait until the host reports that the exploit/GoldHEN flow is ready. Confirm that the selected host actually provides the requested utility, that the PS4 and payload receiver are on the expected network, and that the receiver is listening on the required port. The CSSFontFace branch does not provide standalone utility-payload buttons.

## Safety and limitations

- Use only the host intended for the console's exact firmware.
- Do not interrupt the console while an exploit, GoldHEN load, payload, or system operation is running.
- Keep a safe recovery path and current backups before using backup, restore, or system-related utilities.
- Do not use exploit pages for PSN access or other online services.
- Do not assume that a payload is harmless simply because it is bundled locally; review what each utility does before loading it.
- The CSSFontFace flow is especially sensitive to available browser memory; excluding optional utility payloads is an intentional stability trade-off.
- The 11.00–13.00 branch is a research route with no real-console validation and no guarantee of stability; 12.03–12.49 have no working bug upstream.
- No host can guarantee identical results on every console, browser build, cache state, or network configuration.

## Credits and attribution

```text
$ whoami

Author ............. BlackArch
Community .......... PlayStation Pulse (Telegram)
Game servers ....... NodePlay
```

**Author:** [BlackArch](https://t.me/sudoBlackArch)<br>
**Community:** [PlayStation Pulse](https://t.me/PlayStation_Pulse)<br>
**Premium Game Servers:** [NodePlay](https://nodeplay.net/)

> For any use of the materials or files, the links to the author [BlackArch](https://t.me/sudoBlackArch) and the [PlayStation Pulse](https://t.me/PlayStation_Pulse) Telegram group must remain on all pages.

---

```text
$ exit

PSPULSE // offline ps4 host collection
```
