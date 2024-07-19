/** @module Suggestions */
import QueryParser from "../QueryParser.js";
import SuggestionsGetter from "../SuggestionsGetter.js";
import "font-awesome/css/font-awesome.min.css";
import jsyaml from "js-yaml";

export default class Suggestions {
  constructor(querySelector, suggestionsSelector, env) {
    this.env = env;
    this.queryInput = document.querySelector(querySelector);
    this.suggestionsDiv = document.querySelector(suggestionsSelector);
    this.helpDiv = document.querySelector("#help");
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
    this.suggestions = suggestionsGetter.getSuggestions(this.query);
    this.suggestions = this.suggestions.slice(0, 500);
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

  renderSuggestions(suggestions) {
    while (this.suggestionsDiv.firstChild) {
      this.suggestionsDiv.removeChild(this.suggestionsDiv.firstChild);
    }
    if (suggestions.length === 0) {
      if (this.query) {
        this.helpDiv.textContent = "No matching shortcuts found.";
      }
      return;
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

  renderSuggestion(suggestion, index) {
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
    if (this.env.namespaceInfos[suggestion.namespace].type === "site") {
      fragment.appendChild(this.getTools(suggestion));
    }
    li.appendChild(fragment);
    li.addEventListener("click", () => {
      this.select(index);
    });
    return li;
  }

  select(index) {
    if (this.selected == index) {
      this.selected = -1;
    } else {
      this.selected = index;
    }
    this.updateSuggestions();
    this.queryInput.focus();
  }

  ensureElementIsVisibleInContainer(element, container) {
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

  getMain(suggestion) {
    // Create the main container div
    const mainDiv = document.createElement("div");
    mainDiv.className = `main ${suggestion.reachable ? "" : "unreachable"}`;

    // Create and append the 'left' container
    const leftSpan = document.createElement("span");
    leftSpan.className = "left";
    mainDiv.appendChild(leftSpan);

    // Create and append the keyword span
    const keywordSpan = document.createElement("span");
    keywordSpan.className = "keyword";
    keywordSpan.textContent = suggestion.keyword;
    leftSpan.appendChild(keywordSpan);

    // Create and append the argument names span
    const argNamesSpan = document.createElement("span");
    argNamesSpan.className = "argument-names";
    // getArgumentsStr now returns a DocumentFragment, so we can directly append it
    argNamesSpan.textContent = suggestion.argumentString;

    leftSpan.appendChild(argNamesSpan);

    // Create and append the 'right' container
    const rightSpan = document.createElement("span");
    rightSpan.className = "right";
    mainDiv.appendChild(rightSpan);

    // Create and append the title span
    const titleSpan = document.createElement("span");
    titleSpan.className = "title";
    titleSpan.textContent = suggestion.title || suggestion.url;

    if (this.hasTag(suggestion, "needs-userscript")) {
      titleSpan.textContent += " 🧩";
    }
    if (this.hasTag(suggestion, "is-affiliate")) {
      titleSpan.textContent += " 🤝";
    }

    rightSpan.appendChild(titleSpan);

    // Create and append the namespace span
    const namespaceSpan = document.createElement("span");
    namespaceSpan.className = "namespace";
    namespaceSpan.textContent = suggestion.namespace;
    rightSpan.appendChild(namespaceSpan);

    // On click, set the query input value to "ns:NAMESPACE".
    namespaceSpan.addEventListener("click", (event) => {
      this.handleTagOrNamespaceClick(event, `ns:${suggestion.namespace}`);
    });
    namespaceSpan.addEventListener("mouseover", () => {
      namespaceSpan.style.cursor = "pointer";
    });

    return mainDiv;
  }

  hasTag(suggestion, tag) {
    if (suggestion.tags && Array.isArray(suggestion.tags)) {
      return suggestion.tags.includes(tag);
    }
    return false;
  }

  handleTagOrNamespaceClick(event, query) {
    event.stopPropagation();
    this.queryInput.value = query;
    this.queryInput.focus();
    this.queryInput.dispatchEvent(new Event("input"));
  }

  getDescriptionAndTags(suggestion) {
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

  getExamples(suggestion) {
    if (!suggestion.examples || !Array.isArray(suggestion.examples)) {
      return document.createDocumentFragment();
    }

    const examplesDiv = document.createElement("div");
    examplesDiv.className = "examples";

    for (const example of suggestion.examples) {
      if (this.shouldSkipExample(example)) {
        continue;
      }
      const leftSpan = document.createElement("span");
      leftSpan.className = "left";

      const querySpan = document.createElement("span");
      querySpan.className = "query";
      querySpan.textContent = `${suggestion.reachable ? "" : suggestion.namespace + "."}${suggestion.keyword} ${
        example.arguments || ""
      }`;
      // Surrond query with link to /process.
      const queryLink = document.createElement("a");
      queryLink.href = this.env.buildProcessUrl({
        query: querySpan.textContent,
      });
      queryLink.appendChild(querySpan);
      leftSpan.appendChild(queryLink);

      const rightSpan = document.createElement("span");
      rightSpan.className = "right";

      const descriptionSpan = document.createElement("span");
      descriptionSpan.className = "description";
      descriptionSpan.textContent = example.description;
      rightSpan.appendChild(descriptionSpan);

      examplesDiv.appendChild(leftSpan);
      examplesDiv.appendChild(rightSpan);
    }

    return examplesDiv;
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
    div.innerHTML =
      '🧩 Needs the <a href="https://trovu.net/docs/shortcuts/userscripts/">userscript</a> to be installed.';
    return div;
  }

  getIsAffiliate() {
    const div = document.createElement("div");
    div.className = "is-affiliate";
    div.innerHTML =
      '🤝 <a href="https://trovu.net/docs/shortcuts/tags/#is-affiliate">Affiliate</a> shortcut, we get paid for it.';
    return div;
  }

  getTools(suggestion) {
    const div = document.createElement("div");
    div.className = "tools";
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
    div.innerHTML += "📋  ";
    div.appendChild(this.getCopyYamlLink(suggestion));
    return div;
  }

  getCopyYamlLink(suggestion) {
    const copyYamlLink = document.createElement("a");
    copyYamlLink.href = "#";
    copyYamlLink.textContent = "Copy YAML";
    copyYamlLink.onclick = (event) => {
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
