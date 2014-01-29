---
layout: post
title: TBrowser Shortcut
category: Tips
tags: [ROOT]
description: A shortcut to launch a ROOT TBrowser from the terminal.
---

One of the nice features of [ROOT](http://root.cern.ch/), a data analysis framework commonly used in particle physics, is the [`TBrowser`](http://root.cern.ch/root/htmldoc/TBrowser) file browser.

![Old familiar: a ROOT TBrowser](/assets/img/tbrowser-shortcut/root-tbrowser.png)

It lets you view the directory structure of [ROOT files](http://root.cern.ch/root/htmldoc/TFile), as well as quickly create histograms of ntuple branches.
It’s so useful that I use it a lot during the day, maybe 20 times or more.
Using it then becomes a little tedious, as its instantiation is a little more verbose than I care for, particularly when I’m typing it all day.

{% highlight bash %}
$ root my_file.root
root [0] new TBrowser // Pointer, or
root [1] TBrowser asd // Reference
{% endhighlight %}

So I cobbled something together which requires minimal effort.

{% highlight bash %}
$ tb my_file.root
{% endhighlight %}

This starts ROOT and brings up a `TBrowser` with `my_file.root` loaded.

Implementation
--------------

There are probably a few ways to do this, but I went for a shell function and a [ROOT macro](http://root.cern.ch/drupal/content/working-macros).

In a file my shell looks at, such as `.zshrc`, I have the function `tbrowser`.

{% highlight bash %}
tbrowser () {
  # Check a file has been specified
  if (( $# == 0 )); then
    echo "No file(s) specified."
  else
    # For each file, check it exists
    for i; do
      if [ ! -f $i ]; then
        echo "Could not find file $i"
        return 1;
      fi
    done
    root -l $* $HOME/.macros/newBrowser.C
  fi
}
{% endhighlight %}

This calls a macro `newBrowser.C` in a hidden folder `.macros` in my home directory.
All the macro does is create a `TBrowser` object, as you might expect.

{% highlight cpp %}
void newBrowser() {
  new TBrowser;
}
{% endhighlight %}

As I really am lazy, I alias the `tbrowser` function to `tb`; again, in a file my shell looks at.

{% highlight bash %}
alias tb="tbrowser"
{% endhighlight %}

As an aside, if you haven’t already created an alias to hide that obnoxious ROOT splash screen, I’d recommend it.

{% highlight bash %}
alias root="root -l"
{% endhighlight %}

