---
layout: post
title: Deploying to a VPS With Capistrano
category: Tutorials
tags: [Capistrano, Ruby, nginx]
description: A step-by-step tutorial on deploying Ruby and static apps to a VPS with Capistrano.
---

Following on from the previous tutorial on [how to set up a Linux VPS for Ruby apps]({% post_url 2012-06-19-setting-up-a-vps %}), we'll get a simple Ruby site up-and-running by deploying it to our server with [Capistrano](https://github.com/capistrano/capistrano).

Capistrano simplifies many of the common tasks encountered when to deploying an app to one or more servers, allowing a push with a simple `cap deploy`. Along with Ruby apps, it can be used to deploy static (HTML) pages. The nice thing about using Capistrano rather than something such as [`rsync`](http://www.samba.org/ftp/rsync/rsync.html) is that we can easily pull the latest version from a git repository, as well as rollback to a previous version.

I will assume that our VPS has been set up as in my [VPS setup]({% post_url 2012-06-19-setting-up-a-vps %}) post, but the essentials are:

* SSH access
* Ruby
* A server (nginx, Apache, &hellip;)
* A git repository for the app

So, nothing extraordinary.

We'll be deploying a [Sinatra](http://sinatrarb.com/) application. As an example, we'll quickly create a "Hello World!" app and then get it working on the server. Although we'll deploy a [Sinatra](http://www.sinatrarb.com/) app to demonstrate the process, but it extends trivially to other Ruby apps.

Local Setup
-----------

Let's create a directory to hold our app, create the Gemfile and install the required gems.

{% highlight bash %}
$ mkdir testing
$ cd testing
$ echo -e "source :rubygems\n\ngem 'sinatra'" >> Gemfile
$ bundle install --path vendor/bundle
{% endhighlight %}

Passing the `--path` argument to the `bundle` command allows us to locally install gems without messing with systems gems (it allows us to avoid things like RVM gemsets).

Now the Sinatra gem is installed, we'll initialise a [git](http://git-scm.com/) repository.

{% highlight bash %}
$ git init .
$ echo -e ".bundle/\nvendor/bundle" >> .gitignore
$ git add .
$ git commit -m "Initial commit."
{% endhighlight %}

The `echo` is creating a `.gitignore` file which tells git which files and folders to ignore; we don't need to track the `.bundle` directory. We `git add` all the files to the staging area and then commit them with a message.

In order for Capistrano to deploy our app, we'll tell it to use git. This means setting up a remote repository, which [GitHub](http://github.com) provides for free. Create a [new repository on GitHub](https://github.com/new) and add the remote repo to our local one, then push to it.

{% highlight bash %}
$ git remote add origin https://github.com/USERNAME/REPONAME.git
$ git push -u origin master
{% endhighlight %}

Our 'app' now exists locally and remotely. When we makes changes locally, we `git commit` the changes and the `git push` them to GitHub. Each commit effectively acts as a separate release which Capistrano can deploy.

### Creating the App

We'll create a very simple "Hello World!" Sinatra app to test everything works. Firstly, create the application files.

{% highlight bash %}
$ touch app.rb config.ru
{% endhighlight %}

Then fill `app.rb`, using your favourite editor, with the following.

{% highlight ruby %}
# Bundler
require "rubygems"
require "bundler/setup"

# Sinatra
require "sinatra"

# The app
class Testing < Sinatra::Base
  get "/" do
    "Hello, World!"
  end
end
{% endhighlight %}

And fill `config.ru` with the following.

{% highlight bash %}
require "./app"

run Testing
{% endhighlight %}

The [docs](http://www.sinatrarb.com/documentation) give a comprehensive overview of how to use Sinatra. We can test the app locally to make sure every thing's OK.

{% highlight bash %}
$ bundle exec rackup config.ru
...
INFO  WEBrick::HTTPServer#start: pid=4885 port=9292
...
{% endhighlight %}

Launch [`localhost:9292`](http://localhost:9292) to view the site.

![A "Hello World" Sinatra app.](/assets/img/deploying-to-a-vps-with-capistrano/local-hello-world.png)

Hurrah! Let's configure the app for deployment. Add `gem 'capistrano'` to your Gemfile, which should now look like this:

{% highlight ruby %}
source :rubygems

gem 'sinatra'

gem 'capistrano'
{% endhighlight %}

and then install the gem. No need to worry about adding the `--path` argument; Bundler remembers the preference in `.bundle/config`.

{% highlight bash %}
$ bundle install
{% endhighlight %}

Add the app file to git repository, commit, then add the changes to the Gemfile, then finally commit again.

{% highlight bash %}
$ git add app.rb config.ru
$ git commit -m "Add the Sinatra app."
$ git commit -a -m "Add Capistrano."
$ git push
{% endhighlight %}

The `-a` flag adds all modified files, which in this case is the `Gemfile` and the [lock file](http://stackoverflow.com/questions/4151495/should-gemfile-lock-be-included-in-gitignore) `Gemfile.lock`.


### Setting up Capistrano

To get our app set up with Capistrano, we need to 'capify' the folder. This creates two files: `Capify`, at the root of the app; and `deploy.rb`, inside a `config` directory.
The `deploy.rb` file is where almost all of the configuration is done. Rather than going through [all the possible configuration options](https://github.com/capistrano/capistrano/wiki/2.x-Significant-Configuration-Variables), we'll use a [template deploy file](https://github.com/alexpearce/templates/blob/master/deploy.rb) I've created. It's heavily commented, make sure to understand what it's doing. There's a few things you'll need to change.

* `:application`: Whatever you like. It just determines what the app's folder on the server is called.
* `:repository`: Your GitHub repository, or where ever you're hosting the repo remotely.
* The `:app`, `:web` and `:db` roles: The IP address or FQDN of the VPS to deploy to.

If you didn't set up your VPS using the [previous tutorial]({% post_url 2012-06-19-setting-up-a-vps %}), there may be a few other things you need to change.

* `:user`: If you're not using a deploy user.
* If you're not using [Passenger](http://www.modrails.com/), the `start`, `stop`, and `restart` tasks will need adjusting.
* The `:admin` namespace contains nginx specific tasks for symlinking the hosts file (which we'll get to shortly) and restarting the server. For [Apache](http://httpd.apache.org/) servers the changes needed here will be minimal.

Finally, we'll require an nginx 'hosts' file specific to our app. Again, we'll use a [template nginx hosts file](https://github.com/alexpearce/templates/blob/master/nginx.app.conf) I've created. Let's retrieve both of the files.

{% highlight bash %}
$ capify .
...

$ cd config
$ curl https://raw.github.com/alexpearce/templates/master/nginx.app.conf -o nginx.server
$ curl https://raw.github.com/alexpearce/templates/master/deploy.rb -o deploy.rb
{% endhighlight %}

Now **edit them accordingly**. The nginx file requires a few changes.

* `server_name`: The IP address of FQDN the app will be accessed at.
* `root`: Change `APPNAME` to folder name of app, identical to the `:application` variable in the Capistrano deploy file.
* Delete the `location ^~ /assets/` block. We don't need it as we're not serving a Rails app.

**Add the files and commit them** the usual way, then push to GitHub.

That's it! We're all done locally, we just have a few things to do on our VPS.

Remote Setup
------------

All commands below are to be run *on the remote VPS*, so log in to the VPS via SSH with `ssh user@VPS_IP`.

In order to allow automated pulling from GitHub, we'll touch GitHub over SSH so our server knows the certficate. As it's the `deploy` user who deploys app, we'll assume the identity of `deploy`.

{% highlight bash %}
$ su - deploy
$ ssh github.com
y
{% endhighlight %}

And that's it! Nice and simple.

Deploying
---------

We're back *working locally* now.

Inside the app directory, we just need to run a few commands.

{% highlight bash %}
$ cap deploy:setup
$ cap deploy:cold
{% endhighlight %}

Done! Visit the site using the IP address or FQDN specified in the `nginx.server` file.

![The "Hello World" app live on the server.](/assets/img/deploying-to-a-vps-with-capistrano/live-hello-world.png)

To fully test our deployment we'll change the "Hello World" text to something different, commit and push the changes then deploy.

{% highlight bash %}
$ nano app.rb
...
$ git commit -a -m "Updated app."
$ git push
$ cap deploy
{% endhighlight %}

Now refresh the live app.

![The deployment worked.](/assets/img/deploying-to-a-vps-with-capistrano/live-change.png)

Excellent, everything works!

We've now created a workflow for updating our app. The procedure in this article is very similar no matter what Ruby application your deploying. For apps that talk to a database, you'll just need to create the database on the server before the cold deploy. 

The advantage with this approach is git management, and for future GitHub-hosted apps we won't have to log in to the VPS at all. We can also deploy HTML apps this way, just place all files that need to have public access inside a `public` directory, then `capify` the app as normal. 
