require('shelljs/global');
var dateFormat = require('dateformat'),
    shared = require('../shared');


/**
 * DuckieTV browser action build processor.
 * This processor places both background.js and launch.js in the dist folder and references it from the package.json.
 * launch.js is used to inject the browseraction button.
 * Modifies the manifest in case of nightly.
 */

var BUILD_DIR = shared.BUILD_DIR + '/browseraction';

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
            if (options.nightly) {
                cd(shared.BUILD_DIR);
                exec('zip -r "binaries/DuckieTV-' + version + '-Chrome-BrowserAction.zip" browseraction');
            } else {
                cd(shared.BUILD_DIR);
                exec('zip -r "binaries/DuckieTV-' + version + '-Chrome-BrowserAction.zip" browseraction');
            }

        },
        deploy: function(options) {

            if (options.nightly && options.deploy) {
                //pushToGithub();
                // post to nightly build on webstore
                // make sure to modify the VERSION format to 2017.1.23 in package.json so that it has dots and no 0 as the start char after a dot!
            }


        }
    }

};