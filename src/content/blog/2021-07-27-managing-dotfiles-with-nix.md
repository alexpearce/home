---
title: Managing dotfiles with Nix
date: 2021-07-27
tags: [Tutorials, Terminal, sysadmin, Nix]
description: How to manage your programs and dotfiles with Nix and Home Manager.
---

For several years I've been [managing my dotfiles with GNU Stow][stow-post],
but there are a few things about it that bug me:

- You have to install the relevant programs separately.
- You end up with many configurations files in many different languages.
- It's tricky to manage configurations which you want to differ slightly for
  different machines and environments, e.g. macOS and Linux.

For the first point I've long used [Homebrew][homebrew] on macOS to install
system-wide programs. It is user-friendly but is pretty slow and it's hard to
remember what packages I installed for what purpose.

To address these issues, I recently moved my dotfiles configuration to one
based on [Nix][nix] and [Home Manager][home-manager] and I'm really enjoying
using them.

In this post I'd like to walk you through how to set up Nix and Home Manager
for managing programs and configuration on your own machine.

## Nix? Home Manager?

Let's first go over what the tools we'll be using actually are.

[Nix][nix] is a package management and build system. Package and environment
definitions are written in the [Nix Expression Language][nix-lang].

Nix aims to make building packages fully reproducible by explicitly defining
every input. Each package is placed in a file-system path which contains a
cryptographic checksum constructed from all inputs. Because a package's source
is itself an input Nix can install multiple versions of any package side by
side.  Environments can then be defined by choosing which versions of certain
packages you want to use. This paves the way for development environments
without system-wide conflicts!

[Home Manager][home-manager] combines the package management prowess of Nix
with a system for generating program configuration from a Nix file.

This Home Manager configuration installs a few packages and sets some custom
configuration:

```nix
{ config, pkgs, ... }:

{
  home = {
    username = "apearce";
    homeDirectory = "/Users/apearce";
    # Specify packages not explicitly configured below
    packages = with pkgs; [
      jq
      neovim
      ripgrep
    ];
    sessionVariables = {
      EDITOR = "neovim";
    };
    stateVersion = "21.11";
  };

  programs = {
    fish = {
      enable = true;
      shellAliases = {
        rm = "rm -i";
        cp = "cp -i";
        mv = "mv -i";
        mkdir = "mkdir -p";
      };
      shellAbbrs = {
        g = "git";
        m = "make";
        n = "nvim";
        o = "open";
        p = "python3";
      };
    };

    home-manager.enable = true;
  };
}
```

We'll go over the details later, but you might be able to pick out a few
interesting features already:

1. The `packages` key defines a list of programs we want Home Manager to
   install.
2. The `programs` key defines a list of programs we want Home Manager to
   install _and configure_ in some custom way.

The second point is how Home Manager manages our 'dotfiles' for us: there are
no longer any dotfiles!

Home Manager reads the configuration and figures out what programs need to be
installed and what dotfiles need to be generated. This is a _declarative_
approach and contracts with the imperative approach of using your OS's package
manager and GNU Stow.

## Installing Nix

The [official installation instructions][install-nix] are the best place to
start. Linux and macOS (on x86 and ARM) are both well supported.

```shell
$ curl -L https://nixos.org/nix/install -o install.sh
$ sh install.sh
…
Installation finished!  To ensure that the necessary environment
variables are set, either log in again, or type

  . /Users/apearce/.nix-profile/etc/profile.d/nix.sh

in your shell.
```

The installer will quickly setup your system with the `/nix` folder, where
packages will be installed, and the binaries we'll use to administer it.

If your default shell is **bash** or **zsh** then you should be able to start a new
shell and verify that you now have Nix installed:

```shell
$ nix-shell -p nix-info --run "nix-info -m"
…
 - system: `"aarch64-darwin"`
 - host os: `Darwin 21.5.0, macOS 12.4`
 - multi-user?: `yes`
 - sandbox: `no`
 - version: `nix-env (Nix) 2.9.2`
 - channels(root): `"nixpkgs"`
 - nixpkgs: `/nix/var/nix/profiles/per-user/root/channels/nixpkgs`
```

If your default shell is [**fish**][fish] (heck yeah! 🐟) then this won't work
as the Nix installer [does not inject hooks for fish][fish-nix-support]. You
can run a bash or zsh sub-shell instead though:

```shell
$ zsh -c 'nix-shell -p nix-info --run "nix-info -m"'
```

Luckily there is a nice [fish plugin][fish-nix-env] that fixes this for us.
We'll include this as part of our fish configuration in Home Manager later.
Until then you can drop in to a bash or zsh sub-shell for the upcoming
examples.

### Trying out Nix

We can already try some of the cool features of Nix before we install Home Manager.

One of the neatest things is that we can ask Nix to start a sub-shell with some
specific programs included. Once we leave that sub-shell the programs will no
longer be available.

```shell
# See that `cowsay` is not available on our machine
$ which cowsay

$ nix-shell -p cowsay
these paths will be fetched (7.62 MiB download, 48.87 MiB unpacked):
  /nix/store/frs6r654963v8klf875n8755a24x4z66-cowsay-3.04
  /nix/store/v1aja3gzmzxr112ndr2dbm9km82bv9rb-perl-5.34.0
copying path '/nix/store/v1aja3gzmzxr112ndr2dbm9km82bv9rb-perl-5.34.0' from 'https://cache.nixos.org'...
copying path '/nix/store/frs6r654963v8klf875n8755a24x4z66-cowsay-3.04' from 'https://cache.nixos.org'...

[nix-shell:~]$ which cowsay
/nix/store/frs6r654963v8klf875n8755a24x4z66-cowsay-3.04/bin/cowsay

[nix-shell:~]$ cowsay 'Moo?'
 ______
< Moo? >
 ------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||

[nix-shell:~]$ exit

# Back in the original shell, `cowsay` is still not available
$ which cowsay

```

Nix:

1. Downloads and installs the `cowsay` Nix package.
2. Creates an environment in which the `cowsay` Nix package is available (i.e.
   in our executable `PATH`).
3. Starts a sub-shell which knows about the custom environment.

(This technique can be extended to create [ad-hoc development
environments][nix-dev-envs] if you want to try to the latest hotness without
having to worry about anything conflicting with your usual tools. I hope to
expand on this further in a future post.)

Home Manager leverages this infrastructure to create a user-specific
environment, pulling in the packages we ask for.

## Installing Home Manager

The [Home Manager installation][home-manager-installation] starts by including
a specific Nix 'channel' (a repository of Nix package definitions):

```shell
$ nix-channel --add https://github.com/nix-community/home-manager/archive/master.tar.gz home-manager
$ nix-channel --update
```

Then run the installer using the `install` definition from the new channel:

```shell
$ nix-shell '<home-manager>' -A install
```

We can check that Home Manager has been installed:

```shell
$ nix-env --query --installed
home-manager-path
```

And we can then run the `home-manager` binary and see the default configuration
that was installed:

```shell
$ home-manager --version
21.11
$ cat ~/.config/nixpkgs/home.nix
```

It'll look something like this:

```nix
{ config, pkgs, ... }:

{
  # Let Home Manager install and manage itself.
  programs.home-manager.enable = true;

  # Home Manager needs a bit of information about you and the
  # paths it should manage.
  home.username = "apearce";
  home.homeDirectory = "/Users/apearce";

  # This value determines the Home Manager release that your
  # configuration is compatible with. This helps avoid breakage
  # when a new Home Manager release introduces backwards
  # incompatible changes.
  #
  # You can update Home Manager without changing this value. See
  # the Home Manager release notes for a list of state version
  # changes in each release.
  home.stateVersion = "21.11";
}
```

All that's left for us to do is edit this to suit our needs.

## Configuring Home Manager

There are two jobs we'll use Home Manager to take care of:

1. Installing programs.
2. Creating and installing program configuration files (dotfiles).

Home Manager will automatically install programs which we define configuration
for, so we'll start with the programs we don't need to configure explicitly.

### Programs

I don't have any configuration files for utilities like [ripgrep][ripgrep]. For
programs like this we can just tell Home Manager to install the corresponding
Nix package, which looks like this in your `~/.config/nixpkgs/home.nix`:

```nix
{ config, pkgs, ... }:

{
  home.username = "apearce";
  # <...>

  packages = with pkgs; [
    ripgrep
  ];
}
```

We then ask Home Manager to build and deploy the environment defined by our
`home.nix` with a single command:

```shell
$ home-manager switch
```

Once that's finished we can verify that the `rg` binary is now available under
Home Manager's installation path:

```shell
$ which rg
/Users/apearce/.nix-profile/bin/rg
```

We can install any Nix package this way; [search through them][nix-search] to see what's
available.

Uninstalling a package just means removing it from the list and running
`home-manager switch` as usual.

### Configuration

Home Manager is able to convert configuration in `home.nix` into
program-specific configuration files.

This `home.nix` enables the [bat][bat] Home Manager _module_ and sets some
configuration:

```nix
{ config, pkgs, ... }:

{
  home.username = "apearce";
  # ...

  programs.bat = {
    enable = true;
    config = {
      theme = "GitHub";
      italic-text = "always";
    };
  };
}
```

After running `home-manager switch` we see we have the `bat` binary _and_ a bat
configuration file:

```shell
$ which bat
/Users/apearce/.nix-profile/bin/bat
$ ls -l ~/.config/bat
total 0
lrwxr-xr-x  1 apearce  staff  81 26 Jul 14:22 config -> /nix/store/j6vkynxy202rlgznwlcghhyydif277yl-home-manager-files/.config/bat/config
$ cat ~/.config/bat/config
--italic-text="always"
--theme="GitHub"
```

Notice how the `~/.config/bat/config` file is just a [symbolic link][symlink]
to a file managed by Home Manager. Home Manager will create, update, and remove
these files as necessary whenever we run `home-manager switch`. We no longer
need to manager dotfiles by hand!

The full list of Home Manager modules is best discovered by [browsing the
source][home-manager-modules], so it's useful to be able to skim these files to
learn how to configure the programs you care about.

The [`bat.nix`][home-manager-bat-module] file, for example, has an
`options.programs.bat` member which contains the possible options we can set:

```nix
options.programs.bat = {
  enable = mkEnableOption "bat, a cat clone with wings";

  config = mkOption {
    type = types.attrsOf types.str;
    default = { };
    example = {
      theme = "TwoDark";
      pager = "less -FR";
    };
    description = ''
      Bat configuration.
    '';
  };

  # ...
};
```

We set `programs.bat.enable = true` to tell Home Manager to generate the
default configuration. (Home Manager will, rather sensibly, also install bat in
this case; we don't need to include it in the `packages` list.)

For the `programs.bat.config` member, the `typesAttrsOf types.str` value for
the `config.type` member tells us that we can set `programs.bat.config` to an
[attribute set][attribute-set] of strings, which is what we did above.

The [`config` member][home-manager-bat-config] in the `bat.nix` file defines
how Home Manager will go from our Nix configuration to dotfiles. You don't
normally need to know the details of how this is done, but looking at the
`config` member can be a good approach to understanding how to reproduce the
dotfiles you already have with Home Manager: reverse engineering!

Let's go through a few more configurations to demonstrate more complex
structures.

#### Git

Git is primarily driven through the `~/.gitconfig` and `~/.gitignore` files, also
stored as `~/.config/git/{config,ignore}`.

A fairly standard Git configuration with Home Manager might look like this:

```nix
programs.git = {
  enable = true;
  userName = "Your Name";
  userEmail = "email@example.com";
  aliases = {
    prettylog = "...";
  };
  extraConfig = {
    core = {
      editor = "nvim";
    };
    color = {
      ui = true;
    };
    push = {
      default = "simple";
    };
    pull = {
      ff = "only";
    };
    init = {
      defaultBranch = "main";
    };
  };
  ignores = [
    ".DS_Store"
    "*.pyc"
  ];
};
```

Some members get mapped to specific configuration values in Git's dotfiles,
e.g. setting `userName` results in:

```ini
[user]
	name = "Alex Pearce"
```

For configuration values without specific members the `extraConfig` attribute
set can be used.

The list of strings in the `ignores` member get placed in the `ignores`
configuration file.

One last trick is that we can easily integrate the [delta diff
utility][git-delta] utility into our Git configuration:

```nix
programs.git = {
  # ...
  delta = {
    enable = true;
    options = {
      navigate = true;
      line-numbers = true;
      syntax-theme = "GitHub";
    };
  };
};
```

With this, Home Manager will take care of ensuring that delta is installed and
that Git's `config` file contains entries for enabling delta.

The fact that _nested_ configuration, with the `delta` member being inside the
`git` member, is able to affect not only the parent configuration (`git`) is a
neat feature of Home Manager modules. This technique can be used by other
modules to install handy aliases in your Home-Manager-managed shell, for
example.

#### Fish shell

I mentioned earlier that we can use the [fish shell][fish] with Nix if we also
use the [`nix-env.fish`][fish-nix-env] plugin.

As you might expect by now, we can tell Home Manager to install this plugin for
us, along with giving Home Manager the rest of our fish configuration.

```nix
fish = {
  enable = true;
  plugins = [
    # Need this when using Fish as a default macOS shell in order to pick
    # up ~/.nix-profile/bin
    {
      name = "nix-env";
      src = pkgs.fetchFromGitHub {
        owner = "lilyball";
        repo = "nix-env.fish";
        rev = "00c6cc762427efe08ac0bd0d1b1d12048d3ca727";
        sha256 = "1hrl22dd0aaszdanhvddvqz3aq40jp9zi2zn0v1hjnf7fx4bgpma";
      };
    }
  ];
  shellInit = ''
    # Set syntax highlighting colours; var names defined here:
    # http://fishshell.com/docs/current/index.html#variables-color
    set fish_color_autosuggestion brblack
  '';
  shellAliases = {
    rm = "rm -i";
    cp = "cp -i";
    mv = "mv -i";
    mkdir = "mkdir -p";
  };
  shellAbbrs = {
    g = "git";
    m = "make";
    n = "nvim";
    o = "open";
    p = "python3";
  };
  functions = {
    fish_greeting = {
      description = "Greeting to show when starting a fish shell";
      body = "";
    };
    mkdcd = {
      description = "Make a directory tree and enter it";
      body = "mkdir -p $argv[1]; and cd $argv[1]";
    };
  };
};
```

After running `home-manager switch` I just needed two steps to switch my
default shell on macOS:

1. Add the full path `/Users/apearce/.nix-profile/bin/fish` to the end of the
   `/etc/shells` file.
2. Change shell with `chsh -s ~/.nix-profile/bin/fish`.

I could then open a new terminal window and be dropped into a fish shell which
had access to all my Home-Manager-installed programs. 🎉

My final tweak was to include [iTerm2's shell
integration][iterm2-shell-integration] as a fish plugin. Fish plugins
are installed to `~/.config/fish/conf.d/<plugin folder>` and these are [sourced
_before_][fish-config] the main `config.fish` file, so I needed a few tweaks:

1. Download the integration script using the
   [instructions][iterm2-shell-integration].
2. Wrap the contents of the integration script in a `function iterm2_shell_integration...end`
   block.
3. Place the script in a folder structure next to the `home.nix` file as
   `config/fish/iterm2_shell_integration/functions/iterm2_shell_integration.fish`.
   This mimics the folder structure of fish plugins.
3. Call the integration function in `config.fish`.

The Nix configuration looks like this:

```nix
fish = {
  enable = true;
  plugins = [
    {
      name = "iterm2-shell-integration";
      src = ./config/fish/iterm2_shell_integration;
    }
    # ...
  ];
  interactiveShellInit = ''
    # Activate the iTerm 2 shell integration
    iterm2_shell_integration
  '';
  # ...
};
```

I hope to get around to packaging the integration script as a bona fide fish plugin.

#### Neovim

I recently migrated my [Neovim][neovim] configuration to Lua, which means
having an `init.lua` file rather than an `init.vim` file.

Home Manager [always creates an `init.vim`][home-manager-neovim-bug] but Neovim
will complain if an `init.lua` file is also found. So for now I manage my
Neovim dotfiles explicitly in my `home.nix`, which means I also need to install
`neovim` explicitly.

```nix
{ config, pkgs, ... }:

{
  home = {
    # ...
    packages = with pkgs; [
      neovim
    ];
  };

  # ...

  xdg.configFile.nvim = {
    source = ./config/neovim;
    recursive = true;
  };
}
```

My `init.lua` and other Neovim files live in a folder next to my `home.nix`
called `config/neovim`. Home Manager effectively copies those files to the
location Neovim expects to see them:

```shell
$ ls -l ~/.config/nvim
lrwxr-xr-x 84 apearce 27 Jul 14:34 init.lua -> /nix/store/vxw9a54wykhyyi67hqkf6xmixxmpfxb1-home-manager-files/.config/nvim/init.lua
drwxr-xr-x  - apearce 27 Jul 14:34 lua
drwxr-xr-x  - apearce 25 Jul 20:17 plugin
```

Any updates to my `config/neovim/init.lua` must be followed by `home-manager
switch` for Neovim to see the changes.

### Putting it all together: migrating from Homebrew

We've now gone through all the building blocks you'll need to manage all of
your programs and their configuration with Home Manager.

One of my goals was to move away from Homebrew and manage programs on my laptop
exclusively with Home Manager.

I first dumped the list of packages I had installed with Homebrew:

```shell
$ brew bundle dump
```

The resulting `Brewfile` looks like this:

```
tap "homebrew/bundle"
tap "homebrew/core"
brew "cargo-instruments"
# ...
brew "stow"
```

There were lots of entries I didn't remember installing explicitly, but it was
still a much shorter and more comprehensible list than the output of `brew
list`.

I then went through this list and for each item:

1. [Searched][nix-search] the corresponding Nix package.
2. Added the Nix package name to the `home.packages` list in my `home.nix`
   file.
3. Ran `home-manager switch`.
4. Verified that the program was picked up by my shell (`which <executable
   name>`) and was runnable (`<executable name> --version` or similar).
5. Looked at the corresponding [Home Manager module][home-manager-modules], if
   it existed, to see if I could port over any dotfiles.

## Summary

With Home Manager I was able to:

- Switch to a configuration-as-code system, which will allow me to define
  configuration depending on the system it is being deployed on.
- Define almost all of my dotfile-like configuration in a [single
  file][home.nix].
- Remove Homebrew from my system. (This is particularly cool as I could then
  also remove Xcode, which is huge and takes _ages_ to update.)

These are big pluses, and I'm happy with the result overall, but there are
downsides.

- Understanding the philosophy of Nix, the various terms and commands, as well
  as the Expression Language in depth is not strictly necessary, but some time
  is needed to at least get to grips with a new way of working.
- Nix typically requires root privileges for the initial installation and you
  may not have this on all the machines you work on.[^1] There are [workarounds
  for root-less Nix installs][nix-chroot-install] but these may not work on
  your system (e.g.  if user namespaces are disabled, or if your home directory
  is on a networked file system).
- Your exact configuration may not be reproducible in Home Manager as [by
  design][home-manager-design] it does not always support every possible
  configuration flag. I have to manage Lua-based Neovim configuration in a more
  'manual' way, for example.
- [Fish shell][fish] does not have first-class support in Nix.

[^1]: I used to build programs on such machines myself and install them into
  `~/usr`. By building and installing Stow I could then manage my dotfiles in a
  similar way as on my personal machine.

All that said, I had a lot of fun! 🛠 I'm looking forward to reading more of
other people's experiences with Nix.

As ever, my configuration is [available on GitHub][alexpearce/dotfiles].

### Learning more

Unlike [using Stow][stow-post], using Home Manager requires getting to grips
with a new language and considerably more complex infrastructure. The following
resources helped me along the way.

- [A tour of Nix][nix-tour] for learning the Nix Expression Language.
- The [Nixology][nixology] playlist.
- The NixOS [reddit][nixos-reddit] and [Discourse][nixos-discourse] community discussions.

---

## Updates

There was a bit of churn around Nix installation on macOS mid-2021. This post
was updated in November 2021 to move away from temporary fixes to more stable
installers. Some Home Manager workarounds are no longer needed and so were
removed.

[stow-post]: /2016/02/managing-dotfiles-with-stow/
[homebrew]: https://brew.sh
[nix]: https://nixos.org/
[home-manager]: https://github.com/nix-community/home-manager
[nix-lang]: https://nixos.wiki/wiki/Nix_Expression_Language
[home.nix]: https://github.com/alexpearce/dotfiles/blob/d444f75b1ae800ce4dc2f70dea4357cedd245263/home.nix

[install-nix]: https://nixos.org/download.html
[fish]: https://fishshell.com/
[fish-nix-support]: https://github.com/NixOS/nix/issues/1512
[fish-nix-env]: https://github.com/lilyball/nix-env.fish
[nix-dev-envs]: https://nix.dev/tutorials/ad-hoc-developer-environments

[home-manager-installation]: https://github.com/nix-community/home-manager#installation

[nix-search]: https://search.nixos.org/packages

[ripgrep]: https://github.com/BurntSushi/ripgrep
[bat]: https://github.com/sharkdp/bat
[bash-alias]: https://tldp.org/LDP/abs/html/aliases.html
[home-manager-modules]: https://github.com/nix-community/home-manager/tree/master/modules/programs
[home-manager-bat-module]: https://github.com/nix-community/home-manager/blob/f6f6990fc811454cb3082ba3662b711488fd0554/modules/programs/bat.nix
[home-manager-bat-config]: https://github.com/nix-community/home-manager/blob/f6f6990fc811454cb3082ba3662b711488fd0554/modules/programs/bat.nix#L47-L57
[attribute-set]: https://nixos.org/guides/nix-pills/basics-of-language.html#idm140737320585856
[symlink]: https://en.wikipedia.org/wiki/Symbolic_link
[git-delta]: https://github.com/dandavison/delta
[iterm2-shell-integration]: https://iterm2.com/documentation-shell-integration.html
[fish-config]: https://fishshell.com/docs/current/#configuration-files
[neovim]: https://neovim.io/
[home-manager-neovim-bug]: https://github.com/nix-community/home-manager/issues/1907

[nix-chroot-install]: https://nixos.wiki/wiki/Nix_Installation_Guide#Installing_without_root_permissions
[home-manager-design]: https://nix-community.github.io/home-manager/index.html#sec-guidelines-valuable-options
[nix-tour]: https://nixcloud.io/tour/
[nixology]: https://www.youtube.com/watch?v=NYyImy-lqaA&list=PLRGI9KQ3_HP_OFRG6R-p4iFgMSK1t5BHs
[nixos-reddit]: https://www.reddit.com/r/NixOS
[nixos-discourse]: https://discourse.nixos.org/
[alexpearce/dotfiles]: https://github.com/alexpearce/dotfiles
