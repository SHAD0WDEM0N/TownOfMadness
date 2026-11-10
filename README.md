# Town of Madness

An independent web-launch experiment for the original Windows PC editions of **Midtown Madness (1999)** and **Midtown Madness 2 (2000)**.

> **Phase A2.2 — The browser launcher, private ZIP bridge, and automated BoxedWine WebAssembly deployment are implemented. Original Windows application boot and Midtown Madness gameplay are NOT yet verified.**

## What is built

- Lightweight responsive web launcher with MM1 and MM2 selectable; MM1 is the priority.
- Private import of installed Windows game folders as standard ZIP archives.
- Central-directory ZIP inspection that checks for `midtown.exe` or `Open1560.exe` (MM1), or `midtown2.exe` (MM2), without extracting or uploading. Midtown Madness 1 also requires `audio.ar`, `core.ar`, and `ui.ar`.
- Browser-local archive storage in IndexedDB and a Service Worker bridge that makes the ZIP accessible to a future BoxedWine WASM runtime as `townofmadness-mm1.zip` / `townofmadness-mm2.zip`.
- Launcher integration via the documented BoxedWine `app`, `p`, `work` and `resolution` parameters.
- Runtime checks for both the WebAssembly executable and checksum-verified Wine filesystem; diagnostic console, fullscreen player frame, and cleanup.
- Separate **Test Windows boot (Notepad)** button. This launches Wine's test application without game assets so browser startup can be assessed independently.
- Dependency-free ZIP inspector tests and GitHub Pages CI workflow.

## Run the A1 launcher

Open `index.html` through an HTTP server (not `file://`), for example:

```bash
python -m http.server 8080
# visit http://localhost:8080
```

Or deploy with GitHub Pages: **Settings → Pages → Source: GitHub Actions** (one-time administrator setting). Pushes to `main` automatically verify the launcher, attach the previously compiled BoxedWine WASM bundle (or rebuild it when the temporary artifact expires), download a Wine 11 filesystem from BoxedWine's versioned releases with exact byte-count + SHA-256 checks, and publish a standalone site. If the upstream Wine filesystem is unavailable, the website still publishes but correctly displays **Engine setup needed** and does not allow starting a Windows app.

Once the site indicates **Boot test available**, click **Test Windows boot (Notepad)**. A visible Windows Notepad window is the first browser success criterion; a GitHub Actions build success does not demonstrate boot. Then import your private Midtown Madness ZIP and try a game launch.

## Prepare your legally obtained PC installation

On Windows, install Midtown Madness 1 using your own game media. Open its installed folder (containing `midtown.exe`, or the Open1560 reconstruction's `Open1560.exe`, plus the original `audio.ar`, `core.ar`, and `ui.ar` assets), and ZIP **the whole folder**. Import the ZIP via the launcher. For MM2 use the folder containing `midtown2.exe`.

**Uploaded-file compatibility check (2026-11-10):** A user-provided `Midtown Madness.7z` was inspected *privately*. It contains a 32-bit Windows `Open1560.exe` and the three required game data files; their SHA-1 digests match the [Open1560 methodology reference](https://github.com/0x1F9F1/Open1560/blob/master/docs/methodology.md). The private 7z was converted to a ZIP for browser import. Neither original archive nor converted ZIP was committed.

An `.iso` or a setup `.exe` by itself is not yet supported. A ZIP that merely contains the ISO will also not work. Large archives may hit Safari/IndexedDB storage limits. The files remain on the user's device and are not uploaded to a server.

## Open1560 compatibility

[Open1560](https://github.com/0x1F9F1/Open1560) is a GPL-3.0 partial reconstruction of Midtown Madness build 1560 that improves Windows support and uses SDL3/OpenGL. It is **not** a WebAssembly browser engine: portions still consist of native x86 assembly. We have added detection and local import for `Open1560.exe` as a 32-bit Windows executable for **experimental** BoxedWine loading. There is no verified browser boot, and we have not redistributed Open1560 or the proprietary Midtown Madness assets.

## The actual game engine

We are targeting [BoxedWine](https://github.com/danoon2/Boxedwine), an emulator that runs 32-bit Windows applications using Wine and WebAssembly. MM1 uses Direct3D 6; MM2 uses Direct3D 7. Recent BoxedWine development includes Direct3D-to-WebGL, but **neither game has been tested here**. This is not DOSBox, a remaster, or a rewrite of the original game.

See [engine/README.md](engine/README.md) for the next runtime-integration phase and licensing notes.

## Roadmap

| Phase | Deliverable | Status |
| --- | --- | --- |
| A1 | Responsive launcher, Windows-game ZIP validation, local browser bridge, Pages deployment workflow | Implemented; workflow/browser smoke test pending |
| A2 | Integrate BoxedWine WASM + checked Wine filesystem and launch Wine Notepad in browser | WASM compilation passed; Pages staging + Notepad launch button implemented; filesystem and boot confirmation pending |
| A3 | Test Midtown Madness 1 from a user-provided installed directory; debug Direct3D, audio, loading and performance | Pending |
| A4 | Try Midtown Madness 2; add per-game graphics compatibility settings | Pending |
| A5 | Mobile UX, virtual keyboard/gamepad workarounds and persistent saves after compatibility proof | Pending |

## Phase A2: build the Windows compatibility runtime

The [Build BoxedWine browser runtime](.github/workflows/engine-build.yml) workflow compiled successfully on [10 November 2026](https://github.com/SHAD0WDEM0N/TownOfMadness/actions/runs/42907134660), producing the `BoxedWine-WASM-Experimental` artifact. The [Pages workflow](.github/workflows/pages.yml) automatically stages that runtime (or rebuilds from upstream if the artifact expires), attempts to fetch a compatible SHA-256-verified Wine 11 ZIP from [BoxedWine](https://boxedwine.org/), and publishes the site. **Windows Notepad boot, Direct3D/OpenGL compatibility, and actual gameplay remain to be tested in a browser**.

To run a build: **Actions → Build BoxedWine browser runtime (experimental) → Run workflow**. Once completed, download the artifact and follow [engine setup notes](engine/README.md). Do not commit any game data.

## Development

```bash
npm run check
npm test
```

The launcher contains no third-party JavaScript dependencies. The original games and their assets are copyrighted by their owners and are **never committed** to this repository. BoxedWine is separately licensed under GPL-2.0; respect its licence when incorporating binaries or modified source.
