import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { checkCacheInputs, checkCacheRestore } from './cache.mjs'
import { createTempRoot, createWorkspace, declarations, repoRoot, run } from './workspace.mjs'

const tempRoot = createTempRoot()
try {
  const workspace = await createWorkspace(tempRoot)
  console.log('Checking generated types from the packed client and server templates...')
  for (const name of ['client', 'server']) {
    const cwd = path.join(workspace, 'apps', name)
    const file = path.join(cwd, declarations)
    assert.ok(!existsSync(file), 'new projects must not contain stale declarations')
    run('pnpm', ['cf-typegen:check'], cwd, false)
    for (const task of ['build', 'typecheck']) {
      rmSync(file, { force: true })
      run('pnpm', ['run', task], cwd)
      assert.ok(existsSync(file), `${name} ${task} must generate missing declarations`)
      run('pnpm', ['cf-typegen:check'], cwd)
    }
  }
  console.log('Checking cold builds, cache restoration, and cache invalidation...')
  for (const task of ['build', 'typecheck']) {
    for (const name of ['client', 'server']) {
      rmSync(path.join(workspace, 'apps', name, declarations), { force: true })
    }
    checkCacheRestore(workspace, task)
  }
  checkCacheInputs(workspace)

  console.log('Checking configuration updates and real type errors...')
  const server = path.join(workspace, 'apps/server')
  const configPath = path.join(server, 'wrangler.jsonc')
  const config = readFileSync(configPath, 'utf8')
  const updated = config.replace('"2025-10-16"', '"2025-10-17"').replace('"dev": {', '"vars": { "TYPEGEN_TEST": "updated" },\n  "dev": {')
  assert.notEqual(updated, config)
  writeFileSync(configPath, updated)
  run('pnpm', ['cf-typegen:check'], server, false)
  run('pnpm', ['typecheck'], server)
  const generated = readFileSync(path.join(server, declarations), 'utf8')
  assert.match(generated, /TYPEGEN_TEST/)
  assert.match(generated, /2025-10-17/)
  run('pnpm', ['cf-typegen:check'], server)
  writeFileSync(path.join(server, 'src/typegen-error.ts'), 'export const invalid: string = 123\n')
  const error = run('pnpm', ['typecheck'], server, false)
  assert.match(error, /TS2322/)
  rmSync(path.join(server, 'src/typegen-error.ts'))
  writeFileSync(configPath, '{ invalid json')
  run('pnpm', ['build'], server, false)
  writeFileSync(configPath, config)
  run('pnpm', ['typecheck'], server)

  assert.equal(run('git', ['diff', '--name-only'], workspace).trim(), '', 'generated output must leave tracked files unchanged')
  assert.equal(run('git', ['ls-files', '--others', '--exclude-standard'], workspace).trim(), '', 'generated files must be ignored')
  run(process.execPath, [path.join(repoRoot, 'scripts/check-no-tracked-build-artifacts.mjs')], workspace)
  run('git', ['add', '--force', 'apps/server/worker-configuration.d.ts'], workspace)
  run(process.execPath, [path.join(repoRoot, 'scripts/check-no-tracked-build-artifacts.mjs')], workspace, false)
  console.log('Worker type generation regression checks passed.')
}
finally {
  rmSync(tempRoot, { recursive: true, force: true })
}
