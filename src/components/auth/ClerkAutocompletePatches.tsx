"use client";

import { useEffect } from "react";

/**
 * Check if autocomplete is properly set (not empty/off/undefined)
 */
function hasValidAutocomplete(input: HTMLInputElement): boolean {
  const value = input.getAttribute("autocomplete");
  return Boolean(value && value !== "off" && value !== "on");
}

/**
 * Patches autocomplete attributes on Clerk-rendered form inputs.
 * Clerk doesn't expose a way to set HTML attributes via their appearance API,
 * so we use a MutationObserver to add them after Clerk renders.
 *
 * This follows Chromium's password form best practices:
 * @see https://www.chromium.org/developers/design-documents/create-amazing-password-forms/
 */
export function ClerkAutocompletePatches() {
  useEffect(() => {
    const patchInputs = () => {
      // Password inputs - determine context from form/URL
      document
        .querySelectorAll<HTMLInputElement>('input[type="password"]')
        .forEach((input) => {
          if (hasValidAutocomplete(input)) return;

          // Determine if this is a sign-up or sign-in context
          const isSignUp =
            window.location.pathname.includes("sign-up") ||
            input.closest('[data-clerk-sign-up]') !== null ||
            input.name === "confirmPassword";

          input.setAttribute(
            "autocomplete",
            isSignUp ? "new-password" : "current-password",
          );
        });

      // Email/identifier inputs
      document
        .querySelectorAll<HTMLInputElement>(
          'input[name="identifier"], input[name="emailAddress"], input[type="email"]',
        )
        .forEach((input) => {
          if (!hasValidAutocomplete(input)) {
            input.setAttribute("autocomplete", "username");
          }
        });

      // First name
      document
        .querySelectorAll<HTMLInputElement>('input[name="firstName"]')
        .forEach((input) => {
          if (!hasValidAutocomplete(input)) {
            input.setAttribute("autocomplete", "given-name");
          }
        });

      // Last name
      document
        .querySelectorAll<HTMLInputElement>('input[name="lastName"]')
        .forEach((input) => {
          if (!hasValidAutocomplete(input)) {
            input.setAttribute("autocomplete", "family-name");
          }
        });

      // Username
      document
        .querySelectorAll<HTMLInputElement>('input[name="username"]')
        .forEach((input) => {
          if (!hasValidAutocomplete(input)) {
            input.setAttribute("autocomplete", "username");
          }
        });

      // Phone
      document
        .querySelectorAll<HTMLInputElement>(
          'input[name="phoneNumber"], input[type="tel"]',
        )
        .forEach((input) => {
          if (!hasValidAutocomplete(input)) {
            input.setAttribute("autocomplete", "tel");
          }
        });
    };

    // Run immediately and after a short delay (Clerk might render async)
    patchInputs();
    const initialTimeout = setTimeout(patchInputs, 100);
    const secondTimeout = setTimeout(patchInputs, 500);

    // Watch for DOM changes (Clerk renders dynamically)
    const observer = new MutationObserver(() => {
      // Debounce mutation callbacks
      patchInputs();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["type", "name"],
    });

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(secondTimeout);
      observer.disconnect();
    };
  }, []);

  return null;
}
