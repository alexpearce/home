---
title: Ray tracing with Rust — Introduction
tags: [Rust, Rendering]
description: The first steps of writing a simple ray-tracing renderer in the Rust programming language.
---

This is the first in a series of posts about building a ray tracing scene renderer in the [Rust](https://www.rust-lang.org/) programming language. They’re all based on Gabriel Gambetta’s [Computer Graphics from Scratch](https://gabrielgambetta.com/computer-graphics-from-scratch/) book.

- **Part 0: Introduction**.
- Part 1: Spheres and light.
- Part 2: Shadows and reflections.
- Part 3: Movement.
- Part 4: Optimisation.

---

I adore video games. Not just a powerful interactive story-telling medium, they’re a technical wonder. Every time I play something I’m amazed at how the developers managed to render beautiful scenery, simulate physical effects and interactions, deduce engaging AI movements, manage a huge amount of state, and more, all at 60+ frames per second. It might just be a sign of how naive I am to the power of modern computers, but I still find it pure magic!

What with the [pandemic](https://en.wikipedia.org/wiki/COVID-19_pandemic), I’m not travelling far beyond a very small circle centred on my apartment (apart from [one exception][grand-tour]). As result I’m not learning much in my free time, and am finding it easy to get stuck in a rut of a routine. But in early February I saw [a post](https://news.ycombinator.com/item?id=26017086) about Gabriel Gambetta’s [Computer Graphics from Scratch](https://gabrielgambetta.com/computer-graphics-from-scratch/) book, and after reading the introduction I figured this would make for a fun project. I could scratch the surface of how scenes are pushed to my screen[^1] whilst learning something else I’ve been interested in for a while: [Rust](https://www.rust-lang.org/)!

I work with C++ quite a bit in my day job but I don’t have the same positive relationship with it as I do with Python. Unable to ignore the Rust hype train, I’ve been curious about it for a while, picking it up [briefly](https://github.com/alexpearce/adventofcode_2017) during the [2017 Advent of Code](https://adventofcode.com/2017). Beyond a novelty, I’ve found myself nodding along to the _concepts_ expounded in [the Rust book](https://doc.rust-lang.org/book/), and that’s what draws me to try a new language: not merely a change of syntax but different approaches to problem solving. When I program I think in a way that’s moulded by many years of Python, but I’d like to break out of that and expand my thought process. Rust seems like a promising avenue. (I’m also trying Elixir on the side for a similar purpose, but that’s another story!)

This post documents my very first steps of following the book.[^2] The book assumes that you access to some sort of pixel-based canvas with this API:

```
canvas.PutPixel(x, y, color)
```

As step zero I installed Rust and wrote a tiny program that defines such a canvas, writing out a few pixels as an image file.

Future posts will build from here to add a rudimentary ray tracer.

## Getting up and Rusting
The recommend way to install the Rust toolchain, which includes a compiler and package manager, is with [rustup](https://www.rust-lang.org/tools/install). I instinctively reached for [Homebrew](https://brew.sh/) instead, which is one of [many other install methods](https://forge.rust-lang.org/infra/other-installation-methods.html).

```
$ brew install rust
…
$ rustc --version
rustc 1.49.0
```

Projects written in Rust are naturally housed within [packages](https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html).

```
$ cargo new renderers-from-scratch
     Created binary (application) `renderers-from-scratch` package
```

The `src/main.rs` file in the new `renderers-from-scratch` folder is where I’ll stick the code to start with. Organisational refactoring can come later.

### Editors
There’s great support for Rust in many editors: completion, type inference, error checking, task running, and more. I’m in a weird limbo at the moment, regularly switching between [Neovim](https://neovim.io/) and [Visual Studio Code](https://code.visualstudio.com/), so I set up both.

The semantic power comes from [rust-analyzer](https://rust-analyzer.github.io/), it’s just a matter of hooking things up.

- [**VS Code**](https://rust-analyzer.github.io/manual.html#vs-code): Install the [rust-analyzer extension](https://marketplace.visualstudio.com/items?itemName=matklad.rust-analyzer) which will take care of fetching the binary for you.
- [**Neovim**](https://rust-analyzer.github.io/manual.html#vimneovim): Install the [`coc.nvim` plugin](https://github.com/neoclide/coc.nvim) and then run `:CocInstall coc-rust-analyzer`. When you open your first `.rs` file, `coc.nvim` will ask you if you’d like to download the `rust-analyzer` binary. Go for it!

## The canvas
Before defining the canvas API, it would be nice to know that we can visualise the pixels we place.

### Writing out bytes
Before immediately reaching for an [image](https://docs.rs/image/0.23.13/image/) or [graphics](https://docs.rs/piston2d-graphics/0.39.0/graphics/) library, I figured writing out some raw bytes as an image file would be a good Rust introduction. As a Good Programmer™, I grabbed the first search result:

```rust
use std::fs::File;

fn main() -> std::io::Result<()> {
    let mut f = File::create("foo.txt")?;
    Ok(())
}
```

This is from [`File::create`](https://doc.rust-lang.org/std/fs/struct.File.html#method.create), a method in the standard library. Creating some byte data and writing it is then:

```rust
use std::fs::File;
use std::io::prelude::*;

fn main() -> std::io::Result<()> {
    let image_data = vec![0u8];
    let mut file = File::create("render.ext")?;
    file.write_all(&image_data)?;
    Ok(())
}
```

A vector of bytes (unsigned eight-bit integers, `u8`) is written out to a `render.ext` file.

The question mark `?` after the `create` and `write_all` calls is a [neat little bit of syntactic sugar](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html#a-shortcut-for-propagating-errors-the--operator): each method returns a [`std::io::Result`](https://doc.rust-lang.org/std/io/type.Result.html) enum, which is either `Ok(T)` or `Err(E)`, and if it’s `Err(E)` the `?` syntax will cause the `main` function to return early, otherwise it unwraps the `T` and carries on.

### Image formats
All that’s left is to choose an image format to write out.

I started implementing the [PNG specification](http://www.libpng.org/pub/png/spec/1.2/PNG-Contents.html). The header is simple enough, so how hard could the rest be? Well, pretty hard! PNG encodes [image data](http://www.libpng.org/pub/png/spec/1.2/PNG-Compression.html) in chunks, and each chunk must be [compressed](http://www.libpng.org/pub/png/spec/1.2/PNG-Compression.html) and include [a hash](http://www.libpng.org/pub/png/spec/1.2/PNG-Structure.html#CRC-algorithm) of its contents. I didn't want to implement all this.

The [PPM format](http://netpbm.sourceforge.net/doc/ppm.html) is wonderfully simple in comparison. Here’s a PPM image:

```
P6 1 1 255 cf 8c be
```

There's the “magic number” `P6`, the image width and height, and the maximum colour value, all in ASCII and separated by whitespace. That’s followed by the image data in bytes in row-major order. All togther it's about as inefficient as you can get, but beautifully comprehensible!

We can create this image on the command line:

```shell
$ echo -n -e 'P6 1 1 255 \xcf\x8c\xbe' > image.ppm
$ file image.ppm
image.ppm: Netpbm image data, size = 1 x 1, rawbits, pixmap
$ hexdump -C image.ppm
00000000  50 36 20 31 20 31 20 32  35 35 20 cf 8c be        |P6 1 1 255 ...|
0000000e
```

And the (very zoomed in) result:

![A single purple-ish pixel.](/assets/img/ray-tracing-with-rust-part-0/pixel.png)

Truly a thing of beauty.

We have the knowledge we need to make this image file in Rust.

```rust
use std::fs::File;
use std::io::prelude::*;

fn main() -> std::io::Result<()> {
    // Define the image dimensions and pixel data
    let width: u32 = 1;
    let height: u32 = 1;
    let pixels: Vec<u8> = vec![0xcf, 0x8c, 0xbe];
    // Convert pixels to PPM
    let ppm_header = format!("P6 {} {} 255 ", width, height);
    let image_data = ppm_header
        .as_bytes()
        .iter()
        .chain(pixels.iter())
        .cloned()
        .collect::<Vec<_>>();
    // Write out the PPM
    let mut file = File::create("render.ppm")?;
    file.write_all(&image_data)?;
    Ok(())
}
```

This code lives in `src/main.rs`. We can compile and run it with one command from the project root:

```
$ cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.00s
     Running `target/debug/renderers-from-scratch`
```

### API
The canvas class will abstract away the pixel buffer and be able to convert itself to a PPM byte vector.

```rust
struct Canvas {
    width: u32,
    height: u32,
    buffer: Vec<u8>,
}

impl Canvas {
    fn new(width: u32, height: u32) -> Self {
        assert!(width > 0 && height > 0);
        let npixels = (width * height) as usize;
        let buffer = vec![0; 3 * npixels];
        Self {
            width,
            height,
            buffer,
        }
    }

    fn set_pixel(&mut self, x: u32, y: u32, r: u8, g: u8, b: u8) {
        // No need to check lower bound as values are unsigned ints
        assert!(x < self.width);
        assert!(y < self.height);
        // Map (x, y) coordinates to flat buffer
        let offset = 3 * (x + (y * self.width)) as usize;
        self.buffer[offset] = r;
        self.buffer[offset + 1] = g;
        self.buffer[offset + 2] = b;
    }

    fn as_ppm(&self) -> Vec<u8> {
        // PPM format: http://netpbm.sourceforge.net/doc/ppm.html
        // Magic bytes, width, height, maximum R/G/B value
        let ppm_header = format!("P6 {} {} 255 ", self.width, self.height);
        ppm_header
            .as_bytes()
            .iter()
            .chain(self.buffer.iter())
            .cloned()
            .collect::<Vec<_>>()
    }
}
```

A couple of details:

- The pixel buffer is a flat array of size `3 * npixels`, one entry per channel per pixel. The `canvas.PutPixel` method expected by the book passes the x- and y-coordinate, so our `Canvas::set_pixel` must translate from that coordinate system to the buffer’s. (Unlike the usual physical Cartesian x-y plane, a pixel coordinate system usually has its origin `(0, 0)` in the top left, with the x-axis increasing to the right and the y-axis increasing _down_.)
- The colour depth is hard-coded to 24 bits, 1 byte per channel. I started off with this as a generic, but got bogged down in trait implementations so stuck with `u8` channels.

With the canvas API in place, drawing and converting the resulting image to PPM looks like this:

```rust
fn main() -> std::io::Result<()> {
    let (cw, ch) = (1, 1);
    let mut canvas = Canvas::new(cw, ch);
    canvas.set_pixel(0, 0, 0xcf, 0x8c, 0xbe);
    let mut file = File::create("render.ppm")?;
    file.write_all(&canvas.as_ppm())?;
    Ok(())
}
```

## Summary
With a canvas API in place and the ability to write it out to an image we can look at, we’re ready to go! You can play around with the [code from this post on Compiler Explorer](https://rust.godbolt.org/z/vd468b).

In the next post we'll define a scene of illuminated spheres floating in a 3D space and render that scene using a ray tracer. I’ll also discuss more about the scope of the project; there’s so much one can try with a ray tracer, from physical effects to advanced lighting, animation to parallelisation and optimisation. This series will be limited to a few topics to help me get started down the road. If I’m still excited to explore after that, we’ll see where we end up!

[^1]: Most real-time rendering tasks, like video games, don’t use ray tracing as its so computationally expensive to get nice results. It is [becoming possible](https://developer.nvidia.com/rtx/raytracing) though.
[^2]: I know, [yet another](https://news.ycombinator.com/item?id=26146416) blog post creating a primitive ray tracer!

[grand-tour]: {% post_url collections.posts, 'grand-tour-of-switzerland' %}
