require('shelljs/global');
var shared = require('../shared');


/**
 * DuckieTV new tab build processor.
 * The new tab doesn't have to do anything special, just package.
 * Modifies the manifest in case of nightly.
 */

var BUILD_DIR = shared.BUILD_DIR + '/newtab';

module.exports = {

    processor: {

        preProcess: function(options) {
            shared.patchManifest(BUILD_DIR, ['dist/background.js']);
            shared.modifyPackageJSON(options, BUILD_DIR);
        },

        makeBinary: function(options) {


            // zip -r "binaries/DuckieTV-${DTREV}-Chrome-NewTab.zip" newtab   

        },
        deploy: function(options) {

            if (options.nightly && options.deploy) {
                //pushToGithub();
            }


        }
    }
};