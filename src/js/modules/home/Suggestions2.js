/** @module Suggestions2 */
import Helper from '../Helper.js';
import QueryParser from '../QueryParser.js';
import 'font-awesome/css/font-awesome.min.css';

export default class Suggestions2 {
  constructor(namespaceInfos) {
    this.namespacesInfos = namespaceInfos;

    const queryInput = document.querySelector('#query');
    this.suggestionsList = document.querySelector('#suggestions ul');

    queryInput.addEventListener('input', this.updateSuggestions);
    // Also update on focus,
    // for case when input is already filled (because no shortcut was not found).
    queryInput.addEventListener('focus', this.updateSuggestions);
    // queryInput.addEventListener('awesomplete-select', this.select);
  }

  /**
   * Handle change query input field.
   *
   * @param {object} event – The fired event.
   */
  updateSuggestions = (event) => {
    const inputText = event.target.value;

    // Only search by keyword / first word of user input.
    const [keyword, argumentString] = Helper.splitKeepRemainder(
      inputText,
      ' ',
      2,
    );
    let suggestions = this.getSuggestions(keyword);
    suggestions = suggestions.slice(0, 100);
    this.suggestionsList.innerHTML = '';
    for (const suggestion of suggestions) {
      const li = this.renderSuggestion(suggestion, inputText);
      this.suggestionsList.appendChild(li);
    }
  };

  /**
   * Render a suggestion item.
   */
  renderSuggestion(suggestion) {
    const li = document.createElement('li', {
      role: 'option',
    });
    li.innerHTML += this.getSuggestionMain(suggestion);
    li.innerHTML += this.getSuggestionDescriptionAndTags(suggestion);
    li.innerHTML += this.getSuggestionExamples(suggestion);
    return li;
  }

  getSuggestionMain(suggestion) {
    const argument_names_str = this.getArgumentsStr(suggestion.arguments);

    const main = `
      <div class="main ${suggestion.reachable ? `` : ` unreachable`}">
        <span class="left">  
        <span class="keyword">${suggestion.keyword}</span>  
        <span class="argument-names">${argument_names_str}</span> 
        </span>
        <span class="right">
          <span class="title">${suggestion.title}</span>
          <span class="namespace">${suggestion.namespace}</span>
        </span>
      </div>
    `;
    return main;
  }

  getSuggestionDescriptionAndTags(suggestion) {
    if (!suggestion.description && !suggestion.tags) {
      return '';
    }
    let description = '';
    // If there is a description, use it.
    if (suggestion.description) {
      description = suggestion.description;
      // If it's empty and there are examples, use 'Examples'.
    } else if (suggestion.examples && Array.isArray(suggestion.examples)) {
      description = 'Examples:';
    }
    let tags = '';
    if (suggestion.tags && Array.isArray(suggestion.tags)) {
      for (const tag of suggestion.tags) {
        tags += `<span class="tag">${tag}</span> `;
      }
    }
    const descriptionAndTags = `<div class="description-and-tags">
        <span class="left">${description}</span>
        <span class="right">${tags}</span>
      </div>`;
    return descriptionAndTags;
  }

  getSuggestionExamples(suggestion) {
    if (!suggestion.examples || !Array.isArray(suggestion.examples)) {
      return '';
    }
    let examplesInnerDiv = '';
    for (const example of suggestion.examples) {
      examplesInnerDiv += `
          <span class="left">  
            <span class="query">${suggestion.keyword} ${
              example.arguments || ''
            }</span>  
          </span>
          <span class="right">
            <span class="description">${example.description}</span>  
          </span>`;
    }
    const examples = `<div class="examples">${examplesInnerDiv}</div>`;
    return examples;
  }

  getArgumentsStr(args) {
    const icons = {
      city: '🏙',
      date: '📅',
      time: '🕒',
    };
    return Object.entries(args)
      .map(([key, value]) => {
        const type = Object.values(value)[0].type ?? null;
        return icons[type]
          ? `<span title="${type}">${icons[type]}</span>&nbsp;&#x202F;${key}`
          : key;
      })
      .join(', ');
  }

  /**
   * Find shortcuts to suggest.
   *
   * @param {string} keyword – The keyword from the query.
   *
   * @return {array} suggestions – The found suggestions.
   */
  getSuggestions(keyword) {
    const matches = this.getMatches(keyword);
    this.sortMatches(matches);

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
  getMatches(keyword) {
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
        let pos = shortcut.keyword.search(new RegExp(keyword, 'i'));
        if (pos == 0) {
          if (shortcut.reachable) {
            matches.keywordBeginReachable.push(shortcut);
          } else {
            matches.keywordBeginUnreachable.push(shortcut);
          }
          continue;
        }
        pos = shortcut.title.search(new RegExp(keyword, 'i'));
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
            const pos = tag.search(new RegExp(keyword, 'i'));
            if (pos > -1) {
              if (shortcut.reachable) {
                matches.tagMiddleReachable.push(shortcut);
              } else {
                matches.tagMiddleUnreachable.push(shortcut);
              }
            }
          }
        }
        pos = shortcut.url.search(new RegExp(keyword, 'i'));
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
  sortMatches(matches) {
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
  select = (event) => {
    event.preventDefault();

    const inputText = event.target.value;
    const input = QueryParser.parse(inputText);
    const suggestion = event.text.label;

    if (event.originalEvent.type === 'click') {
      // Unselect all at first because Awesomplete apparently doesn't.
      document.querySelectorAll('#query-form li').forEach((li) => {
        li.setAttribute('aria-selected', 'false');
      });
      this.awesomplete.goto(suggestion.position);
      return;
    }

    let newInputText = suggestion.keyword;

    // Prefix with namespace if not reachable.
    if (!suggestion.reachable) {
      newInputText = `${suggestion.namespace}.${newInputText}`;
    }

    // Append argumentString.
    newInputText = `${newInputText} ${input.argumentString}`;

    // Default: replace with suggested.
    this.awesomplete.replace({
      value: `${newInputText}`,
    });

    this.updateSuggestions(event);
  };
}
