import { ActionPanel, Action, Detail, getPreferenceValues, List, showToast, Toast, open } from "@raycast/api";
import { useFetch } from "@raycast/utils";
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
  const [isShowingDetail, setIsShowingDetail] = useState(false);

  const { data, isLoading, error } = useFetch("https://trovu.net/data.json", {
    parseResponse: async (response) => {
      const data = await response.json();
      const builtEnv = new Env({ data: data });
      const params = {};
      if (preferences.github) {
        params["github"] = preferences.github;
      } else {
        params["language"] = preferences.language;
        params["country"] = preferences.country;
      }
      await builtEnv.populate(params);
      // TODO: Fix this
      // await builtEnv.populate({ language: preferences.language, country: preferences.country, github: "" });
      // console.log({ language: preferences.language, country: preferences.country });
      // console.log(preferences);
      // await builtEnv.populate(preferences);
      return builtEnv;
    },
    onError: (error) => {
      console.error("Error fetching data:", error);
      showToast(Toast.Style.Failure, "Failed to load data from trovu.net, check your connection.");
    },
  });

  useEffect(() => {
    if (data) {
      console.log("begin setenv, typeof env.buildprocessurl", typeof env?.buildProcessUrl);
      setEnv(data);
      console.log("end begin setenv, typeof env.buildprocessurl", typeof env?.buildProcessUrl);
    }
  }, [data]);

  useEffect(() => {
    if (env) {
      filterShortcuts();
    }
  }, [searchText, env]);

  const filterShortcuts = () => {
    if (!env) return;
    const suggestionsGetter = new SuggestionsGetter(env);
    const suggestions = suggestionsGetter.getSuggestions(searchText).slice(0, 50);
    setSuggestions(suggestions);
  };

  const renderSuggestionDetail = (suggestion: Suggestion) => {
    if (!suggestion) {
      console.error("render sugg detail: suggestion is null");
      return "";
    }
    if (!env) {
      console.error("render sugg detail: env is null");
      return "";
    }
    if (typeof env.buildProcessUrl !== "function") {
      console.error("render sugg detail: env.buildProcessUrl is not a function");
      return "";
    }

    const examples = suggestion.examples
      ?.map((example) => {
        const query =
          `${(!suggestion.reachable ? suggestion.namespace + "." : "") + suggestion.keyword} ${example.arguments ?? ""}`.trim();
        return `- [\`${query}\`](https://trovu.net/${env.buildProcessUrl({ query: query })}) ${example.description}`;
      })
      .join("\n");
    const description = suggestion.description ? `_${suggestion.description}_` : "";

    return `
## ${suggestion.title}

\`${(!suggestion.reachable ? suggestion.namespace + "." : "") + (suggestion.keyword + " " + suggestion.argumentString).trim()}\`

${description}
    
${examples ? examples : ""}
    `;
  };

  const toggleDetail = () => {
    setIsShowingDetail((prev) => !prev);
  };

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

  if (error) {
    return (
      <List searchBarPlaceholder="Search shortcuts...">
        <List.EmptyView title="Failed to load data" />
      </List>
    );
  }

  if (!env || !env.data || !env.data.shortcuts) {
    return (
      <List searchBarPlaceholder="Search shortcuts...">
        <List.EmptyView title="Failed to load environment" />
      </List>
    );
  }

  console.log("env", typeof env);
  console.log("env.buildprocessurl", typeof env.buildProcessUrl);

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Enter a shortcut query here. Type a letter to get suggestions..."
      // isShowingDetail={isShowingDetail}
      isShowingDetail
      throttle
    >
      {!searchText && (
        <List.Section>
          <List.Item title="Welcome" detail={<List.Item.Detail markdown={markdowns.welcome} />} />
          <List.Item title="Namespaces" detail={<List.Item.Detail markdown={markdowns.namespaces} />} />
          <List.Item title="Tags" detail={<List.Item.Detail markdown={markdowns.tags} />} />
          <List.Item title="Advanced" detail={<List.Item.Detail markdown={markdowns.advanced} />} />
        </List.Section>
      )}
      {env && env.data && suggestions.length > 0 && typeof env.buildProcessUrl === "function" ? (
        <List.Section>
          {suggestions.map((suggestion) => {
            const title =
              suggestion.title +
              (suggestion.tags?.includes("is-affiliate") ? " 🤝" : "") +
              (suggestion.tags?.includes("needs-userscript") ? " 🧩" : "");
            return (
              <List.Item
                id={`${suggestion.namespace}.${suggestion.keyword} ${suggestion.argumentCount}`}
                key={`${suggestion.namespace}.${suggestion.keyword}.${suggestion.argumentCount}`}
                title={suggestion.keyword}
                subtitle={suggestion.argumentString}
                accessories={[
                  { text: title },
                  {
                    tag: {
                      value: suggestion.namespace,
                      color: suggestion.reachable ? "rgb(255, 53, 69)" : "rgb(220, 220, 220)",
                    },
                  },
                ]}
                detail={
                  isShowingDetail ||
                  (true && (
                    <List.Item.Detail
                      markdown={renderSuggestionDetail(suggestion)}
                      metadata={
                        <List.Item.Detail.Metadata>
                          <List.Item.Detail.Metadata.Label title="URL" text={suggestion.url} />
                          {suggestion.tags && suggestion.tags.length > 0 && (
                            <List.Item.Detail.Metadata.TagList title="Tags">
                              {suggestion.tags.map((tag, index) => (
                                <List.Item.Detail.Metadata.TagList.Item key={index} text={tag} color={"#ffc107"} />
                              ))}
                            </List.Item.Detail.Metadata.TagList>
                          )}
                          {suggestion.tags && suggestion.tags.includes("needs-userscript") && (
                            <>
                              <List.Item.Detail.Metadata.Separator />
                              <List.Item.Detail.Metadata.Link
                                title="Needs userscript"
                                text="yes"
                                target="https://trovu.net/docs/shortcuts/tags/#needs-userscript"
                              />
                            </>
                          )}
                          {suggestion.tags && suggestion.tags.includes("is-affiliate") && (
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
                  ))
                }
                actions={customActions(suggestion)}
              />
            );
          })}
          {searchText && suggestions.length === 0 && (
            <List.Item title="Press Enter to submit the query" actions={customActions(null)} />
          )}
        </List.Section>
      ) : (
        <List.Section>
          <List.Item title="Loading environment..." />
        </List.Section>
      )}
    </List>
  );
}
