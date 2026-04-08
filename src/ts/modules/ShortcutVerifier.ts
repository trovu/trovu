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
    if (shortcut.url && shortcut.arguments && shortcut.argumentCount != Object.keys(shortcut.arguments).length) {
      return `Mismatch in argumentCount of key and arguments.length of url in "${shortcut.namespace}.${shortcut.key}".`;
    }
  }
  static checkIfArgCountMatchesWithExamples(shortcut) {
    if (!shortcut.examples) {
      return;
    }
    for (const example of shortcut.examples) {
      if (!example.arguments) {
        continue;
      }
      const exampleArgs = example.arguments.toString().split(",");
      if (shortcut.argumentCount != exampleArgs.length) {
        return `Mismatch in argumentCount of key and arguments.length of example in "${shortcut.namespace}.${shortcut.key}".`;
      }
    }
  }

  static checkIfDeprecatedAlternativeHasMatchingPlaceholders(shortcut) {
    const query = shortcut?.deprecated?.alternative?.query;
    if (!query) {
      return;
    }

    const argCount = Number(shortcut.argumentCount || 0);
    const placeholderTokens = [...query.matchAll(/<([^>]+)>/g)].map((match) => match[1]);

    const errorMessage = `Mismatch in argumentCount of key and placeholders of deprecated alternative query in "${shortcut.namespace}.${shortcut.key}".`;

    // Args but no placeholders:
    if (argCount > 0 && placeholderTokens.length === 0) {
      return errorMessage;
    }

    // Validate each placeholder token:
    for (const token of placeholderTokens) {
      const index = Number(token);
      const isInvalid = !/^\d+$/.test(token) || index < 1 || index > argCount;

      if (isInvalid) return errorMessage;
    }
  }
}
