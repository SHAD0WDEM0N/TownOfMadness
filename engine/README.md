# BoxedWine browser runtime (not included yet)

This directory intentionally does **not** contain a pretend engine, copyrighted game files, or a prebuilt Wine filesystem.

The launcher checks for `engine/boxedwine.html`. To enable actual game launch, a **tested Emscripten/WebAssembly BoxedWine build** and its matching Wine filesystem ZIP must be placed here. The web build must support Direct3D 6 / Direct3D 7 through WebGL; use the matching graphics-enabled Wine files rather than a generic DirectDraw-only build.

## Why this runtime?

BoxedWine is an open-source Windows compatibility emulator with WebAssembly support: https://github.com/danoon2/Boxedwine

Current build reference: https://github.com/danoon2/Boxedwine/blob/master/docs/How-To-Build-Boxedwine.md
Web launcher configuration: https://github.com/danoon2/Boxedwine/blob/master/buildFlags.txt

1. Build an Emscripten **single-threaded** version first, or obtain an appropriate versioned upstream web build. GitHub Pages cannot supply custom COOP/COEP response headers required by many multithreaded WebAssembly builds.
2. Preserve the generated `boxedwine.html`, JavaScript, WASM and supporting files, plus a compatible Wine filesystem archive, in `engine/`. Verify the actual filenames/paths produced by that version.
3. Confirm the engine boots a small licensed/open-source Windows test program before importing either Midtown Madness game.
4. In the game launcher, import a locally prepared ZIP of the **already installed** game directory. The ZIP is held in IndexedDB, and the service worker responds to BoxedWine's `townofmadness-mm1.zip` / `townofmadness-mm2.zip` request entirely on-device.
5. Validate MM1 title screen, graphics mode, game loading, keyboard input, audio, and stability. Record exact failures before testing MM2.

The wrapper passes the upstream parameters `app`, `p`, `work`, and `resolution`. BoxedWine's documented `app` ZIP mount is `c:/files`. Changes in BoxedWine releases may require an adapter update.

**Current status:** A1 browser launcher and local ZIP bridge only. No BoxedWine runtime binary is bundled; **Midtown Madness gameplay has not been verified.**

Do not publish Microsoft's proprietary game files, CDs, cracked executables, or Wine builds without meeting their respective licences.
