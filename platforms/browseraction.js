require('shelljs/global');
var dateFormat = require('dateformat'),
    shared = require('../shared'),
    buildUtils = require('../util');


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
            var targetFileName = buildUtils.buildFileName(PACKAGE_FILENAME);
            buildUtils.zipBinary('browseraction', targetFileName);
        },
        publish: function(options) {

            var credentials = shared.getCredentials();
            var APP_ID = options.nightly ? credentials.EXTENSION_ID_BROWSER_ACTION_NIGHTLY : credentials.EXTENSION_ID_BROWSER_ACTION;
            if (!options.nightly && !options.iamverysure) {
                echo("Not publishing production version! --iamverysure missing from command");
            }


            var auth = exec('curl https://accounts.google.com/o/oauth2/token -d "client_id=' + credentials.CHROME_WEBSTORE_CLIENT_ID + '&client_secret=' + credentials.CHROME_WEBSTORE_CLIENT_SECRET + '&code=' + credentials.CHROME_WEBSTORE_CODE + '&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob"');
            echo(auth);

            process.exit();

            exec(['curl',
                '-H "Authorization: Bearer ' + credentials.CHROME_WEBSTORE_REFRESH_TOKEN + '"',
                '-H "x-goog-api-version: 2"',
                '-X PUT -T ' + shared.BINARY_OUTPUT_DIR + "/" + buildUtils.buildFileName(PACKAGE_FILENAME),
                '-v https://www.googleapis.com/upload/chromewebstore/v1.1/items/' + APP_ID
            ].join(" "));
            return buildUtils.buildFileName(PACKAGE_FILENAME);

        }
    }

};