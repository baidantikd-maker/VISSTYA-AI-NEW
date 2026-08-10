import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const SCRIPT_PATH = path.join(fileURLToPath(new URL("../..", import.meta.url)), "scripts", "exif_read.py");
const PYTHON_CANDIDATES = [process.env.PYTHON, "python", "python3", "py"].filter(Boolean) as string[];

export interface ParsedExifResult {
  source: string;
  tags: Record<string, string>;
}

export async function parseExifFromUrl(url: string): Promise<ParsedExifResult> {
  return runExifParser(["--url", url]);
}

export async function parseExifFromFile(filePath: string): Promise<ParsedExifResult> {
  return runExifParser(["--file", filePath]);
}

function findPythonCommand(): string {
  for (const candidate of PYTHON_CANDIDATES) {
    if (!candidate) continue;
    return candidate;
  }
  throw new Error("Python executable not found. Set PYTHON or install Python on the PATH.");
}

function runExifParser(args: string[]): Promise<ParsedExifResult> {
  const python = findPythonCommand();

  return new Promise((resolve, reject) => {
    const child = spawn(python, [SCRIPT_PATH, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", chunk => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", chunk => {
      stderr += chunk.toString();
    });

    child.on("error", error => {
      reject(new Error(`Failed to run Python EXIF parser: ${error.message}`));
    });

    child.on("close", code => {
      if (code !== 0) {
        const message = stderr.trim() || `Exif parser exited with code ${code}`;
        reject(new Error(message));
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as ParsedExifResult;
        resolve(parsed);
      } catch (error) {
        reject(new Error(`Failed to parse EXIF parser output: ${error instanceof Error ? error.message : String(error)}\nOutput: ${stdout}\nError: ${stderr}`));
      }
    });
  });
}
