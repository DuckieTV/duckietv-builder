require('shelljs/global');
var shared = require('../shared'),
    util = require(' ../util');


/**
 * DuckieTV .deb build processor.
 * The .deb build takes a generic linux binary and uses debtool to make a .deb
 */

var BUILD_DIR = shared.BUILD_DIR + '/deb';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-ubuntu-%ARCHITECTURE%.deb';
var ARCHITECTURES = ['x32', 'x64'];

module.exports = {

    processor: {

        preProcess: function(options) {
            shared.modifyPackageJSON(options, BUILD_DIR);
            shared.patchManifest(BUILD_DIR, ['dist/background.js']);
        },

        makeBinary: function(options) {
            // copy        

        },
        packageBinary: function(options) {
            ARCHITECTURES.map(function(arch) {
                echo("(TODO) Packing .deb " + arch);
                var targetFileName = util.buildFilename(PACKAGE_FILENAME, arch);
                echo("Done packing .deb " + arch);

            });

        }
        deploy: function(options) {

            if (options.nightly && options.deploy) {
                //pushToGithub();
            }


        }
    }

};