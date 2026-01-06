"use client";

import UploadDropzone from "@/components/upload/UploadDropzone";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Upload Statement</h1>
      <UploadDropzone />
    </div>
  );
}
