require "mina/bundler"
require "mina/git"
require "mina/rbenv"

set :app, "alexpearce.me"

set :user, "deploy"
set :port, "19810"
set :domain, "192.249.56.87"
set :deploy_to, "/home/#{user}/#{app}"

set :repository, "git://github.com/alexpearce/alexpearce.github.com.git"
set :branch, "master"

set :shared_paths, []

task :setup => :environment do
  invoke :link
end

task :link do
  queue "ln -sf #{deploy_to}/#{current_path}/config/Caddyfile /home/deploy/caddyfiles/#{app}.conf"
end

task :unlink do
  queue "rm /home/deploy/caddyfiles/#{app}.conf"
end

desc "Deploys the current version to the server."
task :deploy => :environment do
  deploy do
    invoke :"git:clone"
    invoke :"bundle:install"
    queue "#{bundle_bin} exec jekyll build"
  end
end

