/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ActionPanel, Action, getPreferenceValues, List, showToast, Toast, open } from "@raycast/api";
import { useState, useEffect } from "react";
import { useCachedState } from "@raycast/utils";
import Env from "./core/src/ts/modules/Env";
import SuggestionsGetter from "./core/src/ts/modules/SuggestionsGetter";
import { markdowns } from "./markdowns";
import { isEqual } from "lodash";

interface Preferences {
  language: string;
  country: string;
  github?: string;
}

interface Suggestion {
  argumentCount: string;
  argumentString: string;
  arguments?: { [key: string]: object };
  description?: string;
  examples?: {
    arguments?: string;
    description: string;
  }[];
  key: string;
  keyword: string;
  namespace: string;
  reachable?: boolean;
  tags?: string[];
  title?: string;
  url: string;
}

import { useCallback, useMemo } from "react";

export default function Command() {
  const prefs = getPreferenceValues<Preferences>();
  const [cachedPrefs, setCachedPrefs] = useCachedState<Preferences>("prefs");
  const [searchText, setSearchText] = useState<string>("");
  const [env, setEnv] = useCachedState<Env | null>("env", null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isShowingDetail, setIsShowingDetail] = useState<boolean>(true);

  // Memoize buildTrovuUrl to avoid recreating on every render
  const buildTrovuUrl = useCallback(
    (query: string) => {
      const encodedQuery = encodeURIComponent(query);
      const base = "https://trovu.net/process/index.html?#";
      return prefs.github
        ? `${base}github=${prefs.github}&query=${encodedQuery}`
        : `${base}country=${prefs.country}&language=${prefs.language}&query=${encodedQuery}`;
    },
    [prefs],
  );

  // Memoize renderSuggestionDetail
  const renderSuggestionDetail = useCallback(
    (suggestion: Suggestion) => {
      if (!suggestion || !env) return "";
      const examples = suggestion.examples
        ?.map((example) => {
          const query =
            `${(!suggestion.reachable ? suggestion.namespace + "." : "") + suggestion.keyword} ${example.arguments ?? ""}`.trim();
          return `- [\`${query}\`](${buildTrovuUrl(query)}) ${example.description}`;
        })
        .join("\n");
      return `
## ${suggestion.title}

\`${(!suggestion.reachable ? suggestion.namespace + "." : "") + (suggestion.keyword + " " + suggestion.argumentString).trim()}\`

${suggestion.description ? `_${suggestion.description}_` : ""}
    
${examples || ""}
      `;
    },
    [env, buildTrovuUrl],
  );

  // Memoize customActions
  const customActions = useCallback(
    (suggestion: Suggestion | null) => (
      <ActionPanel>
        <Action
          title="Send Query"
          onAction={async () => {
            if (searchText === "reload") {
              showToast(Toast.Style.Animated, "Reloading environment...");
              setEnv(null);
              setSearchText("");
              return;
            }
            Env.fetchLog("raycast", "https://trovu.net/");
            await open(buildTrovuUrl(searchText));
          }}
        />
        <Action
          title={isShowingDetail ? "Hide Details" : "Show Details"}
          onAction={() => setIsShowingDetail((prev) => !prev)}
          shortcut={{ modifiers: [], key: "tab" }}
        />
        {suggestion && suggestion.namespace && suggestion.namespace.length <= 3 && (
          <>
            <Action.OpenInBrowser
              title="Edit Shortcut"
              url={`https://github.com/trovu/trovu/search?q=${suggestion.keyword}+${suggestion.argumentCount}+path%3Adata/shortcuts/${suggestion.namespace}.yml`}
            />
            <Action.OpenInBrowser
              title="Report Problem"
              url={`https://github.com/trovu/trovu/issues/new?title=Problem%20with%20shortcut%20%60${suggestion.namespace}.${suggestion.keyword}%20${suggestion.argumentCount}%60`}
            />
          </>
        )}
      </ActionPanel>
    ),
    [searchText, isShowingDetail, buildTrovuUrl, setEnv],
  );

  // Only rebuild env if prefs changed
  useEffect(() => {
    // Rebuild env if prefs changed or env is null (first load)
    if (isEqual(prefs, cachedPrefs) && env) return;
    setCachedPrefs(prefs);
    let cancelled = false;
    (async () => {
      try {
        const builtEnv = new Env({ context: "raycast" });
        const params: Record<string, string> = prefs.github
          ? { github: prefs.github }
          : { language: prefs.language, country: prefs.country };
        await builtEnv.populate(params, { removeNamespaces: ["dpl", "dcm"] });
        if (!cancelled) setEnv(builtEnv);
      } catch (error) {
        console.error("Error initializing Env:", error);
        showToast(Toast.Style.Failure, "Failed to initialize environment, check your connection.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prefs, setCachedPrefs, setEnv]);

  // Filter suggestions when env or searchText changes
  useEffect(() => {
    if (!env) return;
    const suggestionsGetter = new SuggestionsGetter(env);
    setSuggestions(suggestionsGetter.getSuggestions(searchText).slice(0, 50));
  }, [searchText, env]);

  if (!env || !env.data || !env.data.shortcuts) {
    return (
      <List searchBarPlaceholder="Search shortcuts...">
        <List.EmptyView title="Loading environment..." />
      </List>
    );
  }

  return (
    <List
      isLoading={!env}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Enter a shortcut query here. Type a letter to get suggestions..."
      isShowingDetail={isShowingDetail}
    >
      {!searchText ? (
        <List.Section>
          <List.Item title="Welcome" detail={<List.Item.Detail markdown={markdowns.welcome} />} />
          <List.Item title="Namespaces" detail={<List.Item.Detail markdown={markdowns.namespaces} />} />
          <List.Item title="Tags" detail={<List.Item.Detail markdown={markdowns.tags} />} />
          <List.Item title="Advanced" detail={<List.Item.Detail markdown={markdowns.advanced} />} />
        </List.Section>
      ) : (
        <List.Section>
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <List.Item
                id={`${suggestion.namespace}.${suggestion.keyword} ${suggestion.argumentCount}`}
                key={`${suggestion.namespace}.${suggestion.keyword}.${suggestion.argumentCount}`}
                title={suggestion.keyword}
                subtitle={suggestion.argumentString}
                accessories={[
                  {
                    text:
                      suggestion.title +
                      (suggestion.tags?.includes("is-affiliate") ? " 🤝" : "") +
                      (suggestion.tags?.includes("needs-userscript") ? " 🧩" : ""),
                  },
                  {
                    tag: {
                      value: suggestion.namespace,
                      color: suggestion.reachable ? "rgb(255, 53, 69)" : "rgb(220, 220, 220)",
                    },
                  },
                ]}
                detail={
                  <List.Item.Detail
                    markdown={renderSuggestionDetail(suggestion)}
                    metadata={
                      <List.Item.Detail.Metadata>
                        <List.Item.Detail.Metadata.Label title="URL" text={suggestion.url} />
                        {suggestion.tags && suggestion.tags.length > 0 && (
                          <List.Item.Detail.Metadata.TagList title="Tags">
                            {suggestion.tags.map((tag, index) => (
                              <List.Item.Detail.Metadata.TagList.Item key={index} text={tag} color="#ffc107" />
                            ))}
                          </List.Item.Detail.Metadata.TagList>
                        )}
                        {suggestion.tags?.includes("needs-userscript") && (
                          <>
                            <List.Item.Detail.Metadata.Separator />
                            <List.Item.Detail.Metadata.Link
                              title="🧩 Needs userscript"
                              text="yes"
                              target="https://trovu.net/docs/shortcuts/tags/#needs-userscript"
                            />
                          </>
                        )}
                        {suggestion.tags?.includes("is-affiliate") && (
                          <>
                            <List.Item.Detail.Metadata.Separator />
                            <List.Item.Detail.Metadata.Link
                              title="🤝 Affiliate shortcut"
                              text="yes"
                              target="https://trovu.net/docs/shortcuts/tags/#is-affiliate"
                            />
                          </>
                        )}
                      </List.Item.Detail.Metadata>
                    }
                  />
                }
                actions={customActions(suggestion)}
              />
            ))
          ) : (
            <List.Item title="Press Enter to submit the query" actions={customActions(null)} />
          )}
        </List.Section>
      )}
    </List>
  );
}
