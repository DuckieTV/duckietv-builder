require('shelljs/global');
var shared = require('../shared'),
    buildUtils = require('../util'),
    dateFormat = require('dateformat'),
    oAuth = require('../oauth');


/**
 * DuckieTV new tab build processor.
 * This processor places background.js (and dependants) in the dist folder and references it from the package.json.
 * Modifies the manifest in case of nightly.
 */

var BUILD_DIR = shared.BUILD_DIR + '/newtab';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-chrome-newtab.zip';


module.exports = {

    processor: {

        preProcess: function(options) {

            if (options.nightly) {
                var dt = new Date();
                var minutesSinceMidnight = 1 + dt.getMinutes() + (60 * dt.getHours());
                ShellString((dt.getFullYear() + 1000) + "." + (dt.getMonth() + 1) + '.' + dt.getDate() + '.' + minutesSinceMidnight).to(BUILD_DIR + '/VERSION'); // set nightly version to work without prefix zeros and separated by dots.
            }
            shared.patchManifest(BUILD_DIR, shared.getManifestBackgroundScriptArray(BUILD_DIR + '/manifest.json', 'dist/'));
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
            return buildUtils.buildFileName(PACKAGE_FILENAME);
        }
    }
}
