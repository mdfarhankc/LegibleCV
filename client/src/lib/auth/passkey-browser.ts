// The part of a passkey that has to happen in the browser: asking the device to create one, or
// to sign in with one. Options and results travel as JSON, which current browsers convert
// themselves.

export function passkeysSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential?.parseRequestOptionsFromJSON === "function" &&
    typeof window.PublicKeyCredential?.parseCreationOptionsFromJSON === "function"
  );
}

export const UNSUPPORTED_MESSAGE = "This browser doesn't support passkeys. Try a newer version.";

export async function createPasskey(
  options: PublicKeyCredentialCreationOptionsJSON,
): Promise<PublicKeyCredentialJSON> {
  const credential = await navigator.credentials.create({
    publicKey: PublicKeyCredential.parseCreationOptionsFromJSON(options),
  });
  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error("No passkey was created");
  }
  return credential.toJSON();
}

export async function getPasskey(
  options: PublicKeyCredentialRequestOptionsJSON,
): Promise<PublicKeyCredentialJSON> {
  const credential = await navigator.credentials.get({
    publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(options),
  });
  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error("No passkey was chosen");
  }
  return credential.toJSON();
}

// What the browser reports when the prompt is dismissed, times out, or isn't allowed.
export function passkeyErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "AbortError") {
      return "The passkey prompt was closed before it finished.";
    }
    if (error.name === "InvalidStateError") {
      return "This device already has a passkey for your account.";
    }
  }
  return fallback;
}

// A name for the list in Settings, so passkeys from different devices can be told apart.
export function deviceName(): string {
  const agent = navigator.userAgent;
  const device =
    [
      ["iPhone", "iPhone"],
      ["iPad", "iPad"],
      ["Android", "Android"],
      ["Windows", "Windows"],
      ["Mac OS X", "Mac"],
      ["Linux", "Linux"],
    ].find(([token]) => agent.includes(token))?.[1] ?? "This device";
  const browser =
    [
      ["Edg/", "Edge"],
      ["Firefox/", "Firefox"],
      ["Chrome/", "Chrome"],
      ["Safari/", "Safari"],
    ].find(([token]) => agent.includes(token))?.[1] ?? null;
  return browser ? `${device}, ${browser}` : device;
}
