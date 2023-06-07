---
title: Thinking loops in Elixir
date: 2023-06-07
tags: [Elixir]
description: Approaches for converting imperative loops into functional Elixir.
---

Whilst taking the last [Advent of Code][advent-of-code] as an opportunity to work on my [Elixir][elixir] skills, I quickly hit a roadblock.
Although I was comfortable with Elixir's syntax, I didn't know how to write a loop!
It was rather disconcerting to fall at such an early hurdle after having been a programmer for well over a decade.

It was partly the experience that was to blame: my mental model of working with collections was tightly coupled to [`for`-loop style implementations][for-loop].
Although [Elixir does have a `for` construct][elixir-for] it is not a drop-in replacement for imperative loops.

To see why, let's say we want to create a new list of all even numbers found an input list of integers.
An imperative approach might look like this:

```python
all_numbers = [4, 2, 5, 9, 6, 1, 0]
even_numbers = []
for num in all_numbers:
  if num % 2 == 0:
    even_numbers.append(num)
print(even_numbers)
# [4, 2, 6, 0]
```

Naively translating this to Elixir:

```elixir
all_numbers = [4, 2, 5, 9, 6, 1, 0]
even_numbers = []
for num <- all_numbers do
  if Integer.mod(num, 2) == 0 do
    even_numbers = [num | even_numbers]
  end
end
IO.inspect(even_numbers)
# []
```

What gives‽
The list is empty after the loop.

As astute readers of the documentation we already know that data structures in Elixir are immutable.
That's why we created a new list each iteration rather than 'appending' to the same list by doing `[num | even_numbers]`.
But we could pretend Python lists are immutable and that example would still work.

```python
all_numbers = [4, 2, 5, 9, 6, 1, 0]
even_numbers = []
for num in all_numbers:
  if num % 2 == 0:
    even_numbers = [num] + even_numbers

print(even_numbers)
# [0, 6, 2, 4]
```

This confusion is unrelated to concepts of 'immutability' or being 'functional': it's a result of Elixir's different scoping rules.
Similarly to Python scopes[^1], a scope in Elixir cannot modify the variables in outer scopes.
Unlike Python however Elixir introduces _additional_ scopes within blocks such as `for` and `if`.
This means our assignment to `even_numbers` inside the Python `for` is 'visible' outside the loop (the scopes are the same) whereas it is not visible outside in Elixir (the scopes are different).

The difference in scoping is enough to rule out many of our usual loop-writing techniques.

How can we approach iteration to fit within the Elixir model?

[^1]: Don't get me started on [`global`][python-global]!

[advent-of-code]: https://adventofcode.com/
[elixir]: https://elixir-lang.org/
[for-loop]: https://en.wikipedia.org/wiki/For_loop
[elixir-for]: https://hexdocs.pm/elixir/Kernel.SpecialForms.html#for/1
[python-global]: https://docs.python.org/3/reference/simple_stmts.html#global

## Approach #1: the `Enum` module

It's a bit dry, but simply reading through the [`Enum` module documentation][enum] from top to bottom is superb for discovering ways of rewriting a loop.
We might expect the obvious things like [`Enum.sum/1`][enum-sum] and [`Enum.map/2`][enum-map], but there are other interesting characters in there.
I found these helpful in the Advent of Code challenges:

- [`Enum.chunk_by/2`][enum-chunk-by]: groups a collection into lists whenever a categoristion function changes its return value.
- [`Enum.flat_map/2`][enum-flat-map]: maps a function and flattens the final list. Useful if an invocation of the mapping function returns multiple elements.
- [`Enum.frequencies_by/2`][enum-frequencies_by]: counts groups of elements for which the key function returns the same value.
- [`Enum.split_while/2`][enum-split-while]: splits the list in two based on the return value of the predicate.

[enum]: https://hexdocs.pm/elixir/1.12/Enum.html
[enum-sum]: https://hexdocs.pm/elixir/1.12/Enum.html#sum/1
[enum-map]: https://hexdocs.pm/elixir/1.12/Enum.html#map/2
[enum-chunk-by]: https://hexdocs.pm/elixir/1.12/Enum.html#chunk_by/2
[enum-flat-map]: https://hexdocs.pm/elixir/1.12/Enum.html#flat_map/2
[enum-frequencies_by]: https://hexdocs.pm/elixir/1.12/Enum.html#frequencies_by/2
[enum-split-while]: https://hexdocs.pm/elixir/1.12/Enum.html#split_while/2

The idea of these kinds of functions might be familiar to you if you're an old hand with [Python's itertools][itertools], which offers some similar functionality.
But unlike `itertools`, Elixir's `Enum` is an essential tool rather than a optional extra.

In our example, we can think of the task as either rejecting all odd numbers, or keeping only even numbers.
In either case, we are _filtering_ the list, and so `Enum.filter/2` is appropriate.

```elixir
Enum.filter(all_numbers, fn num -> Integer.mod(num, 2) == 0 end)
# [4, 2, 6, 0]
```

With a bit of refactoring we can make this wonderfully readable.

```elixir
require Integer

Enum.filter(all_numbers, &Integer.is_even/1)
# [4, 2, 6, 0]
```

It's great that `Enum` provides so much, and it's often all we need.
But what if we need something bespoke, aren't we back to square one?
And if we can't write our usual imperative loops, how does `Enum` provide the same behaviour anyhow?

[itertools]: https://docs.python.org/3/library/itertools.html

## Approach #2: reduce

The [reduce][reduce] operation is the Swiss Army knife of functional iteration.
It's the [ultimate answer][enum-reduce-building-block] to implementing any `for` loop we might have in one language to something in Elixir.

The [full signature][enum-reduce/3] is `reduce(enumerable, acc, fun)` and is nicely described by [the documentation][enum-reduce/3]:

> The initial value of the accumulator is `acc`.
> The function [`fun`] is invoked for each element in the enumerable with the accumulator.
> The result returned by the function is used as the accumulator for the next iteration.
> The function returns the last accumulator.

The term 'accumulator' comes from a common usecase for reduce: summation.

```elixir
Enum.reduce([1, 2, 3], 0, fn num, acc -> acc + num end)
# 6
```

We accumlate numbers from the list during each iteration to form a running total.
When the list is exhausted that running total is the sum of all the numbers.

But the word 'accumulator' may be too restrictive.
The value of the accumulator can be _any object_: not just a number but another list, a tuple, a struct, and so on.
This realisation was a bit of a revelation for me!

I prefer to think of the accumulator more broadly as _state_, passed from one iteration to the next.
In this way we can turn an imperative loop into a `reduce` form by simply storing _any_ information we need to mutate from 'outside' the loop in the accumulator.

```elixir
Enum.reduce(all_numbers, [], fn num, even_numbers ->
  if Integer.mod(num, 2) == 0 do
    [num | even_numbers]
  else
    even_numbers
  end
end)
|> Enum.reverse()
# [4, 2, 6, 0]
```

In our example the 'state' between interations is the list of all even numbers encountered so far.
At the end of the iteration, the state is the complete even-number list.

By using reduce and setting the accumulator to be the inter-iteration state, we can easily rewrite most imperative loops.
It's a [powerful tool][enum-reduce-building-block]!

(And if you're wondering how Elixir implements `Enum.reduce/3` without loops, it doesn't!
It [delegates][enum-reduce-impl] to [Erlang's `lists:foldl/3`][lists-foldl], which is implemented via recursion.)

[reduce]: https://en.wikipedia.org/wiki/Fold_(higher-order_function)
[enum-reduce-building-block]: https://hexdocs.pm/elixir/1.12/Enum.html#reduce/3-reduce-as-a-building-block
[enum-reduce/3]: https://hexdocs.pm/elixir/1.12/Enum.html#reduce/3
[enum-reduce-impl]: https://github.com/elixir-lang/elixir/blob/v1.14/lib/elixir/lib/enum.ex#L2467-L2469
[lists-foldl]: https://www.erlang.org/doc/man/lists.html#foldl-3