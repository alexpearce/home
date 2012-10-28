---
layout: post
title: Merging ROOT Ntuples
category: Tips
tags: [ROOT, Physics]
description: How to merge multiple ntuples, in the form ntuple.root, in to a single file.
---

You have multiple `.root` files containing ntuples and wish to merge them in to one. For example, you have 3 files called `ntuple.0.root`, `ntuple.1.root`, and `ntuple.2.root`. The structure of each is identical, for instance:

{% highlight text %}
ntuple.X.root:
  DecayModeOne
    DecayTree
  DecayModeTwo
    DecayTree
  GetIntegratedLuminosity
    LumiTuple
{% endhighlight %}

Here, the indentation represents the folder structure, and the deepest elements (`DecayTree`, `LumiTuple`) are `TTree` objects.

To merge these files, use the `hadd` command (found in `$ROOTSYS/bin`):

{% highlight bash %}
$ hadd ntuple.root ntuple.0.root ntuple.1.root ntuple.2.root
{% endhighlight %}

The first argument is the desired output ntuple, the remaing arguments are the files to be merged.

This will produce the following output when using the example structure above:

{% highlight text %}
hadd Target file: ntuple.root
hadd Source file 1: ntuple.0.root
hadd Source file 2: ntuple.1.root
hadd Source file 3: ntuple.2.root
hadd Target path: ntuple.root:/
hadd Target path: ntuple.root:/DecayModeOne
hadd Target path: ntuple.root:/DecayModeTwo
hadd Target path: ntuple.root:/GetIntegratedLuminosity
{% endhighlight %}

This can will take some time if you're merging lots of data (it took me around 40 minutes to merge 120 ntuples with a total size of 20GB).

A Nicer Way
-----------

If you're using a bash-like shell (`bash`, `zsh`), then there is an even nicer way of doing things:

{% highlight bash %}
$ hadd ntuple.root ntuple.{0..2}.root
{% endhighlight %}

The `{0..2}` part is expanded by the shell to `ntuple.0.root ntuple.1.root ntuple.2.root`. If you're not a regular bash/zsh user, you can still take advantage of the feature by executing

{% highlight bash %}
$ bash
{% endhighlight %}

in your shell and then

{% highlight bash %}
$ exit
{% endhighlight %}

once you're done. Note that this new shell may not have `$ROOTSYS/bin` in its `PATH`, but can be quickly added.

{% highlight bash %}
$ export PATH=/path/to/root/bin:$PATH
{% endhighlight %}
