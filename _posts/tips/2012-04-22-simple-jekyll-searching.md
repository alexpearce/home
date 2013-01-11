---
layout: post
title: Simple Jekyll Searching
category: Tips
tags: [Jekyll, JavaScript]
description: How to add simple JSON-based searching to Jekyll site.
---

I [recently made]({% post_url 2012-04-21-hello %}) this blog with [Jekyll](https://github.com/mojombo/jekyll). It's a nice little program once you get used to it's methodology. Jekyll's daughter, [Octopress](http://octopress.org/), touts itself as being "for hackers" and Jekyll itself isn't much different in this respect.

The [docs](https://github.com/mojombo/jekyll/wiki) are lacking examples and this did throw me initially, even leading me to put off making the site for a month or so. Eventually I got round to building the site and found Jekyll to be almost pleasurable to work with.

There is a certain satisfaction to implementing your own features. When you use packages which do the heavy lifting for you, it's often the case that it's not quite how you'd like it and then you go around changing things anyway. (This was my experience with Octopress, which I eventually abandoned as I found it too opinionated.)


Categories & Tags
-----------------

My biggest problem with Jekyll was its seeming lack of support for category and tag index pages. In a blog, visitors generally expect to be able to following tag and category links to a page listing other similarly-grouped pages.

Jekyll provides no clear cut way of implementing this, but it is possible and not complicated, so I'll go through my own way of solving the problem.

search.json
-----------

The answer was in a [Development Seed blog post on Jekyll](http://developmentseed.org/blog/2011/09/09/jekyll-github-pages/). In particular, they mention how they had created a `search.json` file via Jekyll which they use in their AJAX auto-complete searching.

While I wasn't look for auto-completion, the idea of creating a JSON index of the site was perfect. I could create a script which searched the JSON index for some matching parameter that I passed. After a little thought on deciding how to pass what I wanted to display, I settled on using GET variables.

I created `search.json` (using a blank [YAML front matter](https://github.com/mojombo/jekyll/wiki/YAML-Front-Matter) to tell Jekyll to parse the file with [Liquid](http://liquidmarkup.org/)):

{% highlight text %}
---
---
[
  <% for post in site.posts %>
    <% include post.json %>,
  <% endfor %>
  null
]
{% endhighlight %}

with the `post.json` partial in `_includes`.

{% highlight text %}
{
  "title"    : "<%= post.title %>",
  "category" : "<%= post.category %>",
  "tags"     : [<% for tag in post.tags %>"<%= tag %>",<% endfor %> null],
  "href"     : "<%= post.url %>",
  "date"     : {
    "day"   : "<%= post.date | date: "%d" %>",
    "month" : "<%= post.date | date: "%B" %>",
    "year"  : "<%= post.date | date: "%Y" %>"
  }
}
{% endhighlight %}

`search.json` now generates an array containing [all of the sites posts](/search.json).

Implementation
------------------

First was `search.html`.

{% highlight html %}
<div id="results">
  <h1><!-- `key` listing for `value` --></h1>
  
  <ul class="results">
    <!-- results lists -->
  </ul>
</div>
{% endhighlight %}

This is a blank `div` which will hold the search results. I wanted to have tag and category pages, so in my post templates I linked categories with `/search.html?category=<%= page.category | downcase %>` and similarly for tags. The JavaScript then needs to grab the GET parameter value, then search the JSON for it.

The main script is pretty simple.

{% highlight js %}
var map = {
  'category' : getParam('category'),
  'tags'     : getParam('tags')
};

$.each(map, function(type, value) {
  if (value !== null) {
    $.getJSON('/search.json', function(data) {
      posts = filterPostsByPropertyValue(data, type, value);
      if (posts.length === 0) {
        // Display 'no results found' or similar here
        noResultsPage();
      } else {
        layoutResultsPage(type, value, posts);
      }
    });
  }
});
{% endhighlight %}

We have a map of objects we'd like to search (categories and tags), where `getParam(key)` retrieves the value of the GET parameter with key `key`. For the link `/search.html?category=testing`, `getParam('category')` returns `testing`.

Iterating over `map`, if the parameter has been specified we grab the JSON index, filter the posts which have the desired properties (posts which match e.g. `post.category == 'testing'`) and then display them.

The function `layoutResultsPage` is almost entirely site-specific. In my case, I cycle through each post appending a `li` containing a few select properties (date, title, and tags) to a `ul`.

Caveats
-------

1. I only use one category per post, but the script *should* be generic enough to handle multiple categories.
2. The script contains a fair amount of HTML, which is ugly inside JavaScript.
3. It is not designed to deal with multiple parameters such as `?tags=hello&categories=world`.
4. As it is, the script is heavily tailored for my own use.

Source
------

You can view the [final JavaScript on Github](https://github.com/alexpearce/alexpearce.github.com/blob/master/assets/js/alexpearce.js) (or in this site's [source](/assets/js/alexpearce.js)). I've tried to concisely document any thing particularly funky.

You can try out the script by clicking any tag or category on this site or [this example](/search.html?category=tips).
