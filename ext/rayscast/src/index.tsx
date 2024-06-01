import { ActionPanel, Action, List } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState, useEffect } from "react";

interface Shortcut {
  title: string;
  url: string;
  description?: string;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [filteredShortcuts, setFilteredShortcuts] = useState<Shortcut[]>([]);
  
  // Use useFetch to fetch data once
  const { data, isLoading } = useFetch("https://trovu.net/data.json", {
    parseResponse: async (response) => {
      const data = await response.json();
      return data.shortcuts;
    },
  });

  useEffect(() => {
    if (data) {
      setShortcuts(data);
    }
  }, [data]);

  useEffect(() => {
    if (searchText.length === 0) {
      setFilteredShortcuts(shortcuts);
    } else {
      const filtered = shortcuts.filter((shortcut) =>
        shortcut.title.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredShortcuts(filtered);
    }
  }, [searchText, shortcuts]);

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search shortcuts..."
      throttle
    >
      <List.Section title="Results" subtitle={filteredShortcuts.length + ""}>
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
