# Town of Madness

An independent web-launch experiment for the original Windows PC editions of **Midtown Madness (1999)** and **Midtown Madness 2 (2000)**.

> **Phase A1 — Browser launcher, ZIP inspection, local storage and engine handoff are implemented. Original game boot and gameplay are NOT yet verified. The BoxedWine WASM runtime must still be integrated.**

## What is built

- Lightweight responsive web launcher with MM1 and MM2 selectable; MM1 is the priority.
- Private import of installed Windows game folders as standard ZIP archives.
- Central-directory ZIP inspection that checks for `midtown.exe` or `Open1560.exe` (MM1), or `midtown2.exe` (MM2), without extracting or uploading. Midtown Madness 1 also requires `audio.ar`, `core.ar`, and `ui.ar`.
- Browser-local archive storage in IndexedDB and a Service Worker bridge that makes the ZIP accessible to a future BoxedWine WASM runtime as `townofmadness-mm1.zip` / `townofmadness-mm2.zip`.
- Launcher integration via the documented BoxedWine `app`, `p`, `work` and `resolution` parameters.
- Runtime checks, diagnostic console, fullscreen player frame and cleanup.
- Dependency-free ZIP inspector tests and GitHub Pages CI workflow.

## Run the A1 launcher

Open `index.html` through an HTTP server (not `file://`), for example:

```bash
python -m http.server 8080
# visit http://localhost:8080
```

Or deploy using GitHub Pages: **Settings → Pages → Source: GitHub Actions**. The workflow will verify and deploy the static launcher on pushes to `main`. Without the runtime files the site is intentionally **not playable**; the missing-engine status is real.

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
| A2 | Integrate and test BoxedWine WASM + matching Wine filesystem, launch a known-good non-commercial Windows executable | Pending; local Open1560 ZIP import support added |
| A3 | Test Midtown Madness 1 from a user-provided installed directory; debug Direct3D, audio, loading and performance | Pending |
| A4 | Try Midtown Madness 2; add per-game graphics compatibility settings | Pending |
| A5 | Mobile UX, virtual keyboard/gamepad workarounds and persistent saves after compatibility proof | Pending |

## Phase A2: build the Windows compatibility runtime

An on-demand GitHub Actions workflow, [Build BoxedWine browser runtime](.github/workflows/engine-build.yml), compiles the upstream single-threaded Emscripten release and uploads a `BoxedWine-WASM-Experimental` workflow artifact. It **does not run automatically** and has **not been build-tested in this project**. The necessary compatible Wine/Linux filesystem ZIP is a separate dependency and must be tested with the generated runtime. Do not mistake a passing compilation for Midtown Madness being playable.

To run a build: **Actions → Build BoxedWine browser runtime (experimental) → Run workflow**. Once completed, download the artifact and follow [engine setup notes](engine/README.md). Do not commit any game data.

## Development

```bash
npm run check
npm test
```

The launcher contains no third-party JavaScript dependencies. The original games and their assets are copyrighted by their owners and are **never committed** to this repository. BoxedWine is separately licensed under GPL-2.0; respect its licence when incorporating binaries or modified source.
