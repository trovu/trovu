import { ActionPanel, Action, Color, List, useNavigation, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState, useEffect } from "react";

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
  const { push } = useNavigation();

  // Use useFetch to fetch data once
  const { data, isLoading, error } = useFetch("https://trovu.net/data.json", {
    parseResponse: async (response) => {
      const data = await response.json();
      console.log("Fetched data:", data); // Debugging log

      // Flatten the data structure and filter out deprecated or removed shortcuts
      const flattenedShortcuts = Object.keys(data.shortcuts).flatMap((namespace) => {
        return Object.entries(data.shortcuts[namespace])
          .filter(([, item]: [string, any]) => !item.deprecated && !item.removed)
          .map(([key, item]: [string, any]) => ({
            key: key,
            namespace: namespace,
            title: item.name || item.title || "No title",
            url: item.url,
            description: item.description || "",
          }));
      });

      console.log("Flattened shortcuts:", flattenedShortcuts); // Debugging log
      return flattenedShortcuts;
    },
  });

  useEffect(() => {
    if (data) {
      console.log("Setting shortcuts data:", data); // Debugging log
      setShortcuts(data);
      setFilteredShortcuts(data);
    }
  }, [data]);

  useEffect(() => {
    if (searchText.length === 0) {
      console.log("Resetting filteredShortcuts to all shortcuts"); // Debugging log
      setFilteredShortcuts(shortcuts);
    } else {
      const filtered = shortcuts.filter((shortcut) =>
        shortcut.title.toLowerCase().includes(searchText.toLowerCase())
      );
      console.log("Filtered shortcuts:", filtered); // Debugging log
      setFilteredShortcuts(filtered);
    }
  }, [searchText, shortcuts]);

  const handleEnterKey = () => {
    // Execute your code here
    showToast(Toast.Style.Success, "Enter key pressed", `Search text: ${searchText}`);
    console.log("Enter key pressed with search text:", searchText);
    push(<NewView searchText={searchText} />);
  };

  if (error) {
    console.error("Error fetching data:", error); // Debugging log
    return <List searchBarPlaceholder="Search shortcuts...">Failed to load data</List>;
  }

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search shortcuts..."
      throttle
    >
      <List.Section title="Results" subtitle={`${filteredShortcuts.length}`}>
        {filteredShortcuts.map((shortcut) => (
          <SearchListItem key={shortcut.url} shortcut={shortcut} />
        ))}
        {searchText && filteredShortcuts.length === 0 && (
          <List.Item
            title="Press Enter to search"
            actions={
              <ActionPanel>
                <Action title="Execute Enter Action" onAction={handleEnterKey} />
              </ActionPanel>
            }
          />
        )}
      </List.Section>
    </List>
  );
}

function SearchListItem({ shortcut }: { shortcut: Shortcut }) {
  return (
    <List.Item
      title={shortcut.title}
      subtitle={shortcut.keyword}
      accessories={[
        { text: shortcut.title },
        { tag: { value: shortcut.namespace, color: Color.Red } },
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open in Browser" url={shortcut.url} />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.CopyToClipboard
              title="Copy URL"
              content={shortcut.url}
              shortcut={{ modifiers: ["cmd"], key: "." }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function NewView({ searchText }: { searchText: string }) {
  return (
    <List>
      <List.Item title={`You searched for: ${searchText}`} />
    </List>
  );
}
