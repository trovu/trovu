import { ActionPanel, Action, Detail, getPreferenceValues, List, showToast, Toast, open } from "@raycast/api";
import { useState, useEffect } from "react";
import Env from "../../../src/js/modules/Env.js";
import SuggestionsGetter from "../../../src/js/modules/SuggestionsGetter.js";
import { markdowns } from "./markdowns";

interface Preferences {
  language: string;
  country: string;
  github?: string;
}

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

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [searchText, setSearchText] = useState("");
  const [env, setEnv] = useState<Env | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isShowingDetail, setIsShowingDetail] = useState(true);

  useEffect(() => {
    const initializeEnv = async () => {
      console.log("Initializing Env with preferences:", preferences);
      try {
        // Initialize Env instance
        const builtEnv = new Env({ context: "raycast" });

        // Prepare the params based on preferences
        const params: Record<string, string> = {};
        if (preferences.github) {
          params.github = preferences.github;
        } else {
          params.language = preferences.language;
          params.country = preferences.country;
        }

        // Populate the Env instance with the params
        await builtEnv.populate(params);

        // Set the populated Env instance to the state
        setEnv(builtEnv);
      } catch (error) {
        console.error("Error initializing Env:", error);
        showToast(Toast.Style.Failure, "Failed to initialize environment, check your connection.");
      }
    };

    // Only initialize if env is not already set
    if (!env) {
      initializeEnv();
    }
  }, [preferences]);

  useEffect(() => {
    if (env) filterShortcuts();
  }, [searchText, env]);

  const filterShortcuts = () => {
    if (!env) return;
    const suggestionsGetter = new SuggestionsGetter(env);
    const suggestions = suggestionsGetter.getSuggestions(searchText).slice(0, 50);
    setSuggestions(suggestions);
  };

  const renderSuggestionDetail = (suggestion: Suggestion) => {
    if (!suggestion || !env || typeof env.buildProcessUrl !== "function") return "";
    const examples = suggestion.examples
      ?.map((example) => {
        const query =
          `${(!suggestion.reachable ? suggestion.namespace + "." : "") + suggestion.keyword} ${example.arguments ?? ""}`.trim();
        return `- [\`${query}\`](https://trovu.net/${env.buildProcessUrl({ query })}) ${example.description}`;
      })
      .join("\n");
    return `
## ${suggestion.title}

\`${(!suggestion.reachable ? suggestion.namespace + "." : "") + (suggestion.keyword + " " + suggestion.argumentString).trim()}\`

${suggestion.description ? `_${suggestion.description}_` : ""}
    
${examples || ""}
    `;
  };

  const toggleDetail = () => setIsShowingDetail((prev) => !prev);

  const customActions = (suggestion: Suggestion | null) => (
    <ActionPanel>
      <Action
        title="Send query"
        onAction={async () => {
          if (!env) {
            console.error("action panel: env is null");
            return;
          }
          if (typeof env.buildProcessUrl !== "function") {
            console.error("action panel: env.buildProcessUrl is not a function");
            return;
          }
          await open(`https://trovu.net/${env.buildProcessUrl({ query: searchText })}`);
        }}
      />
      <Action
        title={isShowingDetail ? "Hide Details" : "Show Details"}
        onAction={toggleDetail}
        shortcut={{ modifiers: [], key: "tab" }}
      />
      {suggestion && suggestion.namespace && suggestion.namespace.length <= 3 && (
        <Action.OpenInBrowser
          title="Edit shortcut"
          url={`https://github.com/trovu/trovu/search?q=${suggestion.keyword}+${suggestion.argumentCount}+path%3Adata/shortcuts/${suggestion.namespace}.yml`}
        />
      )}
      {suggestion && suggestion.namespace && suggestion.namespace.length <= 3 && (
        <Action.OpenInBrowser
          title="Report problem"
          url={`https://github.com/trovu/trovu-web/issues/new?title=Problem%20with%20shortcut%20%60${suggestion.namespace}.${suggestion.keyword}%20${suggestion.argumentCount}%60`}
        />
      )}
    </ActionPanel>
  );

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
      throttle
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
                              title="Needs userscript"
                              text="yes"
                              target="https://trovu.net/docs/shortcuts/tags/#needs-userscript"
                            />
                          </>
                        )}
                        {suggestion.tags?.includes("is-affiliate") && (
                          <>
                            <List.Item.Detail.Metadata.Separator />
                            <List.Item.Detail.Metadata.Link
                              title="Affiliate shortcut"
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
