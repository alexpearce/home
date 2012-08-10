---
layout: post
title: Scattering Cross Sections in the Standard Model
category: Physics
tags: [Physics, Python, C, LaTeX]
description: A computational physics project on 'Numerical Evaluation of the e+e− → μ+μ− Cross Section in the Standard Model'
comments: false
---

As part of my degree I'm taking a computing course which requires two project reports. The first was on e+e− &rarr; &mu;+&mu;− scattering, mediated via the photon and the Z boson.

I wrote the report in LaTeX, with the main program being written in Python. As an extension, I rewrote the bulk of the Python script in C in order to compare the relative performance of the two languages.

I've open-sourced the entire project, which you can [view on GitHub](https://github.com/alexpearce/eeuu-scattering).

Compiling
---------

The C script should compile on just about any system with [gcc](http://gcc.gnu.org/) using

{% highlight bash %}
$ gcc -Wall cross_section.c -o cross_section
{% endhighlight %}

 The LaTeX document has a few dependencies.

1. `atlasphysics` which is bundled in the repository.
2. `feynmp` is found [here](http://www.ctan.org/tex-archive/macros/latex/contrib/feynmf). There's a nice guide to [installing `feynmp` on OS X here](http://osksn2.hep.sci.osaka-u.ac.jp/~taku/osx/feynmp.html).
3. Standard packages such as `amsmath`, `graphicx`, `subfig` and `float`. I use the [MacTex](http://www.tug.org/mactex/2011/) distribution for OS X, which ships with these packages by default.

You can view the [final compiled report on GitHub](https://github.com/downloads/alexpearce/eeuu-scattering/Report.pdf).