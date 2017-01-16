require('shelljs/global');
var shared = require('../shared');


/**
 * DuckieTV linux build processor.
 * The linux build processor makes a generic linux binary and creates a .tgz with a setup script
 */

var BUILD_DIR = shared.BUILD_DIR + '/linux';

module.exports = {

    processor: {

        preProcess: function(options) {
            shared.modifyPackageJSON(options, BUILD_DIR);
            shared.patchManifest(BUILD_DIR, ['dist/background.js']);
        },

        makeBinary: function(options) {


        },
        deploy: function(options) {

            if (options.nightly && options.deploy) {
                //pushToGithub();
            }


        }
    }

};