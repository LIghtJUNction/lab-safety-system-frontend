import { chromium, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = (process.env.E2E_BASE_URL ?? "http://localhost:5174").replace(/\/$/, "");
const parsedBaseUrl = new URL(baseUrl);
const allowedHosts = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
if (!allowedHosts.has(parsedBaseUrl.hostname)) {
  throw new Error(`Refusing product-flow against non-local host: ${parsedBaseUrl.hostname}`);
}

const adminUser = process.env.E2E_ADMIN_USER ?? "cli_super";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "StrongerAdmin123!";
const suffix = Date.now().toString(36);
const reviewerFailures = [];

async function recordDetailField(page, label, expected, context) {
  const term = page.locator("dt").filter({ hasText: label });
  if ((await term.count()) !== 1) {
    reviewerFailures.push(`${context}: missing detail field ${label}`);
    return;
  }
  const actual = (await term.locator("xpath=following-sibling::dd[1]").textContent())?.trim();
  if (actual !== String(expected)) {
    reviewerFailures.push(`${context}: expected ${label}=${expected}, got ${actual}`);
  }
}

async function clickRowRightBlank(page, row, expectedUrl, context) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    if (page.url() === expectedUrl) return;
    try {
      const currentRow = row.first();
      await expect(currentRow).toBeVisible();
      await currentRow.scrollIntoViewIfNeeded();
      const box = await row.first().boundingBox();
      if (!box) throw new Error(`${context}: row has no bounding box`);
      await page.mouse.click(box.x + box.width - 8, box.y + box.height / 2);
      await expect(page).toHaveURL(expectedUrl, { timeout: 1_500 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 3) throw error;
    }
    await page.waitForTimeout(100 * attempt);
  }
  throw lastError ?? new Error(`${context}: row click did not navigate`);
}

async function activateRowLinkWithKeyboard(page, link, expectedUrl, context) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    if (page.url() === expectedUrl) return;
    try {
      const currentLink = link.first();
      await expect(currentLink).toBeVisible();
      await currentLink.scrollIntoViewIfNeeded();
      await currentLink.focus();
      await expect(currentLink).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(expectedUrl, { timeout: 1_500 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 3) throw error;
    }
    await page.waitForTimeout(100 * attempt);
  }
  throw lastError ?? new Error(`${context}: keyboard activation did not navigate`);
}

async function waitForLoginScreen(page) {
  const username = page.locator('input:not([type="password"])').first();
  if (!(await username.isVisible().catch(() => false))) {
    const openLogin = page.getByRole("button", { name: /向上滑动或点击登录|点击登录/ });
    if (await openLogin.isVisible().catch(() => false)) await openLogin.click();
  }
  await expect(username).toBeVisible();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
}

async function login(page, username, password) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await waitForLoginScreen(page);
  await page.locator('input:not([type="password"])').first().fill(username);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /账号密码登录|Password login/ }).click();
  await expect(page.getByRole("button", { name: /退出|Sign out/ })).toBeVisible({ timeout: 15_000 });
  await waitForNotice(page, "已连接后端 API");
}

async function logout(page) {
  await page.getByRole("button", { name: /退出|Sign out/ }).click();
  await waitForLoginScreen(page);
}

async function authHeaders(page) {
  const token = await page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem("lab-safety-session") || "null");
    return session?.access_token;
  });
  if (!token) throw new Error("Missing authenticated session token");
  return { Authorization: `Bearer ${token}` };
}

async function readApi(page, path) {
  const response = await page.request.get(`${baseUrl}/api/v1${path}`, {
    headers: await authHeaders(page),
  });
  if (!response.ok()) throw new Error(`GET ${path}: ${await response.text()}`);
  return response.json();
}

async function waitForNotice(page, text) {
  await expect(page.locator(".status")).toContainText(text, { timeout: 15_000 });
}

async function createLabThroughUi(page) {
  const code = `PRODUCT-${suffix}`;
  await page.goto(`${baseUrl}/system/labs`, { waitUntil: "domcontentloaded" });
  const form = page.locator("form.action-form").filter({ has: page.locator('[name="code"]') });
  await expect(form).toBeVisible();
  await form.locator('[name="code"]').fill(code);
  await form.locator('[name="name"]').fill(`产品流实验室 ${suffix}`);
  await form.locator('[name="location"]').fill("本机验收环境");
  await form.locator('[name="department"]').fill("产品验收");
  await form.locator('[name="status"]').selectOption("active");
  await form.getByRole("button", { name: /^提交$|^Submit$/ }).click();
  await waitForNotice(page, "创建实验室成功");

  const labs = await readApi(page, `/labs?q=${encodeURIComponent(code)}`);
  const lab = labs.find((item) => item.code === code);
  if (!lab) throw new Error(`Created lab ${code} was not returned by the read API`);
  return lab;
}

async function regulationUploadAndDetailFlow(page, lab) {
  const title = `产品流法规 ${suffix}`;
  const filePath = join(tmpdir(), `product-regulation-${suffix}.txt`);
  await writeFile(filePath, `Regulation attachment ${suffix}\n`, "utf8");
  await page.goto(`${baseUrl}/labs/${lab.id}/regulations`, { waitUntil: "domcontentloaded" });

  const form = page
    .locator("form.action-form")
    .filter({ has: page.getByRole("heading", { name: /创建法规|Create regulation/ }) });
  await expect(form).toBeVisible();
  const fileInput = form.locator('input[type="file"][name="file"]');
  await expect(fileInput).toHaveCount(1);
  await fileInput.setInputFiles(filePath);
  await form.locator('[name="title"]').fill(title);
  await form.locator('[name="regulation_type"]').selectOption("regulation");
  await form.locator('[name="issuing_authority"]').fill("产品验收办公室");
  await form.locator('[name="effective_date"]').fill("2026-07-13");
  await form.locator('[name="summary"]').fill("通过同一表单上传并关联附件");
  await form.getByRole("button", { name: /^提交$|^Submit$/ }).click();
  await waitForNotice(page, "创建法规成功");

  const regulations = await readApi(page, `/regulations?q=${encodeURIComponent(title)}`);
  const regulation = regulations.find((item) => item.title === title);
  if (!regulation?.file_url) throw new Error("Created regulation is missing its uploaded file_url");

  const listUrl = `${baseUrl}/labs/${lab.id}/regulations`;
  const detailUrl = `${listUrl}/${regulation.id}`;
  const regulationRow = page.locator(".data-row").filter({ hasText: title });
  await clickRowRightBlank(page, regulationRow, detailUrl, "regulation row");
  await page.goto(listUrl, { waitUntil: "domcontentloaded" });
  const detailLink = page.getByRole("link", { name: new RegExp(title) }).first();
  await activateRowLinkWithKeyboard(page, detailLink, detailUrl, "regulation row link");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await recordDetailField(page, /记录 ID|Record ID/, regulation.id, "regulation");
  await recordDetailField(page, /创建时间|Created at/, regulation.created_at, "regulation");
  await expect(page.getByRole("link", { name: /附件|Attachment/ })).toHaveAttribute(
    "href",
    regulation.file_url,
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await waitForNotice(page, "已连接后端 API");
}

async function incidentDetailFlow(page, lab) {
  const title = `产品流事故 ${suffix}`;
  await page.goto(`${baseUrl}/labs/${lab.id}/incidents`, { waitUntil: "domcontentloaded" });

  const form = page
    .locator("form.action-form")
    .filter({ has: page.getByRole("heading", { name: /录入事故案例|Record incident case/ }) });
  await expect(form).toBeVisible();
  await form.locator('[name="lab_id"]').selectOption(String(lab.id));
  await form.locator('[name="title"]').fill(title);
  await form.locator('[name="occurred_on"]').fill("2026-07-12");
  await form.locator('[name="severity"]').selectOption("high");
  await form.locator('[name="category"]').fill("产品验收事故");
  await form.locator('[name="root_cause"]').fill("事故详情回归根因");
  await form.locator('[name="corrective_actions"]').fill("事故详情回归整改措施");
  await form.getByRole("button", { name: /^提交$|^Submit$/ }).click();
  await waitForNotice(page, "录入事故案例成功");

  const incidents = await readApi(
    page,
    `/incidents?q=${encodeURIComponent(title)}&lab_id=${lab.id}`,
  );
  const incident = incidents.find((item) => item.title === title);
  if (!incident) throw new Error(`Created incident ${title} was not returned by the read API`);

  const listUrl = `${baseUrl}/labs/${lab.id}/incidents`;
  const detailUrl = `${listUrl}/${incident.id}`;
  const incidentRow = page.locator(".data-row").filter({ hasText: title });
  await clickRowRightBlank(page, incidentRow, detailUrl, "incident row");
  await page.goto(listUrl, { waitUntil: "domcontentloaded" });
  const detailLink = page.getByRole("link", { name: new RegExp(title) }).first();
  await activateRowLinkWithKeyboard(page, detailLink, detailUrl, "incident row link");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await recordDetailField(page, /记录 ID|Record ID/, incident.id, "incident");
  await recordDetailField(page, /实验室 ID|Lab ID/, incident.lab_id, "incident");
  await recordDetailField(page, /创建时间|Created at/, incident.created_at, "incident");
  await expect(page.getByText("事故详情回归根因", { exact: true })).toBeVisible();
  await expect(page.getByText("事故详情回归整改措施", { exact: true })).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await waitForNotice(page, "已连接后端 API");
}

async function hazardDetailFlow(page, lab) {
  const title = `产品流隐患 ${suffix}`;
  const issuePath = join(tmpdir(), `product-issue-${suffix}.png`);
  const remediationPath = join(tmpdir(), `product-remediation-${suffix}.png`);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  await writeFile(issuePath, png);
  await writeFile(
    remediationPath,
    png,
  );
  await page.goto(`${baseUrl}/labs/${lab.id}/hazards`, { waitUntil: "domcontentloaded" });

  const form = page
    .locator("form.action-form")
    .filter({ has: page.getByRole("heading", { name: /上报隐患|Report hazard/ }) });
  await expect(form).toBeVisible();
  const issueUpload = page
    .locator("label.upload-button")
    .filter({ hasText: /上传问题照片|Upload issue photo/ });
  await issueUpload.locator('input[type="file"]').setInputFiles(issuePath);
  await waitForNotice(page, "上传问题照片成功");
  const issueNotice = (await page.locator(".status").textContent()) ?? "";
  const issueUrl = issueNotice.match(/(\/uploads\/hazards\/issue\/\S+)/)?.[1];
  if (!issueUrl) throw new Error(`Issue upload notice is missing URL: ${issueNotice}`);
  await form.locator('[name="lab_id"]').selectOption(String(lab.id));
  await form.locator('[name="title"]').fill(title);
  await form.locator('[name="category"]').fill("产品验收隐患");
  await form.locator('[name="description"]').fill("隐患详情与状态历史回归");
  await form.locator('[name="issue_photo_url"]').fill(issueUrl);
  await form.getByRole("button", { name: /^提交$|^Submit$/ }).click();
  await waitForNotice(page, "上报隐患成功");

  const hazards = await readApi(
    page,
    `/hazards?q=${encodeURIComponent(title)}&lab_id=${lab.id}`,
  );
  const hazard = hazards.find((item) => item.title === title);
  if (!hazard) throw new Error(`Created hazard ${title} was not returned by the read API`);

  const hazardRow = page.locator(".data-row").filter({ hasText: title });
  await expect(page).toHaveURL(`${baseUrl}/labs/${lab.id}/hazards`);
  await hazardRow.getByRole("button", { name: /认领|Claim/ }).click();
  await waitForNotice(page, "责任认领成功");
  await expect(page).toHaveURL(`${baseUrl}/labs/${lab.id}/hazards`);

  const remediationUpload = page
    .locator("label.upload-button")
    .filter({ hasText: /上传整改照片|Upload remediation photo/ });
  await remediationUpload.locator('input[type="file"]').setInputFiles(remediationPath);
  await waitForNotice(page, "上传整改照片成功");

  await hazardRow.getByRole("button", { name: /闭环|Close/ }).click();
  await waitForNotice(page, "关闭隐患成功");

  const closedHazard = await readApi(page, `/hazards/${hazard.id}`);
  expect(closedHazard.status).toBe("closed");
  if (!closedHazard.remediation_photo_url) {
    throw new Error("Closed hazard is missing remediation evidence");
  }

  const detailLink = page.getByRole("link", { name: new RegExp(title) }).first();
  await expect(detailLink).toBeVisible();
  await detailLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`${baseUrl}/labs/${lab.id}/hazards/${hazard.id}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await recordDetailField(page, /记录 ID|Record ID/, closedHazard.id, "hazard");
  await recordDetailField(page, /实验室 ID|Lab ID/, closedHazard.lab_id, "hazard");
  await recordDetailField(page, /上报人 ID|Reported by/, closedHazard.reported_by, "hazard");
  await recordDetailField(page, /创建时间|Created at/, closedHazard.created_at, "hazard");
  await expect(page.getByText("隐患详情与状态历史回归", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /状态历史|Status history/ })).toBeVisible();
  for (const status of ["open", "claimed", "remediation_submitted", "closed"]) {
    await expect(page.getByText(status, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /整改证据|Remediation evidence/ })).toHaveAttribute(
    "href",
    closedHazard.remediation_photo_url,
  );
  for (const [name, src] of [
    [/问题照片|Issue photo/, closedHazard.issue_photo_url],
    [/整改照片|Remediation photo/, closedHazard.remediation_photo_url],
  ]) {
    const image = page.getByRole("img", { name });
    if ((await image.count()) !== 1) {
      reviewerFailures.push(`hazard: missing visible image ${name}`);
    } else if ((await image.getAttribute("src")) !== src) {
      reviewerFailures.push(`hazard: image ${name} has wrong src`);
    }
  }
  const transitions = await page.locator(".history-transition").allTextContents();
  for (const transition of ["open → claimed"]) {
    if (!transitions.map((value) => value.trim()).includes(transition)) {
      reviewerFailures.push(`hazard history: missing ${transition}`);
    }
  }
  await expect(page.getByRole("button", { name: /撤回闭环|Reopen hazard/ })).toBeVisible();
  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    await dialog.accept();
  });
  await page.getByRole("button", { name: /撤回闭环|Reopen hazard/ }).click();
  await waitForNotice(page, "撤回闭环成功");
  await expect(page.locator("article header p")).toHaveText("remediation_submitted");
  const reopenedTransitions = await page.locator(".history-transition").allTextContents();
  if (!reopenedTransitions.map((value) => value.trim()).includes("closed → remediation_submitted")) {
    reviewerFailures.push("hazard history: missing closed → remediation_submitted");
  }
  await expect(page.getByRole("button", { name: /撤回闭环|Reopen hazard/ })).toHaveCount(0);
  const reopenedHazard = await readApi(page, `/hazards/${hazard.id}`);
  expect(reopenedHazard.status).toBe("remediation_submitted");
  expect(reopenedHazard.remediation_photo_url).toBe(closedHazard.remediation_photo_url);
  const reopenedHistory = await readApi(page, `/hazards/${hazard.id}/history`);
  expect(reopenedHistory.map((event) => event.to_status)).toEqual([
    "open",
    "claimed",
    "remediation_submitted",
    "closed",
    "remediation_submitted",
  ]);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await waitForNotice(page, "已连接后端 API");
  return { id: hazard.id, title };
}

async function createRoleUsersThroughUi(page, lab) {
  const password = "RoleProduct123!";
  const roles = ["lab_admin", "lab_member", "visitor"];
  const created = {};
  await page.goto(`${baseUrl}/system/users`, { waitUntil: "domcontentloaded" });

  const form = page
    .locator("form.action-form")
    .filter({ has: page.getByRole("heading", { name: /创建用户|Create user/ }) });
  await expect(form).toBeVisible();

  for (const role of roles) {
    const username = `product_${role}_${suffix}`;
    await form.locator('[name="username"]').fill(username);
    await form.locator('[name="display_name"]').fill(`产品流 ${role} ${suffix}`);
    await form.locator('[name="email"]').fill(`${username}@example.com`);
    await form.locator('[name="lab_role"]').selectOption(role);
    await form.locator('[name="lab_id"]').selectOption(String(lab.id));
    await form.locator('[name="auth_provider"]').selectOption("password");
    await form.locator('[name="password"]').fill(password);
    await form.getByRole("button", { name: /^提交$|^Submit$/ }).click();
    await waitForNotice(page, "创建用户成功");

    const users = await readApi(page, "/users");
    const user = users.find((item) => item.username === username);
    if (!user) throw new Error(`Created ${role} ${username} was not returned by the read API`);
    created[role] = { ...user, password };
  }

  const memberships = await readApi(page, `/labs/${lab.id}/users`);
  for (const role of roles) {
    const linked = memberships.find((item) => item.user_id === created[role].id);
    expect(linked?.lab_role).toBe(role);
  }
  return created;
}

async function labAdminTrainingFlow(page, lab, labAdmin) {
  await logout(page);
  await login(page, labAdmin.username, labAdmin.password);
  await page.goto(`${baseUrl}/labs/${lab.id}/trainings`, { waitUntil: "domcontentloaded" });

  const title = `产品流培训 ${suffix}`;
  const form = page
    .locator("form.action-form")
    .filter({ has: page.getByRole("heading", { name: /创建培训|Create training/ }) });
  await expect(form).toBeVisible();
  await form.locator('[name="title"]').fill(title);
  await form.locator('[name="target_role"]').selectOption("lab_member");
  await form.locator('[name="status"]').selectOption("active");
  await form.locator('[name="starts_on"]').fill("2026-07-14");
  await form.locator('[name="exam_required_score"]').fill("85");
  await form.getByRole("button", { name: /^提交$|^Submit$/ }).click();
  await waitForNotice(page, "创建培训成功");

  const trainings = await readApi(page, `/trainings?lab_id=${lab.id}`);
  const training = trainings.find((item) => item.title === title);
  if (!training) throw new Error(`Created training ${title} was not returned by the read API`);
  expect(training.lab_id).toBe(lab.id);
  await expect(page.locator(".data-row").filter({ hasText: title })).toBeVisible();
}

async function roleVisibilityFlow(page, lab, roleUsers, hazard) {
  await logout(page);
  await login(page, roleUsers.lab_member.username, roleUsers.lab_member.password);
  await page.goto(`${baseUrl}/labs/${lab.id}/overview`, { waitUntil: "domcontentloaded" });
  const memberHazardAlerts = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /隐患警报|Hazard alerts/ }) });
  await expect(memberHazardAlerts.getByText(hazard.title, { exact: true })).toBeVisible();
  await expect(
    memberHazardAlerts.getByRole("button", { name: /确认安全|Confirm safe/ }),
  ).toHaveCount(0);

  await logout(page);
  await login(page, roleUsers.lab_admin.username, roleUsers.lab_admin.password);
  await page.goto(`${baseUrl}/labs/${lab.id}/overview`, { waitUntil: "domcontentloaded" });
  const managerHazardAlerts = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /隐患警报|Hazard alerts/ }) });
  await expect(managerHazardAlerts.getByText(hazard.title, { exact: true })).toBeVisible();
  await expect(
    managerHazardAlerts.getByRole("button", { name: /确认安全|Confirm safe/ }),
  ).toBeVisible();
  await page.goto(`${baseUrl}/labs/${lab.id}/hazards`, { waitUntil: "domcontentloaded" });
  const adminHazardRow = page.locator(".data-row").filter({ hasText: hazard.title });
  await expect(adminHazardRow.getByRole("button", { name: /闭环|Close/ })).toBeVisible();
  await adminHazardRow.getByRole("button", { name: /闭环|Close/ }).click();
  await waitForNotice(page, "关闭隐患成功");
  await page.goto(`${baseUrl}/labs/${lab.id}/hazards/${hazard.id}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("button", { name: /撤回闭环|Reopen hazard/ })).toBeVisible();

  await logout(page);
  await login(page, roleUsers.lab_member.username, roleUsers.lab_member.password);
  const memberNav = page.getByRole("complementary");
  await expect(memberNav.getByRole("button", { name: /隐患管理|Hazards/ })).toBeVisible();
  await expect(memberNav.getByRole("button", { name: /培训考核|Training/ })).toBeVisible();
  await expect(memberNav.getByRole("button", { name: /用户管理|Users/ })).toHaveCount(0);
  await page.goto(`${baseUrl}/labs/${lab.id}/hazards`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('form[data-action="hazard-report"]')).toBeVisible();
  const memberHazardRow = page.locator(".data-row").filter({ hasText: hazard.title });
  await expect(memberHazardRow.getByRole("button", { name: /闭环|Close/ })).toHaveCount(0);
  await page.goto(`${baseUrl}/labs/${lab.id}/hazards/${hazard.id}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("button", { name: /撤回闭环|Reopen hazard/ })).toHaveCount(0);

  await logout(page);
  await login(page, roleUsers.visitor.username, roleUsers.visitor.password);
  const visitorNav = page.getByRole("complementary");
  await expect(visitorNav.getByRole("button", { name: /隐患管理|Hazards/ })).toBeVisible();
  await expect(visitorNav.getByRole("button", { name: /培训考核|Training/ })).toHaveCount(0);
  await expect(visitorNav.getByRole("button", { name: /统计分析|Analytics/ })).toHaveCount(0);
  await page.goto(`${baseUrl}/labs/${lab.id}/hazards`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('form[data-action="hazard-report"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: /责任认领|Claim responsibility/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /上传问题照片|Upload issue photo/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /上传整改照片|Upload remediation photo/ })).toHaveCount(0);
  const visitorHazardRow = page.locator(".data-row").filter({ hasText: hazard.title });
  await expect(visitorHazardRow.locator(".row-actions button")).toHaveCount(0);
  await page.goto(`${baseUrl}/labs/${lab.id}/hazards/${hazard.id}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { name: hazard.title })).toBeVisible();
  await expect(page.getByRole("button", { name: /撤回闭环|Reopen hazard/ })).toHaveCount(0);

  for (const [tab, formTitle] of [
    ["trainings", /登记考核|Record exam result/],
    ["bookings", /预约设备|Book equipment/],
    ["repairs", /提交报修|Submit repair ticket/],
  ]) {
    await page.goto(`${baseUrl}/labs/${lab.id}/${tab}`, { waitUntil: "domcontentloaded" });
    await waitForNotice(page, "已连接后端 API");
    const writeForm = page
      .locator("form.action-form")
      .filter({ has: page.getByRole("heading", { name: formTitle }) });
    if ((await writeForm.count()) !== 0) {
      reviewerFailures.push(`visitor: ${tab} direct route exposes write form`);
    }
    if ((await page.locator(".quick-actions-wrap").count()) !== 0) {
      reviewerFailures.push(`visitor: ${tab} direct route renders empty/action shell`);
    }
  }
}

async function expectAnalyticsPanel(page, title, expectedBuckets) {
  const panel = page
    .locator("section.analysis")
    .filter({ has: page.getByRole("heading", { name: title }) });
  await expect(panel).toBeVisible();
  await expect
    .poll(() =>
      panel.locator(".bar-line").evaluateAll((rows) =>
        rows.map((row) => ({
          name: row.querySelector("span")?.textContent?.trim() ?? "",
          count: Number(row.querySelector("strong")?.textContent?.trim() ?? "NaN"),
        })),
      ),
    )
    .toEqual(expectedBuckets);
}

async function analyticsConsistencyFlow(page, lab, labAdmin) {
  await logout(page);
  await login(page, labAdmin.username, labAdmin.password);
  const [incidents, hazards, regulations] = await Promise.all([
    readApi(page, `/analytics/incidents?lab_id=${lab.id}`),
    readApi(page, `/analytics/hazards?lab_id=${lab.id}`),
    readApi(page, "/analytics/regulations"),
  ]);
  await page.goto(`${baseUrl}/labs/${lab.id}/analytics`, { waitUntil: "domcontentloaded" });
  await expectAnalyticsPanel(page, /事故案例分析|Incident analysis/, incidents.by_category);
  await expectAnalyticsPanel(page, /隐患状态分析|Hazard status analysis/, hazards.by_status);
  await expectAnalyticsPanel(page, /隐患分类分析|Hazard category analysis/, hazards.by_category);
  await expectAnalyticsPanel(page, /法规统计|Regulation statistics/, regulations.by_type);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await context.newPage();
const pageErrors = [];
const responseErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 400) {
    responseErrors.push(
      `${response.status()} ${response.request().method()} ${response.url()}`,
    );
  }
});

try {
  await login(page, adminUser, adminPassword);
  const lab = await createLabThroughUi(page);
  await regulationUploadAndDetailFlow(page, lab);
  await incidentDetailFlow(page, lab);
  const hazard = await hazardDetailFlow(page, lab);
  const roleUsers = await createRoleUsersThroughUi(page, lab);
  await labAdminTrainingFlow(page, lab, roleUsers.lab_admin);
  await roleVisibilityFlow(page, lab, roleUsers, hazard);
  await analyticsConsistencyFlow(page, lab, roleUsers.lab_admin);
  expect(pageErrors).toEqual([]);
  expect(reviewerFailures).toEqual([]);
  console.log("Product flow passed");
} catch (error) {
  console.error("Recent failed HTTP responses:", responseErrors.slice(-20));
  throw error;
} finally {
  await context.close();
  await browser.close();
}
