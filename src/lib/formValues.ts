import type { UserCreate } from "../api";
import { validateStrongPassword } from "./auth";

export function value(form: FormData, key: string) {
  const raw = form.get(key)?.toString().trim();
  if (!raw) throw new Error(`${key} 不能为空`);
  return raw;
}

export function optionalValue(form: FormData, key: string) {
  const raw = form.get(key)?.toString().trim();
  return raw || null;
}

export function numberValue(form: FormData, key: string) {
  const raw = Number(value(form, key));
  if (!Number.isFinite(raw)) throw new Error(`${key} 必须是数字`);
  return raw;
}

export function datetimeValue(form: FormData, key: string) {
  return new Date(value(form, key)).toISOString();
}

export function userCreateValue(form: FormData): UserCreate {
  const authProvider = value(
    form,
    "auth_provider",
  ) as UserCreate["auth_provider"];
  const password = optionalValue(form, "password") ?? undefined;
  if (authProvider === "password") {
    if (!password) throw new Error("password 不能为空");
    if (!validateStrongPassword(password)) {
      throw new Error("密码至少 12 位，并包含大小写字母、数字和符号");
    }
  }

  const labRole = value(form, "lab_role");
  const globalRole: UserCreate["role"] = labRole === "visitor" ? "visitor" : "lab_member";
  return {
    username: value(form, "username"),
    display_name: value(form, "display_name"),
    email: value(form, "email"),
    role: globalRole,
    auth_provider: authProvider,
    department: optionalValue(form, "department"),
    password,
  };
}
