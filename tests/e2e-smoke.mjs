import { chromium, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5174";
const adminUser = process.env.E2E_ADMIN_USER ?? "cli_super";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "StrongerAdmin123!";
const federatedSecret =
  process.env.E2E_FEDERATED_SECRET ?? "federated-local-secret";
const suffix = Date.now().toString(36);

function hmac(message, secret) {
  return createHmac("sha256", secret)
    .update(message)
    .digest("base64url");
}

function federatedUrl(provider, username, email, role = "researcher") {
  const displayName = `${provider.toUpperCase()} 用户 ${suffix}`;
  const department = "自动化测试实验室";
  const exp = Math.floor(Date.now() / 1000) + 300;
  const message = [
    provider,
    username,
    email,
    displayName,
    role,
    department,
    exp,
  ].join("\n");
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

async function fillFormByTitle(page, title, values) {
  const form = page.locator("form.action-form", {
    has: page.getByRole("heading", { name: title }),
  });
  await expect(form).toBeVisible();
  for (const [name, value] of Object.entries(values)) {
    const field = form.locator(`[name="${name}"]`);
    await expect(field).toBeVisible();
    await field.fill(String(value));
  }
  await form.getByRole("button", { name: /^提交$/ }).click();
}

async function chooseFormOption(page, title, name) {
  const form = page.locator("form.action-form", {
    has: page.getByRole("heading", { name: title }),
  });
  await expect(form.locator(`select[name="${name}"]`)).toBeVisible();
  const value = await form.locator(`select[name="${name}"] option`).nth(1).getAttribute("value");
  if (!value) {
    throw new Error(`${title}.${name} has no selectable option`);
  }
  await form.locator(`select[name="${name}"]`).selectOption(value);
  return form;
}

async function waitForNotice(page, text) {
  await expect(page.locator(".status")).toContainText(text, { timeout: 15_000 });
}

async function login(page, username, password) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await expect(page.locator(".login-page")).toBeVisible();
  await page.getByLabel("用户名").fill(username);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: /账号密码登录/ }).click();
  await expect(page.locator(".app-shell")).toBeVisible({ timeout: 15_000 });
  await waitForNotice(page, "已连接后端 API");
}

async function uploadByLabel(page, label, filePath) {
  const input = page.locator(".upload-button", { hasText: label }).locator("input");
  await expect(input).toHaveCount(1);
  await input.setInputFiles(filePath);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  acceptDownloads: true,
});
const page = await context.newPage();

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await expect(page.locator(".login-page")).toBeVisible();
  await expect(page.getByLabel("用户名")).toBeVisible();
  await expect(page.getByLabel("密码")).toBeVisible();
  await expect(page.getByRole("button", { name: /账号密码登录/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /SSO/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /OAuth/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /使用 Passkey/ })).toBeVisible();

  const badOauth = await page.request.get(
    `${baseUrl}/api/v1/auth/oauth/callback`,
  );
  expect(badOauth.status()).toBe(400);
  expect(await badOauth.text()).toContain("Missing federated login field: username");

  const ssoResponse = await page.request.get(
    federatedUrl(
      "sso",
      `e2e_sso_${suffix}`,
      `e2e_sso_${suffix}@example.com`,
    ),
  );
  expect([200, 403]).toContain(ssoResponse.status());
  if (ssoResponse.status() === 200) {
    expect(await ssoResponse.text()).toContain("#session=");
  }

  const oauthResponse = await page.request.get(
    federatedUrl(
      "oauth",
      `e2e_oauth_${suffix}`,
      `e2e_oauth_${suffix}@example.com`,
    ),
  );
  expect([200, 403]).toContain(oauthResponse.status());
  if (oauthResponse.status() === 200) {
    expect(await oauthResponse.text()).toContain("#session=");
  }

  await login(page, adminUser, adminPassword);
  await expect(page.getByRole("button", { name: "用户管理" })).toBeVisible();

  const researcherUsername = `e2e_researcher_${suffix}`;
  const researcherPassword = `Researcher${suffix}Aa1!`;

  await fillFormByTitle(page, "创建法规", {
    title: `E2E 法规 ${suffix}`,
    regulation_type: "regulation",
    issuing_authority: "自动化安全办公室",
    effective_date: "2026-07-06",
    summary: "自动化验证法规创建",
  });
  await waitForNotice(page, "创建法规成功");

  await fillFormByTitle(page, "录入事故案例", {
    title: `E2E 事故 ${suffix}`,
    lab_name: "自动化实验室",
    occurred_on: "2026-07-06",
    severity: "medium",
    category: "用电安全",
    root_cause: "线路管理不规范",
    corrective_actions: "完成复查和整改",
  });
  await waitForNotice(page, "录入事故案例成功");

  await fillFormByTitle(page, "创建培训", {
    title: `E2E 培训 ${suffix}`,
    target_role: "researcher",
    status: "active",
    starts_on: "2026-07-06",
    exam_required_score: "80",
  });
  await waitForNotice(page, "创建培训成功");

  await fillFormByTitle(page, "登记设备", {
    asset_code: `E2E-${suffix}`,
    name: `E2E 设备 ${suffix}`,
    lab_name: "自动化实验室",
    status: "available",
    owner: "自动化管理员",
  });
  await waitForNotice(page, "登记设备成功");

  const userForm = page.locator("form.action-form", {
    has: page.getByRole("heading", { name: "创建用户" }),
  });
  await expect(userForm).toBeVisible();
  await userForm.locator('[name="username"]').fill(researcherUsername);
  await userForm.locator('[name="display_name"]').fill(`E2E 普通用户 ${suffix}`);
  await userForm.locator('[name="email"]').fill(`${researcherUsername}@example.com`);
  await userForm.locator('[name="department"]').fill("自动化实验室");
  await userForm.locator('[name="password"]').fill(researcherPassword);
  await userForm.locator('[name="role"]').selectOption("researcher");
  await userForm.locator('[name="auth_provider"]').selectOption("password");
  await userForm.getByRole("button", { name: /^提交$/ }).click();
  await waitForNotice(page, "创建用户成功");

  const bookingForm = await chooseFormOption(page, "预约设备", "equipment_id");
  await bookingForm.locator('[name="starts_at"]').fill("2026-07-07T10:00");
  await bookingForm.locator('[name="ends_at"]').fill("2026-07-07T11:00");
  await bookingForm.locator('[name="purpose"]').fill(`E2E 预约 ${suffix}`);
  await bookingForm.getByRole("button", { name: /^提交$/ }).click();
  await waitForNotice(page, "创建设备预约成功");

  const repairForm = await chooseFormOption(page, "提交报修", "equipment_id");
  await repairForm.locator('[name="description"]').fill(`E2E 报修 ${suffix}`);
  await repairForm.getByRole("button", { name: /^提交$/ }).click();
  await waitForNotice(page, "提交报修成功");

  const examForm = await chooseFormOption(page, "登记考核", "training_id");
  await examForm.locator('[name="score"]').fill("91");
  await examForm.getByRole("button", { name: /^提交$/ }).click();
  await waitForNotice(page, "登记考核成功");

  await page.getByRole("button", { name: /退出/ }).click();
  await expect(page.locator(".login-page")).toBeVisible();
  await login(page, researcherUsername, researcherPassword);
  await expect(page.getByRole("button", { name: "用户管理" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "统计分析" })).toHaveCount(0);
  await expect(page.getByText("我的实验室安全任务")).toBeVisible();

  await fillFormByTitle(page, "上报隐患", {
    title: `E2E 隐患 ${suffix}`,
    lab_name: "自动化实验室",
    category: "消防通道",
    description: "自动化验证隐患上报",
  });
  await waitForNotice(page, "上报隐患成功");

  await page.getByRole("button", { name: /责任认领/ }).last().click();
  await waitForNotice(page, "责任认领成功");

  const imagePath = join(tmpdir(), `lab-safety-e2e-${suffix}.png`);
  await writeFile(
    imagePath,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64",
    ),
  );
  await uploadByLabel(page, "上传问题照片", imagePath);
  await waitForNotice(page, "上传问题照片并上报隐患成功");
  await uploadByLabel(page, "上传整改照片", imagePath);
  await waitForNotice(page, "上传整改照片成功");

  console.log("E2E smoke passed");
} finally {
  await context.close();
  await browser.close();
}
