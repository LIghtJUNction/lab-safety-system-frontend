import { api, AuthSession } from "../api";
import { SESSION_KEY } from "./constants";

export function validateStrongPassword(password: string) {
  if (password.length < 12) return false;
  return (
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function base64UrlToBuffer(value: string) {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(window.atob(padded), (char) => char.charCodeAt(0))
    .buffer;
}

function bufferToBase64Url(value: ArrayBuffer) {
  const bytes = new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function credentialToJson(value: unknown): unknown {
  if (value instanceof ArrayBuffer) return bufferToBase64Url(value);
  if (ArrayBuffer.isView(value)) {
    return bufferToBase64Url(
      new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice()
        .buffer,
    );
  }
  if (
    typeof AuthenticatorAttestationResponse !== "undefined" &&
    value instanceof AuthenticatorAttestationResponse
  ) {
    return {
      clientDataJSON: bufferToBase64Url(value.clientDataJSON),
      attestationObject: bufferToBase64Url(value.attestationObject),
      transports: value.getTransports?.() ?? [],
    };
  }
  if (
    typeof AuthenticatorAssertionResponse !== "undefined" &&
    value instanceof AuthenticatorAssertionResponse
  ) {
    return {
      clientDataJSON: bufferToBase64Url(value.clientDataJSON),
      authenticatorData: bufferToBase64Url(value.authenticatorData),
      signature: bufferToBase64Url(value.signature),
      userHandle: value.userHandle ? bufferToBase64Url(value.userHandle) : null,
    };
  }
  if (Array.isArray(value)) return value.map(credentialToJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        credentialToJson(entry),
      ]),
    );
  }
  return value;
}

export function publicKeyCredentialToJson(credential: Credential) {
  const publicKey = credential as PublicKeyCredential;
  return credentialToJson({
    id: publicKey.id,
    rawId: publicKey.rawId,
    type: publicKey.type,
    response: publicKey.response,
    clientExtensionResults: publicKey.getClientExtensionResults(),
  });
}

type PublicKeyEnvelope<T> = T | { publicKey: T };

function unwrapPublicKeyOptions<T>(options: PublicKeyEnvelope<T>): T {
  if (
    options &&
    typeof options === "object" &&
    "publicKey" in options &&
    options.publicKey
  ) {
    return options.publicKey as T;
  }
  return options as T;
}

export function creationOptionsFromServer(
  serverOptions: PublicKeyEnvelope<PublicKeyCredentialCreationOptions>,
): PublicKeyCredentialCreationOptions {
  const options = unwrapPublicKeyOptions(serverOptions);
  return {
    ...options,
    challenge: base64UrlToBuffer(options.challenge as unknown as string),
    user: {
      ...options.user,
      id: base64UrlToBuffer(options.user.id as unknown as string),
    },
    excludeCredentials: options.excludeCredentials?.map((credential) => ({
      ...credential,
      id: base64UrlToBuffer(credential.id as unknown as string),
    })),
  };
}

export function requestOptionsFromServer(
  serverOptions: PublicKeyEnvelope<PublicKeyCredentialRequestOptions>,
): PublicKeyCredentialRequestOptions {
  const options = unwrapPublicKeyOptions(serverOptions);
  return {
    ...options,
    challenge: base64UrlToBuffer(options.challenge as unknown as string),
    allowCredentials: options.allowCredentials?.map((credential) => ({
      ...credential,
      id: base64UrlToBuffer(credential.id as unknown as string),
    })),
  };
}

function readFederatedSession() {
  const marker = "#session=";
  if (!window.location.hash.startsWith(marker)) return null;
  try {
    const encoded = window.location.hash.slice(marker.length);
    const padded = encoded
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const bytes = Uint8Array.from(window.atob(padded), (char) =>
      char.charCodeAt(0),
    );
    const session = JSON.parse(new TextDecoder().decode(bytes)) as AuthSession;
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    return session;
  } catch {
    return null;
  }
}

export function readSession() {
  try {
    const federated = readFederatedSession();
    if (federated) {
      api.setAccessToken(federated.access_token);
      return federated;
    }
    const raw = window.localStorage.getItem(SESSION_KEY);
    const session = raw ? (JSON.parse(raw) as AuthSession) : null;
    api.setAccessToken(session?.access_token ?? null);
    return session;
  } catch {
    api.setAccessToken(null);
    return null;
  }
}