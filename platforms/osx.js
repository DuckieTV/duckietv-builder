require('shelljs/global');
var shared = require('../shared'),
    util = require('../util');


/**
 * DuckieTV osx build processor.
 * The osx build processor makes a generic x64 
 */

var BUILD_DIR = shared.BUILD_DIR + '/osx';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-OSX-%ARCHITECTURE%.pkg';
var ARCHITECTURE = 'x64';




module.exports = {

    processor: {

        preProcess: function(options) {
            shared.modifyPackageJSON(options, BUILD_DIR);
            shared.patchManifest(BUILD_DIR, ['dist/background.js']);
        },

        makeBinary: function(options) {


        },
        packageBinary: function(options) {
            var targetFileName = util.buildFilename(PACKAGE_FILENAME, ARCHITECTURE);
            // make dmg

        }
        deploy: function(options) {

            if (options.nightly && options.deploy) {
                //pushToGithub();
            }


        }
    }

};