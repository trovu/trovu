export type Dict<T = unknown> = Record<string, T>;

export type ContextName = "index" | "process" | "web-ext" | "raycast" | "node";

export interface GitCommitInfo {
  hash: string;
  date: string;
}

export interface GitInfo {
  commit: GitCommitInfo;
}

export interface LoggerLike {
  info(message: string): void;
  warning(message: string): void;
  success?(message: string): void;
  error(message: string): never | void;
}

export interface PlaceholderAttributes {
  type?: string;
  transform?: string;
  encoding?: string;
  output?: string;
  [key: string]: unknown;
}

export type PlaceholderMatchMap = Record<string, PlaceholderAttributes>;
export type PlaceholderMap = Record<string, PlaceholderMatchMap>;

export interface ShortcutExample {
  arguments?: string;
  description?: string;
  query?: string;
  config?: Record<string, string>;
  [key: string]: unknown;
}

export interface ShortcutTestCase {
  arguments?: string;
  expect?: string;
  [key: string]: unknown;
}

export interface DeprecatedAlternative {
  query: string;
}

export interface DeprecatedShortcut {
  alternative: DeprecatedAlternative;
  created?: string;
  [key: string]: unknown;
}

export interface NamespaceDefinition {
  name?: string;
  github?: string;
  url?: string;
  shortcuts?: RawShortcutMap | ShortcutMap;
  [key: string]: unknown;
}

export type NamespaceReference = string | NamespaceDefinition;

export interface ShortcutInclude {
  key?: string;
  namespace?: NamespaceReference;
  [key: string]: unknown;
}

export type RawShortcutInclude = string | ShortcutInclude;

export interface Shortcut {
  url?: string;
  title?: string;
  description?: string;
  tags?: string[];
  include?: ShortcutInclude | ShortcutInclude[];
  deprecated?: DeprecatedShortcut;
  removed?: string;
  examples?: ShortcutExample[];
  tests?: ShortcutTestCase[];
  showOnHome?: number;
  reachable?: boolean;
  namespace?: string;
  key?: string;
  keyword?: string;
  argumentCount?: number;
  argumentString?: string;
  arguments?: Record<string, unknown>;
  status?: string;
  alternative?: string;
  icon?: string;
  [key: string]: unknown;
}

export interface RawShortcutObject extends Omit<Shortcut, "include"> {
  include?: RawShortcutInclude | RawShortcutInclude[] | null;
}

export type RawShortcut = string | RawShortcutObject;
export type RawShortcutMap = Record<string, RawShortcut>;
export type ShortcutMap = Record<string, Shortcut>;

export type NamespaceType = "site" | "user";

export interface NamespaceInfo {
  name?: string;
  github?: string;
  url?: string;
  shortcuts?: ShortcutMap;
  type?: NamespaceType;
  priority?: number;
  [key: string]: unknown;
}

export type NamespaceMap = Record<string, NamespaceInfo>;

export interface TrovuConfig {
  namespaces?: NamespaceReference[];
  language?: string;
  country?: string;
  defaultKeyword?: string;
  url?: Record<string, string>;
  [key: string]: unknown;
}

export interface TrovuTypesData {
  city?: Record<string, Record<string, string>>;
  date?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TrovuData {
  shortcuts?: Record<string, RawShortcutMap>;
  types?: TrovuTypesData;
  config?: TrovuConfig;
  [key: string]: unknown;
}

export interface QueryParseResult {
  query: string;
  keyword: string;
  argumentString: string;
  args: string[];
  extraNamespaceName?: string;
  language?: string;
  country?: string;
  debug?: boolean;
  reload?: boolean;
}

export interface EnvPopulateOptions {
  removeNamespaces?: string[];
}

export const URL_PARAM_DEFINITIONS = {
  alternative: { isBoolean: false },
  configUrl: { isBoolean: false },
  context: { isBoolean: false },
  country: { isBoolean: false },
  debug: { isBoolean: true },
  defaultKeyword: { isBoolean: false },
  github: { isBoolean: false },
  key: { isBoolean: false },
  language: { isBoolean: false },
  namespace: { isBoolean: false },
  query: { isBoolean: false },
  reload: { isBoolean: true },
  status: { isBoolean: false },
} as const;

export type UrlParamName = keyof typeof URL_PARAM_DEFINITIONS;
export const URL_PARAM_NAMES = Object.keys(URL_PARAM_DEFINITIONS) as UrlParamName[];

export interface EnvParams {
  github?: string;
  configUrl?: string;
  language?: string;
  country?: string;
  defaultKeyword?: string;
  debug?: boolean | "1" | 1;
  reload?: boolean | "1" | 1;
  alternative?: string;
  context?: ContextName;
  key?: string;
  namespace?: string;
  status?: RedirectStatus | string;
  query?: string;
  keyword?: string;
  argumentString?: string;
  args?: string[];
  extraNamespaceName?: string;
  namespaces?: NamespaceReference[];
  [key: string]: unknown;
}

export interface EnvLike extends EnvParams {
  query: string;
  keyword?: string;
  argumentString?: string;
  args: string[];
  data?: TrovuData;
  namespaceInfos?: NamespaceMap;
  logger: LoggerLike;
  defaultKeyword?: string;
}

export type RedirectStatus =
  | "found"
  | "not_found"
  | "deprecated"
  | "removed"
  | "not_reachable"
  | "reloaded"
  | "loading"
  | "suspicious";

export interface RedirectResponse {
  status: RedirectStatus | string;
  redirectUrl?: string | false;
  alternative?: string;
  key?: string;
  namespace?: string;
}

export interface SuggestionsMatchGroups {
  showOnHome: Shortcut[];
  keywordFullReachable: Shortcut[];
  keywordFullUnreachable: Shortcut[];
  keywordBeginReachable: Shortcut[];
  keywordBeginUnreachable: Shortcut[];
  titleBeginReachable: Shortcut[];
  titleBeginUnreachable: Shortcut[];
  titleMiddleReachable: Shortcut[];
  titleMiddleUnreachable: Shortcut[];
  tagMiddleReachable: Shortcut[];
  tagMiddleUnreachable: Shortcut[];
  urlMiddleReachable: Shortcut[];
  urlMiddleUnreachable: Shortcut[];
}

export type Suggestion = Shortcut;

export interface SettingsOption {
  key: string;
  name: string;
  emoji?: string;
}
