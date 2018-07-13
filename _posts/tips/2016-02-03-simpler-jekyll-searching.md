---
layout: post
title: Simpler Jekyll searching
category: Tips
tags: [Jekyll, JavaScript]
description: How to create a searchable post index on a Jekyll site
---

All the way back in 2012, I wrote about [how to create a Jekyll search page][1] 
using a combination of a JSON page index and some JavaScript.
I recently rewrote large parts of my blog when upgrading to [Jekyll 3][2], and 
implemented a lazier, hackier, but simpler way of achieving the same effect. 
This post guides you through how it's done.

[1]: {% post_url 2012-04-22-simple-jekyll-searching %}
[2]: https://jekyllrb.com/news/2015/10/26/jekyll-3-0-released/

## What we want

You can label Jekyll posts with whatever metadata you want using [YAML front 
matter][3], which looks like this for the post you're looking at: 

{% highlight yaml %}
---
layout: post
title: Simpler Jekyll searching
category: Tips
tags: [Jekyll, JavaScript]
description: How to create a searchable post index on a Jekyll site
---
{% endhighlight %}

The interesting things here are the `category` value and `tags` list.
If we're going to label our posts like this, it would be nice to have an index 
for each category and tag; a page that lists all the other posts with the same 
category or tag.

[3]: http://jekyllrb.com/docs/frontmatter/

## The old way

In [my old post][1], the general idea was this:

1. Create a near-empty `search.html` page;
2. Generate a list of all posts, along with their category and tags, as a JSON 
   file;
3. When a user hits the search page with a URL like `search.html?tag=foobar`, 
   some JavaScript searches the JSON file for matching posts, and injects them 
   in to the page.

This worked, but it required quite a bit of JavaScript to go from the JSON to a 
formatted HTML list.
It also required an additional HTTP request to asynchronously retrieve the JSON 
file.

I came up with something arguably less elegant, but easier to understand.

## The new way

Now, instead of generating a list of posts as a JSON file, I just generate one 
list per category and tag in the `search.html` page directly.
This means looping over each category, creating a header, and then an unordered 
list of post titles and links.

{% highlight liquid %}{% raw %}
<div class="category-index">
  {% for category in site.categories %}
    {% assign nposts = category | last | size %}
    <div class="collection" data-name="{{ category | first | escape }}">
      <h1>{{ category | first }}</h1>
      <h2>{{ nposts }} post{% if nposts != 1 %}s{% endif %}</h2>
      <ul>
        {% for posts in category %}
          {% for post in posts %}
            {% if post.title %}
              <li><a href="{{ post.url }}">{{ post.title }}</a></li>
            {% endif %}
          {% endfor %}
        {% endfor %}
      </ul>
    </div>
  {% endfor %}
</div>
{% endraw %}{% endhighlight %}

This snippet is for the categories.
The same logic applies to the loop over the tags.

After this, `search.html` contains one list per category and tag, and so all we 
need to do in the JavaScript is to hide all the lists that don't match the 
label the user is searching for.
The logic I went for goes like this:

1. The user searches for something, visiting `/search.html?tag=foo` for 
   example;
2. Some JavaScript parses the GET parameters for either a `tag` or a `category` 
   parameter, storing the value;
3. The list of `.collection` containers is searched, and a container is hidden 
   if it's `data-name` property doesn't match the value of the search parameter.

There are many ways you could write the JavaScript logic, but you can view what 
I ended up with [on GitHub][4].

[4]: https://github.com/alexpearce/alexpearce.github.com/blob/c18e2c8fcdaecfe016b9ac4373fe433fa20a9d2a/assets/js/alexpearce.js#L64-L73

# Wrap up

The new JavaScript has under half the number of lines of the old, and no longer 
depends on [jQuery][5].
Hooray for faster page loads!

As I said, I think the new implementation is more of a hack than the old.
But I'm OK with that; sometimes it's worth sacrificing a 'pure' implementation 
for something that's easier to understand, as it encourages maintainability in 
the future (who wants to touch that magic one-liner?).

One improvement that could be made is to hide all the containers by default, in 
the CSS, and _show_ matching containers, rather than hiding ones that don't 
match.
This would avoid the [flash of 'unstyled' content][6] where all containers are 
briefly shown before the JavaScript kicks in, but it would mean that everything 
is hidden when a user has JavaScript disabled.
What path to take is up to you.

It should be easier for you to adapt the system I use for your own site.
I'd love to hear if anyone gives it a go!

[5]: https://jquery.com/
[6]: https://en.wikipedia.org/wiki/Flash_of_unstyled_content
