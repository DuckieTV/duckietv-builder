require('shelljs/global');
var shared = require('../shared'),
    util = require('../util');


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
            /*
    for arch in ${architechture[@]}; do
        cd ${WORKING_DIR}
        cp -r ${CURRENT_DIR}/resources/linux/PKGNAME-VERSION-Linux ${WORKING_DIR}/WORK_DIR/$(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}
        PKG_MK_DIR=${BUILD_DIR}/TMP/WORK_DIR/$(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}
        DEB_MK_DIR=${BUILD_DIR}/TMP/WORK_DIR/$(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}-deb
        mv ${PKG_MK_DIR}/PKGNAME ${PKG_MK_DIR}/$(get_value_by_key name)
        mv ${PKG_MK_DIR}/$(get_value_by_key name)/PKGNAME ${PKG_MK_DIR}/$(get_value_by_key name)/$(get_value_by_key name)
        # replaces
        chmod a+rw \
            ${PKG_MK_DIR}/README \
            ${PKG_MK_DIR}/share/applications/$(get_value_by_key name).desktop \
            ${PKG_MK_DIR}/share/menu/$(get_value_by_key name); 

        if [[ "${arch}" = "x64" ]]; then
            DEB_ARCH="amd64"
        else
            DEB_ARCH="i386"
        fi            
        replace -v \
            PKGNAME "$(get_value_by_key name)" \
            PKGDESCRIPTION "$(get_value_by_key description)" \
            PKGVERSION $(get_value_by_key version) \
            PKGARCHITECTURE "${DEB_ARCH}" \
            -- ${PKG_MK_DIR}/setup \
            ${PKG_MK_DIR}/README \
            ${PKG_MK_DIR}/DEBIAN/control \
            ${PKG_MK_DIR}/share/applications/$(get_value_by_key name).desktop \
            ${PKG_MK_DIR}/share/menu/$(get_value_by_key name); 
        # app file
        cp -r ${BUILD_DIR}/TMP/WORK_DIR/linux-${arch}/latest-git/* ${PKG_MK_DIR}/$(get_value_by_key name)
        #make deb 
        mkdir -p ${DEB_MK_DIR}/opt/
        cp -R ${PKG_MK_DIR}/* ${DEB_MK_DIR}
        mv ${DEB_MK_DIR}/$(get_value_by_key name) ${DEB_MK_DIR}/opt/
        mkdir -p ${DEB_MK_DIR}/usr/bin
        mv ${DEB_MK_DIR}/share ${DEB_MK_DIR}/usr/
        cat << create_bin > ${DEB_MK_DIR}/usr/bin/$(get_value_by_key name)
#!/bin/sh
exec /opt/$(get_value_by_key name)/$(get_value_by_key name) "\$@"
create_bin

        chmod 0644 ${DEB_MK_DIR}/usr/share/{applications/$(get_value_by_key name).desktop,pixmaps/$(get_value_by_key name).xpm,menu/$(get_value_by_key name)}
        chmod -R 0755 ${DEB_MK_DIR}/opt/$(get_value_by_key name)/* ${DEB_MK_DIR}/usr/bin/$(get_value_by_key name)
        debtool --build --md5sums ${DEB_MK_DIR}
        # make the tar
        echo "tar -C ${BUILD_DIR}/TMP/WORK_DIR/ -czf $(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}.tar.gz $(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}"
        tar -C ${BUILD_DIR}/TMP/WORK_DIR/ -czf $(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}.tar.gz $(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}
        mv ${WORKING_DIR}/$(get_value_by_key name)-$(get_value_by_key version)-Linux-${arch}.tar.gz ${RELEASE_DIR}
        printf "\nDone Linux ${arch}\n"
    done;*/

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