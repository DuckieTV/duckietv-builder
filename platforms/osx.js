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
            var config = {
                // Build paths
                nwjs_path: '/var/www/duckietv-builder/nwjs_download_cache/nwjs-sdk-v0.19.5-osx-x64/nwjs.app',
                source_path: BUILD_DIR, // App root (the dir with the package.json file)
                build_path: shared.BINARY_OUTPUT_DIR, // Destination dir of the .app build

                // App informations
                name: 'DuckieTV',
                bundle_id: 'tv.duckie',
                version: shared.getVersion().toString(),
                bundle_version: '148',
                copyright: '© DuckieTV',
                icon_path: __dirname + '/osx/duckietv.icns',
            };
            echo(config);

            var Builder = require('nwjs-osx-on-linux-builder');
            var show_output = true;

            var builder = new Builder();
            builder.build(config, function(error, app_path) {
                echo(error ? "ERROR" + error.message : 'Build done: ' + app_path);
            }, show_output);
        },
        packageBinary: function(options) {
            var targetFileName = util.buildFilename(PACKAGE_FILENAME, ARCHITECTURE);
            // make dmg

        },
        deploy: function(options) {

            if (options.nightly && options.deploy) {
                //pushToGithub();
            }


        }
    }

};