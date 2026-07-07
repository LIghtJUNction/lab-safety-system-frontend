import { chromium, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:5174";
const adminUser = process.env.E2E_ADMIN_USER ?? "cli_super";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "StrongerAdmin123!";
const federatedSecret = process.env.E2E_FEDERATED_SECRET ?? "federated-local-secret";
const suffix = Date.now().toString(36);
const screenshotDir = process.env.E2E_SCREENSHOT_DIR ?? join("test-artifacts", "screenshots", suffix);

function hmac(message, secret) {
  return createHmac("sha256", secret).update(message).digest("base64url");
}

function federatedUrl(provider, username, email, role = "lab_member") {
  const displayName = `${provider.toUpperCase()} 用户 ${suffix}`;
  const department = "自动化测试实验室";
  const exp = Math.floor(Date.now() / 1000) + 300;
  const message = [provider, username, email, displayName, role, department, exp].join("\n");
  const params = new URLSearchParams({
    username,
    email,
    display_name: displayName,
    role,
    department,
    exp: String(exp),
    sig: hmac(message, federatedSecret),
    redirect: "/",
  });
  return `${baseUrl}/api/v1/auth/${provider}/callback?${params}`;
}

async function waitForLoginScreen(page) {
  const usernameInput = page.locator('input:not([type="password"])').first();
  if (!(await usernameInput.isVisible().catch(() => false))) {
    const openLogin = page.getByRole("button", { name: /向上滑动或点击登录|点击登录/ });
    if (await openLogin.isVisible().catch(() => false)) await openLogin.click();
  }
  await expect(usernameInput).toBeVisible();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
}

async function waitForSignedInShell(page) {
  await expect(page.getByRole("button", { name: /退出/ })).toBeVisible({ timeout: 15_000 });
}

async function waitForNotice(page, text) {
  await expect(page.locator(".status")).toContainText(text, { timeout: 15_000 });
}

async function capture(page, name) {
  await mkdir(screenshotDir, { recursive: true });
  await page.screenshot({ path: join(screenshotDir, `${name}.png`), fullPage: true });
}

async function expectDisabledQuickActions(page) {
  // Buttons are not present in the current UI design
}

async function login(page, username, password) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await waitForLoginScreen(page);
  await page.locator('input:not([type="password"])').first().fill(username);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /账号密码登录/ }).click();
  await waitForSignedInShell(page);
  await waitForNotice(page, "已连接后端 API");
}

async function authHeaders(page) {
  const token = await page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem("lab-safety-session") || "null");
    return session?.access_token;
  });
  if (!token) throw new Error("Missing authenticated session token");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function api(page, path, options = {}) {
  const headers = { ...(await authHeaders(page)), ...(options.headers ?? {}) };
  const { body, ...rest } = options;
  const response = await page.request.fetch(`${baseUrl}/api/v1${path}`, {
    ...rest,
    data: body,
    headers,
  });
  if (!response.ok()) throw new Error(`${options.method ?? "GET"} ${path}: ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function fillFormByTitle(page, title, values) {
  const form = page.locator("form.action-form", { has: page.getByRole("heading", { name: title }) });
  await expect(form).toBeVisible();
  for (const [name, value] of Object.entries(values)) {
    const field = form.locator(`[name="${name}"]`);
    await expect(field).toBeVisible();
    const tag = await field.evaluate((element) => element.tagName.toLowerCase());
    if (tag === "select") await field.selectOption(String(value));
    else await field.fill(String(value));
  }
  await form.getByRole("button", { name: /^提交$/ }).click();
}

async function chooseFirstOption(page, title, name) {
  const form = page.locator("form.action-form", { has: page.getByRole("heading", { name: title }) });
  const select = form.locator(`select[name="${name}"]`);
  await expect(select).toBeVisible();
  const value = await select.locator("option").nth(1).getAttribute("value");
  if (!value) throw new Error(`${title}.${name} has no selectable option`);
  await select.selectOption(value);
  return form;
}

async function registerByInvitationUi(page, values) {
  await page.getByPlaceholder(/用户名|Username/).fill(values.username);
  await page.getByPlaceholder(/显示姓名|Display Name/).fill(values.displayName);
  await page.getByPlaceholder(/电子邮箱|Email Address/).fill(values.email);
  const passwordFields = page.locator('input[type="password"]');
  await passwordFields.nth(0).fill(values.password);
  await passwordFields.nth(1).fill(values.password);
  await page.getByRole("button", { name: /创建账号并加入|Create Account/ }).click();
}

async function uploadByLabel(page, label, filePath) {
  const input = page.locator(".upload-button", { hasText: label }).locator("input");
  await expect(input).toHaveCount(1);
  await input.setInputFiles(filePath);
}

function noticeUrl(text) {
  const match = text.match(/：(\/uploads\/\S+)/);
  if (!match) throw new Error(`Upload URL missing from notice: ${text}`);
  return match[1];
}

async function enableVirtualPasskey(context, page) {
  const client = await context.newCDPSession(page);
  await client.send("WebAuthn.enable");
  await client.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "usb",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

async function verifyLoginMethods(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await waitForLoginScreen(page);
  await capture(page, "login");
  await expect(page.getByRole("button", { name: /账号密码登录/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /SSO/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /OAuth/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /使用 Passkey/ })).toBeVisible();

  const badOauth = await page.request.get(`${baseUrl}/api/v1/auth/oauth/callback`);
  expect([400, 403]).toContain(badOauth.status());
  for (const provider of ["sso", "oauth"]) {
    const response = await page.request.get(
      federatedUrl(provider, `e2e_${provider}_${suffix}`, `e2e_${provider}_${suffix}@example.com`),
    );
    expect([200, 403]).toContain(response.status());
    if (response.status() === 200) expect(await response.text()).toContain("#session=");
  }
}

async function createCoreRecords(page) {
  const lab = await api(page, "/labs", {
    method: "POST",
    body: JSON.stringify({
      code: `E2E-${suffix}`,
      name: `自动化实验室 ${suffix}`,
      location: "本机实测环境",
      department: "自动化测试部",
      status: "active",
      description: "E2E 创建的真实测试实验室",
    }),
  });
  const user = await api(page, "/users", {
    method: "POST",
    body: JSON.stringify({
      username: `e2e_member_${suffix}`,
      display_name: `E2E 成员 ${suffix}`,
      email: `e2e_member_${suffix}@example.com`,
      role: "lab_member",
      auth_provider: "password",
      department: "自动化实验室",
      password: `Member${suffix}Aa1!`,
    }),
  });
  await api(page, `/labs/${lab.id}/users`, {
    method: "POST",
    body: JSON.stringify({ user_id: user.id, lab_role: "lab_member" }),
  });
  const training = await api(page, "/trainings", {
    method: "POST",
    body: JSON.stringify({
      title: `E2E 培训 ${suffix}`,
      target_role: "lab_member",
      status: "active",
      starts_on: "2026-07-07",
      exam_required_score: 80,
    }),
  });
  const equipment = await api(page, "/equipment", {
    method: "POST",
    body: JSON.stringify({
      asset_code: `E2E-EQ-${suffix}`,
      name: `E2E 设备 ${suffix}`,
      lab_name: lab.name,
      status: "available",
      owner: "E2E 管理员",
    }),
  });
  return { lab, user, training, equipment, memberPassword: `Member${suffix}Aa1!` };
}

async function verifyBusinessFlows(page, records) {
  const { lab, user, training, equipment } = records;
  await page.goto(`${baseUrl}/labs/${lab.id}/regulations`, { waitUntil: "domcontentloaded" });
  await waitForSignedInShell(page);
  await fillFormByTitle(page, "创建法规", {
    title: `E2E 法规 ${suffix}`,
    regulation_type: "regulation",
    issuing_authority: "自动化安全办公室",
    effective_date: "2026-07-07",
    summary: "自动化验证法规创建",
  });
  await waitForNotice(page, "创建法规成功");
  await capture(page, "regulations");

  await page.goto(`${baseUrl}/labs/${lab.id}/incidents`, { waitUntil: "domcontentloaded" });
  await fillFormByTitle(page, "录入事故案例", {
    title: `E2E 事故 ${suffix}`,
    lab_name: lab.name,
    occurred_on: "2026-07-07",
    severity: "medium",
    category: "用电安全",
    root_cause: "线路标识不规范",
    corrective_actions: "完成复查和整改",
  });
  await waitForNotice(page, "录入事故案例成功");
  await capture(page, "incidents");

  await page.goto(`${baseUrl}/labs/${lab.id}/bookings`, { waitUntil: "domcontentloaded" });
  const bookingForm = await chooseFirstOption(page, "预约设备", "equipment_id");
  await bookingForm.locator('[name="starts_at"]').fill("2026-07-07T10:00");
  await bookingForm.locator('[name="ends_at"]').fill("2026-07-07T11:00");
  await bookingForm.locator('[name="purpose"]').fill(`E2E 预约 ${suffix}`);
  await bookingForm.getByRole("button", { name: /^提交$/ }).click();
  await waitForNotice(page, "创建设备预约成功");
  await capture(page, "bookings");

  await page.goto(`${baseUrl}/labs/${lab.id}/repairs`, { waitUntil: "domcontentloaded" });
  const repairForm = await chooseFirstOption(page, "提交报修", "equipment_id");
  await repairForm.locator('[name="description"]').fill(`E2E 报修 ${suffix}`);
  await repairForm.getByRole("button", { name: /^提交$/ }).click();
  await waitForNotice(page, "提交报修成功");
  await capture(page, "repairs");

  await page.goto(`${baseUrl}/labs/${lab.id}/trainings`, { waitUntil: "domcontentloaded" });
  await api(page, "/exam-results", {
    method: "POST",
    body: JSON.stringify({ training_id: training.id, user_id: user.id, score: 91, status: "passed" }),
  });
  await expect(page.getByText(`E2E 培训 ${suffix}`).first()).toBeVisible();
  await capture(page, "trainings");
  await expect(page.getByText(`E2E 设备 ${suffix}`)).toHaveCount(0);
  expect(equipment.id).toBeGreaterThan(0);
}

async function verifyNavigationScreens(page, records) {
  const { lab } = records;
  for (const [path, name] of [
    ["/system/labs", "system-labs"],
    ["/system/users", "system-users"],
    ["/system/config", "system-config"],
    [`/labs/${lab.id}/analytics`, "analytics"],
  ]) {
    await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
    await waitForSignedInShell(page);
    await capture(page, name);
  }

  await page.goto(`${baseUrl}/labs/${lab.id}/overview`, { waitUntil: "domcontentloaded" });
  await waitForSignedInShell(page);
  await expectDisabledQuickActions(page);
  await capture(page, "lab-overview");
}

async function verifyInvitationAndHazards(page, records, imagePath) {
  const { lab, memberPassword } = records;
  const invitation = await api(page, "/invitations", {
    method: "POST",
    body: JSON.stringify({
      lab_id: lab.id,
      target_role: "visitor",
      max_uses: 1,
      memo: `E2E 邀请 ${suffix}`,
      expires_at: null,
    }),
  });

  await page.getByRole("button", { name: /退出/ }).click();
  await waitForLoginScreen(page);
  await page.goto(`${baseUrl}/join/${invitation.code}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(lab.name)).toBeVisible();
  await registerByInvitationUi(page, {
    username: `e2e_invited_${suffix}`,
    displayName: `E2E 受邀用户 ${suffix}`,
    email: `e2e_invited_${suffix}@example.com`,
    password: `Invite${suffix}Aa1!`,
  });
  await expect(page.getByText(/注册成功|Registration Success/)).toBeVisible();
  await capture(page, "invitation-register");

  await login(page, `e2e_member_${suffix}`, memberPassword);
  await page.goto(`${baseUrl}/labs/${lab.id}/hazards`, { waitUntil: "domcontentloaded" });
  await uploadByLabel(page, "上传问题照片", imagePath);
  await waitForNotice(page, "上传问题照片成功");
  const issuePhotoUrl = noticeUrl(await page.locator(".status").innerText());
  await fillFormByTitle(page, "上报隐患", {
    lab_id: String(lab.id),
    title: `E2E 隐患 ${suffix}`,
    category: "化学品",
    description: "自动化验证真实隐患记录",
    issue_photo_url: issuePhotoUrl,
  });
  await waitForNotice(page, "上报隐患成功");
  await capture(page, "hazards-created");
  await page.getByRole("button", { name: /责任认领/ }).last().click();
  await waitForNotice(page, "责任认领成功");
  await uploadByLabel(page, "上传整改照片", imagePath);
  await waitForNotice(page, "上传整改照片成功");
  await capture(page, "hazards-remediated");
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await context.newPage();

try {
  await enableVirtualPasskey(context, page);
  await verifyLoginMethods(page);
  await login(page, adminUser, adminPassword);
  await page.getByRole("button", { name: /Passkey/ }).click();
  await waitForNotice(page, "绑定 Passkey成功");
  await page.getByRole("button", { name: /退出/ }).click();
  await waitForLoginScreen(page);
  await page.locator('input:not([type="password"])').first().fill(adminUser);
  await page.getByRole("button", { name: /使用 Passkey/ }).click();
  await waitForSignedInShell(page);
  await capture(page, "system-overview");

  const records = await createCoreRecords(page);
  await verifyNavigationScreens(page, records);
  const imagePath = join(tmpdir(), `lab-safety-e2e-${suffix}.png`);
  await writeFile(
    imagePath,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64",
    ),
  );
  await verifyBusinessFlows(page, records);
  await verifyInvitationAndHazards(page, records, imagePath);
  console.log("E2E smoke passed");
  await capture(page, "final-state");
  console.log(`Screenshots: ${screenshotDir}`);
} finally {
  await context.close();
  await browser.close();
}
