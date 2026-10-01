import type { ReactNode } from "react";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
  footer?: ReactNode;
  // Shows Google and GitHub buttons above the form. `next` is where to go after signing in.
  oauth?: { next?: string };
};

// Taller fields and buttons than the app default, for the auth pages only.
const controlSizing =
  "[&_input]:h-11 [&_input]:text-base [&_[data-slot=button]]:h-11 [&_[data-slot=button]]:text-base";

export function AuthCard({ title, description, children, footer, oauth }: AuthCardProps) {
  return (
    <Card className={controlSizing}>
      <CardHeader>
        <CardTitle className="font-heading text-2xl font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>

      {(children || oauth) && (
        <CardContent className="grid gap-6">
          {oauth && (
            <>
              <OAuthButtons next={oauth.next} />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or use your email
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}
          {children}
        </CardContent>
      )}

      {footer && (
        <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter>
      )}
    </Card>
  );
}
