---
layout: post
title: Managing dotfiles with GNU stow
category: Tutorials
tags: [Terminal, sysadmin]
description: How to organise and deploy dotfiles using GNU stow.
---

Dotfiles are text files that are used to configure applications you run on the 
command line (in a terminal). They might tell your editor what colours to use, 
or what environment variables should be defined in your shell.

It can be very handy to be able to easily deploy them across multiple machines, 
so that the applications you use behave consistently.

Managing your dotfiles, the collection of these configuration files, is then a 
neat thing to do.
[GitHub][1] even has a [website dedicated to different ways of organising and 
deploying them][2].
I recently adopted what I think is nice way of doing it, and doesn't seem to be 
that common, so I thought I'd share what I'm doing, why, and how you can 
organise your dotfiles in the same way.

[1]: https://github.com/
[2]: https://dotfiles.github.com/

## The dotfiles repository

Let's say you have a machine that you spend most of your time on, but 
occasionally you login in to some server somewhere.
On your local machine, you've got a collection dotfiles sitting in your home 
directory, like `~/.bashrc`, but they're not on the server. What can you do?

A very common method is to create a [git][3] repository, say in a folder called 
`~/.dotfiles`, and then to create [symbolic links][4] (or 'symlinks') from the 
files in the repository to your home directory.
Having the folder be a git repository makes it very easy to synchronise the 
files between machines.

Let's create the git repository and add a dummy dotfile.

{% highlight shell %}
$ mkdir ~/.dotfiles
$ cd ~/.dotfiles
$ git init .
$ echo "This is a dotfile." > mydotfile
$ git add mydotfile
$ git commit -m "Create dotfiles repository"
{% endhighlight %}

Now we have a repository and a dotfile within it, we just need to create the 
symbolic link.

{% highlight shell %}
$ cd ~
$ ln -s .dotfiles/mydotfile .mydotfile
$ ls -la | grep mydotfile
lrwxr-xr-x    1 apearce  staff      19 12 Feb 17:05 .mydotfile -> .dotfiles/mydotfile
{% endhighlight %}

The last command shows that we have a symbolic link called `.mydotfile` 
pointing to the file in the dotfiles repository. We can inspect and edit the 
link as if it were the real file, but if we delete the link the real file 
remains as it was.

This is essence of a dotfiles repository. But, as you can imagine, manually 
linking dotfiles quickly becomes laborious and error-prone. One solution is to 
create a script that links the files for you, but I think there's a better way.

[3]: https://git-scm.com
[4]: https://en.wikipedia.org/wiki/Symbolic_link

## GNU stow

[GNU stow][5], or just stow, is a symbolic link manager. To quote their 
homepage:

> GNU Stow is a symlink farm manager which takes distinct packages of software 
> and/or data located in separate directories on the filesystem, and makes them 
> appear to be installed in the same place.

I didn't understand what this meant when I first read it. I think it's best 
explained with an example.

Let's say we're inside our `~/.dotfiles` folder, but now we've added some files 
and restructured it a little.
We can use the [`tree` command][6] to recursively display the contents of the 
directory as tree-like structure in plain text. (It's not installed on OS X by 
default, but you easily [install it with Homebrew][7] with `brew install 
tree`.) The `-a` flag tells `tree` to show hidden files.

{% highlight shell %}
$ tree -a ~/.dotfiles
.
├── bash
│   ├── .bashrc
│   └── .profile
└── vim
    └── .vimrc
{% endhighlight %}

Now we've got some real dotfiles: a couple for the [Bash shell][8], and one for 
[vim][9], the editor.

We could symlink these to our home directory in the same way as before, or we 
could let stow do it for us!

{% highlight shell %}
$ cd ~/.dotfiles
$ stow vim
{% endhighlight %}

Now let's take a look at what's in our home directory.

{% highlight shell %}
$ ls -la ~ | grep vimrc
lrwxr-xr-x    1 apearce  staff      20  7 Jan 12:35 .vimrc -> .dotfiles/vim/.vimrc
{% endhighlight %}

Stow has created the symlink for us! Magic. So what's actually going on?

1. We ran the command `stow <dir>`, where `<dir>` was the name of a folder 
   whose _entire contents_ we wanted symbolic links for in our home directory.
2. Stow looked in the folder `<dir>`, the `vim/` folder in this case, and found 
   one file: `.vimrc`
3. Stow created a symbolic link to `vim/.vimrc` _one folder above_ where the 
   `stow` command was run.

 The last step is the cool bit. Stow assumes that the contents of the `<dir>` 
 you specify should live one directory above where the `stow` command is run, 
 so having our `.dotfiles` directory at `~/.dotfiles` means using stow to 
 manage our dotfiles just works.

[5]: https://www.gnu.org/software/stow/
[6]: http://mama.indstate.edu/users/ice/tree/
[7]: {% post_url /tips/2016-02-02-root-on-os-x-el-capitan %}
[8]: https://www.gnu.org/software/bash/
[9]: http://www.vim.org

## A little deeper

The original purpose of stow was to manage multiple software versions.  Let's 
say you have some piece of software called `foo` with which sometimes you want 
to use version 1.3, and sometimes you want to use version 2.0.

Most shells will include `/usr/local/bin` in their `PATH`, a variable that 
tells the shell where to look for programs. You could just put two programs, 
`foo1.3` and `foo2.0` in that folder, but you don't want to have to remember to 
run `foo1.3` or `foo2.0`. You just want to run `foo`, and you don't want to 
have to modify scripts that use `foo`, so you do something cool.

{% highlight shell %}
$ mkdir /usr/local/stow
$ cd /usr/local/stow
$ mkdir -p foo1.3/bin
$ mkdir -p foo2.0/bin
$ mv /usr/local/bin/foo1.3 foo1.3/bin/foo
$ mv /usr/local/bin/foo2.0 foo2.0/bin/foo
{% endhighlight %}

Now when you want to start using `foo1.3`, you just use stow to set up some 
symbolic links.

{% highlight shell %}
$ cd /usr/local/stow
$ stow foo1.3
$ ls -la /usr/local/bin | grep foo
lrwxr-xr-x    1 apearce  staff      20  7 Jan 12:35 foo -> ../stow/foo1.3/bin/foo
{% endhighlight %}

Notice that we have a directory structure inside the `foo1.3` folder, and stow 
will respect that structure when making the symbolic link.

This is useful when you have an application that uses the [XDG configuration 
files standard][10], where configuration files for `foo` are kept in 
`~/.config/foo/somefile`, because then your dotfiles repository uses the same 
folder structure as in your home directory.

{% highlight shell %}
$ tree -a ~/.dotfiles
.
├── bash
│   ├── .bashrc
│   └── .profile
├── foo
│   └── .config
│       └── foo
│           └── somefile
└── vim
    └── .vimrc
{% endhighlight %}

Running `stow foo` inside the dotfiles folder will then create a symbolic link 
at `~/.config/foo/somefile`, creating any intermediate directories that don't 
already exist.

If you want to delete a set of symbolic links, just run `stow -D <dir>`.

[10]: https://specifications.freedesktop.org/basedir-spec/basedir-spec-0.8.html

## Wrapping up

Stow is a neat way to manage a [dotfiles folder][2].
If you need a more concrete example of using stow, you can check out [my 
dotfiles repository on GitHub][11].

[11]: https://github.com/alexpearce/dotfiles
