#!/usr/bin/env node

require('shelljs/global');
var program = require('commander'),
    sharedConfig = require('./shared'),
    github = require('./github');

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
    files = files.concat(processor.publish(program));
});

echo(JSON.stringify(files));

if (program.nightly) {
    var tag = 'nightly-' + sharedConfig.getVersion();
    github.createNightlyTag(sharedConfig.BUILD_SOURCE_DIR, tag);
    var lastHash = github.determineLastTagHash(program.nightly);
    var changelog = github.getChangeLogSince(sharedConfig.BUILD_SOURCE_DIR, lastHash);
    github.createNightlyRelease(tag, changelog).then(function(release_id) {
        echo(release_id);
        echo("Nightly release created. now uploading files:");
        return release_id;
    }).then(function(release_id) {
        echo(JSON.stringify(files));
        return files.map(function(filename) {
            echo("Uploading:" + sharedConfig.BINARY_OUTPUT_DIR + "/" + filename + "\n");
            github.publishFileToGithubTag('DuckieTV/Nightlies', release_id, sharedConfig.BINARY_OUTPUT_DIR + "/" + filename);
            echo("Upload complete:" + sharedConfig.BINARY_OUTPUT_DIR + "/" + filename + "\n");
            return true;
        });
        return true;
    }).then(function(done) {
        console.log("all done");
    });
}
echo("Publish processor done");