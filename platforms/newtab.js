require('shelljs/global');
var shared = require('../shared'),
    buildUtils = require('../util');


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
            var targetFileName = buildUtils.buildFileName(PACKAGE_FILENAME);
            buildUtils.zipBinary('newtab', targetFileName);
        },
        publish: function(options) {
            var credentials = shared.getCredentials();
            var APP_ID = options.nightly ? credentials.EXTENSION_ID_NEWTAB_NIGHTLY : credentials.EXTENSION_ID_NEWTAB;
            if (options.nightly && !options.iamverysure) {
                echo("Not publishing production version! --iamverysure missing from command");
            }
            exec(['curl',
                '-H "Authorization: Bearer ' + credentials.CHROME_WEBSTORE_REFRESH_TOKEN + '"',
                '-H "x-goog-api-version: 2"',
                '-X PUT -T ' + shared.BINARY_OUTPUT_DIR + "/" + buildUtils.buildFilename(PACKAGE_FILENAME),
                '-v https://www.googleapis.com/upload/chromewebstore/v1.1/items/' + APP_ID
            ].join(" "));
            return buildUtils.buildFilename(PACKAGE_FILENAME);

        }
    }
}