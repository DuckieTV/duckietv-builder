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
    .description('publish the binaries to github and the chrome web store (if configured)')
    .option("-p, --platform [platforms]", "publish a specific platform (defaults to all: " + sharedConfig.platforms.join(","), function(val) {
        return val.toLowerCase().split(',');
    }, sharedConfig.platforms)
    .option("--nightly", "Publish the nightly version to the webstore and github")
    .option("--iamverysure", "I am very sure that I want to do this. Tag a new release on github SchizoDuckie/DuckieTV")
    .parse(process.argv);



/**
 * Build process
 */

echo("Publishing binaries");

/**
 * - if nightlies, Push built source to nightlies
 * - Collect commit diff since last tag
 * - Create fresh tag with nightly or cli-passed version number with diff list description
 * - For each supported platform, run the publish function that returns which file(s) from the output dir to publish
 * - publish function optionally does it's own thing (like publishing to chrome web store)
 * - upload files list to tag
 */
var files = [];
program.platform.map(function(platform) {
    echo("Running publish processor for " + platform);
    var processor = require('./platforms/' + platform).processor;
    files += processor.publish(program);
    echo("Done processing " + platform);
});

echo("Publish processor done");