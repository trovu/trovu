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

  /**
   * Handle change query input field.
   *
   * @param {object} event – The fired event.
   */
  updateSuggestions = () => {
    this.query = this.queryInput.value;
    const suggestionsGetter = new SuggestionsGetter(this.env);
    this.suggestions = suggestionsGetter.getSuggestions(this.query).slice(0, 500);
    this.renderSuggestions(this.suggestions);
  };

  setListeners() {
    this.queryInput.addEventListener("input", () => {
      this.selected = -1;
      if (this.updateSuggestionsTimeout) {
        clearTimeout(this.updateSuggestionsTimeout);
      }
      this.updateSuggestionsTimeout = setTimeout(() => {
        this.updateSuggestions();
      }, 100);
    });
    this.queryInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        this.selected = Math.max(0, this.selected - 1);
        this.updateSuggestions();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.selected = Math.min(this.suggestions.length - 1, this.selected + 1);
        this.updateSuggestions();
      }
      if (event.key === "Enter") {
        this.pick(event);
      }
    });
  }

  renderSuggestions(suggestions: any[]) {
    while (this.suggestionsDiv.firstChild) {
      this.suggestionsDiv.removeChild(this.suggestionsDiv.firstChild);
    }
    this.helpDiv.textContent = "";
    if (this.query) {
      if (suggestions.length === 0) {
        this.helpDiv.textContent = "No matching shortcuts found.";
        return;
      } else {
        this.helpDiv.textContent = "Type ⬇️ / ⬆️ to navigate, ↵ to select.";
      }
    }

    this.suggestionsList = document.createElement("ul");
    this.suggestionsDiv.appendChild(this.suggestionsList);

    const fragment = document.createDocumentFragment();
    suggestions.forEach((suggestion, index) => {
      const li = this.renderSuggestion(suggestion, index);
      fragment.appendChild(li);
    });

    this.suggestionsList.appendChild(fragment);
    if (this.selected > -1) {
      const selectedLi = this.suggestionsList.querySelector('li[aria-selected="true"]');
      if (selectedLi) {
        this.ensureElementIsVisibleInContainer(selectedLi, this.suggestionsDiv);
      }
    } else {
      this.suggestionsDiv.scrollTop = 0;
    }
  }

  renderSuggestion(suggestion: AnyObject, index: number) {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", index === this.selected ? "true" : "false");
    const fragment = document.createDocumentFragment();
    fragment.appendChild(this.getMain(suggestion));
    fragment.appendChild(this.getDescriptionAndTags(suggestion));
    fragment.appendChild(this.getExamples(suggestion));
    fragment.appendChild(this.getUrl(suggestion));
    if (this.hasTag(suggestion, "needs-userscript")) {
      fragment.appendChild(this.getNeedsUserscript());
    }
    if (this.hasTag(suggestion, "is-affiliate")) {
      fragment.appendChild(this.getIsAffiliate());
    }
    fragment.appendChild(this.getTools(suggestion));
    li.appendChild(fragment);
    li.addEventListener("click", () => {
      this.select(index);
    });
    return li;
  }

  select(index: number) {
    if (this.selected == index) {
      this.selected = -1;
    } else {
      this.selected = index;
    }
    this.updateSuggestions();
    this.queryInput.focus();
  }

  ensureElementIsVisibleInContainer(element: any, container: any) {
    // Assuming the height of the fade-out overlay is known (e.g., 100px)
    const fadeOutHeight = 60; // Adjust the fade-out height accordingly

    // Get the bottom position of the element relative to the container's scrollable area
    const elementBottom = element.offsetTop + element.offsetHeight;

    // Check if the bottom of the element is below the visible area considering the fade out height
    if (elementBottom > container.scrollTop + container.clientHeight - fadeOutHeight) {
      // Scroll down to bring the element above the fade-out overlay
      container.scrollTop = elementBottom - container.clientHeight + fadeOutHeight;
    } else if (element.offsetTop < container.scrollTop) {
      // If the top of the element is above the visible area, scroll up to it
      container.scrollTop = element.offsetTop;
    }
  }

  getMain(suggestion: AnyObject) {
    const { reachable, keyword, argumentString, title, url, namespace } = suggestion;

    // Add icons based on tags
    let displayTitle = title || url;
    if (this.hasTag(suggestion, "needs-userscript")) displayTitle += " 🧩";
    if (this.hasTag(suggestion, "is-affiliate")) displayTitle += " 🤝";

    const container = document.createElement("div");
    container.className = `main ${reachable ? "" : "unreachable"}`;

    // Use Template Literals for better readability and maintainability
    container.innerHTML = `
    <span class="left">
      <span class="keyword">${keyword}</span>
      <span class="argument-names">${argumentString}</span>
    </span>
    <span class="right">
      <span class="title">${displayTitle}</span>
      <span class="namespace" style="cursor: pointer;">${namespace}</span>
    </span>
  `;

    // Attach event listener to the namespace span via Delegation
    container.addEventListener("click", (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("namespace")) {
        this.handleTagOrNamespaceClick(e, `ns:${namespace}`);
      }
    });

    return container;
  }

  hasTag(suggestion: AnyObject, tag: string) {
    if (suggestion.tags && Array.isArray(suggestion.tags)) {
      return suggestion.tags.includes(tag);
    }
    return false;
  }

  handleTagOrNamespaceClick(event: any, query: string) {
    event.stopPropagation();
    this.queryInput.value = query;
    this.queryInput.focus();
    this.queryInput.dispatchEvent(new Event("input"));
  }

  getDescriptionAndTags(suggestion: AnyObject) {
    // Create the container for the description and tags
    const descriptionAndTagsDiv = document.createElement("div");
    descriptionAndTagsDiv.className = "description-and-tags";

    // Create and append the 'left' span for description
    const leftSpan = document.createElement("span");
    leftSpan.className = "left";
    // Set the text content for the description
    leftSpan.textContent =
      suggestion.description || (suggestion.examples && Array.isArray(suggestion.examples) ? "Examples:" : "");
    descriptionAndTagsDiv.appendChild(leftSpan);

    // Create and append the 'right' span for tags
    const rightSpan = document.createElement("span");
    rightSpan.className = "right";
    if (suggestion.tags && Array.isArray(suggestion.tags)) {
      suggestion.tags.forEach((tag) => {
        const tagSpan = document.createElement("span");
        tagSpan.className = "tag";
        tagSpan.textContent = tag;

        // On click, set the query input value to "tag:TAG".
        tagSpan.addEventListener("click", (event) => {
          this.handleTagOrNamespaceClick(event, `tag:${tag}`);
        });
        tagSpan.addEventListener("mouseover", () => {
          tagSpan.style.cursor = "pointer";
        });
        rightSpan.appendChild(tagSpan);
      });
    }
    descriptionAndTagsDiv.appendChild(rightSpan);

    return descriptionAndTagsDiv;
  }

  getExamples(suggestion: AnyObject) {
    const { examples, reachable, namespace, keyword } = suggestion;
    if (!Array.isArray(examples)) return document.createDocumentFragment();

    const container = document.createElement("div");
    container.className = "examples";

    container.innerHTML = examples
      .filter((example) => !this.shouldSkipExample(example))
      .map((example) => {
        const query = `${reachable ? "" : namespace + "."}<b>${keyword}</b> ${example.arguments || ""}`;
        return `
        <span class="left">
          <a href="#" class="query-link"><span class="query">${query}</span></a>
        </span>
        <span class="right">
          <span class="description">${example.description}</span>
        </span>`;
      })
      .join("");

    container.addEventListener("click", (e) => {
      const link = (e.target as HTMLElement).closest(".query-link");
      if (link) {
        e.preventDefault();
        this.queryInput.value = link.textContent;
        this.home.submitQuery();
      }
    });

    return container;
  }

  shouldSkipExample(example) {
    if (!example.config) return false;
    for (const property of ["language", "country"]) {
      if (example.config[property] && example.config[property] !== this.env[property]) {
        return true;
      }
    }
    return false;
  }

  getUrl(suggestion) {
    const urlDiv = document.createElement("div");
    urlDiv.className = "url";
    // add text span with url icon, append it, put urllink next to it
    const urlText = document.createElement("span");
    urlText.textContent = "🔗 ";
    urlDiv.appendChild(urlText);
    const urlLink = document.createElement("a");
    urlLink.href = suggestion.url;
    urlLink.textContent = `${suggestion.url}`;
    urlDiv.appendChild(urlLink);
    return urlDiv;
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

  getTools(suggestion) {
    const div = document.createElement("div");
    div.className = "tools";
    if (this.env.namespaceInfos[suggestion.namespace].type === "site") {
      div.innerHTML += `✍️ <a href="https://github.com/trovu/trovu/blob/master/data/shortcuts/${suggestion.namespace}.yml">Edit</a> &nbsp; `;
      div.innerHTML += `🔧 <a href="https://github.com/trovu/trovu/issues/new?title=${encodeURIComponent(
        "Problem with shortcut `" +
          suggestion.namespace +
          "." +
          suggestion.keyword +
          " " +
          suggestion.argumentCount +
          "`",
      )}">Report problem</a> &nbsp; `;
    }
    div.innerHTML += "📋  ";
    div.appendChild(this.getCopyYamlLink(suggestion));
    return div;
  }

  getCopyYamlLink(suggestion) {
    const copyYamlLink = document.createElement("a");
    copyYamlLink.href = "#";
    copyYamlLink.textContent = "Copy YAML";
    copyYamlLink.onclick = (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      const yaml = this.getYaml(suggestion);
      navigator.clipboard.writeText(yaml);
      event.target.textContent = "Copied.";
    };
    return copyYamlLink;
  }

  getYaml(suggestion) {
    // Deep copy.
    const shortcut = {
      [suggestion.key]: JSON.parse(JSON.stringify(suggestion)),
    };
    const key = suggestion.key;
    ["argumentCount", "arguments", "include", "key", "keyword", "namespace", "reachable"].forEach((property) => {
      delete shortcut[key][property];
    });
    const yaml = jsyaml.dump(shortcut, { noArrayIndent: true, lineWidth: -1 });
    return yaml;
  }

  /**
   * Handle selection of a suggestion.
   *
   * @param {object} event – The fired event.
   */
  pick(event) {
    if (this.selected === -1) {
      return;
    }
    event.preventDefault();
    const inputText = this.queryInput.value;
    const input = QueryParser.parse(inputText);
    const suggestion = this.suggestions[this.selected];
    let newInputText = suggestion.keyword;
    // Prefix with namespace if not reachable.
    if (!suggestion.reachable) {
      newInputText = `${suggestion.namespace}.${newInputText}`;
    }
    newInputText = `${newInputText} ${input.argumentString}`;
    this.queryInput.value = newInputText;
    this.selected = -1;
    this.updateSuggestions();
  }
}
