#!/usr/bin/env node

require('shelljs/global');
var program = require('commander'),
    sharedConfig = require('./shared');

config.verbose = false;
config.fatal = true;


/**
 * Package binaries
 * - package binaries to their respective packaging tgz format
 * - move them to the binaries output dir
 */
program
    .description('package binaries to their respective packaging tgz format, move them to the binaries output dir')
    .option("-p, --platform [platforms]", "Build a specific platform (defaults to all: " + sharedConfig.platforms.join(","), function(val) {
        return val.toLowerCase().split(',');
    }, sharedConfig.platforms)
    .option("-n, --nightly", "do a nightly (version number set to today)")
    .parse(process.argv);

sharedConfig.validateRequestedPlatforms(program.platform);

/**
 * Build process
 */
echo("Packaging binaries");

/**
 * For each supported platform, run the preProcessor that does platform-specific things.
 */
program.platform.map(function(platform) {
    echo("Running packager processor for " + platform);
    var processor = require('./platforms/' + platform).processor;
    processor.packageBinary(program);
    echo("Done processing " + platform);
});

echo("Package processor done");