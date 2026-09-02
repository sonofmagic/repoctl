import { resolve } from 'node:path'

let exists = false
let readValue = '{}'

const mkdirSync = vi.fn()
const existsSync = vi.fn(() => exists)
const readFileSync = vi.fn(() => readValue)
const writeFileSync = vi.fn()

const parse = vi.fn((): any => ({}))
const stringify = vi.fn((_value: Record<string, unknown>) => '{"ok":true}')

vi.mock('node:fs', () => {
  return {
    default: {
      mkdirSync,
      existsSync,
      readFileSync,
      writeFileSync,
    },
    mkdirSync,
    existsSync,
    readFileSync,
    writeFileSync,
  }
})

vi.mock('node:process', () => {
  return {
    default: {
      cwd: () => '/repo',
    },
  }
})

vi.mock('comment-json', () => {
  return {
    default: {
      parse,
      stringify,
    },
  }
})

describe('cli', () => {
  const vscodeDir = resolve('/repo', '.vscode')
  const vscodeSettingsPath = resolve('/repo', '.vscode/settings.json')
  const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('initializes settings when the file is missing', async () => {
    exists = false
    readValue = '{}'
    parse.mockReturnValueOnce({})

    await import('@/cli')

    expect(mkdirSync).toHaveBeenCalledWith(vscodeDir, { recursive: true })
    expect(existsSync).toHaveBeenCalledWith(vscodeSettingsPath)
    expect(readFileSync).not.toHaveBeenCalled()
    expect(stringify).toHaveBeenCalled()
    expect(writeFileSync).toHaveBeenCalledWith(vscodeSettingsPath, '{"ok":true}', 'utf8')
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('init'))

    const firstCall = stringify.mock.calls.at(0)
    if (!firstCall) {
      throw new Error('Expected stringify to be called')
    }
    const writtenConfig = firstCall[0]
    expect(writtenConfig['stylelint.validate']).toEqual(expect.arrayContaining(['vue', 'css', 'scss']))
  })

  it('updates settings when the file exists', async () => {
    exists = true
    readValue = '{"stylelint.validate":["scss"],"eslint.validate":["javascript","css","scss","markdown"]}'
    parse.mockReturnValueOnce({
      'stylelint.validate': ['scss'],
      'eslint.validate': ['javascript', 'css', 'scss', 'markdown'],
    })

    await import('@/cli')

    expect(readFileSync).toHaveBeenCalledWith(vscodeSettingsPath, 'utf8')
    expect(parse).toHaveBeenCalledWith(readValue)
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('update'))
    expect(stringify).toHaveBeenCalled()
  })

  it('handles falsy parsed config values', async () => {
    exists = true
    readValue = 'null'
    parse.mockReturnValueOnce(null)

    await import('@/cli')

    const firstCall = stringify.mock.calls.at(0)
    if (!firstCall) {
      throw new Error('Expected stringify to be called')
    }
    const writtenConfig = firstCall[0]
    expect(writtenConfig['stylelint.validate']).toEqual(expect.arrayContaining(['vue', 'css', 'scss']))
  })
})
