import { ActionPanel, Action, List, showToast, Toast, open } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState, useEffect } from "react";
import Env from "../../../src/js/modules/Env.js";
import SuggestionsGetter from "../../../src/js/modules/SuggestionsGetter.js";

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
  const [searchText, setSearchText] = useState("");
  const [env, setEnv] = useState<Env | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isShowingDetail, setIsShowingDetail] = useState(false);

  const { data, isLoading, error } = useFetch("https://trovu.net/data.json", {
    parseResponse: async (response) => {
      const data = await response.json();
      const builtEnv = new Env({ data: data });
      await builtEnv.populate({ language: "en", country: "us" });
      // console.log(builtEnv.data.shortcuts.o["acl 1"]);
      return builtEnv;
    },
    onError: (error) => {
      console.error("Error fetching data:", error);
      showToast(Toast.Style.Failure, "Failed to load data from trovu.net, check your connection.");
    },
  });

  useEffect(() => {
    if (data) {
      setEnv(data);
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
    const examples = suggestion.examples
      ?.map((example) => {
        const query = `${suggestion.keyword} ${example.arguments ?? ""}`.trim();
        return `| [${query}](https://trovu.net/${env.buildProcessUrl({ query: query })}) | _${example.description}_ |`;
      })
      .join("\n");
    const description = suggestion.description ? `_${suggestion.description}_` : "";

    return `

## ${suggestion.title}


${description}

${
  examples
    ? `| Example query | …result | 
| -------- | -------- | 
${examples}`
    : ""
}
    `;
  };

  const toggleDetail = () => {
    setIsShowingDetail((prev) => !prev);
  };

  const customActions = (suggestion: Suggestion) => (
    <ActionPanel>
      <Action.OpenInBrowser
        title="Send query"
        url={`https://trovu.net/process/#country=us&language=en&query=${encodeURIComponent(searchText)}`}
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
    return <List searchBarPlaceholder="Search shortcuts...">Failed to load data</List>;
  }

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search shortcuts..."
      throttle
      isShowingDetail={isShowingDetail}
    >
      <List.Section>
        {suggestions.map((suggestion) => {
          const title =
            suggestion.title +
            (suggestion.tags?.includes("is-affiliate") ? " 🤝" : "") +
            (suggestion.tags?.includes("needs-userscript") ? " 🧩" : "");
          return (
            <List.Item
              key={`${suggestion.namespace}.${suggestion.keyword}.${suggestion.argumentCount}`}
              title={suggestion.keyword}
              subtitle={suggestion.argumentString}
              accessories={[{ text: title }, { tag: { value: suggestion.namespace, color: "rgb(220, 53, 69)" } }]}
              detail={
                isShowingDetail && (
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
                        <List.Item.Detail.Metadata.Separator />
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
                )
              }
              actions={customActions(suggestion)}
            />
          );
        })}
        {searchText && suggestions.length === 0 && (
          <List.Item title="Press Enter to search" actions={customActions(null)} />
        )}
      </List.Section>
    </List>
  );
}
