---
title: Installing Xcode without the App Store with Nix
description: To do.
tags: [Nix]
date: 2023-06-13
---

``` 
$ nix shell nixpkgs#darwin.xcode
error: Package ‘Xcode.app’ in /nix/store/fqjg9y9pwh9cg2izs76kkv0wwwpsqp1v-source/pkgs/os-specific/darwin/xcode/default.nix:36 has an unfree license (‘unfree’), refusing to evaluate.

       a) To temporarily allow unfree packages, you can use an environment variable
          for a single invocation of the nix tools.

            $ export NIXPKGS_ALLOW_UNFREE=1

        Note: For `nix shell`, `nix build`, `nix develop` or any other Nix 2.4+
        (Flake) command, `--impure` must be passed in order to read this
        environment variable.

       b) For `nixos-rebuild` you can set
         { nixpkgs.config.allowUnfree = true; }
       in configuration.nix to override this.

       Alternatively you can configure a predicate to allow specific packages:
         { nixpkgs.config.allowUnfreePredicate = pkg: builtins.elem (lib.getName pkg) [
             "Xcode.app"
           ];
         }

       c) For `nix-env`, `nix-build`, `nix-shell` or any other Nix command you can add
         { allowUnfree = true; }
       to ~/.config/nixpkgs/config.nix.
(use '--show-trace' to show detailed location information)
```

```
$ env NIXPKGS_ALLOW_UNFREE=1 nix shell --impure nixpkgs#darwin.xcode
error: builder for '/nix/store/hfmp5295my2wbs8jsbi22s9cqnfzv7z4-Xcode.app.drv' failed with exit code 1;
       last 10 log lines:
       > Note: download (~ 5GB), extraction and storing of Xcode will take a while
       >
       > open -W Xcode_12.3.xip
       > rm -rf Xcode_12.3.xip
       >
       > nix-store --add-fixed --recursive sha256 Xcode.app
       > rm -rf Xcode.app
       >
       > ***
       >
       For full logs, run 'nix log /nix/store/hfmp5295my2wbs8jsbi22s9cqnfzv7z4-Xcode.app.drv'.
```

Important bit of the log is hidden.

```
$ nix log /nix/store/hfmp5295my2wbs8jsbi22s9cqnfzv7z4-Xcode.app.drv

***
Unfortunately, we cannot download Xcode.app automatically.
Please go to https://developer.apple.com/services-account/download?path=/Developer_Tools/Xcode_12.3/Xcode_12.3.xip
to download it yourself, and add it to the Nix store by running the following commands.
Note: download (~ 5GB), extraction and storing of Xcode will take a while

open -W Xcode_12.3.xip
rm -rf Xcode_12.3.xip

nix-store --add-fixed --recursive sha256 Xcode.app
rm -rf Xcode.app

***
```

OK, so firstly want a newer version: `darwin.xcode_14`.

```
$ env NIXPKGS_ALLOW_UNFREE=1 nix shell --impure nixpkgs#darwin.xcode_14
error: builder for '/nix/store/pjlx30ygzcnq6jamf0kg1z237kk19x22-Xcode.app.drv' failed with exit code 1;
       last 10 log lines:
       …
       For full logs, run 'nix log /nix/store/pjlx30ygzcnq6jamf0kg1z237kk19x22-Xcode.app.drv'.

$ nix log /nix/store/pjlx30ygzcnq6jamf0kg1z237kk19x22-Xcode.app.drv

***
Unfortunately, we cannot download Xcode.app automatically.
Please go to https://developer.apple.com/services-account/download?path=/Developer_Tools/Xcode_14/Xcode_14.xip
…
```

Can follow the instructions.

Or use [xcodes][xcodes].

```
$ nix shell nixpkgs#xcodes -c xcodes install --latest
Updating...
Latest release version available is 14.3.1
Apple ID: alxprc@me.com
Apple ID Password:
Two-factor authentication is enabled for this account.

Enter "sms" without quotes to exit this prompt and choose a phone number to send an SMS security code to.
Enter the 6 digit code from one of your trusted devices: 738689

Downloading with urlSession - for faster downloads install aria2 (`brew install aria2`)
(1/6) Downloading Xcode 14.3.1+14E300c: 7%
^C
```

Who doesn't want "faster downloads"?
Let's include `aria2`.

```
$ nix shell nixpkgs#xcodes nixpkgs#aria -c xcodes install --latest
Updating...
Latest release version available is 14.3.1

Downloading with aria2 (/nix/store/sqwyin1ghdz04g74xmlzbaz3qfcmz6b2-aria2-1.36.0-bin/bin/aria2c)
(1/6) Downloading Xcode 14.3.1+14E300c: 99%
(2/6) Unarchiving Xcode (This can take a while)
Using regular unxip. Try passing `--experimental-unxip` for a faster unxip process
(3/6) Moving Xcode to /Applications/Xcode-14.3.1.app
(4/6) Moving Xcode archive Xcode-14.3.1+14E300c.xip to the Trash
(5/6) Checking security assessment and code signing
(6/6) Finishing installation
xcodes requires superuser privileges in order to finish installation.
macOS User Password:

Xcode 14.3.1 has been installed to /Applications/Xcode-14.3.1.app
```

It works!

```
$ open /Applications/Xcode-14.3.1.app
```

[xcodes]: https://github.com/XcodesOrg/xcodes