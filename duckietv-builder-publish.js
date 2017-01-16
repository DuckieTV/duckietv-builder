#!/usr/bin/env node

require('shelljs/global');
var program = require('commander'),
    sharedConfig = require('./shared');

config.verbose = false;
config.fatal = true;


/**
 * Make binaries
 * - puts nwjs in place where needed
 * - performs .apk build via Phonegap Build for android (platform = cordova)
 */
program
    .command('publish', 'publish [--no-nightly --iamverysure]  ')
    .description('publish the binaries to github and the chrome web store (if configured)')
    .option("-p, --platform [platforms]", "publish a specific platform (defaults to all: " + sharedConfig.platforms.join(","), function(val) {
        return val.toLowerCase().split(',');
    }, sharedConfig.platforms)
    .option("--no-nightly", "Publish the PRODUCTION version to the webstore")
    .option("--iamverysure", "I am very sure that I want to do this. Tag a new release on github SchizoDuckie/DuckieTV")
    .parse(process.argv);



/**
 * Build process
 */

echo("Building binaries");

/**
 * For each supported platform, run the preProcessor that does platform-specific things.
 */
program.platform.map(function(platform) {
    echo("Running build processor for " + platform);
    var processor = require('./platforms/' + platform).processor;
    processor.makeBinary(program);
    echo("Done processing " + platform);
});

echo("Binary processor done");