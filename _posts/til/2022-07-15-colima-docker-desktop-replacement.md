---
title: "TIL: Colima as a Docker Desktop for Mac replacement"
tags: [TIL, Docker, OS X]
description: Using the Colima virtual machine manager to replace Docker Desktop for Mac.
---

I have never really loved [Docker Desktop for Mac][docker-mac].

It seems to want to download and install huge updates every other day, each
offering little user-facing benefit, comes with a clunky management UI I never
use,[^1] and requires you to accept an [onerous license
agreement][docker-desktop-license].

So why use it? To run containers, of course! And although there are
[several][docker-runtime] [container][containerd] [runtime][runc] interfaces,
Docker is particularly common. Whether you're a sole developer or working as
part of a team, chances are it's Docker you'll reach for first. Docker Desktop
for Mac is an easy way to get access to all the components needed to start
working with containers.

Containers are a feature of the Linux kernel, and so a lot of what Docker
Desktop for Mac does is managing a Linux virtual machine for you using macOS's
virtualisation framework. Your containers will run within that VM.

[Lima][lima] is a tool to run and manage Linux virtual machines on macOS.
[Colima][colima] builds on top of Lima to provide simple access to container
runtimes, including Docker. It runs a Docker-compatible process inside the
Linux VM (a 'Docker daemon') allowing us to use all the `docker` CLI commands
we're familiar with, including [Docker Compose][docker-compose], without
needing to install Docker Desktop for Mac.

## Installation

If you [use Nix and/or home-manager][home-manager-post] you can easily try out
Colima in a subshell:

```
$ nix shell nixpkgs#colima nixpkgs#docker nixpkgs#kubectl
```

Or you can include the packages in your home-manager configuration to make them
always available:

```nix
{ config, pkgs, ... }:

{
  home = {
    packages = with pkgs; [
      colima
      docker
      kubectl
    ];
  };
}
```

If you use Homebrew you can install Colima in a similar way.

```
$ brew install colima docker kubectl
```

Note that Colima provides a Docker-compatible runtime but does not ship with
the `docker` or `kubectl` CLIs, so we must install those separately.

## Usage

All that's required to get going is to tell Colima to start the Linux VM.

```
$ colima start
INFO[0000] starting colima
INFO[0000] runtime: docker
INFO[0000] preparing network ...                         context=vm
INFO[0000] starting ...                                  context=vm
INFO[0021] provisioning ...                              context=docker
INFO[0022] starting ...                                  context=docker
INFO[0027] done
```

This will download the VM's base image and boot it. Once the machine is running
Colima will start a Docker daemon inside of it and advertise a socket on the host
(macOS) to the Docker CLI.

We can verify that `docker` can see Colima's daemon by using the
[`context` command][docker-context].[^2]

```
$ docker context list
NAME       DESCRIPTION                               DOCKER ENDPOINT                                      KUBERNETES ENDPOINT                ORCHESTRATOR
colima *   colima                                    unix:///Users/username/.colima/default/docker.sock
default    Current DOCKER_HOST based configuration   unix:///var/run/docker.sock                          https://127.0.0.1:6443 (default)   swarm
```

As promised, we can now use the `docker` commands we're familiar with.

```
$ docker run --rm grycap/cowsay /usr/games/cowsay 'Hello, Colima!'
 ________________
< Hello, Colima! >
 ----------------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||

```

Colima even includes supports for running a local Kubernetes cluster!

```
$ colima kubernetes start
INFO[0000] installing ...                                context=kubernetes
INFO[0005] loading oci images ...                        context=kubernetes
INFO[0010] updating config ...                           context=kubernetes
INFO[0010] Switched to context "colima".                 context=kubernetes
```

As Colima will add the necessary connection details to our `$HOME/.kube/config`
file, we can immediately interact with the cluster using `kubectl` as usual.

```
$ kubectl config get-contexts
CURRENT   NAME     CLUSTER   AUTHINFO   NAMESPACE
*         colima   colima    colima

$ kubectl get all --output wide
NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE   SELECTOR
service/kubernetes   ClusterIP   10.43.0.1    <none>        443/TCP   52s   <none>
```

To stop the cluster or base VM, use the corresponding `stop` commands.

```
$ colima kubernetes stop

$ colima stop
INFO[0000] stopping colima
INFO[0000] stopping ...                                  context=docker
INFO[0002] stopping ...                                  context=vm
INFO[0005] done
```

More advanced usage is given in [the README][colima-readme] and
[FAQ][colima-faq], including details of the [VM configuration][colima-vm-config]
stored under `$HOME/.colima/default/colima.yaml`.

I've found Colima to be a complete, pain-free replacement for my usage of Docker
Desktop for Mac.

[docker-mac]: https://docs.docker.com/desktop/install/mac-install/
[docker-desktop-license]: https://docs.docker.com/subscription/#docker-desktop-license-agreement
[docker-runtime]: https://www.docker.com/products/container-runtime/
[containerd]: https://containerd.io
[runc]: https://github.com/opencontainers/runc
[lima]: https://github.com/lima-vm/lima
[colima]: https://github.com/abiosoft/colima
[colima-readme]: https://github.com/abiosoft/colima#readme
[colima-faq]: https://github.com/abiosoft/colima/blob/main/docs/FAQ.md
[colima-vm-config]: https://github.com/abiosoft/colima/blob/main/docs/FAQ.md#can-config-file-be-used-instead-of-cli-flags
[docker-compose]: https://docs.docker.com/compose/
[home-manager-post]: {% post_url collections.posts, 'managing-dotfiles-with-nix' %}
[docker-context]: https://docs.docker.com/engine/context/working-with-contexts/

[^1]: I will admit to being a particularly terminal-happy developer but the
`docker` CLI is well structured and prints pretty output. The Docker Desktop UI
is just a wrapper around a subset of the CLI's feature set.
[^2]: The CLI's context support allows Colima to run alongside Docker Desktop
for Mac, if desired. You just need to select which context the CLI by default
with `docker context use`.
