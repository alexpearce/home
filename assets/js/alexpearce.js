// Capitalizes a string
// Accepts:
//   str: string
// Returns:
//   string
var majusculeFirst = function(str) {
  var temp = str.charAt(0).toUpperCase();
  for (var i = 1; i < str.length; i++) {
    temp += str.charAt(i).toLowerCase();
  }
  return temp;
}

// Retrieves the value of a GET parameter with a given key
// Accepts:
//   param: string
// Returns:
//   string or null
var getParam = function(param) {
  var queryString = window.location.search.substring(1),
      queries = queryString.split("&");
  for (var i in queries) {
    var pair = queries[i].split("=");
    if (pair[0] == param) {
      return pair[1];
    }
  }
  return null;
};

// Filters posts with the condition `post['property'] == value`
// Accepts:
//   posts - array of post objects and a string
//   property - string of post object property to compare
//   value - filter value of property
// Returns:
//  array of post objects
var filterPostsByPropertyValue = function(posts, property, value) {
  var filteredPosts = [];
  // The last element is a null terminator
  posts.pop();
  for (var i in posts) {
    var post = posts[i],
        prop = post[property];
    
    // The property could be a string, such as a post's category,
    // or an array, such as a post's tags
    if (prop.constructor == String) {
      if (prop.toLowerCase() == value.toLowerCase()) {
        filteredPosts.push(post);
      }
    } else if (prop.constructor == Array) {
      // hehe
      prop.pop();
      for (var j in prop) {
        if (prop[j].toLowerCase() == value.toLowerCase()) {
          filteredPosts.push(post);
        }
      }
    }
  }
  
  return filteredPosts;
};

// Formats search results and appends them to the DOM
// Accepts:
//   property: string of object type we're displaying
//   value: string of name of object we're displaying
//   posts: array of post objects
// Returns: nothing
var layoutResultsPage = function(property, value, posts) {
  // Make sure we're on the search results page
  var $container = $('#results');
  if ($container.length == 0) return;
  
  // Update the header
  var str = majusculeFirst(property) + " Listing for ‘" + majusculeFirst(value) + '’';
  $container.find('h1').text(str);
  
  // Loop through each post to format it
  for (var i in posts) {
    // Create an unordered list of the post's tags
    var tagsList = '<ul class="tags cf">',
        post     = posts[i],
        tags     = post.tags;

    if (tags[0] === null) tags.pop();
    for (var j in tags) {
      tagsList += '<li><a href="/search.html?tags=' + tags[j] + '">' + tags[j] + '</li>';
    }
    tagsList += '</ul>';
    
    $container.find('ul.results').append(
      '<li>'
        // Page anchor
        + '<a href="' + post.href + '">'
        + posts[i].title
        + '</a>'
        // Post date
        + ' <span class="date">- '
        + posts[i].date.day + ' ' + posts[i].date.month + ' ' + posts[i].date.year
        + '</span>'
        // Tags
        + tagsList
        + '</li>'
    );
  }
}

// Replaces ERB-style tags with Liquid ones as we can't escape them in posts
// Accepts:
//   elements: jQuery elements in which to replace tags
// Returns: nothing
var replaceERBTags = function(elements) {  
  elements.each(function() {
    // Only for text blocks at the moment as we'll strip highlighting otherwise
    var $this = $(this),
        txt   = $this.html();
        console.log(txt);
    
    // Replace <%=  %>with {{ }}
    txt = txt.replace(new RegExp("&lt;%=(.+?)%&gt;", "g"), "{{$1}}");
    // Replace <% %> with {% %}
    txt = txt.replace(new RegExp("&lt;%(.+?)%&gt;", "g"), "{%$1%}");
    
    $this.html(txt);
  });
};

$(function() {
  var map = {
    'category' : getParam('category'),
    'tags'     : getParam('tags'),
    'search'   : getParam('search')
  };

  $.each(map, function(type, value) {
    if (value !== null) {
      $.getJSON('/search.json', function(data) {
        posts = filterPostsByPropertyValue(data, type, value);
        if (posts.length === 0) {
          //noResultsPage();
          console.log('No results.');
        } else {
          layoutResultsPage(type, value, posts);
        }
      });
    }
  });
  
  // Replace ERB-style Liquid tags in highlighted code blocks...
  replaceERBTags($('div.highlight').find('code.text'));
  // ... and in inline code
  replaceERBTags($('p code'));
});