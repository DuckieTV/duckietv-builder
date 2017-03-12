require('shelljs/global');
var shared = require('../shared'),
    buildUtils = require('../util');

config.verbose = true;

/**
 * DuckieTV windows build processor.
 * The windows build processor makes a x32 and x64 binary and runs the output through NSIS to create a nice setup installer.
 */

var BUILD_DIR = shared.BUILD_DIR + '/windows';
var PACKAGE_FILENAME = 'DuckieTV-%VERSION%-windows-%ARCHITECTURE%.zip';
var INSTALLER_FILENAME = 'DuckieTV-%VERSION%-windows-%ARCHITECTURE%.exe';
var ARCHITECTURES = ['x32', 'x64'];

module.exports = {

    processor: {

        preProcess: function(options) {
            shared.modifyPackageJSON(options, BUILD_DIR);
            shared.patchManifest(BUILD_DIR, [
                'dist/CRUD.js',
                'dist/CRUD.SqliteAdapter.js',
                'dist/CRUD.entities.js',
                'dist/CRUD.background.bootstrap.js',
                'dist/background.js'
            ]);
            if (options.nightly) {
                shared.addNightlyStrings(BUILD_DIR);
            }
        },

        makeBinary: function(options) {

            if (!which('makensis')) {
                echo("makensis is required to build windows installers. Grab it from http://nsis.sourceforge.net/");
                process.exit();
            }

            ARCHITECTURES.map(function(arch) {
                var ARCH_BUILD_DIR = BUILD_DIR + "-" + arch + "/DuckieTV";

                // create output dir for platform
                mkdir("-p", ARCH_BUILD_DIR);

                // copy generic sources 
                cp('-r', BUILD_DIR + "/*", BUILD_DIR + "-" + arch + "/DuckieTV")

                cp('-r', __dirname + "/windows/*", BUILD_DIR + "-" + arch);

                // download and extract nwjs
                var EXTRACTED_NWJS = require('../nwjs-downloader')
                    .setDebug(options.nightly)
                    .setPlatform('win')
                    .setArchitecture(arch)
                    .setVersion(shared.NWJS_VERSION)
                    .get();

                cp('-r', EXTRACTED_NWJS + "/*", ARCH_BUILD_DIR);
                //rename nw executable to DuckieTV-bin, so the wrapper script can run
                mv(ARCH_BUILD_DIR + "/nw.exe", ARCH_BUILD_DIR + "/DuckieTV.exe");

                pushd(BUILD_DIR + "-" + arch);

                cat('DuckieTV/app.nsi')
                    .replace(/{{ARCHITECTURE}}/g, arch)
                    .replace(/{{ICONFILE}}/g, 'img/favicon.ico')
                    .replace(/{{LICENSE}}/g, 'LICENSE.md')
                    .replace(/{{VERSION}}/g, shared.getVersion())
                    .replace(/{{NIGHTLY}}/g, options.nightly ? "Nightly " : "")
                    .replace(/{{SETUP_OUTPUT_FILENAME}}/g, buildUtils.buildFileName(INSTALLER_FILENAME, arch))
                    .to('DuckieTV/app.nsi');

                // hijack resourcehacker nodejs module's executable so we can pipe it through sync exec() function
                var path = require('path');
                pushd('DuckieTV');
                var RESHACKER_PATH = path.join(path.dirname(require.resolve('resourcehacker')), '../bin/ResourceHacker.exe');
                if (process.platform != 'win32') {
                    RESHACKER_PATH = 'wine ' + RESHACKER_PATH;
                }
                exec(RESHACKER_PATH + ' -open "' + ARCH_BUILD_DIR + '/DuckieTV.exe" -save "' + ARCH_BUILD_DIR + '/DuckieTV.exe" -action addoverwrite -resource "' + ARCH_BUILD_DIR + '/img/favicon-inverted.ico" -mask ICONGROUP, IDR_ALT_ICON, 0 -log "' + BUILD_DIR + '/RHlog1.txt"');
                exec(RESHACKER_PATH + ' -open "' + ARCH_BUILD_DIR + '/DuckieTV.exe" -save "' + ARCH_BUILD_DIR + '/DuckieTV.exe" -action addoverwrite -resource "' + ARCH_BUILD_DIR + '/img/favicon.ico" -mask ICONGROUP, IDR_MAINFRAME, 1033 -log "' + BUILD_DIR + '/RHlog2.txt"');
                exec(RESHACKER_PATH + ' -open "' + ARCH_BUILD_DIR + '/DuckieTV.exe" -save "' + ARCH_BUILD_DIR + '/DuckieTV.exe" -action addoverwrite -resource "' + ARCH_BUILD_DIR + '/img/favicon.ico" -mask ICONGROUP, IDR_X001_APP_LIST, 1033 -log "' + BUILD_DIR + '/RHlog3.txt"');
                exec(RESHACKER_PATH + ' -open "' + ARCH_BUILD_DIR + '/DuckieTV.exe" -save "' + ARCH_BUILD_DIR + '/DuckieTV.exe" -action addoverwrite -resource "' + __dirname + '/windows/fileinfo.res" -mask VERSIONINFO, 1, 1033 -log "' + BUILD_DIR + '/RHlog4.txt"');
                exec("makensis app.nsi");
                mv(buildUtils.buildFileName(INSTALLER_FILENAME, arch), '..');
                popd();
                popd();

            });
        },
        packageBinary: function(options) {
            ARCHITECTURES.map(function(arch) {
                echo("Packing windows " + arch);
                var targetFileName = buildUtils.buildFileName(PACKAGE_FILENAME, arch);
                var installerFile = buildUtils.buildFileName(INSTALLER_FILENAME, arch);
                buildUtils.zipBinary('windows-' + arch, targetFileName, '*.exe');
                echo("Packaging windows " + arch + " done.");
            });

        },
        publish: function(options) {
            return ARCHITECTURES.map(function(arch) {
                return buildUtils.buildFileName(PACKAGE_FILENAME, arch);
            });

        }
    }

};