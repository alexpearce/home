---
layout: post
title: Fixing a TMVA Error
category: Tips
tags: [ROOT, TMVA, Physics]
description: One solution for the TMVA error "signal and background histograms have different or invalid dimensions".
---

If you're using the multivariate analysis package [TMVA](http://tmva.sourceforge.net) and are running in to the following error on training or testing:

{% highlight text %}
--- <FATAL> Tools: <GetSeparation> signal and background histograms have different or invalid dimensions
{% endhighlight %}

It might be failing because you're giving it one or more [`NaN` values](http://en.wikipedia.org/wiki/Not_a_Number).

By default, TMVA selects its training and testing data randomly from the input data. It will do this in a repeatable fashion unless you give `0` as the value to the `RandomSeed` option in the splitting options, so you may either get this error each time you run TMVA or just occasionally.

After a couple weeks of working around the issue, I discovered that I had a single event (a *single* event, mind you!) with a negative value for a particular variable, which I gave the log of to TMVA. In C++, the logarithm of a negative number is represented as a `NaN` value, and it was this which was causing the error.

You can either apply a cut to the input data:

{% highlight text %}
factory->PrepareTrainingAndTestTree("troublesome_var > 0", "troublesome_var > 0", splitOptions);
{% endhighlight %}

or make sure that the events with bad values aren't present in your input data.

The [TMVA user's guide](http://tmva.sourceforge.net/docu/TMVAUsersGuide.pdf) documents the `PrepareTrainingAndTestTree` method, amongst other things.
