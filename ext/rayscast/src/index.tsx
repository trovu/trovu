import { ActionPanel, Action, Color, List, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState, useEffect } from "react";
import Env from "../../../src/js/modules/Env.js";

interface Shortcut {
  keyword: string;
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
  const env = new Env();
  // console.log("Environment:", env); // Debugging log

  const { data, isLoading, error } = useFetch("https://trovu.net/data.json", {
    parseResponse: async (response) => {
      const data = await response.json();
      // console.log("Fetched data:", data); // Debugging log

      // Flatten the data structure and filter out deprecated or removed shortcuts
      const flattenedShortcuts = Object.keys(data.shortcuts).flatMap((namespace) => {
        return Object.entries(data.shortcuts[namespace])
          .filter(([, item]: [string, any]) => !item.deprecated && !item.removed)
          .map(([key, item]: [string, any]) => ({
            keyword: key,
            namespace: namespace,
            title: item.name || item.title || "No title",
            url: item.url,
            description: item.description || "",
          }));
      });

      // console.log("Flattened shortcuts:", flattenedShortcuts); // Debugging log
      return flattenedShortcuts;
    },
  });

  useEffect(() => {
    if (data) {
      // console.log("Setting shortcuts data:", data); // Debugging log
      setShortcuts(data);
      setFilteredShortcuts(data);
    }
  }, [data]);

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
