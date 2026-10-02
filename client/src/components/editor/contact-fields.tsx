"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { TextField } from "@/components/editor/fields";
import { Button } from "@/components/ui/button";
import { LIMITS, type ResumeFormValues } from "@/lib/resumes/form";

export function ContactFields() {
  const { control } = useFormContext<ResumeFormValues>();
  const links = useFieldArray({ control, name: "links" });

  return (
    <section className="grid grid-cols-1 gap-5 rounded-xl border p-5 sm:p-6">
      <h2 className="font-heading text-lg font-semibold">Contact</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="full_name" label="Full name" autoComplete="name" />
        <TextField name="email" label="Email" type="email" autoComplete="email" />
        <TextField name="phone" label="Phone" type="tel" autoComplete="tel" />
        <TextField name="location" label="Location" placeholder="City, Country" />
      </div>

      <div className="grid gap-3">
        <div>
          <h3 className="font-medium">Links</h3>
          <p className="text-sm text-muted-foreground">
            LinkedIn, GitHub, a portfolio. The label is what the resume shows.
          </p>
        </div>
        {links.fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-start">
            <TextField name={`links.${index}.label`} label="Label" placeholder="LinkedIn" />
            <TextField
              name={`links.${index}.url`}
              label="Address"
              type="url"
              placeholder="https://www.linkedin.com/in/you"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive sm:mt-[1.6rem]"
              onClick={() => links.remove(index)}
              aria-label={`Remove link ${index + 1}`}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="justify-self-start"
          disabled={links.fields.length >= LIMITS.links}
          onClick={() => links.append({ label: "", url: "" })}
        >
          <Plus />
          Add link
        </Button>
      </div>
    </section>
  );
}
