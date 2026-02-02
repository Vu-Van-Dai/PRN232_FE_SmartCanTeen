export type CloudinaryUploadResult = {
  url: string;
  publicId?: string;
};

import { apiRequest } from "@/lib/api/http";

type CloudinarySignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

export async function uploadImageToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const sig = await apiRequest<CloudinarySignatureResponse>("/api/uploads/cloudinary-signature", {
    method: "POST",
    body: {
      folder: (import.meta.env.VITE_CLOUDINARY_FOLDER as string | undefined) ?? undefined,
    },
  });

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    const msg = body?.error?.message ?? `Cloudinary upload failed (${res.status})`;
    throw new Error(msg);
  }

  const url: string | undefined = body?.secure_url;
  if (!url) throw new Error("Cloudinary did not return secure_url");

  return { url, publicId: body?.public_id };
}
