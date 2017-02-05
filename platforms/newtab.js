require('shelljs/global');
var shared = require('../shared'),
    buildUtils = require('../util'),
    dateFormat = require('dateformat'),
    oAuth = require('../oauth');


/**
 * DuckieTV new tab build processor.
 * The new tab doesn't have to do anything special, just package.
 * Modifies the manifest in case of nightly.
 */

var BUILD_DIR = shared.BUILD_DIR + '/newtab';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-chrome-newtab.zip';


module.exports = {

    processor: {

        preProcess: function(options) {

            if (options.nightly) {
                ShellString(dateFormat('yyyy.m.dHHM')).to(BUILD_DIR + '/VERSION'); // set nightly version to work without prefix zeros and separated by dots.
            }
            shared.patchManifest(BUILD_DIR, ['dist/background.js']);
            if (options.nightly) {
                shared.addNightlyStrings(BUILD_DIR);
                shared.rotateNightlyImages(BUILD_DIR);
            }
        },

        makeBinary: function(options) {
            cp('-r', BUILD_DIR, shared.BASE_OUTPUT_DIR);
        },
        packageBinary: function(options) {
            var targetFileName = buildUtils.buildFileName(PACKAGE_FILENAME);
            buildUtils.zipBinary('newtab', targetFileName);
        },
        publish: function(options) {
            if (!options.nightly && !options.iamverysure) {
                echo("Not publishing production version! --iamverysure missing from command");
                return;
            }

            oAuth.refreshTokenIfNeeded();
            var credentials = shared.getCredentials();
            var APP_ID = options.nightly ? credentials.EXTENSION_ID_NEWTAB_NIGHTLY : credentials.EXTENSION_ID_NEWTAB;

            // upload zip
            echo("\nUploading to chrome webstore\n");
            oAuth.uploadBinary(APP_ID, shared.BINARY_OUTPUT_DIR + "/" + buildUtils.buildFileName(PACKAGE_FILENAME));

            // publish it
            echo("\nPublishing chrome webstore draft\n");
            oAuth.publishDraft(APP_ID);

            return buildUtils.buildFileName(PACKAGE_FILENAME);

        }
    }
}