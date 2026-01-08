declare global {
  interface CustomJwtSessionClaims {
    publicMetadata?: {
      role?: string;
    };
  }
}

export {};
