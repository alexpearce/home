---
layout: post
title: Python and ROOT on OS X
category: Tips
tags: [ROOT, Python, OSX]
description: Fixing an ImportError from libPyROOT on OS X
---

I don't find myself using [ROOT](http://root.cern.ch/drupal/) much on my home machine, but when I do there's usually something broken.

In this case, it was when trying to use [PyROOT](http://root.cern.ch/drupal/content/pyroot), a ROOT interface for Python, that this error made my day:

{% highlight python %}
>>> import ROOT
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/usr/local/root/lib/ROOT.py", line 85, in <module>
    import libPyROOT as _root
ImportError: dlopen(/usr/local/root/lib/libPyROOT.so, 2): Library not loaded: @rpath/libRIO.so
  Referenced from: /usr/local/root/lib/libPyROOT.so
  Reason: image not found
{% endhighlight %}

This is using the install as documented in [a previous post]({% post_url 2012-08-03-installing-root-on-mountain-lion %}).

The problem is that the library Python loads can't find another library it needs. To fix this, the `DYLD_LIBRARY_PATH` variable needs to be set:

{% highlight text %}
export DYLD_LIBRARY_PATH=$ROOTSYS/lib:$DYLD_LIBRARY_PATH
{% endhighlight %}

This can be executed directly in the shell or placed in a `.bashrc`-type file.

Caveat
------

This solution is not without fault. Namely, whenever one runs a command with `sudo`, the following warning appears:

{% highlight text %}
dyld: DYLD_ environment variables being ignored because main executable (/usr/bin/sudo) is setuid or setgid
{% endhighlight %}

This is a [well](https://discussions.apple.com/thread/4143805?start=0&tstart=0) [known](http://stackoverflow.com/questions/12064725/dyld-dyld-environment-variables-being-ignored-because-main-executable-usr-bi) issue with OS X 10.8 (Mountain Lion), complete with a [bug report](http://openradar.appspot.com/11894054).

At least [one workaround](http://apple.stackexchange.com/a/76213) is available, but for now I put up with the message in the shell I want to use PyROOT in, manually setting `DYLD_LIBRARY_PATH` when needed.
