require('shelljs/global');

var BASE_URL = "https://dl.nwjs.io/v{{VERSION}}/nwjs{{DEBUG}}-v{{VERSION}}-{{PLATFORM}}-{{ARCHITECTURE}}.{{PACKAGE_FORMAT}}",
    FLAVOUR = "nwjs{{DEBUG}}-v{{VERSION}}-{{PLATFORM}}-{{ARCHITECTURE}}",
    VERSION = '0.20.0',
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
    };

var NWJS_DOWNLOAD_DIR = require('os').homedir() + "/nwjs_download_cache";


function buildUrl() {
    return BASE_URL
        .replace("{{VERSION}}", version)
        .replace("{{DEBUG}}", DEBUG ? "-sdk" : "")
        .replace("{{PLATFORM}}", PLATFORM)
        .replace("{{ARCHITECTURE}}", ARCHITECTURE)
        .replace("{{PACKAGE_FORMAT}}", PACKAGE_FORMATS[PLATFORM]);
}

function getFlavour() {
    return FLAVOUR
        .replace("{{VERSION}}", version)
        .replace("{{DEBUG}}", DEBUG ? "-sdk" : "")
        .replace("{{PLATFORM}}", PLATFORM)
        .replace("{{ARCHITECTURE}}", ARCHITECTURE);
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

    setArchitecture = function(architecture) {
        ARCHITECTURE = architecture;
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
        var flavour = getFlavour(),
            extracted = test('-d', flavour);

        if (!extracted) {
            echo(flavour + " is not yet extracted.. extracting.");
            pushd(NWJS_DOWNLOAD_DIR);
            switch (PACKAGE_FORMATS[PLATFORM]) {
                case 'tar.gz':
                    exec("tar -zxf ./" + flavour + ".tar.gz");
                    break;
                case 'zip':
                    exec("unzip ./" + flavour + ".zip");
                    break;
            }
            popd();
        }
        return NWJS_DOWNLOAD_DIR + "/" + flavour;
    }
}

module.exports = public;