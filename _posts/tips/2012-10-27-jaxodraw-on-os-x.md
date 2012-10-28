---
layout: post
title: JaxoDraw on OS X with MacTex
category: Tips
tags: [OS X, Physics]
description: Tips on running the Feynman diagram generator JaxoDraw on OS X
---

Creating [Feynman Diagrams](http://en.wikipedia.org/wiki/Feynman_Diagrams) in LaTeX can be a real pain. There are packages to simplify the process, such as [feynMP](http://osksn2.hep.sci.osaka-u.ac.jp/~taku/osx/feynmp.html), but the syntax is verbose, cumbersome, and unintuitive.

As LaTeX is generally such an unpleasant environment in which to create images, it's often much less painful to use a GUI for the task. For Feynman diagrams there is the open source [JaxoDraw](http://jaxodraw.sourceforge.net).

Unfortunately, JaxoDraw didn't work out-of-the-box for me. Namely, I couldn't export the diagrams directly to the vector image format EPS, nor could I draw gluon lines without the program crashing.

The rest of this post explains how to get JaxoDraw in tip-top condition, so that you'll be able to create and save smashing diagrams like this:

![A nifty Feynman diagram](/assets/img/jaxodraw-on-os-x/feynman-diagram.png)

Prerequisites
-------------

As JaxoDraw is a Java application, you need to have a Java runtime installed. OS X no longer ships with a Java runtime by default, so open a Terminal window (in `/Applications/Utilities/Terminal.app`) and execute the following.

    java -version

You'll be told that you don't have Java installed and asked if you like to install it, so install it.

Keep the Terminal window open as we'll be using it later.

As we're dealing with LaTeX on OS X, we should have the de facto OS X LaTeX distribution installed: [MacTex](http://www.tug.org/mactex/). If don't have it already download the `MacTex.pkg` file from the homepage (it's over 2GB in size) and install it.

Now we should have everything we need, so let's acquire JaxoDraw and get it up and running.

Getting JaxoDraw Working
------------------------

Download the [JaxoDraw binary](http://jaxodraw.sourceforge.net/download/bin.html) and the [JaxoDraw OS X application](http://jaxodraw.sourceforge.net/download/dmg.html).

The OS X application won't launch, but we're going to create a *new* application using the icon from the broken application and the binary we just downloaded.

Unzip the binary archive by double clicking on it and note the `jaxodraw-2.1-0.jar` file that's extracted; this is "the binary". Next, mount the application disk image and execute the following command in Terminal.

{% highlight bash %}
$ cp /Volumes/jaxodraw-2.1-0/JaxoDraw.app/Contents/Resources/jaxoicon2_128.icns \
  ~/Desktop/
{% endhighlight %}

This will copy the icon image from the JaxoDraw application to your desktop. You can unmount the disk and delete the disk image now; we're done with it.

We can launch and play around with JaxoDraw straight away. Assuming the JaxoDraw directory that we created when unarchiving the `jaxodraw-2.1-0-bin.tar.gz` file is in your `Downloads` folder, we can launch JaxoDraw with the following command:

{% highlight bash %}
$ java -jar ~/Downloads/jaxodraw-2.1-0/jaxodraw-2.1-0.jar
{% endhighlight %}

Nearly everything works, but if you try to draw a gluon line (the curly one) the app crashes with an error message similar to

> `Invalid memory access of location 0x170f2240 rip=0x1170d055d`
>
> `[1]    1188 segmentation fault  java -jar ~/Downloads/jaxodraw-2.1-0/jaxodraw-2.1-0.jar`

Luckily, this problem is [well known](http://sourceforge.net/tracker/?func=detail&aid=2561249&group_id=142124&atid=751521) and solvable; we just need to run the file in 32-bit mode:

{% highlight bash %}
$ java -d32 -jar ~/Downloads/jaxodraw-2.1-0/jaxodraw-2.1-0.jar 
{% endhighlight %}

Now we can draw gluons, huzzah!

If you now try to export your diagram, however, you'll get another error.

> Cannot execute command!
> Please try 'Export LaTeX' and run latex manually.

There's two problems here.

1. We don't have the axodraw LaTeX package installed,
2. JaxoDraw doesn't know where our LaTeX binaries are.

So let's fix those.

Download the [axodraw4j archive](http://sourceforge.net/projects/jaxodraw/files/axodraw4j/axodraw4j_2008_11_19/axodraw4j_2008_11_19.tar.gz/download) and extract it.

Assuming you now have a folder called `axodraw4j_2008_11_19` in your `Downloads` folder, execute the following to create the directories where LaTeX looks for packages in and copy the package to that directory:

{% highlight bash %}
$ mkdir -p ~/Library/texmf/tex/latex
$ cp ~/Downloads/axodraw4j_2008_11_19/axodraw4j.sty ~/Library/texmf/tex/latex/
{% endhighlight %}

You may need to restart JaxoDraw at this point. To run it, you must use the `java` command as above. This is impractical, but we'll fix that in just a minute. (You can delete the axodraw stuff in your Downloads folder now; we're done with it).

With JaxoDraw restarted, go to `Options -> Preferences` and enter `/usr/texbin/latex` inside the "LaTeX path" field and `/usr/texbin/dvips` inside the "dvips path" field.

If you now create a test diagram and do `File -> Export`, choosing "LaTeX -> EPS" as the file format, JaxoDraw will now successfully export your diagram as an EPS file.

Great, so now the only thing that's left is to create a more convenient way of launching the app.

Creating JaxoDraw.app
---------------------

When we installed the Java runtime, it provided a few extra tools to make the life of a Java developer a little easier. One of these tools is called ["Jar Bundler.app"](http://nakkaya.com/2009/12/12/creating-mac-os-x-app-bundle-for-java-applications/). Sounds promising!

To open the jar bundler, you can either navigate to `/usr/share/java/Tools` or open it in Terminal

{% highlight bash %}
$ open /usr/share/java/Tools/Jar\ Bundler.app
{% endhighlight %}

This will allow us to bundle the `jaxodraw-2.1-0.jar` file in to a fully-fledged `.app`. 

Next to the "Main Class" field, click "Choose..." and select the `jaxodraw-2.1-0.jar` file. Click the down arrow just to the left of the "Choose..." button and select `net.sf.jaxodraw.JaxoDraw`. Click "Choose Icon..." and select the icon file on your Desktop that we copied there earlier. Your Jar Bundler window should look like this:

![Jar Bundler window configured for JaxoDraw](/assets/img/jaxodraw-on-os-x/jar-bundler.png)

Now hit "Create Application..." and save it to your Applications directory. (Note that the Jar Bundler helpfully renames the application to whatever folder you click on, so when you click on the Applications directory, it will call the JaxoDraw app "Applications", so make sure to change the field to "JaxoDraw" before saving.)

Fantastic, we've got a `JaxoDraw.app` file sitting in our Applications directory. You can run it just like any other OS X app now. But... wait. Gluon lines crash the app! And we can't export to EPS anymore!

Never fear. The app isn't [launching in 32-bit mode](http://lists.apple.com/archives/java-dev/2009/Jul/msg00125.html) at the moment. To change this, right click on the JaxoDraw app and choose "Get Info", then check the "Open in 32-bit mode" box. You can reopen JaxoDraw and verify that gluons are now drawable.

To fix the EPS export issue, we just need to retrace the steps we took earlier: open the JaxoDraw preferences and enter the correct path to `latex` and `dvips` (that's `/usr/texbin/latex` and `/usr/texbin/dvips`). Export to EPS is now working again.

To make the change persist when you close and reopen JaxoDraw, click "Save" when updating the paths in the preferences window.

Caveats
-------

The only thing I haven't been able to get working, because it's not something that bothers me, is the "Preview" feature in the export window. It requires a PostScript viewer like [Ghostview](http://pages.cs.wisc.edu/~ghost/) to work. I imagine that you could download such a viewer and update the "Preferred Postscript viewer" field in the JaxoDraw preferences if you require the preview feature.

Now that we've finished creating a decent JaxoDraw application bundle, the JaxoDraw image on the desktop and any JaxoDraw stuff in the Downloads folder can be deleted.

Happy diagramming!
