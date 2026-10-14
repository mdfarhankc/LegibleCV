"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireFreshUser } from "@/lib/auth/dal";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { SETTINGS_PATH } from "@/lib/auth/routes";
import { createClient, type Supabase } from "@/lib/supabase/server";

// I split a passkey into two steps so the browser never needs a Supabase client: the server
// gets the challenge, the device signs it in the browser, and the server verifies the answer.

type Passkeys = Supabase["auth"]["passkey"];
// The options are standard WebAuthn JSON. Supabase's client has its own copy of the type, so I
// return them as the browser's type, which is what reads them.
type SignInOptions = PublicKeyCredentialRequestOptionsJSON;
type RegistrationOptions = PublicKeyCredentialCreationOptionsJSON;
type Credential = Parameters<Passkeys["verifyAuthentication"]>[0]["credential"];

type Failure = { ok: false; message: string };
type Challenge<Options> = { ok: true; challengeId: string; options: Options } | Failure;
export type PasskeyResult = { ok: true } | Failure;

const UNAVAILABLE: Failure = {
  ok: false,
  message: "Passkeys aren't available right now. Try again in a moment.",
};
const EXPIRED: Failure = { ok: false, message: "That took too long. Try again." };

const challengeIdSchema = z.string().min(1).max(200);
// Only the shape is checked here. Supabase verifies the signature against its own challenge.
const credentialSchema = z.looseObject({
  id: z.string().min(1).max(2000),
  rawId: z.string().min(1).max(2000),
  type: z.literal("public-key"),
  response: z.looseObject({}),
});
// Same limit as Supabase's.
const nameSchema = z.string().trim().min(1).max(120);

function readAnswer(challengeId: unknown, credential: unknown) {
  const id = challengeIdSchema.safeParse(challengeId);
  const answer = credentialSchema.safeParse(credential);
  if (!id.success || !answer.success) {
    return null;
  }
  return { challengeId: id.data, credential: answer.data as unknown as Credential };
}

export async function startPasskeySignIn(): Promise<Challenge<SignInOptions>> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.passkey.startAuthentication();
  if (error || !data) {
    return UNAVAILABLE;
  }
  return {
    ok: true,
    challengeId: data.challenge_id,
    options: data.options as unknown as SignInOptions,
  };
}

// Redirects into the app on success, so it only returns when sign-in failed.
export async function finishPasskeySignIn(
  challengeId: unknown,
  credential: unknown,
  next: unknown,
): Promise<Failure> {
  const answer = readAnswer(challengeId, credential);
  if (!answer) {
    return UNAVAILABLE;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.passkey.verifyAuthentication(answer);
  if (error || !data?.session) {
    return error && "code" in error && error.code === "webauthn_challenge_expired"
      ? EXPIRED
      : { ok: false, message: "That passkey wasn't recognised. Use another way to log in." };
  }
  redirect(safeRedirectPath(next));
}

export async function startPasskeyRegistration(): Promise<Challenge<RegistrationOptions>> {
  await requireFreshUser();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.passkey.startRegistration();
  if (error || !data) {
    return UNAVAILABLE;
  }
  return {
    ok: true,
    challengeId: data.challenge_id,
    options: data.options as unknown as RegistrationOptions,
  };
}

export async function finishPasskeyRegistration(
  challengeId: unknown,
  credential: unknown,
  name: unknown,
): Promise<PasskeyResult> {
  await requireFreshUser();
  const answer = readAnswer(challengeId, credential);
  if (!answer) {
    return UNAVAILABLE;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.passkey.verifyRegistration(answer);
  if (error || !data) {
    return error && "code" in error && error.code === "webauthn_challenge_expired"
      ? EXPIRED
      : { ok: false, message: "The passkey couldn't be saved. Try again." };
  }

  // The name only helps tell passkeys apart in the list, so failing to set it isn't an error.
  const friendlyName = nameSchema.safeParse(name);
  if (friendlyName.success) {
    await supabase.auth.passkey.update({ passkeyId: data.id, friendlyName: friendlyName.data });
  }

  revalidatePath(SETTINGS_PATH);
  return { ok: true };
}

export async function removePasskey(id: unknown): Promise<PasskeyResult> {
  await requireFreshUser();
  const passkeyId = z.uuid().safeParse(id);
  if (!passkeyId.success) {
    return { ok: false, message: "Could not remove the passkey. Try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.passkey.delete({ passkeyId: passkeyId.data });
  if (error) {
    return { ok: false, message: "Could not remove the passkey. Try again." };
  }

  revalidatePath(SETTINGS_PATH);
  return { ok: true };
}
