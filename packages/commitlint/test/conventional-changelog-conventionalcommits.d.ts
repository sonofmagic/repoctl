declare module 'conventional-changelog-conventionalcommits' {
  const createPreset: (...args: any[]) => Promise<any>
  export default createPreset
}
