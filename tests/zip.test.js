import {test} from "node:test";
import assert from "node:assert/strict";
import {inspectZip} from "../src/zip.js";

function fakeZip(paths) {
  const encoder = new TextEncoder();
  const chunks = [];
  let offset = 0;
  let central = [];
  for (const path of paths) {
    const name = encoder.encode(path);
    const local = new Uint8Array(30 + name.length);
    const l = new DataView(local.buffer);
    l.setUint32(0, 0x04034b50, true);
    l.setUint16(26, name.length, true);
    local.set(name, 30);
    chunks.push(local);
    const head = new Uint8Array(46 + name.length);
    const c = new DataView(head.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    head.set(name, 46);
    central.push(head);
    offset += local.length;
  }
  const centralLength = central.reduce((acc, part) => acc + part.length, 0);
  const eocd = new Uint8Array(22);
  const e = new DataView(eocd.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, paths.length, true);
  e.setUint16(10, paths.length, true);
  e.setUint32(12, centralLength, true);
  e.setUint32(16, offset, true);
  return new Blob([...chunks, ...central, eocd], {type: "application/zip"});
}

test("finds the original Windows executable, even inside a folder", async () => {
  const zip = fakeZip(["Midtown Madness/midtown.exe", "Midtown Madness/players/default.cfg"]);
  const result = await inspectZip(zip, "midtown.exe");
  assert.equal(result.exePath, "Midtown Madness/midtown.exe");
  assert.equal(result.fileCount, 2);
});
test("recognises sequel only when selected", async () => {
  const zip = fakeZip(["MM2/Midtown2.EXE"]);
  await assert.rejects(inspectZip(zip, "midtown.exe"), /Could not find midtown.exe/);
  assert.equal((await inspectZip(zip, "midtown2.exe")).exePath, "MM2/Midtown2.EXE");
});
test("rejects unsafe ZIP paths and corrupt data", async () => {
  await assert.rejects(inspectZip(fakeZip(["../midtown.exe"]), "midtown.exe"), /unsafe/);
  await assert.rejects(inspectZip(fakeZip(["\\\\midtown.exe"]), "midtown.exe"), /unsafe/);
  await assert.rejects(inspectZip(new Blob(["not a zip"]), "midtown.exe"), /not a valid ZIP/);
});
