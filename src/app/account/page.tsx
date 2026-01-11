"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useState } from "react";

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

function ProfileSection() {
  const { user, isLoaded } = useUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Initialize form values when user loads
  useState(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
  });

  const handleUpdateProfile = useCallback(async () => {
    if (!user) return;
    setIsUpdating(true);
    setMessage(null);

    try {
      await user.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update profile",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [user, firstName, lastName]);

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="firstName" className={labelClassName}>
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={user.firstName ?? ""}
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className={labelClassName}>
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={user.lastName ?? ""}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClassName}>Email</label>
          <input
            type="email"
            autoComplete="email"
            value={user.primaryEmailAddress?.emailAddress ?? ""}
            disabled
            className={`${inputClassName} bg-muted`}
          />
          <p className="text-xs text-muted-foreground">
            Contact support to change your email address
          </p>
        </div>

        {message && (
          <p
            className={`text-sm ${message.type === "success" ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
          >
            {message.text}
          </p>
        )}

        <Button onClick={handleUpdateProfile} disabled={isUpdating}>
          {isUpdating ? "Updating..." : "Update profile"}
        </Button>
      </CardContent>
    </Card>
  );
}

function PasswordSection() {
  const { user, isLoaded } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleUpdatePassword = useCallback(async () => {
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "Password must be at least 8 characters",
      });
      return;
    }

    setIsUpdating(true);
    setMessage(null);

    try {
      await user.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions: true,
      });
      setMessage({ type: "success", text: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update password",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [user, currentPassword, newPassword, confirmPassword]);

  if (!isLoaded || !user) {
    return null;
  }

  // Check if user has a password (they might use only OAuth)
  const hasPassword = user.passwordEnabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          {hasPassword
            ? "Change your password"
            : "Set a password for your account"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPassword && (
          <div className="space-y-2">
            <label htmlFor="currentPassword" className={labelClassName}>
              Current password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClassName}
            />
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="newPassword" className={labelClassName}>
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className={labelClassName}>
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClassName}
          />
        </div>

        {message && (
          <p
            className={`text-sm ${message.type === "success" ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
          >
            {message.text}
          </p>
        )}

        <Button
          onClick={handleUpdatePassword}
          disabled={isUpdating || !newPassword || !confirmPassword}
        >
          {isUpdating ? "Updating..." : "Update password"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SessionsSection() {
  const { user, isLoaded } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOutOtherSessions = useCallback(async () => {
    if (!user) return;
    setIsSigningOut(true);

    try {
      const sessions = await user.getSessions();
      // Sign out all sessions except current
      await Promise.all(
        sessions
          .filter((session) => session.status === "active")
          .slice(1)
          .map((session) => session.revoke()),
      );
    } catch (err) {
      console.error("Failed to sign out other sessions:", err);
    } finally {
      setIsSigningOut(false);
    }
  }, [user]);

  if (!isLoaded || !user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions</CardTitle>
        <CardDescription>Manage your active sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          onClick={handleSignOutOtherSessions}
          disabled={isSigningOut}
        >
          {isSigningOut ? "Signing out..." : "Sign out other sessions"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          This will sign you out of all other devices
        </p>
      </CardContent>
    </Card>
  );
}

export default function AccountPage() {
  return (
    <div className="space-y-6 p-6">
      <section className="relative overflow-hidden rounded-2xl border bg-background p-8">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-muted/40 via-background to-background" />
        <div className="absolute inset-0 -z-20 opacity-40 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[32px_32px]" />
        <div className="relative">
          <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Manage your account settings, security, and preferences
          </p>
        </div>
      </section>

      <div className="grid gap-6">
        <ProfileSection />
        <PasswordSection />
        <SessionsSection />
      </div>
    </div>
  );
}
