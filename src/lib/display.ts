export function roleLabel(role: string) {
  switch (role) {
    case "system_admin":
      return "系统管理员";
    case "lab_admin":
      return "实验室管理员";
    case "lab_member":
      return "实验室成员";
    case "visitor":
      return "访客";
    default:
      return role;
  }
}

export function authProviderLabel(provider: string) {
  switch (provider) {
    case "password":
      return "账号密码";
    case "sso":
      return "SSO";
    case "oauth":
      return "OAuth";
    default:
      return provider;
  }
}

export function tableCellClass(cell: string, cellIndex: number) {
  if (cell === "启用") {
    return "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  }
  if (cell === "停用") {
    return "inline-flex items-center rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-300";
  }
  return cellIndex === 0
    ? "font-medium text-stone-800 dark:text-stone-200"
    : "text-stone-500 dark:text-stone-400";
}
