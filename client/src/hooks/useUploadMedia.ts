import { trpc } from "@/lib/trpc";

/**
 * Uploads a media file directly to object storage using a presigned PUT URL
 * obtained from the server. Returns the permanent public URL.
 */
export function useUploadMedia() {
  const presign = trpc.upload.presignUrl.useMutation();

  const upload = async (file: File): Promise<{ url: string; key: string }> => {
    if (presign.isPending) {
      throw new Error("An upload is already in progress");
    }

    const { uploadUrl, key, url } = await presign.mutateAsync({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    });

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!response.ok) {
      throw new Error(
        `Upload to storage failed (${response.status} ${response.statusText})`
      );
    }

    return { url, key };
  };

  return {
    upload,
    isPending: presign.isPending,
    error: presign.error,
  };
}
