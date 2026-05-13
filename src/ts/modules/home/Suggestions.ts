/** @module Suggestions */
import QueryParser from "../QueryParser";
import SuggestionsGetter from "../SuggestionsGetter";
import "@fortawesome/fontawesome-free/css/all.min.css";
import jsyaml from "js-yaml";

export default class Suggestions {
  [key: string]: any;

  escapeHtml(str: string): string {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

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

    const leftSpan = document.createElement("span");
    leftSpan.className = "left";
    const kwSpan = document.createElement("span");
    kwSpan.className = "keyword";
    kwSpan.textContent = keyword;
    const argSpan = document.createElement("span");
    argSpan.className = "argument-names";
    argSpan.textContent = argumentString;
    leftSpan.appendChild(kwSpan);
    leftSpan.appendChild(argSpan);

    const rightSpan = document.createElement("span");
    rightSpan.className = "right";
    const titleSpan = document.createElement("span");
    titleSpan.className = "title";
    titleSpan.textContent = displayTitle;
    const nsSpan = document.createElement("span");
    nsSpan.className = "namespace";
    nsSpan.style.cursor = "pointer";
    nsSpan.textContent = namespace;
    rightSpan.appendChild(titleSpan);
    rightSpan.appendChild(nsSpan);

    container.appendChild(leftSpan);
    container.appendChild(rightSpan);

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
    container.innerHTML = description ? `<span class="icon">ⓘ</span> <span class="text">${this.escapeHtml(description)}</span>` : "";
    return container;
  }

  getTags(suggestion: AnyObject) {
    const { tags } = suggestion;
    const container = document.createElement("div");
    container.className = "tags";
    if (Array.isArray(tags) && tags.length) {
      container.innerHTML = tags.map((tag) => `<span class="tag">${this.escapeHtml(tag)}</span>`).join("");
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
    examples
      .filter((ex) => !this.shouldSkipExample(ex))
      .forEach((ex) => {
        const left = document.createElement("span");
        left.className = "left";
        const link = document.createElement("a");
        link.href = "#";
        link.className = "query";
        const queryText = reachable ? "" : namespace + ".";
        link.appendChild(document.createTextNode(queryText));
        const bold = document.createElement("b");
        bold.textContent = keyword;
        link.appendChild(bold);
        if (ex.arguments) {
          link.appendChild(document.createTextNode(" " + ex.arguments));
        }
        left.appendChild(link);
        left.appendChild(document.createTextNode(" → "));
        const desc = document.createElement("span");
        desc.className = "description";
        desc.textContent = ex.description || "";
        left.appendChild(desc);
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

  getUrl(suggestion: AnyObject) {
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
      if (target.classList.contains("namespace")) {
        e.stopPropagation();
      }
    });

    return div;
  }

  isVisible(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const containerRect = this.suggestionsDiv.getBoundingClientRect();
    return rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
  }

  ensureElementIsVisibleInContainer(element: HTMLElement, container: HTMLElement) {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    if (elementRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - elementRect.top;
    } else if (elementRect.bottom > containerRect.bottom) {
      container.scrollTop += elementRect.bottom - containerRect.bottom;
    }
  }

  select(index: number) {
    this.selected = index;
    this.renderSuggestions(this.suggestions);
    this.pick();
  }

  pick(e?: Event) {
    const suggestion = this.suggestions[this.selected];
    if (!suggestion) return;
    const queryParser = new QueryParser();
    const keywords = queryParser.parseKeywords(suggestion.keywordapsed);
    const url = keywords[suggestion.keyword] || suggestion.url;
    window.location.href = suggestion.reachable ? url : `https://${suggestion.namespace}.${url}`;
  }

  hasTag(suggestion: AnyObject, tag: string) {
    return Array.isArray(suggestion.tags) && suggestion.tags.includes(tag);
  }

  getYaml(suggestion: AnyObject) {
    return jsyaml.dump(suggestion);
  }

  handleTagOrNamespaceClick(e: Event, tag: string) {
    e.stopPropagation();
    this.queryInput.value = tag;
    this.queryInput.dispatchEvent(new Event("input"));
  }

  shouldSkipExample(example: AnyObject) {
    return example.arguments && example.arguments.includes("(") && example.arguments.includes(")");
  }
}
