---
title: "TIL: Logging and analysing slow PostgreSQL queries"
tags: [TIL, SQL, PostgreSQL]
description: How to leverage existing PostgreSQL configuration to find slow queries in your application.
---

SQL is a wonderful, declarative abstraction over the details of fetching
information from a database. It allows us to express _what_ we want, letting a
query engine like that found in [PostgreSQL][postgresql] deal with the _how_ of
retrieving the data from the underlying store.

Web APIs are often just relatively simple wrappers around some SQL queries,
which means if API response times are measurably slow then an SQL query is a
often the culprit. But how do you identify which queries are causing the
slow-down in a large application? And how do you figure out how to speed those
queries up once you find them?

In this post we'll cover PostgreSQL's [`log_min_duration_statement`
configuration][log_min_duration_statement] for automatic logging of slow
queries, and we'll also touch on PostgreSQL's [`EXPLAIN` statement][explain]
for understanding what the query engine is doing when trying to optimise
queries.

> This is part of a series of 'TIL', or 'today I learned' posts; shorter
> articles designed to offer quick tips and to encourage me to write more
> often. My link in the inspiration chain connects back to my friend Tim Head
> and [his TIL series](https://betatim.github.io/posts/til-explained/); thanks Tim!

## Logging

PostgreSQL is highly configurable, and while the number of options can be
daunting it is worthwhile skimming over [what's
available](https://www.postgresql.org/docs/14/runtime-config.html) to see what
might useful for you.

I was doing just that when I came across the [`log_min_duration_statement`
parameter][log_min_duration_statement]. When set to a value greater than or
equal to zero (the default is -1) PostgreSQL will emit logs for any query which
takes at least as long than that value.

For example setting

```
log_min_duration_statement = 100ms
```

will result in logs for all queries whose total execution time (parsing, planning, and evaluation) takes 100 milliseconds or more.[^1]

[^1]: The location of your PostgreSQL configuration and log files will depend
  on your method of installation. On Ubuntu, for example, the configuration is
  at `/etc/postgresql/12/main/postgresql.conf` and the current log file is at
  `/var/log/postgresql/postgresql-12-main.log`.

A query taking longer than the `log_min_duration_statement` value produces a
log like this:

```
2022-05-12 15:40:13.566 UTC [186488] postgres_user@app_db LOG:  duration: 301.129 ms  execute __asyncpg_stmt_162ac__: SELECT resource.id, count
(task.id) AS count_1
        FROM resource JOIN task ON resource.id = task.resource_id
        WHERE task.state = $1 GROUP BY resource.id
2022-05-12 15:40:13.566 UTC [186488] postgres_user@app_db DETAIL:  parameters: $1 = 'sent'
```

This is packed full of useful information!

* The time the query was executed, which you could correlate with your
  application logs to determine the source.
* The user and database executing the query (`postgres_user` and `app_db` above).
* The duration of the query.
* The query itself, typically
  [parameterised](https://www.postgresql.org/docs/current/sql-prepare.html)
  (with variables `$1`, `$2`, and so on).
* The parameter values, if any, under the separate `DETAIL` line.

If you have a high query volume and you're [worried about
performance](https://stackoverflow.com/q/60067640/596068) you can use the
similar [`log_min_duration_sample` parameter][log_min_duration_sample],
combined with [`log_statement_sample_rate`][log_statement_sample_rate], to log
only a sample of queries exceeding the threshold.

### Monitoring

After deploying this change and waiting a while to collect the data, you'll
likely have a lot of logs to sift through.

In production you might have access to log aggregation and filtering tools,
such as [Grafana Loki][loki] or the [ELK stack][elk]. You can combine these
with alerting systems to automatically warn you of a high number or high rate
of slow queries, so that you don't have to keep an eye on the log file yourself.

Wrangling the logs by hand isn't a terrible way to get started though! Assuming
a standard Ubuntu installation we can find slow query log lines like this:

```shell
# Select all slow-query lines
$ grep 'LOG:  duration: ' /var/log/postgresql/postgresql-12-main.log
```

We could then use our favourite plain-text filtering and sorting tools to see,
for example, the counts of each unique parameterised query:

```shell
# Select all slow-query lines and filter out everything except the actual query statement
$ grep 'LOG:  duration: ' /var/log/postgresql/postgresql-12-main.log \
  | sed -E 's/.*statement: //' \
  | sort \
  | uniq -c
```

This might return something like this:

```
     2 SELECT job.id, count (task.id) AS count_1
     65 SELECT resource.id, count (task.id) AS count_1
```

Use this information to figure out which queries are worth tackling first, for
example the most common or those taken the most cumulative time.

[loki]: https://grafana.com/oss/loki/
[elk]: https://www.elastic.co/what-is/elk-stack
[alertmanager]: https://prometheus.io/docs/alerting/latest/alertmanager/

## Analysis

So you have some slow queries, how do you speed them up?

Ideally we'd apply a variation of [Richard Feynman's problem solving
algorithm](https://wiki.c2.com/?FeynmanAlgorithm):

1. Find the slow query.
2. Think real hard.
3. Implement the solution.

Unfortunately, just like theoretical physics, the world of SQL optimisation is
deep and full of oft-obtuse tricks of the trade. A combination of reading the
documentation and using your own experience is often the best way to start
figuring out how to optimise a slow query.

Luckily there is one tool that will almost certainly be valuable to you in
understanding _why_ the query is slow, and that boils down to getting a better
understanding of how the query engine is executing the SQL: [PostgreSQL's
`EXPLAIN` statement][explain].

`EXPLAIN` will return the query engine's _plan_ for how to process the query,
including what scan techniques to use (such as sequential or index) and what
join techniques to use. The plan includes the engine's estimate for how long
each step will take, which can be compared to the other steps in the plan to
see which parts are the most expensive.

My usual analysis pattern is to copy-paste the slow query from the logs into an
interactive database tool such as [Postico][postico], substitute in the
parameter values, and prepend `EXPLAIN ANALYZE` to the query.

The query we saw in the example log above would then look like this for
analysis:

```sql
EXPLAIN ANALYZE
    SELECT resource.id, count (task.id) AS count_1
    FROM resource JOIN task ON resource.id = task.resource_id
    WHERE task.state = 'sent' GROUP BY resource.id
```

This **executes the query**, so be careful when trying to understand slow
queries which perform modifications (such as `UPDATE` and `DELETE`)! You can
omit the `ANALYZE` option to omit the measured execution time, leaving only the
engine's estimates.

With the execution plan in front of you, you can see what steps are taking the
bulk of the time, and what those steps are doing. Query optimisation is a broad
topic and there are [many tips and tricks][explain-usage] to be found, and with
experience you'll quickly see low-hanging fruit (if any! 🤞).

In my work so far the most common red flag is seeing that a sequential table
scan is taking the majority of the execution time. When the engine performs a
sequential scan it iterates over the rows of the table in question, an
operation which scales linearly with the size of the table. The [typical
solution][use-the-index] is to add some form of [index][indicies] to the table
being queried, which trades disk space for constant-time lookups.

As with any optimisation problem there are other considerations worth making
before you start tuning what's in front of you:

- Does your application really need to perform the query? Perhaps it only uses
  a subset of the information, which may be cheaper to retrieve.
- Are there other ways of constructing the same query? It could be possible to
  query a table directly rather than using joins, for example.
- Is the execution time truly 'slow' for your needs? If the query runs within a
  task whose main computation takes ten times longer, it might be worth
  focusing on optimising that computation first.
- Could the PostgreSQL server be tuned more appropriately? It could be that a
  faster storage medium will improve access times enough, or perhaps the
  PostgreSQL cache size is too low, leading to more cache misses and slower
  queries.

All that being said, I find myself revisiting the slow-query logs and using
`EXPLAIN` to figure out why my API is slower than I'd like more and more often.
One of PostgreSQL's many strengths is providing tools like these!

[postgresql]: https://www.postgresql.org
[log_min_duration_statement]: https://www.postgresql.org/docs/14/runtime-config-logging.html#GUC-LOG-MIN-DURATION-STATEMENT
[log_min_duration_sample]: https://www.postgresql.org/docs/14/runtime-config-logging.html#GUC-LOG-MIN-DURATION-SAMPLE
[log_statement_sample_rate]: https://www.postgresql.org/docs/14/runtime-config-logging.html#GUC-LOG-STATEMENT-SAMPLE-RATE
[explain]: https://www.postgresql.org/docs/current/sql-explain.html
[explain-usage]: https://www.postgresql.org/docs/current/using-explain.html
[postico]: https://eggerapps.at/postico/
[indicies]: https://www.postgresql.org/docs/current/indexes.html
[use-the-index]: https://use-the-index-luke.com
