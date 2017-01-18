require('shelljs/global');
var shared = require('../shared'),
    util = require(' ../util');


/**
 * DuckieTV windows build processor.
 * The windows build processor makes a x32 and x64 binary and runs the output through NSIS to create a nice setup installer.
 */

var BUILD_DIR = shared.BUILD_DIR + '/windows';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-windows-%ARCHITECTURE%.zip';
var ARCHITECTURES = ['x32', 'x64'];

module.exports = {

    processor: {

        preProcess: function(options) {
            shared.modifyPackageJSON(options, BUILD_DIR);
            shared.patchManifest(BUILD_DIR, ['dist/background.js']);
        },

        makeBinary: function(options) {


        },
        packageBinary: function(options) {
            ARCHITECTURES.map(function(arch) {
                echo("Packing windows " + arch);
                var targetFileName = util.buildFilename(PACKAGE_FILENAME, ARCHITECTURE);
                buildUtils.zipBinary('windows-' + arch, targetFileName);
                echo("Packaging windows " + arch + " done.");
            });
        },
        deploy: function(options) {
            ARCHITECTURES.map(function(arch) {

                if (options.nightly && options.deploy) {
                    buildUtils.publishFileToGithubTag('DuckieTV/Nightlies', options.GITHUB_TAG, shared.OUTPUT_DIR + '/' + buildUtils.buildFilename(PACKAGE_FILENAME));
                }

                if (!options.nightly && options.deploy && options.iamsure) {
                    buildUtils.publishFileToGithubTag('SchizoDuckie/DuckieTV', options.GITHUB_TAG, shared.OUTPUT_DIR + '/' + buildUtils.buildFilename(PACKAGE_FILENAME));
                }


            });

        }
    }

};