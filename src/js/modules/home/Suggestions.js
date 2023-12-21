/** @module Suggestions */
import Helper from '../Helper.js';
import QueryParser from '../QueryParser.js';
import 'font-awesome/css/font-awesome.min.css';

export default class Suggestions {
  constructor(querySelector, suggestionsSelector, namespaceInfos) {
    this.namespacesInfos = namespaceInfos;
    this.queryInput = document.querySelector(querySelector);
    this.suggestionsDiv = document.querySelector(suggestionsSelector);
    this.suggestionsList = document.createElement('ul');
    this.suggestionsDiv.appendChild(this.suggestionsList);
    this.selected = 0;
    this.suggestions = [];
    this.setListeners();
  }

  /**
   * Handle change query input field.
   *
   * @param {object} event – The fired event.
   */
  updateSuggestions = (event) => {
    const query = event.target.value;
    this.suggestions = this.getSuggestions(query);
    this.suggestions = this.suggestions.slice(0, 200);
    this.renderSuggestions(this.suggestions);
  };

  setListeners() {
    this.queryInput.addEventListener('input', (event) => {
      this.selected = 0;
      this.updateSuggestions(event);
    });
    // Also update on focus,
    // for case when input is already filled (because no shortcut was not found).
    this.queryInput.addEventListener('focus', this.updateSuggestions);
    this.queryInput.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.selected = Math.max(1, this.selected - 1);
        this.updateSuggestions(event);
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.selected = Math.min(this.suggestions.length, this.selected + 1);
        this.updateSuggestions(event);
      }
      if (event.key === 'Enter') {
        this.pick(event);
      }
    });
  }

  renderSuggestions(suggestions) {
    while (this.suggestionsList.firstChild) {
      this.suggestionsList.removeChild(this.suggestionsList.firstChild);
    }

    const fragment = document.createDocumentFragment();
    suggestions.forEach((suggestion, index) => {
      const li = this.renderSuggestion(suggestion, index + 1);
      fragment.appendChild(li);
    });

    this.suggestionsList.appendChild(fragment);
    const selectedLi = this.suggestionsList.querySelector(
      'li[aria-selected="true"]',
    );
    if (selectedLi) {
      this.ensureElementIsVisibleInContainer(selectedLi, this.suggestionsDiv);
    }
  }

  renderSuggestion(suggestion, index) {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.setAttribute(
      'aria-selected',
      index === this.selected ? 'true' : 'false',
    );
    const fragment = document.createDocumentFragment();
    fragment.appendChild(this.getMain(suggestion));
    fragment.appendChild(this.getDescriptionAndTags(suggestion));
    fragment.appendChild(this.getExamples(suggestion));
    li.appendChild(fragment);
    li.addEventListener('click', () => {
      this.updateAriaSelected(index);
      this.selected = index;
      this.queryInput.focus();
    });
    return li;
  }

  // New method to update aria-selected attribute for all items
  updateAriaSelected(selectedIndex) {
    const lis = this.suggestionsList.querySelectorAll('li');
    lis.forEach((li, index) => {
      li.setAttribute(
        'aria-selected',
        index === selectedIndex ? 'true' : 'false',
      );
    });
  }

  ensureElementIsVisibleInContainer(element, container) {
    // Assuming the height of the fade-out overlay is known (e.g., 100px)
    const fadeOutHeight = 60; // Adjust the fade-out height accordingly

    // Get the bottom position of the element relative to the container's scrollable area
    const elementBottom = element.offsetTop + element.offsetHeight;

    // Check if the bottom of the element is below the visible area considering the fade out height
    if (
      elementBottom >
      container.scrollTop + container.clientHeight - fadeOutHeight
    ) {
      // Scroll down to bring the element above the fade-out overlay
      container.scrollTop =
        elementBottom - container.clientHeight + fadeOutHeight;
    } else if (element.offsetTop < container.scrollTop) {
      // If the top of the element is above the visible area, scroll up to it
      container.scrollTop = element.offsetTop;
    }
  }

  getMain(suggestion) {
    // Create the main container div
    const mainDiv = document.createElement('div');
    mainDiv.className = `main ${suggestion.reachable ? '' : 'unreachable'}`;

    // Create and append the 'left' container
    const leftSpan = document.createElement('span');
    leftSpan.className = 'left';
    mainDiv.appendChild(leftSpan);

    // Create and append the keyword span
    const keywordSpan = document.createElement('span');
    keywordSpan.className = 'keyword';
    keywordSpan.textContent = suggestion.keyword;
    leftSpan.appendChild(keywordSpan);

    // Create and append the argument names span
    const argNamesSpan = document.createElement('span');
    argNamesSpan.className = 'argument-names';
    // getArgumentsStr now returns a DocumentFragment, so we can directly append it
    const argsFragment = this.getArgsFragment(suggestion.arguments);

    argNamesSpan.appendChild(argsFragment);
    leftSpan.appendChild(argNamesSpan);

    // Create and append the 'right' container
    const rightSpan = document.createElement('span');
    rightSpan.className = 'right';
    mainDiv.appendChild(rightSpan);

    // Create and append the title span
    const titleSpan = document.createElement('span');
    titleSpan.className = 'title';
    titleSpan.textContent = suggestion.title;
    rightSpan.appendChild(titleSpan);

    // Create and append the namespace span
    const namespaceSpan = document.createElement('span');
    namespaceSpan.className = 'namespace';
    namespaceSpan.textContent = suggestion.namespace;
    rightSpan.appendChild(namespaceSpan);

    // On click, set the query input value to "ns:NAMESPACE".
    namespaceSpan.addEventListener('click', () => {
      this.queryInput.value = `ns:${suggestion.namespace}`;
    });
    namespaceSpan.addEventListener('mouseover', () => {
      namespaceSpan.style.cursor = 'pointer';
    });

    return mainDiv;
  }

  getDescriptionAndTags(suggestion) {
    // Create the container for the description and tags
    const descriptionAndTagsDiv = document.createElement('div');
    descriptionAndTagsDiv.className = 'description-and-tags';

    // Create and append the 'left' span for description
    const leftSpan = document.createElement('span');
    leftSpan.className = 'left';
    // Set the text content for the description
    leftSpan.textContent =
      suggestion.description ||
      (suggestion.examples && Array.isArray(suggestion.examples)
        ? 'Examples:'
        : '');
    descriptionAndTagsDiv.appendChild(leftSpan);

    // Create and append the 'right' span for tags
    const rightSpan = document.createElement('span');
    rightSpan.className = 'right';
    if (suggestion.tags && Array.isArray(suggestion.tags)) {
      suggestion.tags.forEach((tag) => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        tagSpan.textContent = tag;

        // On click, set the query input value to "tag:TAG".
        tagSpan.addEventListener('click', () => {
          this.queryInput.value = `tag:${tag}`;
        });
        tagSpan.addEventListener('mouseover', () => {
          tagSpan.style.cursor = 'pointer';
        });
        rightSpan.appendChild(tagSpan);
        rightSpan.appendChild(document.createTextNode(' ')); // Add space after each tag
      });
    }
    descriptionAndTagsDiv.appendChild(rightSpan);

    return descriptionAndTagsDiv;
  }

  getExamples(suggestion) {
    if (!suggestion.examples || !Array.isArray(suggestion.examples)) {
      return document.createDocumentFragment();
    }

    const examplesDiv = document.createElement('div');
    examplesDiv.className = 'examples';

    for (const example of suggestion.examples) {
      const leftSpan = document.createElement('span');
      leftSpan.className = 'left';

      const querySpan = document.createElement('span');
      querySpan.className = 'query';
      querySpan.textContent = `${suggestion.keyword} ${
        example.arguments || ''
      }`;
      leftSpan.appendChild(querySpan);

      const rightSpan = document.createElement('span');
      rightSpan.className = 'right';

      const descriptionSpan = document.createElement('span');
      descriptionSpan.className = 'description';
      descriptionSpan.textContent = example.description;
      rightSpan.appendChild(descriptionSpan);

      examplesDiv.appendChild(leftSpan);
      examplesDiv.appendChild(rightSpan);
    }

    return examplesDiv;
  }

  getArgsFragment(args) {
    const icons = {
      city: '🏙️',
      date: '📅',
      time: '🕒',
    };

    const argsFragment = document.createDocumentFragment();

    Object.entries(args).forEach(([key, value], index, array) => {
      const type = Object.values(value)[0].type ?? null;
      const argSpan = document.createElement('span');
      argSpan.title = type;

      if (icons[type]) {
        const iconText = document.createTextNode(icons[type] + '\u202F'); // Adding a narrow no-break space
        argSpan.appendChild(iconText);
      }

      const argText = document.createTextNode(type ? key : `${key}, `);
      argSpan.appendChild(argText);

      argsFragment.appendChild(argSpan);

      // If it's not the last argument, add a comma and a space
      if (index < array.length - 1) {
        argsFragment.appendChild(document.createTextNode(', '));
      }
    });

    return argsFragment;
  }

  /**
   * Find shortcuts to suggest.
   *
   * @param {string} keyword – The keyword from the query.
   *
   * @return {array} suggestions – The found suggestions.
   */
  getSuggestions(query) {
    const matches = this.getMatches(query);
    this.sort(matches);

    let suggestions = [];
    suggestions = suggestions.concat(
      matches.keywordFullReachable,
      matches.keywordFullUnreachable,
      matches.keywordBeginReachable,
      matches.keywordBeginUnreachable,
      matches.titleBeginReachable,
      matches.titleBeginUnreachable,
      matches.titleMiddleReachable,
      matches.titleMiddleUnreachable,
      matches.tagMiddleReachable,
      matches.tagMiddleUnreachable,
      matches.urlMiddleReachable,
      matches.urlMiddleUnreachable,
    );

    return suggestions;
  }

  /**
   * Find matches given keyword.
   *
   * @param {string} keyword – The keyword from the query.
   *
   * @return {object} matches – The found matches, grouped by type of match.
   */
  getMatches(query) {
    const [keyword, argumentString] = Helper.splitKeepRemainder(query, ' ', 2);
    const matches = {
      keywordFullReachable: [],
      keywordFullUnreachable: [],
      keywordBeginReachable: [],
      keywordBeginUnreachable: [],
      titleBeginReachable: [],
      titleBeginUnreachable: [],
      titleMiddleReachable: [],
      titleMiddleUnreachable: [],
      tagMiddleReachable: [],
      tagMiddleUnreachable: [],
      urlMiddleReachable: [],
      urlMiddleUnreachable: [],
    };

    const keywordRegex = new RegExp(keyword, 'i');
    for (const namespaceInfo of Object.values(this.namespacesInfos)) {
      for (const shortcut of Object.values(namespaceInfo.shortcuts)) {
        if (shortcut.deprecated || shortcut.removed) {
          continue;
        }
        if (keyword == shortcut.keyword) {
          if (shortcut.reachable) {
            matches.keywordFullReachable.push(shortcut);
          } else {
            matches.keywordFullUnreachable.push(shortcut);
          }
          continue;
        }
        let pos = shortcut.keyword.search(keywordRegex);
        if (pos == 0) {
          if (shortcut.reachable) {
            matches.keywordBeginReachable.push(shortcut);
          } else {
            matches.keywordBeginUnreachable.push(shortcut);
          }
          continue;
        }
        pos = shortcut.title.search(keywordRegex);
        if (pos == 0) {
          if (shortcut.reachable) {
            matches.titleBeginReachable.push(shortcut);
          } else {
            matches.titleBeginUnreachable.push(shortcut);
          }
          continue;
        }
        if (pos > 0) {
          if (shortcut.reachable) {
            matches.titleMiddleReachable.push(shortcut);
          } else {
            matches.titleMiddleUnreachable.push(shortcut);
          }
          continue;
        }
        if (shortcut.tags && Array.isArray(shortcut.tags)) {
          for (const tag of shortcut.tags) {
            const pos = tag.search(keywordRegex);
            if (pos > -1) {
              if (shortcut.reachable) {
                matches.tagMiddleReachable.push(shortcut);
              } else {
                matches.tagMiddleUnreachable.push(shortcut);
              }
            }
          }
        }
        pos = shortcut.url.search(keywordRegex);
        if (pos > 0) {
          if (shortcut.reachable) {
            matches.urlMiddleReachable.push(shortcut);
          } else {
            matches.urlMiddleUnreachable.push(shortcut);
          }
          continue;
        }
      }
    }
    return matches;
  }

  /**
   * Sort matches based on keyword.
   *
   * @param {string} keyword – The keyword from the query.
   */
  sort(matches) {
    const compareKeywords = (a, b) => a.keyword.localeCompare(b.keyword);
    for (const key in matches) {
      matches[key].sort(compareKeywords);
    }
  }

  /**
   * Handle selection of a suggestion.
   *
   * @param {object} event – The fired event.
   */
  pick(event) {
    if (this.selected === 0) {
      return;
    }
    event.preventDefault();
    const inputText = this.queryInput.value;
    const input = QueryParser.parse(inputText);
    const suggestion = this.suggestions[this.selected - 1];
    console.log('pick', suggestion);
    let newInputText = suggestion.keyword;
    // Prefix with namespace if not reachable.
    if (!suggestion.reachable) {
      newInputText = `${suggestion.namespace}.${newInputText}`;
    }
    newInputText = `${newInputText} ${input.argumentString}`;
    this.queryInput.value = newInputText;
    this.selected = 0;
    this.updateSuggestions(event);
  }
}
