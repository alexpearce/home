---
layout: post
title: Escaping Liquid Tags in Jekyll
category: Tips
tags: [Jekyll, JavaScript]
description: How to include Liquid tags in Jekyll posts.
---
Writing [the previous post]({% post_url 2012-04-22-simple-jekyll-searching %}) brought about a problem: How can I write posts about [Liquid tags](http://liquidmarkup.org/)?

By default, any Jekyll file containing [YAML front matter](https://github.com/mojombo/jekyll/wiki/YAML-Front-Matter) will be churned through the Liquid processor. This means that any blog posts, which require YAML front matter, that contain Liquid tags will have them processed producing unwanted results.

The few solutions to this problem I've seen monkey-patch Jekyll. This works but was a little messy for me, so I went with a JavaScript approach.

Instead of writing my posts with Liquid tags , I simply substitute in ERB-style brackets.

{% highlight erb %}
<% for post in site.posts %>
  <%= post.title %>
  <% include post.json %>
<% endfor %>
{% endhighlight %}

The above will be transformed in to

{% highlight text %}
<% for post in site.posts %>
  <%= post.title %>
  <% include post.json %>
<% endfor %>
{% endhighlight %}

The replacement is done with JavaScript via `replaceERBTags($el)`, where `$el` is a jQuery object of the element containing the tags to be replaced. The function itself is nothing complex, in fact it's so simple I can't show it because it can't escape itself! So you'll have to be content with viewing it [on GitHub](https://github.com/alexpearce/alexpearce.github.com/blob/37f92f56e4cf85f96361f52baa523ab1dd900398/assets/js/alexpearce.js#L113).

Syntax Highlighting
-------------------

[Pygments](http://pygments.org/), the syntax highlighter used by Jekyll, doesn't support Liquid so we can't get pretty markup. The syntax highlighting above is due to me using a `<% highlight erb %>` block. Because I target `$('code.text')` elements for tag replacements, i.e. `<% highlight text %>` blocks, I needed to use a different lexer to show the ERB tags.

You *could* target `code.erb` elements instead, but then you lose the use of ERB tags! I'm not a fan of Liquid, so I plan on doing as few posts on it as possible, hence I'm happier with ERB support. (Plus, any syntax highlighting you did get would only be approximate, and I expect would break down if you had anything but raw Liquid.)
