import { api, type AuthSession } from "../api";
import { creationOptionsFromServer, publicKeyCredentialToJson } from "./auth";

export async function bindPasskey(session: AuthSession | null) {
  if (!session?.user) throw new Error("请先登录后再绑定 Passkey");
  if (!window.PublicKeyCredential) {
    throw new Error("当前浏览器不支持 Passkey");
  }
  const challenge = await api.passkeyRegisterStart();
  const credential = await navigator.credentials.create({
    publicKey: creationOptionsFromServer(challenge.options),
  });
  if (!credential) throw new Error("Passkey 绑定已取消");
  return api.passkeyRegisterFinish(
    challenge.challenge_id,
    publicKeyCredentialToJson(credential),
    `${session.user.display_name} Passkey`,
  );
}
