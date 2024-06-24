// ext/raycast/src/modules.d.ts

declare module "../../../src/js/modules/Env.js" {
  interface Env {
    populate(params: Record<string, string>): Promise<void>;
    data: any; // Replace `any` with the actual type if known
  }

  const Env: Env;
  export default Env;
}

declare module "../../../src/js/modules/SuggestionsGetter.js" {
  interface Suggestion {
    argumentCount: string;
    argumentString: string;
    arguments?: object;
    description?: string;
    examples?: object[];
    key: string;
    keyword: string;
    namespace: string;
    reachable?: boolean;
    tags?: string[];
    title?: string;
    url: string;
  }

  class SuggestionsGetter {
    getSuggestions(query: string): Suggestion[];
  }

  export default SuggestionsGetter;
}
