# BoxedWine browser runtime (not included yet)

This directory intentionally does **not** contain a pretend engine, copyrighted game files, or a prebuilt Wine filesystem.

The launcher checks for `engine/boxedwine.html`. To enable actual game launch, a **tested Emscripten/WebAssembly BoxedWine build** and its matching Wine filesystem ZIP must be placed here. The web build must support Direct3D 6 / Direct3D 7 through WebGL; use the matching graphics-enabled Wine files rather than a generic DirectDraw-only build.

## Build workflow

The [experimental GitHub Actions job](../.github/workflows/engine-build.yml) checks out upstream BoxedWine and invokes `make release` in `project/emscripten` with Emscripten. It stages the output as a temporary GitHub Actions artifact. No proprietary game archive is involved. The job is manually triggered and has not yet been run/verified here.

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
