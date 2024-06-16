import { ActionPanel, Action, Detail, getPreferenceValues, List, showToast, Toast, open } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState, useEffect } from "react";
import Env from "../../../src/js/modules/Env.js";
import SuggestionsGetter from "../../../src/js/modules/SuggestionsGetter.js";

interface Preferences {
  language: string;
  country: string;
  github?: string;
}

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
  const preferences = getPreferenceValues<Preferences>();
  const [searchText, setSearchText] = useState("");
  const [env, setEnv] = useState<Env | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isShowingDetail, setIsShowingDetail] = useState(false);

  const { data, isLoading, error } = useFetch("https://trovu.net/data.json", {
    parseResponse: async (response) => {
      const data = await response.json();
      const builtEnv = new Env({ data: data });
      await builtEnv.populate({ language: preferences.language, country: preferences.country });
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
        const query =
          `${(!suggestion.reachable ? suggestion.namespace + "." : "") + suggestion.keyword} ${example.arguments ?? ""}`.trim();
        return `- [\`${query}\`](https://trovu.net/${env.buildProcessUrl({ query: query })}) ${example.description}`;
      })
      .join("\n");
    const description = suggestion.description ? `_${suggestion.description}_` : "";

    return `
## ${suggestion.title}

\`${(!suggestion.reachable ? suggestion.namespace + "." : "") + (suggestion.keyword + " " + suggestion.argumentString).trim()}\`

${description}
    
${examples ? examples : ""}
    `;
  };

  const toggleDetail = () => {
    setIsShowingDetail((prev) => !prev);
  };

  const customActions = (suggestion: Suggestion) => (
    <ActionPanel>
      <Action
        title="Send query"
        onAction={async () => {
          if (!env) return;
          await open(`https://trovu.net/${env.buildProcessUrl({ query: searchText })}`);
        }}
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

  if (!env || !env.data || !env.data.shortcuts) {
    return <List searchBarPlaceholder="Search shortcuts...">Failed to load dat2a</List>;
  }

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search shortcuts..."
      // isShowingDetail={isShowingDetail}
      isShowingDetail
      throttle
    >
      {!searchText && (
        <List.Section>
          <List.Item
            title="Welcome"
            detail={
              <List.Item.Detail
                markdown={`
# Welcome to trovu.net

_Web search as if from your command line: Trovu's shortcuts take you directly to the search results of other sites.
[Read more](https://trovu.net/docs/), watch a [video](https://www.youtube.com/watch?v=gOUNhCion9M), or try the examples:_

- [\`g berlin\`](https://trovu.net/process/index.html?#query=g%20berlin) Search Google for Berlin
- [\`w berlin\`](https://trovu.net/process/index.html?#query=w%20berlin) Go to the Wikipedia article about Berlin
- [\`fr.w berlin\`](https://trovu.net/process/index.html?#query=fr.w%20berlin) Go to the French Wikipedia article about Berlin
- [\`gd london, liverpool\`](https://trovu.net/process/index.html?#query=gd%20london%2C%20liverpool) Search for a route on Google Directions from London to Liverpool
- [\`gfl ber, ibiza, fr, 28\`](https://trovu.net/process/index.html?#query=gfl%20ber%2C%20ibiza%2C%20fr%2C%2028) Search on Google Flights for a flight from Berlin to Ibiza, leaving next Friday, returning on the 28th
- [\`wg berlin\`](https://trovu.net/process/index.html?#query=wg%20berlin) Search Wikipedia for all mentions of "berlin" via Google
- [\`npm csv\`](https://trovu.net/process/index.html?#query=npm%20csv) Search the Node Package Manager for modules projects about CSV
`}
              />
            }
          />
          <List.Item
            title="Namespaces"
            detail={
              <List.Item.Detail
                markdown={`
## Namespaces

Every shortcut belongs to exactly one namespace. There are namespaces for:

- languages (e.g. \`en\`, \`de\`, \`fr\`)
- countries (e.g. \`.us\`, \`.gb\`, \`.de\`)
- dictionaries (e.g. \`leo\` for leo.org, \`dcm\` for dict.com)

When searching shortcuts, filter for shortcuts of a namespace by \`ns:en\`, \`ns:de\`, \`ns:fr\`, etc.

When calling a query, ensure a namespace is used by prefixing your query, e.g. \`en.w berlin\`.

Read more about [namespaces](https://trovu.net/docs/shortcuts/namespaces/).
`}
              />
            }
          />
          <List.Item
            title="Tags"
            detail={
              <List.Item.Detail
                markdown={`
## Tags

Tags are only used for information purposes. They do not affect which shortcut is used for a query.

When searching shortcuts, filter for shortcuts with a tag by \`tag:web-search\`, \`tag:video\`, \`tag:language\`, etc.
`}
              />
            }
          />
          <List.Item
            title="Advanced"
            detail={
              <List.Item.Detail
                markdown={`
## Advanced

You can [create and manage your own user shortcuts and set advanced settings](https://trovu.net/docs/users/advanced/) via GitHub, or a self-hosted config file.

Once you have set up Trovu via your GitHub account, set your username in the extension preferences.

`}
              />
            }
          />
        </List.Section>
      )}
      <List.Section>
        {suggestions.map((suggestion) => {
          const title =
            suggestion.title +
            (suggestion.tags?.includes("is-affiliate") ? " 🤝" : "") +
            (suggestion.tags?.includes("needs-userscript") ? " 🧩" : "");
          return (
            <List.Item
              id={`${suggestion.namespace}.${suggestion.keyword} ${suggestion.argumentCount}`}
              key={`${suggestion.namespace}.${suggestion.keyword}.${suggestion.argumentCount}`}
              title={suggestion.keyword}
              subtitle={suggestion.argumentString}
              accessories={[
                { text: title },
                {
                  tag: {
                    value: suggestion.namespace,
                    color: suggestion.reachable ? "rgb(255, 53, 69)" : "rgb(220, 220, 220)",
                  },
                },
              ]}
              detail={
                isShowingDetail ||
                (true && (
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
                ))
              }
              actions={customActions(suggestion)}
            />
          );
        })}
        {searchText && suggestions.length === 0 && (
          <List.Item title="Press Enter to submit the query" actions={customActions(null)} />
        )}
      </List.Section>
    </List>
  );
}
