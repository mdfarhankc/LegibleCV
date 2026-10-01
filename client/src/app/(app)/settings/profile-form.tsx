"use client";

import { useActionState, useState } from "react";

import { FormField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/lib/auth/account-actions";
import type { Profile } from "@/lib/auth/profile";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  // Controlled, so the values survive the form reset React does after an action.
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);

  return (
    <form action={action} className="grid gap-4">
      <FormField
        name="full_name"
        label="Full name"
        autoComplete="name"
        maxLength={200}
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        errors={state?.fieldErrors?.full_name}
      />
      <FormField
        name="phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        maxLength={40}
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        errors={state?.fieldErrors?.phone}
      />
      <FormField
        name="location"
        label="Location"
        placeholder="City, Country"
        autoComplete="address-level2"
        maxLength={200}
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        errors={state?.fieldErrors?.location}
      />
      <FormMessage state={state} />
      <Button type="submit" className="justify-self-start" disabled={pending}>
        {pending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
