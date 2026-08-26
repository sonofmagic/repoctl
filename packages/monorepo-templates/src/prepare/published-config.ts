import YAML from 'yaml'

type UnknownRecord = Record<string, unknown>

interface WorkflowJob extends UnknownRecord {
  needs?: string | string[]
}

interface WorkflowConfig extends UnknownRecord {
  jobs?: Record<string, WorkflowJob>
}

interface RenovateConfig extends UnknownRecord {
  packageRules?: UnknownRecord[]
}

const generatedAssetsJob = 'generated-assets'
const cloudflareWorkersToolingGroup = 'cloudflare-workers-tooling'

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function referencesJob(needs: unknown, jobName: string) {
  return needs === jobName || (Array.isArray(needs) && needs.includes(jobName))
}

function removeJobDependency(needs: string | string[], jobName: string) {
  if (typeof needs === 'string') {
    return needs === jobName ? undefined : needs
  }
  const remaining = needs.filter(name => name !== jobName)
  return remaining.length > 0 ? remaining : undefined
}

export function sanitizePublishedCiWorkflowContent(content: string) {
  const document = YAML.parseDocument(content)
  if (document.errors.length > 0) {
    throw document.errors[0]
  }

  const workflow = document.toJS() as WorkflowConfig | null
  const jobs = workflow?.jobs
  if (!isRecord(jobs) || !isRecord(jobs[generatedAssetsJob])) {
    return content
  }

  document.deleteIn(['jobs', generatedAssetsJob])

  const build = jobs['build']
  if (isRecord(build) && referencesJob(build.needs, generatedAssetsJob)) {
    const nextNeeds = removeJobDependency(build.needs as string | string[], generatedAssetsJob)
    if (nextNeeds === undefined) {
      document.deleteIn(['jobs', 'build', 'needs'])
    }
    else {
      document.setIn(['jobs', 'build', 'needs'], nextNeeds)
    }
  }

  const aggregate = jobs['ci']
  if (isRecord(aggregate) && referencesJob(aggregate.needs, generatedAssetsJob)) {
    document.deleteIn(['jobs', 'ci'])
  }

  return document
    .toString({ flowCollectionPadding: false })
    .replace(/[ \t]+$/gm, '')
    .replace(/(^|\n)(jobs:\n)\n(?= {2}\S)/, '$1$2')
}

export function sanitizePublishedRenovateContent(content: string) {
  const config = JSON.parse(content) as RenovateConfig
  if (!Array.isArray(config.packageRules)) {
    return content
  }

  let changed = false
  for (const rule of config.packageRules) {
    if (!isRecord(rule) || rule['groupSlug'] !== cloudflareWorkersToolingGroup) {
      continue
    }
    if ('rebaseWhen' in rule) {
      delete rule['rebaseWhen']
      changed = true
    }
    if ('postUpgradeTasks' in rule) {
      delete rule['postUpgradeTasks']
      changed = true
    }
  }

  return changed ? `${JSON.stringify(config, null, 2)}\n` : content
}
