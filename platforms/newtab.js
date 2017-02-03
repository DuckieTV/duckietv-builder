require('shelljs/global');
var shared = require('../shared'),
    buildUtils = require('../util'),
    dateFormat = require('dateformat');


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
                ShellString(dateFormat('yyyy.m.dHM')).to(BUILD_DIR + '/VERSION'); // set nightly version to work without prefix zeros and separated by dots.
            }
            if (options.nightly) {
                shared.addNightlyStrings(BUILD_DIR);
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
            var credentials = shared.getCredentials();
            var APP_ID = options.nightly ? credentials.EXTENSION_ID_NEWTAB_NIGHTLY : credentials.EXTENSION_ID_NEWTAB;
            if (!options.nightly && !options.iamverysure) {
                echo("Not publishing production version! --iamverysure missing from command");
            }

            // grab fresh auth token only when needed
            if (Math.floor(new Date().getTime() / 1000) > credentials.CHROME_WEBSTORE_REFRESH_TOKEN_MAX_AGE) {
                var response = JSON.parse(exec('curl "https://www.googleapis.com/oauth2/v4/token" -d "client_id=' + credentials.CHROME_WEBSTORE_CLIENT_ID + '&client_secret=' + credentials.CHROME_WEBSTORE_CLIENT_SECRET + '&code=' + credentials.CHROME_WEBSTORE_REFRESH_TOKEN + '&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob"').trim());
                if (response.error) {
                    process.exit();
                }
                credentials.CHROME_WEBSTORE_REFRESH_TOKEN = response.refresh_token;
                credentials.CHROME_WEBSTORE_CODE = response.access_token;
                credentials.CHROME_WEBSTORE_REFRESH_TOKEN_MAX_AGE = Math.floor(new Date().getTime() / 1000) + response.expires_in;
                shared.putCredentials(credentials);
                echo("Updated credentials:");
                echo(response);
            }

            // upload zip
            echo("Uploading to chrome webstore");
            exec(['curl',
                '-H "Authorization: Bearer ' + credentials.CHROME_WEBSTORE_CODE + '"',
                '-H "x-goog-api-version: 2"',
                '-X PUT -T ' + shared.BINARY_OUTPUT_DIR + "/" + buildUtils.buildFileName(PACKAGE_FILENAME),
                '-v https://www.googleapis.com/upload/chromewebstore/v1.1/items/' + APP_ID
            ].join(" "));
            // publish it
            echo("Publishing chrome webstore draft");
            echo(['curl',
                '-H "Authorization: Bearer ' + credentials.CHROME_WEBSTORE_CODE + '"',
                '-H "x-goog-api-version: 2"',
                '-H "Content-Length: 0"',
                '-X POST',
                '-v https://www.googleapis.com/chromewebstore/v1.1/items/' + APP_ID + '/publish'
            ].join(" "));

            return buildUtils.buildFileName(PACKAGE_FILENAME);

        }
    }
}