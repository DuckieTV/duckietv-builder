require('shelljs/global');
var shared = require('../shared');


/**
 * DuckieTV .deb build processor.
 * The .deb build takes a generic linux binary and uses debtool to make a .deb
 */

var BUILD_DIR = shared.BUILD_DIR + '/deb';

module.exports = {

    processor: {

        preProcess: function(options) {
            shared.modifyPackageJSON(options, BUILD_DIR);
            shared.patchManifest(BUILD_DIR, ['dist/background.js']);
        },

        makeBinary: function(options) {
            // copy        

        },
        deploy: function(options) {

            if (options.nightly && options.deploy) {
                //pushToGithub();
            }


        }
    }

};