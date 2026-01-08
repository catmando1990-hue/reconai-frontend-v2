// Video URLs - update these after uploading to Vercel Blob
// Run: npx tsx scripts/upload-videos-to-blob.ts

export const VIDEO_URLS = {
  // Set to empty string to fall back to local /videos/ path
  heroLoop: "",
  heroPoster: "",
  complianceShield: "",
  reconaiPreview: "",
} as const;

// Helper to get video URL with fallback to local path
export function getVideoUrl(
  key: keyof typeof VIDEO_URLS,
  localFallback: string
): string {
  return VIDEO_URLS[key] || localFallback;
}
