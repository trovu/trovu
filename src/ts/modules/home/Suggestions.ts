/** @module Suggestions */
import QueryParser from "../QueryParser";
import SuggestionsGetter from "../SuggestionsGetter";
import "@fortawesome/fontawesome-free/css/all.min.css";
import jsyaml from "js-yaml";

export default class Suggestions {
  [key: string]: any;

  constructor(querySelector: string, suggestionsSelector: string, home: AnyObject) {
    this.env = home.env;
    this.home = home;
    this.queryInput = document.querySelector(querySelector) as HTMLInputElement;
    this.suggestionsDiv = document.querySelector(suggestionsSelector) as HTMLElement;
    this.helpDiv = document.querySelector("#help") as HTMLElement;
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

  renderSuggestions(suggestions: any[]) {
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

  renderSuggestion(suggestion: AnyObject, index: number) {
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

  getMain(suggestion: AnyObject) {
    const { reachable, keyword, argumentString, title, url, namespace } = suggestion;
    let displayTitle = title || url;
    if (this.hasTag(suggestion, "needs-userscript")) displayTitle += " 🧩";
    if (this.hasTag(suggestion, "is-affiliate")) displayTitle += " 🤝";

    const container = document.createElement("div");
    container.className = `main ${reachable ? "" : "unreachable"}`;
    container.innerHTML = `
      <span class="left">
        <span class="keyword">${keyword}</span>
        <span class="argument-names">${argumentString}</span>
      </span>
      <span class="right">
        <span class="title">${displayTitle}</span>
        <span class="namespace" style="cursor:pointer">${namespace}</span>
      </span>`;

    container.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).classList.contains("namespace")) {
        this.handleTagOrNamespaceClick(e, `ns:${namespace}`);
      }
    });

    return container;
  }

  getDescription({ description }: AnyObject) {
    const container = document.createElement("div");
    container.className = "description";
    container.innerHTML = description ? `<span class="icon">ⓘ</span> <span class="text">${description}</span>` : "";
    return container;
  }

  getTags(suggestion: AnyObject) {
    const { tags } = suggestion;
    const container = document.createElement("div");
    container.className = "tags";
    if (Array.isArray(tags) && tags.length) {
      container.innerHTML = tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
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

  getExamples(suggestion: AnyObject) {
    const { examples, reachable, namespace, keyword } = suggestion;
    if (!Array.isArray(examples)) return document.createDocumentFragment();

    const container = document.createElement("div");
    container.className = "examples";
    container.innerHTML = examples
      .filter((ex) => !this.shouldSkipExample(ex))
      .map((ex) => {
        const query = `${reachable ? "" : namespace + "."}<b>${keyword}</b> ${ex.arguments || ""}`;
        return `
          <span class="left">
          <a href="#" class="query-link">${query}</a>
→ <span class="description">${ex.description}</span>
          </span>
          `;
      })
      .join("");

    container.addEventListener("click", (e) => {
      const link = (e.target as HTMLElement).closest(".query-link");
      if (link) {
        e.preventDefault();
        this.queryInput.value = link.textContent || "";
        this.home.submitQuery();
      }
    });

    return container;
  }

  getUrl(suggestion: AnyObject) {
    const div = document.createElement("div");
    div.className = "url";
    div.innerHTML = `<span class="icon">🔗 </span><span class="text"><a href="${suggestion.url}">${suggestion.url}</a></span>`;
    return div;
  }

  getNeedsUserscript() {
    const div = document.createElement("div");
    div.className = "needs-userscript";
    div.innerHTML = `🧩 Needs the <a href="${this.env.data.config.url.docs}shortcuts/userscripts/">userscript</a> to be installed.`;
    return div;
  }

  getIsAffiliate() {
    const div = document.createElement("div");
    div.className = "is-affiliate";
    div.innerHTML = `🤝 <a href="${this.env.data.config.url.docs}shortcuts/tags/#is-affiliate">Affiliate</a> shortcut, we get paid for it.`;
    return div;
  }

  getTools(suggestion: AnyObject) {
    const div = document.createElement("div");
    div.className = "tools";
    const isSite = this.env.namespaceInfos[suggestion.namespace].type === "site";

    if (isSite) {
      const reportTitle = encodeURIComponent(
        `Problem with shortcut \`${suggestion.namespace}.${suggestion.keyword} ${suggestion.argumentCount}\``,
      );
      div.innerHTML += `
        <a target="_blank" class="btn btn-sm btn-outline-secondary" href="https://github.com/trovu/trovu/blob/master/data/shortcuts/${suggestion.namespace}.yml">
        ✍️ Edit</a> &nbsp;
        <a target="_blank" class="btn btn-sm btn-outline-secondary" href="https://github.com/trovu/trovu/issues/new?title=${reportTitle}">🔧 Report</a> &nbsp; `;
    }

    div.innerHTML += `
    <a class="btn btn-sm btn-outline-secondary copy-yaml" href="#">📋 Copy YAML</a>`;
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

  // --- Helper & logic methods stay mostly the same but cleaned up ---

  select(index: number) {
    this.selected = this.selected === index ? -1 : index;
    this.updateSuggestions();
    this.queryInput.focus();
  }

  hasTag(suggestion: AnyObject, tag: string) {
    return Array.isArray(suggestion.tags) && suggestion.tags.includes(tag);
  }

  handleTagOrNamespaceClick(event: Event, query: string) {
    event.stopPropagation();
    this.queryInput.value = query;
    this.queryInput.focus();
    this.queryInput.dispatchEvent(new Event("input"));
  }

  shouldSkipExample(example: any) {
    if (!example.config) return false;
    return ["language", "country"].some((prop) => example.config[prop] && example.config[prop] !== this.env[prop]);
  }

  getYaml(suggestion: AnyObject) {
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
