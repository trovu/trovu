// @ts-nocheck
export default class ShortcutVerifier {
  static checkIfHasUrl(shortcut) {
    if (!shortcut.url && !shortcut.deprecated) {
      return `Missing url in ${shortcut.namespace}.${shortcut.key}.`;
    }
  }
  static checkIfHasUrlAndNoInclude(shortcut) {
    if (!shortcut.url && !shortcut.deprecated && !shortcut.include) {
      return `Missing url in ${shortcut.namespace}.${shortcut.key}.`;
    }
  }
  static checkIfArgCountMatches(shortcut) {
    if (shortcut.url && shortcut.argumentCount != Object.keys(shortcut.arguments).length) {
      return `Mismatch in argumentCount of key and arguments.length of url in "${shortcut.namespace}.${shortcut.key}".`;
    }
  }
}
