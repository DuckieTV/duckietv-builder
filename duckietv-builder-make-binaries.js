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
    .command('make-binaries', 'make-binaries --installers --platforms[platforms] ')
    .description('compile binaries with optional installers for a platform (default all)')
    .option("-p, --platform [platforms]", "Build a specific platform (defaults to all: " + sharedConfig.platforms.join(","), function(val) {
        return val.toLowerCase().split(',');
    }, sharedConfig.platforms)
    .option("-n, --nightly", "do a nightly (version number set to today)")
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