import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Wires up real "Run code" execution using Piston (https://github.com/engineer-man/piston),
// a free, keyless, sandboxed multi-language execution API. We resolve a runtime version
// dynamically (and cache it) instead of hardcoding version numbers that go stale.
const PISTON_BASE = 'https://emkc.org/api/v2/piston';

const LANGUAGE_HINTS = {
  javascript: ['javascript', 'node', 'js'],
  typescript: ['typescript', 'ts'],
  python: ['python', 'py'],
  java: ['java'],
  cpp: ['cpp', 'c++'],
  go: ['go', 'golang'],
  rust: ['rust', 'rs'],
};

const FILE_NAMES = {
  javascript: 'main.js',
  typescript: 'main.ts',
  python: 'main.py',
  java: 'Main.java',
  cpp: 'main.cpp',
  go: 'main.go',
  rust: 'main.rs',
};

const MAX_CODE_LENGTH = 20000;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let runtimesCache = null;
let runtimesCacheAt = 0;

async function readErrorDetail(response) {
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return json.message || text;
    } catch {
      return text;
    }
  } catch {
    return '';
  }
}

async function getRuntimes() {
  const now = Date.now();
  if (runtimesCache && now - runtimesCacheAt < CACHE_TTL_MS) return runtimesCache;

  let response;
  try {
    response = await fetch(`${PISTON_BASE}/runtimes`);
  } catch (err) {
    console.error('[execute] Failed to reach Piston runtimes endpoint:', err.message);
    throw new ApiError(502, 'Could not reach the code execution service. Try again in a moment.');
  }
  if (!response.ok) {
    const detail = await readErrorDetail(response);
    console.error(`[execute] Piston runtimes fetch failed (${response.status}):`, detail);
    throw new ApiError(502, 'Could not reach the code execution service. Try again in a moment.');
  }

  const data = await response.json();
  runtimesCache = data;
  runtimesCacheAt = now;
  return data;
}

function resolveRuntime(runtimes, language) {
  const hints = LANGUAGE_HINTS[language];
  if (!hints) return null;
  return runtimes.find(
    (rt) => hints.includes(rt.language) || (rt.aliases || []).some((alias) => hints.includes(alias))
  );
}

export const executeCode = asyncHandler(async (req, res) => {
  const { language, code, stdin = '' } = req.body;

  if (!language || !LANGUAGE_HINTS[language]) {
    throw ApiError.badRequest(`Unsupported language: ${language}`);
  }
  if (typeof code !== 'string' || !code.trim()) {
    throw ApiError.badRequest('Code must not be empty.');
  }
  if (code.length > MAX_CODE_LENGTH) {
    throw ApiError.badRequest(`Code is too long to run (max ${MAX_CODE_LENGTH} characters).`);
  }
  if (typeof stdin !== 'string') {
    throw ApiError.badRequest('stdin must be a string.');
  }

  const runtimes = await getRuntimes();
  const runtime = resolveRuntime(runtimes, language);
  if (!runtime) {
    throw new ApiError(503, `No execution runtime is currently available for ${language}.`);
  }

  let pistonRes;
  try {
    pistonRes = await fetch(`${PISTON_BASE}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{ name: FILE_NAMES[language] || 'main.txt', content: code }],
        stdin,
        compile_timeout: 10000,
        run_timeout: 5000,
      }),
    });
  } catch (err) {
    throw new ApiError(502, 'The code execution service is unreachable right now.');
  }

  if (pistonRes.status === 429) {
    throw new ApiError(429, 'The code execution service is rate-limited — wait a few seconds and try again.');
  }
  if (!pistonRes.ok) {
    const detail = await readErrorDetail(pistonRes);
    console.error(`[execute] Piston execute failed (${pistonRes.status}) for ${language}:`, detail);
    throw new ApiError(
      502,
      detail
        ? `The code execution service returned an error: ${detail}`
        : `The code execution service returned an error (status ${pistonRes.status}).`
    );
  }

  const result = await pistonRes.json();

  res.json({
    success: true,
    result: {
      language: runtime.language,
      version: runtime.version,
      compile: result.compile
        ? {
            stdout: result.compile.stdout ?? '',
            stderr: result.compile.stderr ?? '',
            code: result.compile.code ?? null,
          }
        : null,
      run: {
        stdout: result.run?.stdout ?? '',
        stderr: result.run?.stderr ?? '',
        output: result.run?.output ?? '',
        code: result.run?.code ?? null,
        signal: result.run?.signal ?? null,
      },
    },
  });
});