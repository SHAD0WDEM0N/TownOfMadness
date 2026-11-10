# Town of Madness

An independent web-launch experiment for the original Windows PC editions of **Midtown Madness (1999)** and **Midtown Madness 2 (2000)**.

> **Phase A1 — Browser launcher, ZIP inspection, local storage and engine handoff are implemented. Original game boot and gameplay are NOT yet verified. The BoxedWine WASM runtime must still be integrated.**

## What is built

- Lightweight responsive web launcher with MM1 and MM2 selectable; MM1 is the priority.
- Private import of installed Windows game folders as standard ZIP archives.
- Central-directory ZIP inspection that checks for `midtown.exe` (MM1) or `midtown2.exe` (MM2), without extracting or uploading.
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

On Windows, install Midtown Madness 1 using your own game media. Open its installed folder (typically containing `midtown.exe`, game resource files and subdirectories), and ZIP **the whole folder** rather than just the EXE. Import the ZIP via the launcher. For MM2 use the folder containing `midtown2.exe`.

An `.iso` or a setup `.exe` by itself is not yet supported. A ZIP that merely contains the ISO will also not work. Large archives may hit Safari/IndexedDB storage limits. The files remain on the user's device and are not uploaded to a server.

## The actual game engine

We are targeting [BoxedWine](https://github.com/danoon2/Boxedwine), an emulator that runs 32-bit Windows applications using Wine and WebAssembly. MM1 uses Direct3D 6; MM2 uses Direct3D 7. Recent BoxedWine development includes Direct3D-to-WebGL, but **neither game has been tested here**. This is not DOSBox, a remaster, or a rewrite of the original game.

See [engine/README.md](engine/README.md) for the next runtime-integration phase and licensing notes.

## Roadmap

| Phase | Deliverable | Status |
| --- | --- | --- |
| A1 | Responsive launcher, Windows-game ZIP validation, local browser bridge, Pages deployment workflow | Implemented; workflow/browser smoke test pending |
| A2 | Integrate and test BoxedWine WASM + matching Wine filesystem, launch a known-good non-commercial Windows executable | Pending |
| A3 | Test Midtown Madness 1 from a user-provided installed directory; debug Direct3D, audio, loading and performance | Pending |
| A4 | Try Midtown Madness 2; add per-game graphics compatibility settings | Pending |
| A5 | Mobile UX, virtual keyboard/gamepad workarounds and persistent saves after compatibility proof | Pending |

## Development

```bash
npm run check
npm test
```

The launcher contains no third-party JavaScript dependencies. The original games and their assets are copyrighted by their owners and are **never committed** to this repository. BoxedWine is separately licensed under GPL-2.0; respect its licence when incorporating binaries or modified source.
