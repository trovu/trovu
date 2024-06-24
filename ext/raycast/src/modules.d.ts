declare module "../../src/js/modules/Env.js" {
  interface Env {
    populate(params: Record<string, string>): Promise<void>;
    data: any; // You should replace `any` with the actual type if known
  }

  export default Env;
}

declare module "../../src/js/modules/SuggestionsGetter.js" {
  import Env from "./Env";

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
    constructor(env: Env);
    getSuggestions(query: string): Suggestion[];
  }

  export default SuggestionsGetter;
}
