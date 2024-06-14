import { ActionPanel, Action, List, showToast, Toast, open } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState, useEffect } from "react";
import Env from "../../../src/js/modules/Env.js";
import SuggestionsGetter from "../../../src/js/modules/SuggestionsGetter.js";

interface Suggestion {
  argumentCount: string;
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
      return builtEnv;
    },
    onError: (error) => {
      console.error("Error fetching data:", error);
      showToast(Toast.Style.Failure, "Failed to load data");
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

  const handleEnterKey = () => {
    showToast(Toast.Style.Success, "Enter key pressed", `Search text: ${encodeURIComponent(searchText)}`);
    open(`https://trovu.net/process/#country=us&language=en&query=${encodeURIComponent(searchText)}`);
  };

  const openEdit = () => {
    open(`https://github.com/`);
  };

  const renderSuggestionDetail = (suggestion: Suggestion) => {
    const examples = suggestion.examples?.map((example) => {
      console.log(example);
      const query = `${suggestion.keyword} ${example.arguments}`.trim();
      return `${query}`;
    });

    const description = suggestion.description ? `_${suggestion.description}_` : "";
    return `
## ${suggestion.title}

${description}

### Examples
- [db b,hh](https://trovu.net/process/#country=us&language=en&query=db%20b%20hh) – Nächster Bus von B nach HH
- [db b,hh](https://trovu.net/process/#country=us&language=en&query=db%20b%20hh) – Nächster Bus von B nach HH
    `;
  };

  const toggleDetail = () => {
    setIsShowingDetail((prev) => !prev);
  };

  const customActions = (suggestion: Suggestion) => (
    <ActionPanel>
      <Action title="Send query to Trovu" onAction={handleEnterKey} />
      <Action
        title={isShowingDetail ? "Hide Details" : "Show Details"}
        onAction={toggleDetail}
        shortcut={{ modifiers: [], key: "tab" }}
      />
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
        {suggestions.map((suggestion) => (
          <List.Item
            key={`${suggestion.namespace}.${suggestion.keyword}.${suggestion.argumentCount}`}
            title={suggestion.keyword}
            subtitle={suggestion.title}
            accessories={[{ tag: { value: suggestion.namespace, color: "rgb(220, 53, 69)" } }]}
            detail={
              isShowingDetail && (
                <List.Item.Detail
                  markdown={renderSuggestionDetail(suggestion)}
                  metadata={
                    <List.Item.Detail.Metadata>
                      <List.Item.Detail.Metadata.Label title="URL" text={suggestion.url} />
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.TagList title="Tags">
                        <List.Item.Detail.Metadata.TagList.Item text="Electric" color={"#eed535"} />
                        <List.Item.Detail.Metadata.TagList.Item text="Electric" color={"#eed535"} />
                      </List.Item.Detail.Metadata.TagList>
                    </List.Item.Detail.Metadata>
                  }
                />
              )
            }
            actions={customActions(suggestion)}
          />
        ))}
        {searchText && suggestions.length === 0 && (
          <List.Item title="Press Enter to search" actions={customActions(null)} />
        )}
      </List.Section>
    </List>
  );
}
