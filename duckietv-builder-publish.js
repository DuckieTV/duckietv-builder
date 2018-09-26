#!/usr/bin/env node

require('shelljs/global');
var program = require('commander'),
    sharedConfig = require('./shared'),
    github = require('./github');

config.verbose = false;
config.fatal = true;


/**
 * Publish
 * - publish the binaries to github and the chrome web store (if configured)
 */
program
    .description('publish the binaries to github and the chrome web store (if configured)')
    .option("-p, --platform [platforms]", "publish a specific platform (defaults to all: " + sharedConfig.platforms.join(","), function(val) {
        return val.toLowerCase().split(',');
    }, sharedConfig.platforms)
    .option("-n, --nightly", "Publish the nightly version to the webstore and github")
    .option("--iamverysure", "I am very sure that I want to do this. Tag a new release on github SchizoDuckie/DuckieTV")
    .parse(process.argv);

sharedConfig.validateRequestedPlatforms(program.platform);

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
    github.determineLastTagHash(program.nightly).then(function(lastTag) {
        echo("Last tag hash:", lastTag);
        echo("Fetching changelog");
        var changelog = github.getChangeLogSince(sharedConfig.CHANGELOG_DIFF_DIR, lastTag);
        var tag = 'nightly-' + sharedConfig.getVersion();

        github.createNightlyTag(sharedConfig.CHANGELOG_DIFF_DIR, tag);

        return github.createNightlyRelease(tag, changelog).then(function(release_id) {
            echo(release_id);
            echo("Nightly release " + tag + " created with ID " + release_id + ".\nChangelog: \n" + changelog.replace('\n', "\n"));
            return release_id;
        });
    }, function(err) {
        throw err;
    }).then(function(release_id) {
        echo("\n\nnow uploading files:\n");
        echo(JSON.stringify(files));

        return Promise.all(files.map(function(filename) {
            echo("Uploading:" + sharedConfig.BINARY_OUTPUT_DIR + "/" + filename + "\n");
            github.publishFileToGithubTag('DuckieTV/Nightlies', release_id, sharedConfig.BINARY_OUTPUT_DIR + "/" + filename);
            echo("Upload complete:" + sharedConfig.BINARY_OUTPUT_DIR + "/" + filename + "\n");
            return true;
        }));
    }).then(function(done) {
        echo("Nightly publishing all done");
    });

}