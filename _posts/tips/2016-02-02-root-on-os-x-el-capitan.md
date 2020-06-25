---
title: ROOT on OS X 10.11 El Capitan
tags: [Tips, ROOT, OS X]
description: A guide to install to high energy physics framework ROOT on OS X 10.11 with Homebrew.
---

<div class="alert">
  This guide is outdated!
</div>

The [original post](#original-post) is below for posterity, but
installing ROOT has been much simpler for a while now, whether you're on El Capitan, Sierra, High Sierra, Mojave, Catalina, or Big Sur.

There are only two steps:

1. Install [Homebrew][5].
2. Run this command:

```bash
$ brew install root
```

Boom. Just take care to read the information printed at the end. You can
review it later if you missed it:

```bash
$ brew info root
==> Caveats
Because ROOT depends on several installation-dependent
environment variables to function properly, you should
add the following commands to your shell initialization
script (.bashrc/.profile/etc.), or call them directly
before using ROOT.

For bash users:
  . /usr/local/bin/thisroot.sh
For zsh users:
  pushd /usr/local >/dev/null; . bin/thisroot.sh; popd >/dev/null
For csh/tcsh users:
  source /usr/local/bin/thisroot.csh
For fish users:
  . /usr/local/bin/thisroot.fish
```

I recommend [installing ROOT via Anaconda][anaconda] as an alternative, which
often integrates more nicely in to the reproducible analysis paradigm.

[anaconda]: https://iscinumpy.gitlab.io/post/root-conda/

---

# Original post

I've written some lengthy guides on installing [ROOT][1], firstly for [OS X 
10.8 Mountain Lion][2] and then for [OS X 10.9 Mavericks][3].

They were long because the [install process with CMake][4] could be convoluted, 
requiring several dependencies that are occasionally non-obvious. These days, 
though, things are extremely simple.

[1]: https://root.cern.ch
[2]: {% post_url collections.posts, 'installing-root-on-mountain-lion' %}
[3]: {% post_url collections.posts, 'root-on-os-x-mavericks' %}
[4]: https://root.cern.ch/building-root

## Homebrew

[Homebrew][5] is a software management program for OS X.
A large group of volunteers maintains a set of so-called [formula][6], recipes 
that tell your Mac how to build pieces of software.

If you don't already have Homebrew installed, I highly recommend it. It makes 
it extremely easy to install software and to keep it up-to-date.
To install CMake, for example, you would do:

```bash
$ brew install cmake
```

In addition to the [standard repository of formula][7], which includes formula 
for programs like CMake and [git][8], there's a repository dedicated to programs 
used for science, called [Homebrew Science][9].
This repository contains formula for ROOT 5 and ROOT 6.

[5]: http://brew.sh/
[6]: http://braumeister.org/
[7]: https://github.com/Homebrew/homebrew/tree/master/Library/Formula
[8]: https://git-scm.com/
[9]: http://brew.sh/homebrew-science/

## Installation

By default, `brew` only knows about the standard repository of formula, so 
first add the Homebrew Science collection.

```bash
$ brew tap homebrew/science
```

Now we can install ROOT. We'll go with ROOT 6 here, the latest version.

```bash
$ brew install root6
```

That was easy!

You'll notice that Homebrew gives you some instructions after you've run the 
installation.
You can look at these instructions whenever you like.

```bash
$ brew info root6
```

This tells you to add a line to your shell configuration.
For the [Bash shell][1], you can add these lines to the `.bashrc` file in your home directory:

```bash
. $(brew --prefix root6)/libexec/thisroot.sh
```

Open a new shell and try it out by running `root`.
