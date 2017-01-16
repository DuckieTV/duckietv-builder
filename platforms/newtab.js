require('shelljs/global');
var shared = require('../shared'),
    buildUtils = require(' ../util');


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
            shared.patchManifest(BUILD_DIR, ['dist/background.js']);
            shared.modifyPackageJSON(options, BUILD_DIR);
        },

        makeBinary: function(options) {
            cp('-r', BUILD_DIR, shared.BASE_OUTPUT_DIR);
        },
        packageBinary: function(options) {
            var targetFileName = util.buildFilename(PACKAGE_FILENAME);
            buildUtils.zipBinary('newtab', targetFileName);
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