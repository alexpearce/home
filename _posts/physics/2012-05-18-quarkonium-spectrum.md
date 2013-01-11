---
layout: post
title: The Spectrum of Quarkonium
category: Physics
tags: [Physics, Python, LaTeX]
description: A computational physics project on 'Masses of S-State Quarkonium via the Roots of the Airy Function Ai(x)'.
comments: false
---

As part of my degree I'm taking a computing course which requires two project reports. The second was on finding the roots of [the first Airy function](http://mathworld.wolfram.com/AiryFunctions.html) in order to find the charm and beauty quark masses. The first one is in a [previous post]({% post_url 2012-05-18-quarkonium-spectrum %}).

The report is written in LaTeX, the problem solving was done in Python, and the plotting was done with Mathematica. The [entire project is open source on GitHub](https://github.com/alexpearce/meson-masses).

Compiling
---------

The LaTeX document has a few dependencies.

1. `atlasphysics` which is bundled in the repository.
2. `siunitx` is found [here](ftp://tug.ctan.org/tex-archive/macros/latex/contrib/siunitx/). It's a nice package which simplifies typesetting units.
3. Standard packages such as `amsmath`, `graphicx`, `subfigure` and `float`. I use the [MacTex](http://www.tug.org/mactex/2011/) distribution for OS X, which ships with these packages by default (and ships with `siunitx` too).

You can view the [final compiled PDF on GitHub](https://github.com/downloads/alexpearce/meson-masses/Report.pdf).
