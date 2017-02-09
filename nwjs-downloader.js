require('shelljs/global');

var BASE_URL = "https://dl.nwjs.io/v{{VERSION}}/nwjs{{DEBUG}}-v{{VERSION}}-{{PLATFORM}}-{{ARCHITECTURE}}.{{PACKAGE_FORMAT}}",
    FLAVOUR = "nwjs{{DEBUG}}-v{{VERSION}}-{{PLATFORM}}-{{ARCHITECTURE}}",
    VERSION = '0.20.1',
    DEBUG = false,
    PLATFORMS = ['linux', 'osx', 'win'],
    ARCHITECTURES = {
        'linux': ['ia32', 'x64'],
        'osx': ['x64'],
        'win': ['ia32', 'x64']
    },
    PACKAGE_FORMATS = {
        'linux': 'tar.gz',
        'osx': 'zip',
        'win': 'zip'
    },
    NWJS_DOWNLOAD_DIR = require('os').homedir() + "/nwjs_download_cache";


function buildUrl() {
    return BASE_URL
        .replace(/{{VERSION}}/g, VERSION)
        .replace(/{{DEBUG}}/g, DEBUG ? "-sdk" : "")
        .replace(/{{PLATFORM}}/g, PLATFORM)
        .replace(/{{ARCHITECTURE}}/g, ARCHITECTURE)
        .replace(/{{PACKAGE_FORMAT}}/g, PACKAGE_FORMATS[PLATFORM]);
}

function getFlavour() {
    return FLAVOUR
        .replace(/{{VERSION}}/g, VERSION)
        .replace(/{{DEBUG}}/g, DEBUG ? "-sdk" : "")
        .replace(/{{PLATFORM}}/g, PLATFORM)
        .replace(/{{ARCHITECTURE}}/g, ARCHITECTURE);
}

function prepareDownloadDir() {
    if (!test('-d', NWJS_DOWNLOAD_DIR)) {
        mkdir(NWJS_DOWNLOAD_DIR);
    }
}


var public = {

    setVersion: function(version) {
        NWJS_VERSION = version;
        return public;
    },

    setDebug: function(debug) {
        DEBUG = debug;
        return public;
    },

    setPlatform: function(platform) {
        PLATFORM = platform;
        return public;
    },

    setArchitecture: function(architecture) {
        ARCHITECTURE = architecture == 'x32' ? 'ia32' : architecture;
        return public;
    },

    download: function() {
        prepareDownloadDir();

        var flavour = getFlavour();
        var downloaded = test('-f', NWJS_DOWNLOAD_DIR + "/" + flavour + "." + PACKAGE_FORMATS[PLATFORM]);

        if (!downloaded) {
            pushd(NWJS_DOWNLOAD_DIR);
            var url = buildUrl();
            echo(flavour + " not yet found. Downloading from " + url);
            exec("curl -O " + url);
            popd();
        }
        return public;
    },

    extract: function() {
        var flavour = getFlavour();
        pushd(NWJS_DOWNLOAD_DIR);
        extracted = test('-d', flavour);

        if (!extracted) {
            echo(flavour + " is not yet extracted.. extracting.");
            switch (PACKAGE_FORMATS[PLATFORM]) {
                case 'tar.gz':
                    exec("tar -zxf ./" + flavour + ".tar.gz");
                    break;
                case 'zip':
                    exec("unzip ./" + flavour + ".zip");
                    break;
            }
        }
        popd();
        echo("Extracted path for " + flavour + ": " + NWJS_DOWNLOAD_DIR + "/" + flavour);
        return NWJS_DOWNLOAD_DIR + "/" + flavour;
    },

    get: function() {
        return public.download().extract();
    }
}

module.exports = public;
