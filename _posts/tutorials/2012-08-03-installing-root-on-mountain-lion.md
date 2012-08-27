---
layout: post
title: Installing ROOT on OS X 10.8 with CMake and Homebrew
category: Tutorials
tags: [ROOT, osx]
description: A step-by-step guide to install to high energy physics framework ROOT on OS X 10.8 with CMake and Homebrew.
---

With Mountain Lion, the latest version of OS X, having been [recently released](http://www.theverge.com/2012/7/25/3186764/apple-os-x-10-8-mountain-lion-released), there's been the usual flurry of blog posts on how to [survive the upgrade](http://robots.thoughtbot.com/post/27985816073/the-hitchhikers-guide-to-riding-a-mountain-lion).

I recently found myself needing to install [ROOT](http://root.cern.ch/), the high energy physics framework by the folks at CERN. It wasn't easy. The only [10.8 ROOT tutorial I've found](http://blog.philippklaus.de/2012/06/installing-root-cern-on-mac-os-x-10-8-mountain-lion/) uses the `make; make install` path and doesn't enumerate any of the available configuration options. (I wanted to use `cmake` for the [Xcode integration](http://root.cern.ch/drupal/content/building-root-cmake)).

The following assumes you're OK using the command line, though all the commands needed are given, and are running OS X 10.8 Mountain Lion. We'll be installing ROOT to its own directory, so if something goes wrong during the install just delete the directory and try again.

## Setting Up

ROOT is distributed as source, so to install it we must download and compile. It has [several dependencies](http://root.cern.ch/drupal/content/build-prerequisites) which are required for compilation; we'll use [Homebrew](http://mxcl.github.com/homebrew/) to install them.

[Xcode](https://developer.apple.com/xcode/), Apple's development environment, is required before installing Homebrew. It's [available on the Mac App Store](http://itunes.apple.com/us/app/xcode/id497799835?ls=1&mt=12). Once it's downloaded and installed, open Xcode, then open the following menu items in order: `Xcode, Preferences, Downloads, Components`. Choose to install the "Command Line Tools" option.

Finally in preparation for Homebrew, as [Mountain Lion doesn't ship with X11](http://support.apple.com/kb/HT5293), [download XQuartz](http://xquartz.macosforge.org/landing/) 2.7.2 or later. Mount the disk image and use the package install inside.

Next, launch Terminal (inside `/Applications/Utilities/`) and install Homebrew.

{% highlight bash %}
$ ruby <(curl -fsS https://raw.github.com/mxcl/homebrew/go)
...
$ brew doctor
{% endhighlight %}

A lot of the warnings that `brew doctor` produces can safely be ignored (at least for our purposes). If there's any of them that look particular troubling, Googling almost always uncovers someone with the same problem.

Remember to add the Homebrew directory to your `PATH` by adding the directory (found with `brew --prefix`) to your `.bashrc`, `.zshrc` or whatever shell file you're using (`.bashrc` is the OS X default). We'll also add the XQuartz binaries to the `PATH` in case anything needs them in the future.

{% highlight bash %}
export PATH=/usr/local/bin:/opt/X11/bin:$PATH
{% endhighlight %}

Start a new Terminal session to pick up the changes.

Now that Homebrew is installed, we can use it to install the required dependencies. Each may take some time as Homebrew generally compiles from source.

{% highlight bash %}
$ brew install gfortran # Fortran compiler
$ brew install python   # Python interpreter
$ brew install pcre     # Regular Expressions library
$ brew install fftw     # Fast Fourier Transforms
$ brew install cmake    # Cross-platform make
{% endhighlight %}

You can read the post-install caveats any time by reading the [appropriate recipe](https://github.com/mxcl/homebrew/tree/master/Library/Formula). (The only one to really take notice of is the [Python installation](https://github.com/mxcl/homebrew/blob/master/Library/Formula/python.rb), where you might like to use the symlinks provided and add the `install-scripts` folder to your `PATH`.)

That's everything required for ROOT to install. Now to download and compile.

## Installing ROOT

We'll be installing ROOT in to the same directory that Homebrew installs things in to, but you can choose whichever directory you like (preferably one which your user owns to avoid lots of `sudo`). Create the directory and download ROOT in to it with [cURL](http://curl.haxx.se/docs/manpage.html).

{% highlight bash %}
$ cd /usr/local
$ mkdir root
$ cd root
$ curl -O ftp://root.cern.ch/root/root_v5.34.01.source.tar.gz
{% endhighlight %}

Unzip the tarball and move it to a `src` directory.

{% highlight bash %}
$ gzip -dc root_v5.34.01.source.tar.gz | tar -xf -
$ mv root/ src/
{% endhighlight %}

Good stuff. All that's left is the compilation with `make`. I stumbled a lot here, mainly because of X11. The compiler didn't pick up my XQuartz install so couldn't find `X11/Xlib.h`. Luckily [StackOverflow provided the answer](http://stackoverflow.com/questions/11465258/xlib-h-not-found-when-building-graphviz-on-mountain-lion), saying to pass the required directory as a compiler flag.

We use a few compilers here (`clang`, `clang++`, `gfortran`), so which compiler needs the flags? I got the compilation to work with the following.

{% highlight bash %}
$ export CFLAGS=-I/opt/X11/include
$ export CXXFLAGS=-I/opt/X11/include
$ export CPPFLAGS=-I/opt/X11/include
{% endhighlight %}

Now run `cmake` to configure ROOT.

{% highlight bash %}
$ cmake /usr/local/root/src -DCMAKE_INSTALL_PREFIX=/usr/local/root -DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++ -Droofit=ON
{% endhighlight %}

The `C_COMPILER` and `CXX_COMPILER` are both [Clang](http://en.wikipedia.org/wiki/Clang). If you don't set these flags explicitly CMake may use the GNU compiler `gcc` for the `C_COMPILER` and Clang for the `CXX_COMPILER`, which [causes errors](https://savannah.cern.ch/bugs/?96160). We enabled [Roofit](http://roofit.sourceforge.net) for nice fits. If there [any other ROOT options](http://root.cern.ch/drupal/content/building-root-cmake#options) you want changed, the `cmake` command is the place to specify them.

Now we can compile ROOT.

{% highlight bash %}
$ make -j 3
{% endhighlight %}

The `-j` flag is the jobs flag and allows the compiler to execute multiple jobs simultaneously, rather than running a linear compilation. I've heard arguments saying that the integer argument should be related to [the number of cores](http://root.cern.ch/drupal/content/building-root-cmake#options) on your processor and [the number of cores plus one](http://www.timocharis.com/help/jn.html). Both worked fine for me with a Core 2 Duo processor (`-j 2` and `-j 3`). If you're on a newer machine with a [Core iX processor](http://en.wikipedia.org/wiki/Intel_Core#Sandy_Bridge_microarchitecture_based) you might have 2, 4, or even 6 cores.

Assuming that worked without fatal errors (and if it did, congratulations! You've achieved the impossible) then there's only one more step. If it *didn't* work, you can contact me with the error message to try and sort something, or Google around with some key words from the error message.

{% highlight bash %}
$ make install
{% endhighlight %}

Finally, add ROOT to your `PATH` using the same procedure as before, such that it might now look something like this.

{% highlight bash %}
export PATH=/usr/local/bin:/opt/X11/bin:/usr/local/root/bin:$PATH
{% endhighlight %}

Remember that this line should be *in a shell config file* such as `.bashrc`. If you enter this line directly as a command, it will be lost in a new session.

With that, open a new shell session and try to run ROOT. You should see your X server start and a little ROOT splash window appear.

{% highlight bash %}
$ root
...
root [0]
{% endhighlight %}

Now you're ready to ROOT! To quit, use `.q`. If you ever find your stuck in the ROOT command line, try `ctrl + c` to interrupt.

It's a good idea to run the demos to test the installation, using `.x` to execute a file.

{% highlight text %}
root[0] .x /usr/local/root/src/tutorials/demos.C
{% endhighlight %}

There are [many ROOT tutorials included](http://root.cern.ch/root/html/tutorials/) inside `src/tutorials`, and [this Histogram tutorial](http://www.slac.stanford.edu/BFROOT/www/doc/workbook/root1/root1.html) gives a brief feel of the syntax. If you ever see a mention of `$ROOTSYS`, this refers to the ROOT installation directory in `/usr/local/root/src`.

### Testing

If you like, you can compile and run [ROOT's test suite](http://root.cern.ch/drupal/content/benchmarking). To do so, change directory in to `$ROOTSYS`, run the `thisroot` bash script, and then compile.

{% highlight bash %}
$ cd /usr/local/root
$ . bin/thisroot.sh
$ cd test/
$ make
$ ./stress -b
...
*  ROOTMARKS =1444.7   *  Root5.34/01   20120713/1049
{% endhighlight %}

## Summary

We've installed Xcode, XQuartz, and Homebrew, which we've used to install all of the dependencies required for configuring and compiling ROOT. After downloading, configuring, compiling, and installing ROOT, we have ran a demo program to make sure it's working.

This took me a few hours to figure out, using many online sources which I have tried to link to throughout. If you have problems getting ROOT up and running on 10.8 I'm happy to try and help, or you can try the [ROOT message board](http://root.cern.ch/phpBB3/index.php).