#!/usr/bin/env python3
"""Fetch a versioned upstream BoxedWine Wine 11 browser root with SHA-256 verification.

A missing download is nonfatal for publishing the launcher; the generated
runtime-manifest.json will mark the game runtime unavailable.
"""
import hashlib
import json
import os
import pathlib
import sys
import tempfile
import urllib.error
import urllib.request

SOURCES = [
    ("30", 96910727, "4a3ff6df91496e0331887191e04a7dd86eedef2844854be889aeb4e2ccd5f885"),
    ("29", 96909056, "407d92cce8d04d7962bf71ba235a1e443b68cc2e39da90c3ad7c0fbf21821dd3"),
    ("28", 96903258, "0ef37445a4d31af044a435e6b68f79ba23eaa7197655106f165d89ef5caf950c"),
    ("27", 99650033, "7f24b945165dfdc71cd86ae8a32927e07c32c072fb24711bad338830d283652c"),
    ("26", 99629744, "af2352a3f77dcd2747a1a67cb055962dde1efca546f1998e139ef03212ea13ca"),
    ("25", 99626437, "f053683d1bd40d524d0136d6d14cb8a45a6b13ce1de4c56916ae4e20fc4cd91b"),
    ("23", 99514221, "4d505092956dd78e36712dac8111c252e5d1b859ce2373fbe7c80242bb65ad47"),
    ("22", 99512503, "3781540f59c23f2c4d7f68a64542cf1ef08f0c0baa24cebc9552e34615b4d969"),
    ("20", 99499113, "21beaeea9566fe214a5d5fd4d605cae467166d1e6cd1458a8e6fef79fe5bb631"),
    ("18", 99494797, "c56e0a2689bfa7ca076749696bec1f563a75610ebb1481ee4b959e7b23d595e5"),
    ("17", 99486076, "262671189dddccac04c537715fd5030f23ac08a5bc6742d15206004eeeb9f29d"),
    ("15", 99466825, "f839ac3d9b85e9f5a102ba6ca3232828d5f47a55399898f220dafa094321103a"),
    ("14", 99456246, "3365e31caaf6a1fc832a0a7c4812592d25410b9f5c9536277131388c8e103a49"),
    # Published full Wine 11 fallback for Notepad diagnostics if smaller web roots unavailable.
    ("11-full", 167152655, "13993bf74c3421304ee50e247ff628ca47d75ae3118e10967a388e8a664aabee"),
]
FILENAME = "TinyCore15Wine11.0-web.zip"


def download_checked(url, expected_size, expected_sha256, output):
    req = urllib.request.Request(url, headers={"User-Agent": "TownOfMadness-CI/1.0"})
    digest = hashlib.sha256()
    count = 0
    with urllib.request.urlopen(req, timeout=35) as response, open(output, "wb") as file:
        while True:
            data = response.read(1024 * 1024)
            if not data:
                break
            count += len(data)
            if count > expected_size:
                raise ValueError("Downloaded file exceeds known upstream size")
            file.write(data)
            digest.update(data)
    if count != expected_size or digest.hexdigest() != expected_sha256:
        raise ValueError("Upstream filesystem size/SHA-256 mismatch")
    return count


def main():
    destination = pathlib.Path(sys.argv[1])
    destination.mkdir(parents=True, exist_ok=True)
    outcome = {
        "ready": False,
        "root": FILENAME,
        "engine": "BoxedWine WebAssembly",
        "tested_gameplay": False,
        "message": "No verified compatible Wine filesystem downloaded",
    }
    root = destination / FILENAME
    for version, size, sha256 in SOURCES:
        release = version.split("-")[0]
        remote_name = "TinyCore15Wine11.0.zip" if version == "11-full" else FILENAME
        url = f"https://boxedwine.org/v2/{release}/{remote_name}"
        print(f"Checking BoxedWine Wine 11 web filesystem v{version}: {url}", flush=True)
        try:
            fd, temp_name = tempfile.mkstemp(prefix="townofmadness-wine-", suffix=".zip", dir=destination)
            os.close(fd)
            try:
                download_checked(url, size, sha256, temp_name)
                os.replace(temp_name, root)
                outcome.update({"ready": True, "filesystem_version": version,
                                "sha256": sha256, "size_bytes": size,
                                "source_url": url, "message": "Verified Wine 11 filesystem downloaded"})
                print(f"Verified filesystem revision {version}: {size} bytes", flush=True)
                break
            finally:
                if os.path.exists(temp_name):
                    os.unlink(temp_name)
        except (OSError, ValueError, urllib.error.URLError) as exc:
            print(f"Filesystem v{version} unavailable or incorrect: {exc}", flush=True)
    manifest = destination / "runtime-manifest.json"
    manifest.write_text(json.dumps(outcome, indent=2) + "\n", encoding="utf-8")
    print(f"Runtime status saved to {manifest}: ready={outcome['ready']}", flush=True)


if __name__ == "__main__":
    main()
