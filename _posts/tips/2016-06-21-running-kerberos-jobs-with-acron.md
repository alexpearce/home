---
layout: post
title: Running periodic Kerberos-authenticated jobs with acron
category: Tips
tags: [Terminal, CERN]
description: A short guide on how to run periodic jobs with a Kerberos token on CERN's computing resources
---

The [`cron` utility][cron] allows you to schedule a program to be run 
periodically. Once you've defined a ‘cron job’, the operating system will make 
sure that job is run at the times you've specified.

Jobs are defined in the ‘cron table’, which can be manipulated with the 
`crontab` command.
An example job definition might look like this in the crontab.

{% highlight text %}
01 01 1 1 1 echo foo
{% endhighlight %}

The command to be run is `echo foo`. The numbers preceding the command specify 
when the command is to be run: minute, hour, day of the month, month, and the 
day of the week.
This job will then run at 01:01 am on January 1st, and at the same time every 
Monday in January (cron will run the job as long as at least one of the two day 
fields matches the current time).

There are already plenty of tutorials for crontabs, so I won't dwell on them to 
long (`man crontab` and `man 5 crontab` are good starting points), but I'll 
mention two other interesting parts of the crontab syntax.

{% highlight text %}
# First example
01 01 * * * echo foo
# Second example
*/5 01 * * * echo foo
{% endhighlight %}

In the first example, we've used the asterisk `*` syntax to tell cron to match 
any value of the field. In this case, cron will run the job at 01:01 am every 
day of every month.

In the second example, the slash `/` syntax tells cron to run in steps on that 
field. Here, `*/5` means cron will run the command every 5 minutes when the 
hour is 01.

[cron]: https://en.wikipedia.org/wiki/Cron

## Kerberos jobs at CERN

At [CERN][cern], user authentication is handled with [Kerberos][kerberos] 
tokens. Generally, as a user, you need to renew your token once every 24 hours 
by running a command and entering your password.

If you want to run a job periodically, you won't be around to enter your 
password every time the job runs, so your job won't be able to see any of your 
files!
The way around this restriction is to use [acron][Acron], which will 
automatically provide your job context with the Kerberos token it needs to be 
able to have the same access rights as you.

It works in a very similar way to regular cron, but now you edit an ‘acron 
table’ with the `acrontab -e` command, and there's one additional field you 
need to specify for each row.

{% highlight text %}
01 01 * * * lxplus.cern.ch echo foo
{% endhighlight %}

The extra field is before the command, still `echo foo`, where here we've 
chosen `lxplus.cern.ch`. This field specifies the machine that acron will run 
your job on. In this case, our job will run on an [lxplus node][lxplus], which 
is usual cluster of machines that CERN users run interactive jobs on.

### Differences to cron

The syntax allowed in an acrontab file is near-identical to that in a regular 
crontab, except that step definitions, like `*/5` we saw earlier, aren't 
supported, and neither is a `*` value in the minute field. This is to prevent 
the acron system being overloaded with many jobs to run. (After all, CERN has 
thousands of users, and whereas cron usually runs on your own machine that has 
one or two users, acron needs to be able to run jobs for everyone.)

## Summary

You can define jobs to run periodically on machines in the CERN network with 
acron, and those jobs will have Kerberos tokens automatically.
You can manipulate the acron table with the `acrontab` command

In [the next post][acron-vm], we'll go over how to set up your own [virtual 
machine in the CERN network][openstack] that is able to run acron jobs, so that 
you can install your own software for your jobs to use.

[cern]: https://home.cern/
[kerberos]: https://en.wikipedia.org/wiki/Kerberos_(protocol)
[acron]: http://acron.web.cern.ch/
[lxplus]: https://information-technology.web.cern.ch/services/lxplus-service
[openstack]: http://clouddocs.web.cern.ch/clouddocs/
[acron-vm]: {% post_url /tutorials/2016-06-22-creating-a-vm-for-acron-jobs %}
