"use client";

import { useOrganizationList } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FormEventHandler, useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const inputClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const labelClassName = "text-sm font-medium leading-none";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { isLoaded, createOrganization } = useOrganizationList();
  const [organizationName, setOrganizationName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    async (e) => {
      e.preventDefault();

      if (!organizationName.trim()) {
        setError("Organization name is required");
        return;
      }

      if (!createOrganization) {
        setError("Unable to create organization. Please try again.");
        return;
      }

      setIsCreating(true);
      setError(null);

      try {
        await createOrganization({ name: organizationName.trim() });
        router.push("/dashboard");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create organization",
        );
      } finally {
        setIsCreating(false);
      }
    },
    [organizationName, createOrganization, router],
  );

  if (!isLoaded) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Create Organization</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create Organization</CardTitle>
          <CardDescription>
            Create a new organization to collaborate with your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="organizationName" className={labelClassName}>
                Organization name
              </label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                autoComplete="organization"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Acme Inc."
                className={inputClassName}
                disabled={isCreating}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isCreating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !organizationName.trim()}
                className="flex-1"
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
