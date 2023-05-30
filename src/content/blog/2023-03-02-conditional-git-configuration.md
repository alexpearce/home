---
title: "TIL: Conditional Git configuration"
date: 2023-03-02
tags: [TIL, Git, Nix]
description: Setting configuration Git configuration to separate personal and work user information.
---

When you start your version control adventure you might have [told `git`][git-config]
about yourself.

```shell
git config --global user.name "Max Power"
git config --global user.email "max@example.com"
```

This information is added to each commit you make so other folks know who the
author was. Git persists the values in its global configuration file, typically
at `~/.config/git/config` or `~/.gitconfig`.

But what if you have multiple sets of information? Say you have a personal
email you'd like to use most of the time, but a work email you'd like to use
for work stuff. You want to override the 'global' configuration on a per-repository
basis.

One way is to explicitly tell `git` the specific information when working
within one of those special repositories.

```shell
$ cd ~/Work/backend-repo
$ git config user.email "max@work.example.org"
```

These _overrides_ are stored in the repository-local configuration file `.git/config`.

You can then verify that `git` will use your personal email everywhere except
these special repositories.

```shell
$ cd ~/Code/blog-repo
$ git config user.email
max@example.com

$ cd ~/Work/backend-repo
$ git config user.email
max@work.example.org
```

But how boring! We have to go into _every_ work repository and run this `git
config` command. Plus, we have to remember to do that for each new repository
we create or clone. So tedious.

Luckily this problem is so outrageously common that Git has a solution built in.

## Conditional configuration

Git's [configuration file][git-config-file] supports many different fields, in
addition to the `user.name` and `user.email` fields used above.

One of those fields is called [`includeIf`][git-config-includeif] and tells
`git` to include _other_ configuration files _only if_ certain conditions are met.

If we want to use our work email when working on all repositories under our `~/Work`
folder, we first need to create that other configuration file somewhere.
This could be `~/.config/git/work`, for example.

```ini
[user]
  email = "max@work.example.org"
```

Then we need to add the `includeIf` configuration to the end of our global
configuration file, again typically at `~/.config/git/config` or
`~/.gitconfig`.

```ini 
[includeIf "gitdir:~/Work/"]
  path = "~/.config/git/work"
```

This [tells git][git-config-includeif]:

1. If the current repository is in a folder underneath the path `~/Work`;
2. Then merge the configuration file at `~/.config/git/work` with the global configuration.

Now any repository under `~/Work` will use our work-specific configuration!

```shell
$ cd ~/Work/backend-repo
$ git config user.email
max@work.example.org

$ cd ~/Work/frontend-repo
$ git config user.email
max@work.example.org

$ cd ~/Code/blog-repo
$ git config user.email
max@example.com
```

As you might expect, we can add any configuration we like into the work-specific
configuration file, and we can have as many `includeIf` blocks in our
global configuration as we like.

## Bonus: Nix Home Manager support

I [manage][home-manager-post] my Git configuration using [Nix's][nix]
[Home Manager][home-manager].

Home Manager [supports Git's `includeIf` natively][home-manager-git-includes],
and in a particularly cool way that means we don't even need to create a
separate configuration file!

```nix
{ config, pkgs, ... }:

{
  # Other Home Manager configuration omitted for brevity.
  programs = {
    git = {
      enable = true;
      userName = "Max Power";
      userEmail = "max@example.com";
      includes = [
        {
          contents = {
            user = {
              email = "max@work.example.org";
            };
          };
          condition = "gitdir:~/Work/";
        }
      ];
    };
  };
}
```

This will generate a global Git configuration like this:

```ini
[user]
  email = "max@example.com"
  name = "Max Power"

[includeIf "gitdir:~/Work/"]
  path = "/nix/store/94a894qn78iq13s3kw4xic2i0yh3m9rl-hm_gitconfig"
```

The override configuration we specified is placed in an auto-generated file in
the Nix store, and looks like this.

```ini
[user]
  email = "max@work.example.org"
```

Fabulous.

[git-config]: https://git-scm.com/docs/git-config
[git-config-file]: https://git-scm.com/docs/git-config/2.6.7#EXAMPLES
[git-config-includeif]: https://git-scm.com/docs/git-config#_conditional_includes
[home-manager-post]: /2021/07/managing-dotfiles-with-nix/
[nix]: https://nixos.org/
[home-manager]: https://github.com/nix-community/home-manager
[home-manager-git-includes]: https://rycee.gitlab.io/home-manager/options.html#opt-programs.git.includes
