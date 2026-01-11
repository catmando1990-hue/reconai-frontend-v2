"use client";

import { useOrganizationList, useOrganization } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Building2,
  Check,
  ChevronRight,
  Loader2,
  Plus,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const inputClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function OrgOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

  const { organization: activeOrg } = useOrganization();
  const { isLoaded, userMemberships, createOrganization, setActive } =
    useOrganizationList({
      userMemberships: {
        infinite: true,
      },
    });

  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  const handleSelectOrg = useCallback(
    async (orgId: string) => {
      if (!setActive) return;
      setSwitching(orgId);
      try {
        await setActive({ organization: orgId });
        router.push(returnTo);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to select organization",
        );
        setSwitching(null);
      }
    },
    [setActive, router, returnTo],
  );

  const handleCreateOrg = useCallback(async () => {
    if (!createOrganization || !newOrgName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const org = await createOrganization({ name: newOrgName.trim() });
      if (setActive && org.id) {
        await setActive({ organization: org.id });
      }
      router.push(returnTo);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create organization",
      );
      setIsCreating(false);
    }
  }, [createOrganization, newOrgName, setActive, router, returnTo]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading organizations...
        </div>
      </div>
    );
  }

  const organizations = userMemberships.data ?? [];
  const hasOrgs = organizations.length > 0;

  return (
    <main className="relative min-h-[92vh] overflow-hidden px-6 py-16">
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero/onboarding-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40 dark:opacity-30"
        />
        <div className="absolute inset-0 bg-background/80 dark:bg-background/75" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
            <Building2 className="h-4 w-4 text-primary" />
            Organization Setup
          </div>

          <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight">
            {hasOrgs ? "Select your organization" : "Create your organization"}
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">
            {hasOrgs
              ? "Choose an organization to continue, or create a new one."
              : "Organizations help you collaborate with your team and manage access."}
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}

        <div className="mt-8 space-y-4">
          {hasOrgs && !showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="space-y-3"
            >
              {organizations.map((membership, index) => {
                const org = membership.organization;
                const isActive = activeOrg?.id === org.id;
                const isSwitching = switching === org.id;

                return (
                  <motion.button
                    key={org.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    onClick={() => handleSelectOrg(org.id)}
                    disabled={!!switching}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50 hover:bg-accent"
                    } ${switching && !isSwitching ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {org.imageUrl ? (
                          <Image
                            src={org.imageUrl}
                            alt={org.name}
                            width={48}
                            height={48}
                            className="rounded-xl"
                          />
                        ) : (
                          <Building2 className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{org.name}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>{membership.role}</span>
                          {org.membersCount && (
                            <>
                              <span className="text-border">|</span>
                              <span>
                                {org.membersCount}{" "}
                                {org.membersCount === 1 ? "member" : "members"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            Active
                          </span>
                        )}
                        {isSwitching ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <ChevronRight
                            className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                          />
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}

              {userMemberships.hasNextPage && (
                <Button
                  variant="ghost"
                  onClick={() => userMemberships.fetchNext()}
                  className="w-full"
                >
                  Load more organizations
                </Button>
              )}

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => setShowCreateForm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-4 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="h-5 w-5" />
                Create new organization
              </motion.button>
            </motion.div>
          )}

          {(showCreateForm || !hasOrgs) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Create Organization
                  </CardTitle>
                  <CardDescription>
                    Give your organization a name to get started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="orgName"
                      className="text-sm font-medium leading-none"
                    >
                      Organization name
                    </label>
                    <input
                      id="orgName"
                      name="orgName"
                      type="text"
                      autoComplete="organization"
                      placeholder="Acme Inc."
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newOrgName.trim()) {
                          handleCreateOrg();
                        }
                      }}
                      className={inputClassName}
                      disabled={isCreating}
                    />
                  </div>

                  <div className="flex gap-3">
                    {hasOrgs && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewOrgName("");
                          setError(null);
                        }}
                        disabled={isCreating}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      onClick={handleCreateOrg}
                      disabled={isCreating || !newOrgName.trim()}
                      className="flex-1"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Create & Continue
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex items-center justify-between"
        >
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to home
          </Link>

          {activeOrg && (
            <Button onClick={() => router.push(returnTo)}>
              Continue with {activeOrg.name}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </motion.div>
      </div>
    </main>
  );
}

export default function OrgOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading...
          </div>
        </div>
      }
    >
      <OrgOnboardingContent />
    </Suspense>
  );
}
