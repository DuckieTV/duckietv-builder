require('shelljs/global');
var shared = require('../shared');


/**
 * DuckieTV osx build processor.
 * The osx build processor makes a generic x64 
 */

var BUILD_DIR = shared.BUILD_DIR + '/osx';

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