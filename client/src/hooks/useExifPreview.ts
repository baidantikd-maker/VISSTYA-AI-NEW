import { parseExifFromMediaUrl, type ParsedExifResult } from "@/lib/exif";
import { useEffect, useState } from "react";

type ExifState = {
  data: ParsedExifResult | null;
  isLoading: boolean;
  isError: boolean;
};

export function useExifPreview(mediaUrl: string | undefined): ExifState {
  const [state, setState] = useState<ExifState>({
    data: null,
    isLoading: false,
    isError: false,
  });

  useEffect(() => {
    if (!mediaUrl) {
      setState({ data: null, isLoading: false, isError: false });
      return;
    }

    let cancelled = false;
    setState({ data: null, isLoading: true, isError: false });

    parseExifFromMediaUrl(mediaUrl)
      .then((data) => {
        if (cancelled) return;
        setState({ data, isLoading: false, isError: false });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ data: null, isLoading: false, isError: true });
      });

    return () => {
      cancelled = true;
    };
  }, [mediaUrl]);

  return state;
}
