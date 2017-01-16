require('shelljs/global');
var dateFormat = require('dateformat'),
    shared = require('../shared'),
    buildUtils = require(' ../util');


/**
 * DuckieTV browser action build processor.
 * This processor places both background.js and launch.js in the dist folder and references it from the package.json.
 * launch.js is used to inject the browseraction button.
 * Modifies the manifest in case of nightly.
 */

var BUILD_DIR = shared.BUILD_DIR + '/browseraction';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-chrome-browseraction.zip';

module.exports = {

    processor: {

        preProcess: function(options) {

            if (options.nightly) {
                ShellString(dateFormat('yyyy.m.d')).to(BUILD_DIR + '/VERSION'); // set nightly version to work without prefix zeros and separated by dots.
            }
            cp([shared.BUILD_SOURCE_DIR + "/manifest-app.json"], BUILD_DIR + '/manifest.json');
            cp([shared.BUILD_SOURCE_DIR + "/js/background.js", shared.BUILD_SOURCE_DIR + '/launch.js'], BUILD_DIR + '/dist/');
            shared.patchManifest(BUILD_DIR, ['dist/background.js', 'dist/launch.js']);
        },
        makeBinary: function(options) {
            cp('-r', BUILD_DIR, shared.BASE_OUTPUT_DIR);
        },
        packageBinary: function(options) {
            var targetFileName = util.buildFilename(PACKAGE_FILENAME);
            buildUtils.zipBinary('browseraction', targetFileName);
        }
        deploy: function(options) {

            if (options.nightly && options.deploy) {
                buildUtils.publishFileToGithubTag('DuckieTV/Nightlies', options.GITHUB_TAG, shared.OUTPUT_DIR + '/' + buildUtils.buildFilename(PACKAGE_FILENAME));
            }

            if (!options.nightly && options.deploy && options.iamsure) {
                buildUtils.publishFileToGithubTag('SchizoDuckie/DuckieTV', options.GITHUB_TAG, shared.OUTPUT_DIR + '/' + buildUtils.buildFilename(PACKAGE_FILENAME));
            }


        }
    }

};