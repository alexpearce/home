(function(window, document, undefined) {
  'use strict';

  // Search page URL without leading slash
  var SEARCH_PATH = 'search/';

  var ready = function(fn) {
    if (document.readyState != 'loading'){
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  // Return an object of `key: value` pairs from the GET search string
  var parseSearchParameters = function(search) {
    var ret = {},
        // Each key-value pair is separated with an ampersand
        params = search.split('&'),
        i, kv;
    for (i = 0; i < params.length; i++) {
      // Keys are separated from values with an equals sign
      var kv = params[i].split('=');
      ret[kv[0]] = kv[1];
    };
    return ret;
  };

  // Only display posts on the search page that match the query
  var filterPosts = function(categoriesContainer, tagsContainer, errorsContainer) {
    var params = parseSearchParameters(window.location.search.slice(1)),
        hasTag = params.tag !== undefined,
        hasCategory = params.category !== undefined,
        children, child, searchTerm, i, hasMatch = false;

    // No search terms were specified
    if (!hasTag && !hasCategory) {
      tagsContainer.style.display = 'none';
      categoriesContainer.style.display = 'none';
      errorsContainer.style.display = 'block';
      errorsContainer.querySelector('.too-few-parameters').style.display = 'block';
      return;
    }

    // More than 1 search term was specified
    if (hasTag && hasCategory) {
      tagsContainer.style.display = 'none';
      categoriesContainer.style.display = 'none';
      errorsContainer.style.display = 'block';
      errorsContainer.querySelector('.too-many-parameters').style.display = 'block';
      return;
    }

    // If we're here, there's only one search term
    if (hasCategory) {
      tagsContainer.style.display = 'none';
      categoriesContainer.style.display = 'block';
      children = categoriesContainer.children;
      searchTerm = decodeURI(params.category);
    }
    if (hasTag) {
      tagsContainer.style.display = 'block';
      categoriesContainer.style.display = 'none';
      children = tagsContainer.children;
      searchTerm = decodeURI(params.tag);
    }

    for (i = 0; i < children.length; i++) {
      child = children[i];
      if (decodeURI(child.dataset.name) === searchTerm) {
        child.style.display = 'display';
        hasMatch = true;
      } else {
        child.style.display = 'none';
      }
    };

    if (!hasMatch) {
      errorsContainer.style.display = 'block';
      errorsContainer.querySelector('.no-results').style.display = 'block';
    }
  };

  ready(function() {
    // If we're on the search page, get the index containers and filter them
    // based on the GET query
    if (window.location.pathname.slice(-SEARCH_PATH.length) === SEARCH_PATH) {
      var tagsContainer = document.querySelector('.tag-index'),
          categoriesContainer = document.querySelector('.category-index'),
          errorsContainer = document.querySelector('.error');
      // We need both containers for the method to work
      if (!!tagsContainer || !!categoriesContainer) {
        filterPosts(categoriesContainer, tagsContainer, errorsContainer);
      }
    }
  });
})(window, window.document);
