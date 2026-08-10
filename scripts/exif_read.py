#!/usr/bin/env python3
import argparse
import io
import json
import sys
import urllib.request
import urllib.error

import exifread


def fetch_bytes_from_url(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Visstya-AI-EXIF-Parser/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read()


def parse_exif_bytes(data: bytes) -> dict:
    try:
        tags = exifread.process_file(io.BytesIO(data), details=False)
    except Exception as exc:
        raise RuntimeError(f"EXIF parsing failed: {exc}") from exc

    parsed = {}
    for tag_name, tag_value in tags.items():
        try:
            parsed[tag_name] = str(tag_value)
        except Exception:
            parsed[tag_name] = repr(tag_value)

    return parsed


def main() -> int:
    parser = argparse.ArgumentParser(description="Parse EXIF metadata from an image URL or local file.")
    parser.add_argument("--url", type=str, help="Image URL to fetch and parse")
    parser.add_argument("--file", type=str, help="Local image file path to parse")
    args = parser.parse_args()

    if not args.url and not args.file:
        parser.error("Either --url or --file is required.")

    try:
        if args.url:
            image_bytes = fetch_bytes_from_url(args.url)
        else:
            with open(args.file, "rb") as file_handle:
                image_bytes = file_handle.read()

        result = {
            "source": args.url or args.file,
            "tags": parse_exif_bytes(image_bytes),
        }
        json.dump(result, sys.stdout, ensure_ascii=False)
        return 0
    except urllib.error.HTTPError as http_err:
        print(json.dumps({"error": f"HTTP fetch failed: {http_err.code} {http_err.reason}"}), file=sys.stderr)
        return 2
    except urllib.error.URLError as url_err:
        print(json.dumps({"error": f"URL fetch failed: {url_err.reason}"}), file=sys.stderr)
        return 3
    except Exception as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
