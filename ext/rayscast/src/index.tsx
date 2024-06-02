import { ActionPanel, Action, List } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState, useEffect } from "react";

interface Shortcut {
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

  // Use useFetch to fetch data once
  const { data, isLoading, error } = useFetch("https://trovu.net/data.json", {
    parseResponse: async (response) => {
      const data = await response.json();
      console.log("Fetched data:", data); // Debugging log

      // Flatten the data structure and filter out deprecated or removed shortcuts
      const flattenedShortcuts = Object.keys(data.shortcuts).flatMap((key) => {
        return Object.values(data.shortcuts[key])
          .filter((item: any) => !item.deprecated && !item.removed)
          .map((item: any) => ({
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
      </List.Section>
    </List>
  );
}

function SearchListItem({ shortcut }: { shortcut: Shortcut }) {
  return (
    <List.Item
      title={shortcut.title}
      subtitle={shortcut.description}
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
