// Evidence-gathering only: a loaded canvas is NOT proof Wine Notepad boots.
// Runs against the self-hosted GitHub Actions staging site, without game files.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const report = {
  test: "BoxedWine WebAssembly / Wine Notepad browser smoke",
  time: new Date().toISOString(),
  notepadBootVerified: false,
  note: "Automated observations only; human review of screenshot and console required.",
  errors: [],
  console: []
};
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader"]
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 850 } });
  page.on("pageerror", error => report.errors.push(error.message));
  page.on("console", message => {
    if (report.console.length < 350) report.console.push(message.type() + ": " + message.text().slice(0, 500));
  });
  page.on("requestfailed", request => {
    if (report.errors.length < 80) report.errors.push("Request failed: " + request.url() + " — " + (request.failure()?.errorText || "unknown"));
  });
  const url = new URL("http://127.0.0.1:8765/engine/boxedwine.html");
  url.search = new URLSearchParams({
    root: "TinyCore15Wine11.0-web",
    p: "notepad",
    resolution: "800x600",
    "wine-override": "nomono"
  }).toString();
  report.url = url.toString();
  const response = await page.goto(url.toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
  report.httpStatus = response?.status() ?? null;
  // Initial Wine configuration on an empty browser profile can take substantial time.
  await page.waitForTimeout(90000);
  report.pageTitle = await page.title();
  report.statusText = await page.locator("#status").textContent().catch(() => null);
  report.consoleTextArea = (await page.locator("#output").inputValue().catch(() => "" )).slice(-12000);
  report.canvases = await page.locator("canvas").evaluateAll(elements => elements.map(c => ({
    id: c.id, width: c.width, height: c.height
  })));
  await page.screenshot({ path: "browser-smoke.png", fullPage: true, timeout: 30000 });
  report.screenshot = "browser-smoke.png";
  console.log("Browser probe captured screenshot; visible Windows Notepad still needs manual confirmation.");
} catch (error) {
  report.errors.push(String(error));
  console.error("Browser smoke failed:", error);
} finally {
  if (browser) await browser.close().catch(() => {});
  writeFileSync("browser-smoke-report.json", JSON.stringify(report, null, 2) + "\n");
}
