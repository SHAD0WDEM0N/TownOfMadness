# BoxedWine browser runtime (not included yet)

This directory in the **source tree** contains deployment instructions, not copyrighted game data. The GitHub Pages workflow adds the successfully compiled BoxedWine WebAssembly bundle and, when available, a verified Wine 11 filesystem into the **published website**. These files are staged by GitHub Actions rather than copied into Git history.

The launcher checks for `engine/boxedwine.html`. To enable actual game launch, a **tested Emscripten/WebAssembly BoxedWine build** and its matching Wine filesystem ZIP must be placed here. The web build must support Direct3D 6 / Direct3D 7 through WebGL; use the matching graphics-enabled Wine files rather than a generic DirectDraw-only build.

## Build workflow

The [experimental build](../.github/workflows/engine-build.yml) ran successfully on [10 November 2026](https://github.com/SHAD0WDEM0N/TownOfMadness/actions/runs/42907134660) and uploaded its WASM bundle. The [Pages workflow](../.github/workflows/pages.yml) obtains that artifact using GitHub Actions permissions, rebuilds if the artifact expired, and stages it under `site/engine/`. The separate [filesystem downloader](../scripts/fetch_wine_fs.py) tries versioned, SHA-256-verified upstream Wine 11 archives; its `runtime-manifest.json` accurately communicates the result to the launcher.

To view this site publicly, enable **GitHub Pages → GitHub Actions** in repository settings once. The connected GitHub app does not provide a Pages settings API. Then inspect the `Verify and publish web launcher` workflow run. If it reports a missing filesystem, review the checksummed-source download logs and update the tested source list rather than bypassing hash validation.

**First browser boot validation:** On the published site, click **Test Windows boot (Notepad)**; confirm a real Wine Notepad window appears, not just the BoxedWine loading screen. Test on desktop Chromium first. Only after this passes, import the private Midtown Madness ZIP and attempt Open1560. Screenshots or console logs will be needed to diagnose runtime graphics/input errors.

**Note:** Generated `boxedwine.html/js/wasm` alone is not a complete emulator environment. A matching web Wine/Linux filesystem ZIP is still required; it must be acquired or prepared from upstream according to applicable licences. After providing it, test Wine Notepad first, then MM1. GitHub Pages may need additional performance/memory considerations for large runtime assets.

## Why this runtime?

BoxedWine is an open-source Windows compatibility emulator with WebAssembly support: https://github.com/danoon2/Boxedwine

Current build reference: https://github.com/danoon2/Boxedwine/blob/master/docs/How-To-Build-Boxedwine.md
Web launcher configuration: https://github.com/danoon2/Boxedwine/blob/master/buildFlags.txt

1. Build an Emscripten **single-threaded** version first, or obtain an appropriate versioned upstream web build. GitHub Pages cannot supply custom COOP/COEP response headers required by many multithreaded WebAssembly builds.
2. Preserve the generated `boxedwine.html`, JavaScript, WASM and supporting files, plus a compatible Wine filesystem archive, in `engine/`. Verify the actual filenames/paths produced by that version.
3. Confirm the engine boots a small licensed/open-source Windows test program before importing either Midtown Madness game.
4. In the game launcher, import a locally prepared ZIP of the **already installed** game directory. The ZIP is held in IndexedDB, and the service worker responds to BoxedWine's `townofmadness-mm1.zip` / `townofmadness-mm2.zip` request entirely on-device.
5. Validate MM1 title screen, graphics mode, game loading, keyboard input, audio, and stability. Record exact failures before testing MM2.

The wrapper passes BoxedWine's documented parameters `app`, `p`, `w` (working directory), and `resolution`. BoxedWine mounts the `app` ZIP under `c:/files`; the private game archive is served by the local service worker, including requests underneath `engine/`.

### Open1560 archive variant
A supplied MM1 archive contains `Open1560.exe` (32-bit x86 Windows), `SDL3.dll`, and the original `audio.ar`, `core.ar`, and `ui.ar` assets. The launcher now recognizes this variant, but its Windows SDL3/OpenGL 3.2 renderer may not work through BoxedWine's browser graphics layer. Direct source compilation to WASM is not presently viable without replacing native x86 assembly. First prove BoxedWine boots a known-good test program; then attempt this installation, record errors, and consider the original `midtown.exe` with BoxedWine's Direct3D/WebGL path if Open1560 fails.

**Current status:** A1 browser launcher and local ZIP bridge only. No BoxedWine runtime binary is bundled; **Midtown Madness gameplay has not been verified.**

Do not publish Microsoft's proprietary game files, CDs, cracked executables, or Wine builds without meeting their respective licences.
