import { useEffect, useState } from "react";
import {
  api,
  type AuthMethods,
  type AuthSettings,
  type AuthSettingsPatch,
  type DeploymentSettings,
} from "../../api";

type SystemSettingsPanelProps = {
  language: "zh" | "en";
  onAuthMethodsChange: (methods: AuthMethods) => void;
};

export function SystemSettingsPanel({
  language,
  onAuthMethodsChange,
}: SystemSettingsPanelProps) {
  const [auth, setAuth] = useState<AuthSettings | null>(null);
  const [deployment, setDeployment] = useState<DeploymentSettings | null>(null);
  const [secret, setSecret] = useState("");
  const [clearSecret, setClearSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const isEn = language === "en";

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([api.authSettings(), api.deploymentSettings()])
      .then(([nextAuth, nextDeployment]) => {
        if (!active) return;
        setAuth(nextAuth);
        setDeployment(nextDeployment);
        setMessage("");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setAuthField = <K extends keyof AuthSettings>(
    field: K,
    value: AuthSettings[K],
  ) => setAuth((current) => (current ? { ...current, [field]: value } : current));

  const requestSecretClear = () => {
    const confirmed = window.confirm(
      isEn
        ? "Clear the stored federated login secret? SSO and OAuth must be disabled first."
        : "确认清除已保存的联邦登录密钥？请先停用 SSO 和 OAuth。",
    );
    if (confirmed) {
      setClearSecret(true);
      setSecret("");
    }
  };

  const save = async () => {
    if (!auth) return;
    const trimmedSecret = secret.trim();
    if (trimmedSecret && trimmedSecret.length < 32) {
      setMessage(
        isEn
          ? "Federated login secret must be at least 32 characters."
          : "联邦登录密钥至少需要 32 个字符。",
      );
      return;
    }
    setSaving(true);
    setMessage("");
    const payload: AuthSettingsPatch = {
      sso_enabled: auth.sso_enabled,
      sso_login_url: auth.sso_login_url?.trim() || null,
      oauth_enabled: auth.oauth_enabled,
      oauth_login_url: auth.oauth_login_url?.trim() || null,
      clear_federated_login_secret: clearSecret,
    };
    if (trimmedSecret) payload.federated_login_secret = trimmedSecret;
    try {
      const updated = await api.updateAuthSettings(payload);
      const methods = await api.authMethods();
      setAuth(updated);
      onAuthMethodsChange(methods);
      setSecret("");
      setClearSecret(false);
      setMessage(isEn ? "Authentication settings saved." : "认证设置已保存。 ");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-stone-500">{isEn ? "Loading settings…" : "正在加载设置…"}</p>;
  }

  return (
    <section className="space-y-6" data-testid="system-settings-panel">
      <div className="rounded-2xl border border-stone-200 bg-white/80 p-5 dark:border-stone-700 dark:bg-stone-900/60">
        <div className="mb-5">
          <h3 className="text-base font-semibold">{isEn ? "Identity gateway" : "身份网关"}</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {isEn
              ? "This is a signed identity-gateway integration. It is not a generic OAuth client configuration."
              : "这是签名身份网关集成，并非通用 OAuth 客户端配置。"}
          </p>
        </div>

        {auth ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <ProviderFields
              label="SSO"
              enabled={auth.sso_enabled}
              loginUrl={auth.sso_login_url ?? ""}
              callbackUrl={callbackUrl(deployment?.callback_paths.sso)}
              onEnabled={(enabled) => setAuthField("sso_enabled", enabled)}
              onLoginUrl={(value) => setAuthField("sso_login_url", value)}
              isEn={isEn}
            />
            <ProviderFields
              label="OAuth"
              enabled={auth.oauth_enabled}
              loginUrl={auth.oauth_login_url ?? ""}
              callbackUrl={callbackUrl(deployment?.callback_paths.oauth)}
              onEnabled={(enabled) => setAuthField("oauth_enabled", enabled)}
              onLoginUrl={(value) => setAuthField("oauth_login_url", value)}
              isEn={isEn}
            />

            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium" htmlFor="federated-login-secret">
                {isEn ? "Federated login secret" : "联邦登录密钥"}
              </label>
              <input
                id="federated-login-secret"
                data-testid="federated-login-secret"
                type="password"
                autoComplete="new-password"
                value={secret}
                onChange={(event) => {
                  setSecret(event.target.value);
                  if (event.target.value) setClearSecret(false);
                }}
                placeholder={
                  auth.federated_login_secret_configured
                    ? isEn
                      ? "Leave blank to keep the stored secret"
                      : "留空即保留已保存密钥"
                    : isEn
                      ? "At least 32 characters"
                      : "至少 32 个字符"
                }
                className="w-full rounded-xl border border-stone-300 bg-transparent px-3 py-2 text-sm dark:border-stone-700"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
                <span data-testid="secret-status">
                  {clearSecret
                    ? isEn
                      ? "Secret will be cleared on save"
                      : "保存时将清除密钥"
                    : auth.federated_login_secret_configured
                      ? isEn
                        ? "A secret is configured; it is never displayed."
                        : "密钥已配置，系统不会回显。"
                      : isEn
                        ? "No secret configured"
                        : "尚未配置密钥"}
                </span>
                <button
                  type="button"
                  onClick={requestSecretClear}
                  disabled={!auth.federated_login_secret_configured || clearSecret}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-red-700 disabled:opacity-40 dark:border-red-900 dark:text-red-300"
                >
                  {isEn ? "Clear stored secret" : "清除已保存密钥"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 lg:col-span-2">
              <button
                type="button"
                data-testid="save-auth-settings"
                disabled={saving}
                onClick={() => void save()}
                className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900"
              >
                {saving ? (isEn ? "Saving…" : "保存中…") : isEn ? "Save authentication settings" : "保存认证设置"}
              </button>
              {message ? <p role="status" className="text-sm text-stone-600 dark:text-stone-300">{message}</p> : null}
            </div>
          </div>
        ) : (
          <p role="alert" className="text-sm text-red-600">{message || (isEn ? "Settings unavailable" : "设置不可用")}</p>
        )}
      </div>

      {deployment ? <DeploymentCards settings={deployment} isEn={isEn} /> : null}
    </section>
  );
}

type ProviderFieldsProps = {
  label: string;
  enabled: boolean;
  loginUrl: string;
  callbackUrl: string;
  onEnabled: (enabled: boolean) => void;
  onLoginUrl: (value: string) => void;
  isEn: boolean;
};

function ProviderFields(props: ProviderFieldsProps) {
  const id = props.label.toLowerCase();
  return (
    <fieldset className="space-y-3 rounded-xl border border-stone-200 p-4 dark:border-stone-700">
      <label className="flex items-center justify-between gap-3 font-medium">
        <span>{props.label}</span>
        <input
          data-testid={`${id}-enabled`}
          type="checkbox"
          checked={props.enabled}
          onChange={(event) => props.onEnabled(event.target.checked)}
        />
      </label>
      <label className="block text-xs font-medium text-stone-500" htmlFor={`${id}-login-url`}>
        {props.isEn ? "Gateway login URL" : "网关登录 URL"}
      </label>
      <input
        id={`${id}-login-url`}
        data-testid={`${id}-login-url`}
        type="url"
        value={props.loginUrl}
        onChange={(event) => props.onLoginUrl(event.target.value)}
        className="w-full rounded-xl border border-stone-300 bg-transparent px-3 py-2 text-sm dark:border-stone-700"
      />
      <p className="break-all text-xs text-stone-500">
        {props.isEn ? "Callback URL: " : "回调 URL："}
        <code>{props.callbackUrl}</code>
      </p>
    </fieldset>
  );
}

function DeploymentCards({ settings, isEn }: { settings: DeploymentSettings; isEn: boolean }) {
  const rows = [
    ["App env", settings.app_env],
    ["Token TTL", `${settings.token_ttl_seconds}s`],
    ["WebAuthn RP ID", settings.webauthn_rp_id],
    ["WebAuthn origin", settings.webauthn_origin],
    ["CORS", settings.cors_allowed_origins.join(", ") || (isEn ? "Same origin" : "同源")],
    ["MCP", settings.mcp_enabled ? (isEn ? "Enabled" : "已启用") : isEn ? "Disabled" : "未启用"],
  ];
  return (
    <div className="rounded-2xl border border-stone-200 bg-white/80 p-5 dark:border-stone-700 dark:bg-stone-900/60">
      <h3 className="text-base font-semibold">{isEn ? "Deployment settings" : "部署设置"}</h3>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        {isEn
          ? "These values are read-only. Deployment-level changes require environment updates and a service restart."
          : "以下配置只读；部署级调整需要修改环境变量并重启服务。"}
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-stone-100/70 p-3 dark:bg-stone-800/70">
            <dt className="text-xs font-medium text-stone-500">{label}</dt>
            <dd className="mt-1 break-all text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function callbackUrl(path?: string) {
  if (!path) return "—";
  return new URL(path, window.location.origin).toString();
}
