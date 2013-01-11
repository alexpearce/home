---
layout: post
title: Jekyll Sitemaps
category: Tips
tags: [Jekyll]
description: How to create a Google sitemap for a Jekyll site.
---

For indexing websites, Google et al. have a [standardised protocol](http://www.sitemaps.org/) for creating a sitemap. A sitemap is an XML file containing a list of all pages to be indexed. The [sitemaps Wikipedia article](http://en.wikipedia.org/wiki/Google_Sitemap) is more informative than I am on the matter.

Anyway, I wanted to create a sitemap for this site to [submit to Google](https://www.google.com/webmasters/tools/). This site is very simple as it consists of only three types of pages: a post page, a tag index page, and a category index page. One post page per post, and one tag/category index page per tag/category. (For how I implemented tag/category index pages, see my post on [simple Jekyll searching]({% post_url 2012-04-22-simple-jekyll-searching %}).

Listing all the pages is easy.

{% highlight text %}
<% for post in site.posts %>
...
<% endfor %>
{% endhighlight %}

Listing the index pages was slightly harder, as the template data `sites.tags` is supposed to be used like `sites.tags.TAGNAME`, returning a list of all posts with the given tag name. The solution is embedded [somewhere here](https://groups.google.com/forum/?fromgroups#!topic/jekyll-rb/W_8n8_yvopw), specifically these lines:

{% highlight text %}
<% for category in site.categories %>
  <%= category | first %>
<% endfor %>
{% endhighlight %}

We just need to use the [liquid filter]() `first` to get the category name, and equally for tags.

Consolidating it all into a `sitemap.xml` might yield [something like mine](http://github.com/alexpearce/alexpearce.github.com/blob/master/sitemap.xml). If you have any extra pages you can add these in a similar way to posts. Nice!
