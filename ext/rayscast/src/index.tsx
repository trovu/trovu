import { ActionPanel, Action, List, showToast, Toast, open } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState, useEffect, useCallback } from "react";
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

  const renderSuggestionDetail = (suggestion: Suggestion) => {
    return `
### ${suggestion.keyword}

**Description:** ${suggestion.description ?? "N/A"}

**Namespace:** ${suggestion.namespace}

**Arguments:** ${JSON.stringify(suggestion.arguments, null, 2) ?? "N/A"}

**Examples:** ${suggestion.examples?.map((example) => `\`${example}\``).join("\n") ?? "N/A"}

**URL:** [Link](${suggestion.url})
    `;
  };

  const customActions = (
    <ActionPanel>
      <Action title="Send query to Trovu" onAction={handleEnterKey} />
    </ActionPanel>
  );

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      setIsShowingDetail(true);
    } else if (event.key === "ArrowLeft") {
      setIsShowingDetail(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

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
            detail={<List.Item.Detail markdown={renderSuggestionDetail(suggestion)} />}
            actions={customActions}
          />
        ))}
        {searchText && suggestions.length === 0 && <List.Item title="Press Enter to search" actions={customActions} />}
      </List.Section>
    </List>
  );
}
