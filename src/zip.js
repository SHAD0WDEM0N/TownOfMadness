// Inspect the ZIP central directory without uncompressing or uploading game data.
// Standard ZIP is supported; ZIP64/multipart and encrypted archives are rejected.
const decoder = new TextDecoder("utf-8");

function fail(message) {
  throw new Error(message);
}

function isUnsafePath(path) {
  const parts = path.replaceAll("\\", "/").split("/");
  const normalized = path.replaceAll("\\", "/");
  return normalized.startsWith("/") || /^[a-z]:/i.test(normalized) || parts.some((part) => part === "..");
}

export async function inspectZip(blob, executableName, requiredFiles = []) {
  const executableNames = Array.isArray(executableName) ? executableName : [executableName];
  if (!blob || blob.size < 22) fail("This is not a valid ZIP archive.");
  const tailStart = Math.max(0, blob.size - 65557);
  const tail = new DataView(await blob.slice(tailStart).arrayBuffer());
  let end = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === 0x06054b50 &&
      i + 22 + tail.getUint16(i + 20, true) === tail.byteLength) {
      end = i;
      break;
    }
  }
  if (end < 0) fail("ZIP end-of-directory record not found. Use a normal ZIP of the installed game folder.");
  if (tail.getUint16(end + 4, true) !== 0 || tail.getUint16(end + 6, true) !== 0) {
    fail("Multipart ZIP archives are not supported.");
  }
  const total = tail.getUint16(end + 10, true);
  const centralSize = tail.getUint32(end + 12, true);
  const centralOffset = tail.getUint32(end + 16, true);
  if (total === 0xffff || centralOffset === 0xffffffff || centralSize === 0xffffffff) {
    fail("ZIP64 is not supported in Phase A1. Make a standard ZIP of the installed game folder.");
  }
  if (centralOffset + centralSize > blob.size || centralSize === 0 || total === 0) {
    fail("ZIP directory is empty or invalid.");
  }
  const view = new DataView(await blob.slice(centralOffset, centralOffset + centralSize).arrayBuffer());
  const entries = [];
  let index = 0;
  for (let i = 0; i < total; i++) {
    if (index + 46 > view.byteLength || view.getUint32(index, true) !== 0x02014b50) {
      fail("ZIP central directory is damaged.");
    }
    const flags = view.getUint16(index + 8, true);
    const method = view.getUint16(index + 10, true);
    const length = view.getUint16(index + 28, true);
    const extra = view.getUint16(index + 30, true);
    const comment = view.getUint16(index + 32, true);
    if (index + 46 + length + extra + comment > view.byteLength) fail("Invalid ZIP entry metadata.");
    if (flags & 1) fail("Password-protected game ZIPs cannot be imported.");
    if (method !== 0 && method !== 8) fail("This ZIP uses an unsupported compression method.");
    const bytes = new Uint8Array(view.buffer, view.byteOffset + index + 46, length);
    const name = decoder.decode(bytes).replaceAll("\\", "/");
    if (isUnsafePath(name)) fail("The archive contains an unsafe relative file path.");
    if (name && !name.endsWith("/")) entries.push(name);
    index += 46 + length + extra + comment;
  }
  const available = new Map(entries.map((path) => [path.split("/").pop().toLowerCase(), path]));
  // Prefer the original executable if both versions are present; Open1560 is a fallback.
  let exe;
  for (const candidate of executableNames) {
    if (available.has(candidate.toLowerCase())) {
      exe = available.get(candidate.toLowerCase());
      break;
    }
  }
  if (!exe) {
    const found = entries.filter((name) => name.toLowerCase().endsWith(".exe")).slice(0, 5);
    fail("Could not find " + executableNames.join(" or ") + ". ZIP the complete game folder, not an installer/ISO." +
      (found.length ? " Executables found: " + found.join(", ") : ""));
  }
  const missing = requiredFiles.filter((file) => !available.has(file.toLowerCase()));
  if (missing.length) fail("The game ZIP is missing required data files: " + missing.join(", ") + ".");
  return {exePath: exe, exeName: exe.split("/").pop(), fileCount: entries.length, archiveSize: blob.size};
}
