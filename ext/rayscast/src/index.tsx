import { ActionPanel, Action, Color, List, showToast, Toast, open } from "@raycast/api";
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

  const { data, isLoading, error } = useFetch("https://trovu.net/data.json", {
    parseResponse: async (response) => {
      console.log("Fetching data..."); // Debugging log
      const data = await response.json();
      const builtEnv = new Env({ data: data });
      await builtEnv.populate({ language: "en", country: "us" });
      return builtEnv;
    },
    onError: (error) => {
      console.error("Error fetching data:", error); // Debugging log
      showToast(Toast.Style.Failure, "Failed to load data");
    },
  });

  useEffect(() => {
    if (data) {
      setEnv(data);
    }
  }, [data]);

  useEffect(() => {
    console.log("Search text changed:", searchText); // Debugging log
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

  const customActions = (
    <ActionPanel>
      <Action title="Execute Enter Action" onAction={handleEnterKey} />
    </ActionPanel>
  );

  if (error) {
    return <List searchBarPlaceholder="Search shortcuts...">Failed to load data</List>;
  }

  return (
    <List isLoading={isLoading} onSearchTextChange={setSearchText} searchBarPlaceholder="Search shortcuts..." throttle>
      <List.Section title="Results" subtitle={`${suggestions.length}`}>
        {suggestions.map((shortcut) => (
          <List.Item
            key={`${shortcut.namespace}.${shortcut.keyword}.${shortcut.argumentCount}`}
            title={shortcut.title}
            subtitle={shortcut.keyword}
            accessories={[{ text: shortcut.title }, { tag: { value: shortcut.namespace, color: Color.Red } }]}
            actions={customActions}
          />
        ))}
        {searchText && suggestions.length === 0 && <List.Item title="Press Enter to search" actions={customActions} />}
      </List.Section>
    </List>
  );
}
