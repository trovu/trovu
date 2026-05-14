/** @module Suggestions */
import QueryParser from "../QueryParser";
import SuggestionsGetter from "../SuggestionsGetter";
import "@fortawesome/fontawesome-free/css/all.min.css";
import jsyaml from "js-yaml";
import type { EnvLike, ShortcutExample, Suggestion } from "../../types";
import type Home from "../Home";

export default class Suggestions {
  env: EnvLike;
  home: Home;
  queryInput: HTMLInputElement;
  suggestionsDiv: HTMLElement;
  helpDiv: HTMLElement;
  selected: number;
  suggestions: Suggestion[];
  suggestionsList?: HTMLUListElement;
  query = "";
  updateSuggestionsTimeout?: ReturnType<typeof setTimeout>;

  constructor(querySelector: string, suggestionsSelector: string, home: Home) {
    this.env = home.env;
    this.home = home;
    const queryInput = document.querySelector<HTMLInputElement>(querySelector);
    const suggestionsDiv = document.querySelector<HTMLElement>(suggestionsSelector);
    const helpDiv = document.querySelector<HTMLElement>("#help");
    if (!queryInput || !suggestionsDiv || !helpDiv) {
      throw new Error("Missing suggestions UI elements.");
    }
    this.queryInput = queryInput;
    this.suggestionsDiv = suggestionsDiv;
    this.helpDiv = helpDiv;
    this.selected = -1;
    this.suggestions = [];
    this.setListeners();
    this.updateSuggestions();
  }

  updateSuggestions = () => {
    this.query = this.queryInput.value;
    const suggestionsGetter = new SuggestionsGetter(this.env);
    this.suggestions = suggestionsGetter.getSuggestions(this.query).slice(0, 500);
    this.renderSuggestions(this.suggestions);
  };

  setListeners() {
    this.queryInput.addEventListener("input", () => {
      this.selected = -1;
      if (this.updateSuggestionsTimeout) clearTimeout(this.updateSuggestionsTimeout);
      this.updateSuggestionsTimeout = setTimeout(() => this.updateSuggestions(), 100);
    });

    this.queryInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        this.selected = Math.max(0, this.selected - 1);
        this.updateSuggestions();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        this.selected = Math.min(this.suggestions.length - 1, this.selected + 1);
        this.updateSuggestions();
      } else if (e.key === "Enter") {
        this.pick(e);
      }
    });
  }

  renderSuggestions(suggestions: Suggestion[]) {
    this.suggestionsDiv.innerHTML = "";
    this.helpDiv.textContent = this.query
      ? suggestions.length === 0
        ? "No matching shortcuts found."
        : "Type ⬇️ / ⬆️ to navigate, ↵ to select."
      : "";

    if (suggestions.length === 0) return;

    this.suggestionsList = document.createElement("ul");
    this.suggestionsDiv.appendChild(this.suggestionsList);

    const fragment = document.createDocumentFragment();
    suggestions.forEach((suggestion, index) => {
      fragment.appendChild(this.renderSuggestion(suggestion, index));
    });

    this.suggestionsList.appendChild(fragment);

    const selectedLi = this.suggestionsList.querySelector('li[aria-selected="true"]') as HTMLElement;
    if (selectedLi) {
      this.ensureElementIsVisibleInContainer(selectedLi, this.suggestionsDiv);
    } else {
      this.suggestionsDiv.scrollTop = 0;
    }
  }

  renderSuggestion(suggestion: Suggestion, index: number): HTMLLIElement {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", index === this.selected ? "true" : "false");

    li.append(
      this.getMain(suggestion),
      this.getExamples(suggestion),
      // document.createElement("hr"),
      this.getDescription(suggestion),
      this.getUrl(suggestion),
      this.hasTag(suggestion, "needs-userscript") ? this.getNeedsUserscript() : "",
      this.hasTag(suggestion, "is-affiliate") ? this.getIsAffiliate() : "",
      this.getTags(suggestion),
      this.getTools(suggestion),
    );

    li.addEventListener("click", () => this.select(index));

    return li;
  }

  getMain(suggestion: Suggestion): HTMLDivElement {
    const { reachable, keyword, argumentString, title, url, namespace } = suggestion;
    let displayTitle = title || url;
    if (this.hasTag(suggestion, "needs-userscript")) displayTitle += " 🧩";
    if (this.hasTag(suggestion, "is-affiliate")) displayTitle += " 🤝";

    const container = document.createElement("div");
    container.className = reachable ? "main" : "main unreachable";

    const left = this.createSpan("left");
    left.append(this.createSpan("keyword", keyword), this.createSpan("argument-names", argumentString));

    const right = this.createSpan("right");
    const namespaceSpan = this.createSpan("namespace", namespace);
    namespaceSpan.style.cursor = "pointer";
    right.append(this.createSpan("title", displayTitle), namespaceSpan);

    container.append(left, right);

    container.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).classList.contains("namespace")) {
        this.handleTagOrNamespaceClick(e, `ns:${namespace}`);
      }
    });

    return container;
  }

  getDescription({ description }: Suggestion): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "description";
    if (description) {
      container.append(
        this.createSpan("icon", "ⓘ"),
        document.createTextNode(" "),
        this.createSpan("text", description),
      );
    }
    return container;
  }

  getTags(suggestion: Suggestion): HTMLElement | string {
    const { tags } = suggestion;
    const container = document.createElement("div");
    container.className = "tags";
    if (Array.isArray(tags) && tags.length) {
      tags.forEach((tag) => {
        container.appendChild(this.createSpan("tag", tag));
      });
    } else {
      return "";
    }
    container.addEventListener("click", (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("tag")) {
        this.handleTagOrNamespaceClick(e, `tag:${target.textContent}`);
      }
    });
    return container;
  }

  getExamples(suggestion: Suggestion): HTMLElement | DocumentFragment {
    const { examples, reachable, namespace, keyword } = suggestion;
    if (!Array.isArray(examples)) return document.createDocumentFragment();

    const container = document.createElement("div");
    container.className = "examples";
    examples
      .filter((ex) => !this.shouldSkipExample(ex))
      .forEach((ex) => {
        const left = this.createSpan("left");
        const query = document.createElement("a");
        query.href = "#";
        query.className = "query";
        if (!reachable) query.appendChild(document.createTextNode(`${namespace}.`));
        const keywordElement = document.createElement("b");
        keywordElement.textContent = keyword;
        query.appendChild(keywordElement);
        if (ex.arguments) query.appendChild(document.createTextNode(` ${ex.arguments}`));

        left.append(query, document.createTextNode(" → "), this.createSpan("description", ex.description));
        container.appendChild(left);
      });

    container.addEventListener("click", (e) => {
      const link = (e.target as HTMLElement).closest(".query");
      if (link) {
        e.preventDefault();
        this.queryInput.value = link.textContent || "";
        this.home.submitQuery();
      }
    });

    return container;
  }

  getUrl(suggestion: Suggestion): HTMLDivElement {
    const div = document.createElement("div");
    div.className = "url";

    const icon = document.createElement("span");
    icon.className = "icon";
    icon.textContent = "🔗 ";

    const link = document.createElement("a");
    link.href = suggestion.url;
    link.textContent = suggestion.url;

    div.append(icon, link);

    return div;
  }

  getNeedsUserscript() {
    const div = document.createElement("div");
    div.className = "needs-userscript";
    div.append(
      document.createTextNode("🧩 Needs the "),
      this.createLink(`${this.env.data.config.url.docs}shortcuts/userscripts/`, "userscript"),
      document.createTextNode(" to be installed."),
    );
    return div;
  }

  getIsAffiliate() {
    const div = document.createElement("div");
    div.className = "is-affiliate";
    div.append(
      document.createTextNode("🤝 "),
      this.createLink(`${this.env.data.config.url.docs}shortcuts/tags/#is-affiliate`, "Affiliate"),
      document.createTextNode(" shortcut, we get paid for it."),
    );
    return div;
  }

  getTools(suggestion: Suggestion): HTMLDivElement {
    const div = document.createElement("div");
    div.className = "tools";
    const isSite = this.env.namespaceInfos[suggestion.namespace].type === "site";

    if (isSite) {
      const reportTitle = encodeURIComponent(
        `Problem with shortcut \`${suggestion.namespace}.${suggestion.keyword} ${suggestion.argumentCount}\``,
      );
      div.append(
        this.createButtonLink(
          `https://github.com/trovu/trovu/blob/master/data/shortcuts/${suggestion.namespace}.yml`,
          "✍️ Edit",
          true,
        ),
        document.createTextNode("  "),
        this.createButtonLink(`https://github.com/trovu/trovu/issues/new?title=${reportTitle}`, "🔧 Report", true),
        document.createTextNode("  "),
      );
    }

    const copyYaml = this.createButtonLink("#", "📋 Copy YAML");
    copyYaml.classList.add("copy-yaml");
    div.appendChild(copyYaml);
    div.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("copy-yaml")) {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(this.getYaml(suggestion));
        target.textContent = "Copied.";
      }
    });

    return div;
  }

  createSpan(className: string, text: unknown = "") {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = String(text ?? "");
    return span;
  }

  createLink(href: string, text: string) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    return link;
  }

  createButtonLink(href: string, text: string, openInNewTab = false) {
    const link = this.createLink(href, text);
    link.className = "btn btn-sm btn-outline-secondary";
    if (openInNewTab) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    return link;
  }

  // --- Helper & logic methods stay mostly the same but cleaned up ---

  select(index: number) {
    this.selected = this.selected === index ? -1 : index;
    this.updateSuggestions();
    this.queryInput.focus();
  }

  hasTag(suggestion: Suggestion, tag: string): boolean {
    return Array.isArray(suggestion.tags) && suggestion.tags.includes(tag);
  }

  handleTagOrNamespaceClick(event: Event, query: string) {
    event.stopPropagation();
    this.queryInput.value = query;
    this.queryInput.focus();
    this.queryInput.dispatchEvent(new Event("input"));
  }

  shouldSkipExample(example: ShortcutExample): boolean {
    if (!example.config) return false;
    return ["language", "country"].some((prop) => example.config[prop] && example.config[prop] !== this.env[prop]);
  }

  getYaml(suggestion: Suggestion): string {
    const shortcut = { [suggestion.key]: JSON.parse(JSON.stringify(suggestion)) };
    const key = suggestion.key;
    ["argumentCount", "argumentString", "arguments", "include", "key", "keyword", "namespace", "reachable"].forEach(
      (prop) => {
        delete shortcut[key][prop];
      },
    );
    return jsyaml.dump(shortcut, { noArrayIndent: true, lineWidth: -1 });
  }

  pick(event: Event) {
    if (this.selected === -1) return;
    event.preventDefault();
    const suggestion = this.suggestions[this.selected];
    const input = QueryParser.parse(this.queryInput.value);

    const prefix = suggestion.reachable ? "" : `${suggestion.namespace}.`;
    this.queryInput.value = `${prefix}${suggestion.keyword} ${input.argumentString}`;
    this.selected = -1;
    this.updateSuggestions();
  }

  ensureElementIsVisibleInContainer(element: HTMLElement, container: HTMLElement) {
    const fadeOutHeight = 60;
    const elementBottom = element.offsetTop + element.offsetHeight;
    if (elementBottom > container.scrollTop + container.clientHeight - fadeOutHeight) {
      container.scrollTop = elementBottom - container.clientHeight + fadeOutHeight;
    } else if (element.offsetTop < container.scrollTop) {
      container.scrollTop = element.offsetTop;
    }
  }
}
