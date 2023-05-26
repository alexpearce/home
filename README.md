# Blog

This is the source for [my blog][blog].

It uses [Astro][astro] to generate a static site which is deployed and served by [Netlify][netlify].

Comment threads are made as GitHub issues.
You can comment directly on the site at the bottom of each post, or on [an existing issue on GitHub][issues] if one exists.

[blog]: https://alexpearce.me
[astro]: https://astro.build/
[netlify]: https://www.netlify.com/
[issues]: https://github.com/alexpearce/home/issues?q=is%3Aissue+label%3Acomments+

## Building

I use [Nix](https://nixos.org/) to manage development dependencies, as specified in the [`flake.nix` flake](./flake.nix).
If you have Nix and [direnv](https://direnv.net/) installed, run `direnv allow` to enable automatic activation of the development environment.
Otherwise, having access to a a recent `npm` will suffice.

To work with the project:

```shell
# Install dependencies.
npm install
# Generate the static site under `dist/`.
npm run build
# Run linting and type checks.
npm run check
# Start a live-reloading development server.
npm run dev
```
