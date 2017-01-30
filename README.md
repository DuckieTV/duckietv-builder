DuckieTV Builder
================

A new, hackable way to automate DuckieTV builds and Deployment.

Features:
---------

* Separated from DuckieTV Codebase so that the main repo is not polluted with nodejs bloat for the build process
* No moar gulp. Comprehensible, readable, followable code.
* CLI Installer (run `npm install -g` in this directory to have a duckietv-builder binary)
* Git-style subcommands keep the individual tasks clean
* `--nightly` parameter takes care of handling nightly build number and relevant patches to locales.
* `--platform` parameter allows to build one or more specific platforms

Todo:
-----
- [ ] allow publishing to the webstore and cordova builds by using API keys where possible
- [ ] convert changelog to js
- [ ] \(unlisted) nightly builds for the chrome webstore! \o/
- [x] nwjs build process
- [x] installers
- [ ] install on buildbot
- [ ] convert XEM fetcher
- [ ] confirmation 'areyouversure' when publishing non-nightlies to production

Usage:
------
* `npm install -g`
* copy `dtv-builder-credentials.json-template` to `~/.dtv-builder-credentials.json` and fill it with provided credentials
* `duckietv-builder prepare --nightly --platform cordova,linux,osx,windows,browseraction,newtab` # prepare sources for build
* `duckietv-builder make-binaries --nightly --platform cordova,windows` # create binaries (where needed)
* `duckietv-builder package-binaries --nightly --platform cordova,windows` #package built binaries to /output
