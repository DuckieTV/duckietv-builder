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
            /**
             for arch in ${architechture[@]}; do
                    cd ${WORKING_DIR}
                    cp -r ${CURRENT_DIR}/resources/windows/app.nsi ${WORKING_DIR}
                    cp -r $(get_value_by_key windowsIconPath) ${WORKING_DIR}/WORK_DIR/win-${arch}/latest-git/
                    # Replce paths and vars in nsi script
                    replace \
                        NWJS_APP_REPLACE_APPNAME "$(get_value_by_key name)" \
                        NWJS_APP_REPLACE_DESCRIPTION "$(get_value_by_key description)" \
                        NWJS_APP_REPLACE_LICENSE $(get_value_by_key license) \
                        NWJS_APP_REPLACE_VERSION $(get_value_by_key version) \
                        NWJS_APP_REPLACE_EXE_NAME $(get_value_by_key name)-$(get_value_by_key version)-Windows-${arch}.exe \
                        NWJS_APP_REPLACE_INC_FILE_1 ${WORKING_DIR}/WORK_DIR/win-${arch}/latest-git/\*.\* \
                        NWJS_APP_REPLACE_ICO_FILE_NAME $(basename $(get_value_by_key windowsIconPath)) \
                        NWJS_APP_REPLACE_INC_FILE_ICO $(get_value_by_key windowsIconPath) -- app.nsi;
                    makensis app.nsi
                    # Clean a bit
                    rm -rf ${WORKING_DIR}/$(get_value_by_key name).nsi;
                    mv ${WORKING_DIR}/$(get_value_by_key name)-$(get_value_by_key version)-Windows-${arch}.exe ${RELEASE_DIR}
                    printf "\nDone Windows ${arch}\n"
                done
            */
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