---
title: ROOT on OS X 10.9 Mavericks
date: 2013-12-11
tags: [Tutorials, ROOT, OS X]
description: Caveats when installing ROOT on OS X 10.9 (Mavericks).
archived: true
---

**Note**: Running OS X 10.9 Mavericks or later? Check out [the latest tutorial](/2016/02/root-on-os-x-el-capitan/).

With the [recent release of OS X 10.9 Mavericks](http://en.wikipedia.org/wiki/OS_X_Mavericks), I tried to install a recent version of [ROOT](http://root.cern.ch/), 5.34/10, using [my tutorial](/2012/08/installing-root-on-mountain-lion/).
It didn’t work.

[Many people](http://root.cern.ch/phpBB3/viewtopic.php?f=3&t=17190) had [similar issues](http://comments.gmane.org/gmane.comp.lang.c%2B%2B.root/15642) with ROOT and Mavericks, from compiling ROOT itself to compiling programs with ROOT dependencies.
Luckily, the developers have now fixed the problems in later versions.
There are a couple of caveats I’ll throw in for good measure, though:

* Install the [Xcode command line developer tools](http://railsapps.github.io/xcode-command-line-tools.html) by running
    `xcode-select --install`
in a terminal; and
* Reinstall [XQuartz](http://xquartz.macosforge.org/) to make sure you have the latest version.

If you’ve never installed ROOT before, you’ll need to follow my [previous ROOT installation tutorial](/2012/08/installing-root-on-mountain-lion/), up until the ‘Installing ROOT’ step.

There are two ways we can proceed.

1. Download the ROOT source code and compile it ourselves; or
2. Let Homebrew do the heavy lifting.

Each way has it advantages and disadvantages.
The following ‘Compiling’ section walks through the first option, and the ‘Homebrew’ section does the same for the second.
Choose whichever you prefer.
(Homebrew is arguably simpler and cleaner, though, and a safe bet if you’re unsure.)

Compiling
---------

Mavericks compatibility seems to be at its best with versions from 5.34/13, so we’ll use that.
In a terminal (like `Terminal.app`), we download the 5.34/13 source code and extract it on to the desktop.

```bash
$ cd ~/Desktop
$ curl -O ftp://root.cern.ch/root/root_v5.34.13.source.tar.gz
$ tar -xzf root_v5.34.13.source.tar.gz
```

Then we create and move in to the directory we want to install ROOT into. If this directory already exists, we’ll need to move it.

```bash
$ export INSTALL_DIR=/usr/local/root
$ mv $INSTALL_DIR ~/Desktop/old_root
$ mkdir $INSTALL_DIR
$ cd $INSTALL_DIR
```

Next, configure ROOT with with `cmake`

```bash
$ cmake ~/Desktop/root -DCMAKE_INSTALL_PREFIX=$INSTALL_DIR -Droofit=ON -Dcocoa=ON
```

We’ve enabled [RooFit](http://roofit.sourceforge.net/) for nice fitting, and the [Cocoa bindings](http://indico.cern.ch/getFile.py/access?contribId=11&resId=0&materialId=slides&confId=217511) for native OS X interfaces (no XQuartz!).

If you installed the dependencies outlined in the [previous tutorial](/2012/08/installing-root-on-mountain-lion/), this step should complete without errors. If not, look at what’s missing and install it with Homebrew.

Finally, compile.

```bash
$ make
```

If this works, ROOT is now compiled!
You can set up the environment for ROOT by sourcing `thisroot.sh`.

```bash
$ . $INSTALL_DIR/bin/thisroot.sh
```

And then check everything works by trying a `TBrowser`.

```bash
$ root
root [0] TBrowser tb
```

Homebrew
--------

Rather than downloading the source code and running `cmake`/`make` yourself, you can ask Homebrew to do the heavy lifting for you.
We used Homebrew to install the dependencies for us, and now we can do the same for ROOT.

To install with Homebrew, we need to add the [science formula repository](https://github.com/Homebrew/homebrew-science).

```bash
$ brew tap homebrew/science
```

Then simply install ROOT, enabling the Cocoa interface.

```bash
$ brew install --with-cocoa root
```

Summary
-------

ROOT is now fully compatible with Mavericks from version 5.34/13, as far as I can tell.
There are two choices for installation, either compiling manually or with Homebrew.
I’m currently using the Homebrew option, as it seems tidier given my previous reliance on it.

As before, if you’re having trouble with the install, feel free to let me know.
