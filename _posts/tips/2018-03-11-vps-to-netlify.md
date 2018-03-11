---
layout: post
title: Moving static sites from a VPS to Netlify
category: Tips
tags: [VPS, Hosting, sysadmin, Jekyll]
description: A short guide on how to run periodic jobs with a Kerberos token on CERN's computing resources
---

For many years, I’ve owned a virtual private server (VPS). I wanted one 
primarily so that I could experiment with hosting static and dynamic websites 
(the latter written in Ruby and Python, mostly), as well as an opportunity to 
learn Linux system adminstration.

I enjoyed managing my VPS a lot. It buys you a lot of freedom, and it’s 
rewarding to get something cool working, knowing that you understand how it got 
there from top to bottom. But over the past few years I haven’t done anything 
interesting with it, so the VPS has been collecting dust, dutifully serving my 
blog and a couple of other static sites.

Although I don’t pay much for it, less than $5 a month, it still feels like a 
waste to have something without really using it. So, although I’d miss being 
able to deploy something world-readable with minimal fuss, I decided to move my 
sites to a dedicated hosting provider.

## Options for hosting static sites

My criteria for a hosting service were, in no particular order:

* Custom domains.
* HTTPS.
* Easy deployment, ideally with a single command from a CLI client (git 
  integration is a big plus).
* Simple infrastructure, e.g. it’d be nice if the same service includes 
  distributed CDN, SSL certificates, and other niceties.
* Cheaper than my VPS (I’m happy to pay for a decent service).

I didn’t do much research. I compared:

* [GitHub pages][ghpages]: GitHub is great. I host a lot of code there, 
  including [the blog][blogsrc], but they don’t support HTTPS
  for custom domains (without setting up another layer like Cloudflare).
* [Amazon S3][amazons3]: Setting up an HTTP custom domain is [a little fiddly][s3ssl], 
  with a full setup requiring several Amazon services to work together.
* [Netlify][netlify]: Seems to [offer a lot][netlifyplans] of what I want, even 
    on the free plan. Let’s give it a go!

## Setting up Netlify


After [signing up][netlifysignup], I added a the git repository for my blog 
from GitHub. Netlify seemed to automatically detect that the site uses the 
[Jekyll] [static site generator], and offered to build the site with the 
`jekyll build` command, then deploy the generated `_site/` directory.

After clicking the “Deploy site” button it… just worked! I was already 
impressed with the Netlify site itself, as it’s clear and pretty, but having my 
site deployed so effortlessly was a real motivator in taking the plunge to 
_really_ move.

![Netlify deploy dashboard](/assets/img/vps-to-netlify/netlify-deploy.png)

Now I needed to change some DNS records, so that the `alexpearce.me` URLs point 
to Netlify’s servers, and enable HTTPS.

### DNS records and redirection

The next step, clearly signposted on Netlify’s summary of my site, was to set 
up the custom domain.

![Netlify next steps](/assets/img/vps-to-netlify/netlify-steps.png)

I use [Gandi] to manage my domains and their DNS records, but I only need to 
sign in very rarely, so rarely that I had to go through an account upgrade to 
[Gandi’s new LiveDNS infrastructure][livedns].  This wasn’t a problem, but 
Gandi do advise waiting 12–24 hours for the migration to complete before 
changing any settings.

Then, whilst trying to add this `ALIAS`/`ANAME` record in Gandi:

{% highlight text %}
alexpearce.me ALIAS random-subdomain-label.netlify.com.
{% endhighlight %}

I found out that [Gandi doesn’t support `CNAME` records on the root 
domain][gandiwishlist], which is what I want (to point `alexpearce.me`, with no 
subdomain, to the Netlify address). So instead I have to create an `A` record, 
as suggested by Netlify, and deleted the `A` record that pointed to the VPS:

{% highlight text %}
@ A 104.198.XXX.XXX
{% endhighlight %}

No big deal, but this does mean I don’t benefit from Netlify’s CDN. Moving to 
another DNS provider, one that doesn’t support `ALIAS`/`ANAME`/`CNAME` records 
on the root domain, would solve this.[^1]

I also set up a record for the `www` subdomain.

{% highlight text %}
www A 104.198.XXX.XXX
{% endhighlight %}

Pointing `www` to Netlify is required for enabling HTTPS.[^2]

### HTTPS

Once I had a DNS configuration that Netlify liked, enabling HTTPS was just a 
couple of clicks, getting a certificate via [Let’s Encrypt][letsencrypt]. I 
then enabled forcing HTTPS, so that `http://…` visitors are redirected to 
`https://…` (as I had on my VPS).

![Netlify HTTPS configuration](/assets/img/vps-to-netlify/netlify-https.png)

That was easy.

## Summary

After having absolute power over my hosting for so long, I still feel wary 
about giving up control to a third party. If there’s a problem or some 
limitation, I can no longer just open a text file and fix it, or install the 
additional software that I need. On the other hand, I’m now no longer 
responsible for keeping my server up-to-date, which I neglected in the past, 
and the deployment infrastructure is a lot simpler.

Moving to Netlify was pretty simple, overall, and I’m happy I tried it.
My biggest concern is that Netlify could easily drop their free plan (the next 
tier is $45 a month!), or the business could pivot or go under, but I expect 
things to be stable enough for the next few years.

[ghpages]: https://pages.github.com/
[amazons3]: https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html
[s3ssl]: https://www.josephecombs.com/2018/03/05/how-to-make-an-AWS-S3-static-website-with-ssl
[blogsrc]: https://github.com/alexpearce/alexpearce.github.com
[netlify]: https://www.netlify.com/
[netlifyplans]: https://www.netlify.com/pricing/
[netlifysignup]: https://app.netlify.com/signup
[Jekyll]: https://jekyllrb.com/
[static site generator]: https://davidwalsh.name/introduction-static-site-generators
[Gandi]: https://www.gandi.net/
[livedns]: https://news.gandi.net/en/2016/12/gandi-s-new-platform-it-s-here/
[gandiwishlist]: https://v4.gandi.net/domain/wishlist/
[netlifyredirects]: https://www.netlify.com/docs/redirects/
[letsencrypt]: https://letsencrypt.org

[^1]:
    Although having a CDN was a criterion, it was only at this point that I 
    realised a CDN wouldn’t work with _any_ hosting provider because I use 
    Gandi for DNS. I like Gandi, and couldn’t be bothered to change, so am 
    stuck without a CDN. (My sites were hosted only on my little VPS before 
    anyway, and were speedy enough, so I know that I don’t need _need_ a CDN.)

[^2]:
    I only found this out after first creating an HTTP redirect with Gandi, my 
    DNS registrar, then seeing in the Netlify dashboard that my DNS 
    configuration was invalid for issuing SSL certificates, as the `www` record 
    did not point to their servers.
