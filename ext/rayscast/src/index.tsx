import { ActionPanel, Action, Color, List, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState, useEffect, useMemo } from "react";
import Env from "../../../src/js/modules/Env.js";
import SuggestionsGetter from "../../../src/js/modules/SuggestionsGetter.js";

interface Shortcut {
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
  const [filteredShortcuts, setFilteredShortcuts] = useState<Shortcut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { data } = useFetch("https://trovu.net/data.json", {
    parseResponse: async (response) => {
      const start = Date.now();
      const data = await response.json();
      const end = Date.now();
      console.log(`Data fetch took ${end - start}ms`);
      const builtEnv = new Env({ data });
      await builtEnv.populate({ language: "en", country: "us" });
      return builtEnv;
    },
    onError: (error) => {
      console.error("Error fetching data:", error);
      setError(error);
      showToast(Toast.Style.Failure, "Failed to load data");
      setIsLoading(false);
    },
  });

  useEffect(() => {
    if (data) {
      setEnv(data);
      setIsLoading(false);
    }
  }, [data]);

  const debouncedSearchText = useDebounce(searchText, 300);

  const filterShortcuts = useMemo(() => {
    if (!env) return [];
    console.time("getSuggestions");
    const suggestionsGetter = new SuggestionsGetter(env);
    const suggestions = suggestionsGetter.getSuggestions(debouncedSearchText).slice(0, 50);
    console.timeEnd("getSuggestions");
    return suggestions;
  }, [debouncedSearchText, env]);

  useEffect(() => {
    setFilteredShortcuts(filterShortcuts);
  }, [filterShortcuts]);

  const handleEnterKey = () => {
    showToast(Toast.Style.Success, "Enter key pressed", `Search text: ${searchText}`);
    console.log("Enter key pressed with search text:", searchText);
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
      <List.Section title="Results" subtitle={`${filteredShortcuts.length}`}>
        {filteredShortcuts.map((shortcut) => (
          <List.Item
            key={`${shortcut.namespace}.${shortcut.keyword}.${shortcut.argumentCount}`}
            title={shortcut.title}
            subtitle={shortcut.keyword}
            accessories={[{ text: shortcut.title }, { tag: { value: shortcut.namespace, color: Color.Red } }]}
            actions={customActions}
          />
        ))}
        {searchText && filteredShortcuts.length === 0 && (
          <List.Item title="Press Enter to search" actions={customActions} />
        )}
      </List.Section>
    </List>
  );
}

function NewView({ searchText }: { searchText: string }) {
  return (
    <List>
      <List.Item title={`You searched for: ${searchText}`} />
    </List>
  );
}
