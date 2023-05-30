---
title: Exponent labels in matplotlib
date: 2014-04-13
tags: [Tips, Python, matplotlib]
description: How to move and configure the exponent/offset label in matplotlib.
---

Creating nice-looking plots in Python is easy with [matplotlib](http://matplotlib.org/).
Here’s an example of plotting some data as a histogram.

```python
import numpy as np
from matplotlib import pyplot as plt

fig = plt.figure(figsize=(5, 4))
# Generate some data
mu, sigma = 0, 1
s = np.random.normal(mu, sigma, 10000)
# Plot it
plt.hist(s, 30, histtype='step')
# Format it
ax = plt.gca()
ax.minorticks_on()
ax.set_xlabel('Vertex position [mm]', x=1, ha='right')
ax.set_ylabel('Candidates', y=1, ha='right')
fig.set_tight_layout(True)
fig.savefig('vertex-position.svg')
```

I like that looking at a matplotlib script is reasonably self-explanatory.
Most of the default values are sensible, so it doesn’t take much to create something that looks alright.
The above code produces the following.

![A histogram of a randomly-sampled Gaussian distribution made with matplotlib.](/img/exponent-label-in-matplotlib/simple-gaussian.svg)

The only interesting configuration we do is to slightly shrink the figure size, shift the x and y labels to the right of their respective axes, and to tighten up the figure margins.
All of these are just cosmetic changes to bring the look inline with what I’m used to.

The problem comes when the axis tick values are large enough to warrant an exponent or offset.
If we change `mu` and `sigma` to some large values, we can see the problem.

```python
mu, sigma = 1e7, 1e6
```

This shifts the mean of the distribution to ten million, and changes to width to one million.
Running the code above with this change, we get the following.

![A Gaussian distribution with a very large mean and width.](/img/exponent-label-in-matplotlib/shifted-gaussian.svg)

The problem is that the exponential prefix is covered by the axis label.
(This prefix is equivalent to [scientific notation](https://en.wikipedia.org/wiki/Scientific_notation), where numbers like `1230` are represented as `1.230e3`, read as ‘one point two three zero times ten to the power three’.)

I came across this while creating a scipt to convert [ROOT](http://root.cern.ch/) [canvases](http://root.cern.ch/root/html534/TCanvas) to matplotlib figures (available soon!).
Googling didn’t help, so I ended up looking throught the [matplotlib source code](https://github.com/matplotlib/matplotlib).
To access the [`Text` object](http://matplotlib.org/api/artist_api.html#matplotlib.text.Text) that holds the exponential label, one uses

```python
ax.get_xaxis().get_offset_text()
# Or equivalently
# ax.xaxis.offsetText
```

where `ax` is the [Axes](http://matplotlib.org/api/axes_api.html) instance.
Once you have this, you can manipulate the object’s size, position, colour, and a bunch of other properties.
To shift the exponential label (called ‘offset text’ in matplotlib jargon, as it can also hold an offset value), you can do

```python
ax.get_xaxis().get_offset_text().set_x(0)
```

(The `x` property is the x-position of the `Text` object, from 0 to 1 left-to-right.)

Making this modification, the plot now looks like this.

![The previous Gaussian, but with the exponential label now visible.](/img/exponent-label-in-matplotlib/shifted-gaussian-fixed.svg)

Much better!
But it stills look odd.
It’s more conventional to have the exponential label on the right.
So, let’s shift the *axis label* slightly to the left, and keep the exponential fully to the right.

```python
ax.set_xlabel('Vertex position [mm]', x=0.9, ha='right')
# This line's not necessary as x=1 is the default
ax.get_xaxis().get_offset_text().set_x(1)
```

Now we’re pretty much there.

![The previous Gaussian, but with the labels looking conventional.](/img/exponent-label-in-matplotlib/shifted-gaussian-final.svg)

Nice.
My only problem with this result is that the offset text is sitting on a slightly higher baseline than the axis label.
This happens because the offset text is actually part of the axis, whereas the label is not.
This also means its y-position can’t be modified.

If this really bugs you, you can append the offset text to the axis label and hide the offset text itself.
You need to draw the figure first in order for the text to be created.

```python
ax.set_xlabel('Vertex position [mm]', x=1, ha='right')
fig.savefig('vertex-position.svg')
offset = ax.get_xaxis().get_offset_text()
ax.set_xlabel('{0} {1}'.format(ax.get_xlabel(), offset.get_text()))
offset.set_visible(False)
fig.savefig('vertex-position.svg')
```

All these changes gives the following.

![The final figure.](/img/exponent-label-in-matplotlib/shifted-gaussian-anal.svg)

The full code for this final figure is [available as a gist](https://gist.github.com/alexpearce/10581837).

This solution isn’t ideal, it could look better and be implemented more elegantly, but it’s not a bad start.
