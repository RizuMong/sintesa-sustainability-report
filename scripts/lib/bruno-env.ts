// Reads a Bruno environment .yml from the sibling API-collection repo (`api/` symlinks into
// `SLM/collections/Sintesa`) and resolves it to { baseUrl, token }.
//
// run: node --experimental-strip-types scripts/lib/bruno-env.ts <name>   (prints resolved baseUrl)
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

interface BrunoVariable {
  name: string
  value: string
  secret?: boolean
}

interface BrunoEnvFile {
  name: string
  variables: BrunoVariable[]
}

export interface BrunoEnv {
  baseUrl: string
  token: string
}

// fileURLToPath, not .pathname — repo paths under ~/Projects contain spaces, which .pathname
// would percent-encode instead of decoding back to a literal space.
const API_SYMLINK = fileURLToPath(new URL('../../api', import.meta.url))
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))

// api/ -> .../SLM/collections/Sintesa ; environments live at .../SLM/environments/<name>.yml,
// i.e. two levels up from the symlink's real target (collections/Sintesa -> collections -> SLM).
function environmentsDir(): string {
  const realCollection = realpathSync(API_SYMLINK)
  const slmRoot = fileURLToPath(new URL('../../', `file://${realCollection}/`))
  return `${slmRoot}environments/`
}

// No YAML dependency in this repo (see scripts/mock-api-server.ts) — reuse its established
// python3 + PyYAML shell-out instead of adding one for a handful of environment files.
function parseYamlFile(path: string): BrunoEnvFile {
  const out = execFileSync(
    'python3',
    [
      '-c',
      ['import yaml,json,sys', 'd=yaml.safe_load(open(sys.argv[1]))', 'sys.stdout.write(json.dumps(d))'].join('\n'),
      path,
    ],
    { encoding: 'utf8' },
  )
  return JSON.parse(out) as BrunoEnvFile
}

// Simple KEY=VALUE .env parser (no dependency) — .env is gitignored, used for local overrides.
function loadDotEnv(): Record<string, string> {
  const path = `${REPO_ROOT}/.env`
  if (!existsSync(path)) return {}
  const out: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

export function loadBrunoEnv(name: string): BrunoEnv {
  const dotEnv = loadDotEnv()
  const envOverride = process.env.SINTESA_BASE_URL ?? dotEnv.SINTESA_BASE_URL
  const tokenOverride = process.env.SINTESA_BOOTSTRAP_TOKEN ?? dotEnv.SINTESA_BOOTSTRAP_TOKEN

  if (envOverride && tokenOverride) {
    return { baseUrl: envOverride.replace(/\/+$/, ''), token: tokenOverride }
  }

  if (!existsSync(API_SYMLINK)) {
    throw new Error(
      `loadBrunoEnv('${name}'): api/ symlink not found at ${API_SYMLINK} — is the vas-api-collection repo checked out?`,
    )
  }

  const envPath = `${environmentsDir()}${name}.yml`
  if (!existsSync(envPath)) {
    throw new Error(`loadBrunoEnv('${name}'): environment file not found at ${envPath}`)
  }

  const parsed = parseYamlFile(envPath)
  const variables = parsed.variables ?? []
  const byName = new Map(variables.map((v) => [v.name, v.value]))

  const baseUrl = envOverride ?? byName.get('base_url')
  if (!baseUrl) {
    throw new Error(`loadBrunoEnv('${name}'): no 'base_url' variable found in ${envPath}`)
  }
  const token = tokenOverride ?? byName.get('token')
  if (!token) {
    throw new Error(`loadBrunoEnv('${name}'): no 'token' variable found in ${envPath}`)
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ''), token }
}

// Allow `node --experimental-strip-types scripts/lib/bruno-env.ts <name>` for manual inspection.
if (import.meta.url === `file://${process.argv[1]}`) {
  const name = process.argv[2] ?? 'Development'
  const { baseUrl } = loadBrunoEnv(name)
  console.log(`${name}: ${baseUrl}`)
}
