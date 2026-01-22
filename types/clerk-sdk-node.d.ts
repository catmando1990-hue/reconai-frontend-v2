/**
 * Type declaration for @clerk/clerk-sdk-node
 *
 * This module is installed at CI runtime only (not in package.json).
 * This declaration allows TypeScript to compile without errors.
 */
declare module "@clerk/clerk-sdk-node" {
  export interface ClerkClient {
    signInTokens: {
      createSignInToken(options: {
        userId: string;
        expiresInSeconds: number;
      }): Promise<{ token: string }>;
    };
  }

  export function createClerkClient(options: {
    secretKey: string;
  }): ClerkClient;
}
