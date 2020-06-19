---
layout: post
title: Italic fonts in iTerm2, tmux, and vim
category: Tips
tags: [Terminal, vim, tmux]
description: How to configure iTerm2, tmux, and vim to enable italic fonts.
---

<div class="alert">
  <a href="{% post_url /tips/2014-05-06-italics-in-iterm2-vim-tmux %}#tmux-21-and-above">
    Using tmux version 2.1 or above? Check out the update.
  </a>
</div>

Recently, I’ve been trying to restrict my coding workflow to the terminal.
I’ve always used [iTerm2][1] as my terminal, and, since switching to [vim][2] about 18 months, have used [MacVim][3] as my editor.
I felt I was losing efficiency switching between windows though, and losing power by not exploiting things like [splits][4].

Currently, my setup is using iTerm2 with [tmux][5] to manage terminal splits and ‘windows’, and then regular old vim to edit.
I like it, but the setup’s for another post.

This one is about enabling italics in these three tools.
MacVim has native support for italics, and although iTerm2 has [supported italics][6] for sometime, getting my italics back proved to be somewhat cumbersome.
I’ll explain what I did to get italics in iTerm2, tmux, and vim, as shown below, in this post.

![Consolas Italic in vim, running in a tmux session, running in iTerm2](/assets/img/italics-in-iterm2-vim-tmux/italic-showcase.png)

[1]: http://www.iterm2.com/
[2]: http://www.vim.org/
[3]: https://code.google.com/p/macvim/
[4]: http://robots.thoughtbot.com/vim-splits-move-faster-and-more-naturally
[5]: http://tmux.sourceforge.net/
[6]: https://code.google.com/p/iterm2/issues/detail?id=391

The font
--------

In order to see italicised text at all, we need a typeface with a italic variant.
I like [Consolas](https://en.wikipedia.org/wiki/Consolas), which is included in all recent versions of Windows, and will be present on an OS X system if Microsoft Office has been installed.
If you don’t have it, you can probably find it online, or use a free typeface with an italic variant like [Ubuntu](http://font.ubuntu.com/) or [Anonymous Pro](http://www.marksimonson.com/fonts/view/anonymous-pro). (There’s also <a href="https://en.wikipedia.org/wiki/Menlo_(typeface)">Menlo</a>, which is included with OS X.)

iTerm2
------

iTerm2 has support for italics built in.
First, make sure it’s enabled in your terminal profile.

![Where to enable italic text in iTerm2](/assets/img/italics-in-iterm2-vim-tmux/iterm2-italic-text-setting.jpg)

Next, we need to tell the terminal what italic actually *means*, which is done by using a special [`TERM`][7] entry.
(This is not a subject I’m familiar with, but worrying about the technicalities here doesn’t seem to be necessary.)
Luckily, one has [already been made for us][8], courtesy of [Stefan Schüssler][9].

{% highlight text %}
# A xterm-256color based TERMINFO that adds the escape sequences for italic.
xterm-256color-italic|xterm with 256 colors and italic,
  sitm=\E[3m, ritm=\E[23m,
  use=xterm-256color,
{% endhighlight %}

Create a file called `xterm-256color-italic.terminfo`, where ever you like, with the above contents.
This file needs to be processed and added to the `TERM` database.

{% highlight bash %}
$ tic xterm-256color-italic.terminfo
{% endhighlight %}

Finally, we need to tell iTerm2 to use this new `TERM`, `xterm-256color-italic`, by default.
This is done in the terminal pane of whatever profile you’re using.
The new entry probably won’t be in the list, but we can just type it in.

![Where to change the reported terminal type in iTerm2](/assets/img/italics-in-iterm2-vim-tmux/iterm2-report-terminal-type.jpg)

If you close and reopen iTerm2, executing the following should show italicised text.

{% highlight bash %}
$ echo `tput sitm`italics`tput ritm`
{% endhighlight %}

If you don’t see italicised text, something else might be overriding the `TERM` environment variable.
Check its value is `xterm-256color-italic`.

{% highlight bash %}
$ echo $TERM
xterm-256color-italic
{% endhighlight %}

If it’s different, check you’re dotfiles (like `.bashrc`).

[7]: http://linux.about.com/od/ttl_howto/a/hwtttl16t06.htm
[8]: https://gist.github.com/sos4nt/3187620
[9]: https://github.com/sos4nt

vim
---

I really like having comments in italic.
It differentiates them one step more from the surrounding code, and it makes sense semantically too, as a comment is treated very differently from anything else in the source.

To [enable italicised comments in vim][10], add this line to your `.vimrc` file *after* anything else theme related (like `colorscheme`).

{% highlight text %}
highlight Comment cterm=italic
{% endhighlight %}

Then open up a new vim session and type a comment. Glorious.

You could also edit your colorscheme directly by changing the comment highlighting declaration.

[10]: https://stackoverflow.com/questions/3494435

tmux
----

If you open up a new tmux session, and then open vim, you’ll notice the italics aren’t working anymore.
This is because the `TERM` for a tmux session is, by default, different to that of a non-tmux session.


{% highlight bash %}
# Inside a tmux session
$ echo $TERM
screen-256color
{% endhighlight %}

To fix this, we need to install a new `TERM` entry, like we did before, and then tell tmux to use it.

So, as before, copy the contents below in to a file, this time called `screen-256color-italic.terminfo`.

{% highlight text %}
# A screen-256color based TERMINFO that adds the escape sequences for italic.
screen-256color-italic|screen with 256 colors and italic,
  sitm=\E[3m, ritm=\E[23m,
  use=screen-256color,
{% endhighlight %}

If you squint, you’ll notice the only difference to the previous `.terminfo` is replacing all instances of `xterm` with `screen`.

Then, load this in to the `TERM` database.

{% highlight bash %}
$ tic screen-256color-italic.terminfo
{% endhighlight %}

Add a line to your `tmux.conf` to tell tmux to use the new `TERM`.

{% highlight text %}
set -g default-terminal "screen-256color-italic"
{% endhighlight %}

I suspect there’s a cleverer way, but I had to kill my tmux process to bring the changes into effect.

{% highlight bash %}
$ killall tmux
{% endhighlight %}

Starting a new tmux session and opening vim, you should see what we’re after: italics!

Caveats
-------

If you `ssh` in to a remote machine from your tmux session, you might get some errors related to your new `TERM`.
This is because the remote machine doesn’t have the database entry we just installed locally.

To fix this, repeat the installation of the `xterm-256color-italic` and `screen-256color-italic` `TERM` entries.
(The `screen` entry isn’t necessary if you won’t be using tmux on the remote machine.)
We can extract the terminfo from our local database, and then upload it to the remote machine.

{% highlight bash %}
$ infocmp xterm-256color-italic > xterm-256color-italic.terminfo
$ scp xterm-256color-italic.terminfo user@remote:
$ ssh user@remote
# On the remote machine
$ tic xterm-256-italic.terminfo
{% endhighlight %}

Repeat for the `screen` terminfo.

You can delete the `.terminfo` files, from both the remote and local machines, once you’ve loaded them with `tic`.

tmux 2.1 and above
------------------

The release of [tmux 2.1][tmux21] saw several changes to the way tmux handles 
the terminal type, amongst other things. For getting italics working, we now 
need a *new terminfo* called `tmux`.

Luckily, there's already [an FAQ][tmux21-faq] on how to add the new terminfo entry with a single command.

{% highlight bash %}
$ cat <<EOF|tic -x -
tmux|tmux terminal multiplexer,
  ritm=\E[23m, rmso=\E[27m, sitm=\E[3m, smso=\E[7m, Ms@,
  use=xterm+tmux, use=screen,

tmux-256color|tmux with 256 colors,
  use=xterm+256setaf, use=tmux,
EOF
{% endhighlight %}

We then just need to tell tmux to use this new terminfo.

{% highlight text %}
set -g default-terminal "tmux"
{% endhighlight %}

You might need to restart your terminal and/or the tmux server for the changes 
to take effect.

Thanks to Landon Schropp for pointing this out in the comments.

[tmux21]: https://github.com/tmux/tmux/releases/tag/2.1
[tmux21-faq]: https://github.com/tmux/tmux/blob/2.1/FAQ#L355-L383
[tmux21-comment]: https://alexpearce.me/2014/05/italics-in-iterm2-vim-tmux/#comment-2629095475
