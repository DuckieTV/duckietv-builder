require('shelljs/global');
var shared = require('../shared');


/**
 * DuckieTV windows build processor.
 * The windows build processor makes a x32 and x64 binary and runs the output through NSIS to create a nice setup installer.
 */

var BUILD_DIR = shared.BUILD_DIR + '/windows';

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


            }


        }
    }

};