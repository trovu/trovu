import { ActionPanel, Action, Color, List, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState, useEffect } from "react";
import Env from "../../../src/js/modules/Env.js";
import SuggestionsGetter from "../../../src/js/modules/SuggestionsGetter.js";

interface Shortcut {
  keyword: string;
  namespace: string;
  title: string;
  url: string;
  description?: string;
  deprecated?: boolean;
  removed?: boolean;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [filteredShortcuts, setFilteredShortcuts] = useState<Shortcut[]>([]);
  // console.log("Environment:", env); // Debugging log

  const { env, isLoading, error } = useFetch("https://trovu.net/data.json", {
    parseResponse: async (response) => {
      const data = await response.json();

      const builtEnv = new Env({ data: data });
      await env.populate({ language: "en", country: "us" });
      return env;
      // const suggestionsGetter = new SuggestionsGetter(env);
      // const suggestions = suggestionsGetter.getSuggestions("g");
      // console.log("Suggestions:", suggestions); // Debugging log
      return builtEnv;
    },
  });

  useEffect(() => {
    if (env) {
      // console.log("Setting shortcuts data:", data); // Debugging log
      setShortcuts(env);
      setFilteredShortcuts(env);
    }
  }, [env]);

  useEffect(() => {
    filterShortcuts();
  }, [searchText, shortcuts]);

  const filterShortcuts = () => {
    if (searchText.length === 0) {
      console.log("Resetting filteredShortcuts to all shortcuts"); // Debugging log
      setFilteredShortcuts(shortcuts);
    } else {
      const filtered = shortcuts.filter((shortcut) => shortcut.title.toLowerCase().includes(searchText.toLowerCase()));
      // console.log("Filtered shortcuts:", filtered); // Debugging log
      setFilteredShortcuts(filtered);
    }
  };

  const handleEnterKey = () => {
    // Execute your custom code here
    showToast(Toast.Style.Success, "Enter key pressed", `Search text: ${searchText}`);
    console.log("Enter key pressed with search text:", searchText);
    // Example of pushing a new view
    // push(<NewView searchText={searchText} />);
  };

  const customActions = (
    <ActionPanel>
      <Action title="Execute Enter Action" onAction={handleEnterKey} />
    </ActionPanel>
  );

  if (error) {
    console.error("Error fetching data:", error); // Debugging log
    return <List searchBarPlaceholder="Search shortcuts...">Failed to load data</List>;
  }

  return (
    <List isLoading={isLoading} onSearchTextChange={setSearchText} searchBarPlaceholder="Search shortcuts..." throttle>
      <List.Section title="Results" subtitle={`${filteredShortcuts.length}`}>
        {filteredShortcuts.map((shortcut) => (
          <List.Item
            key={`${shortcut.namespace}.${shortcut.keyword}`}
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
