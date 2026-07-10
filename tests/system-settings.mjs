import { chromium, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4177";
const session = {
  access_token: "mock-system-admin-token",
  token_type: "bearer",
  expires_in: 3600,
  user: {
    id: 1,
    username: "settings-admin",
    display_name: "Settings Admin",
    email: "settings-admin@example.com",
    role: "system_admin",
    auth_provider: "password",
  },
};

let authSettings = {
  sso_enabled: false,
  sso_login_url: null,
  oauth_enabled: false,
  oauth_login_url: null,
  federated_login_secret_configured: false,
};
let authMethods = {
  password: true,
  sso: false,
  oauth: false,
  sso_login_url: null,
  oauth_login_url: null,
};
let patchPayload = null;
let authMethodsRequests = 0;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
await context.addInitScript((value) => {
  localStorage.setItem("lab-safety-session", JSON.stringify(value));
}, session);
const page = await context.newPage();
const pageErrors = [];
const consoleErrors = [];
const consoleWarnings = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
  if (message.type() === "warning") consoleWarnings.push(message.text());
});

await page.route("**/api/v1/**", async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname.replace("/api/v1", "");
  const method = request.method();
  let body;

  if (path === "/settings/auth" && method === "GET") body = authSettings;
  else if (path === "/settings/auth" && method === "PATCH") {
    patchPayload = request.postDataJSON();
    authSettings = {
      sso_enabled: patchPayload.sso_enabled,
      sso_login_url: patchPayload.sso_login_url,
      oauth_enabled: patchPayload.oauth_enabled,
      oauth_login_url: patchPayload.oauth_login_url,
      federated_login_secret_configured: true,
    };
    authMethods = {
      password: true,
      sso: authSettings.sso_enabled,
      oauth: authSettings.oauth_enabled,
      sso_login_url: authSettings.sso_login_url,
      oauth_login_url: authSettings.oauth_login_url,
    };
    body = authSettings;
  } else if (path === "/settings/deployment") {
    body = {
      app_env: "production",
      token_ttl_seconds: 3600,
      webauthn_rp_id: "labs.example.com",
      webauthn_origin: "https://labs.example.com",
      cors_allowed_origins: ["https://admin.example.com"],
      mcp_enabled: true,
      callback_paths: {
        sso: "/api/v1/auth/sso/callback",
        oauth: "/api/v1/auth/oauth/callback",
      },
    };
  } else if (path === "/auth/methods") {
    authMethodsRequests += 1;
    body = authMethods;
  } else if (path === "/auth/me") body = session.user;
  else if (path === "/auth/my-labs") body = [];
  else if (path === "/settings/login-carousel") body = { zh: [], en: [] };
  else if (path === "/analytics/dashboard") {
    body = {
      regulation_count: 0,
      incident_count: 0,
      training_count: 0,
      equipment_count: 0,
      open_repair_count: 0,
      exam_pass_rate: 0,
    };
  } else if (path === "/analytics/incidents") body = { by_category: [], by_severity: [] };
  else if (path === "/analytics/hazards") body = { by_status: [], by_category: [] };
  else if (path === "/analytics/regulations") body = { by_type: [], by_authority: [] };
  else body = [];

  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
});

try {
  await page.goto(`${baseUrl}/system/config`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("system-settings-panel")).toBeVisible();
  await expect(page.getByText("这是签名身份网关集成")).toBeVisible();
  await expect(page.getByText("部署设置")).toBeVisible();
  await expect(page.getByText("labs.example.com", { exact: true })).toBeVisible();
  await expect(page.getByTestId("federated-login-secret")).toHaveValue("");

  await page.getByTestId("sso-enabled").check();
  await page.getByTestId("sso-login-url").fill("https://idp.example.com/sso/login");
  await page.getByTestId("federated-login-secret").fill("playwright-federated-secret-32-characters");
  await page.getByTestId("save-auth-settings").click();
  await expect(page.getByRole("status")).toContainText("认证设置已保存");
  await expect(page.getByTestId("federated-login-secret")).toHaveValue("");
  await expect(page.getByTestId("secret-status")).toContainText("密钥已配置，系统不会回显");

  expect(patchPayload).toEqual({
    sso_enabled: true,
    sso_login_url: "https://idp.example.com/sso/login",
    oauth_enabled: false,
    oauth_login_url: null,
    clear_federated_login_secret: false,
    federated_login_secret: "playwright-federated-secret-32-characters",
  });
  expect(authMethodsRequests).toBeGreaterThanOrEqual(2);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(consoleWarnings).toEqual([]);

  console.log(
    JSON.stringify({
      patchPayload,
      secretInputAfterSave: await page.getByTestId("federated-login-secret").inputValue(),
      authMethodsRequests,
      pageErrors,
      consoleErrors,
      consoleWarnings,
      syntaxErrors: [...pageErrors, ...consoleErrors].filter((message) =>
        /syntax|unexpected token/i.test(message),
      ),
    }),
  );
} finally {
  await browser.close();
}
