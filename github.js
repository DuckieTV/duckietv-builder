require('shelljs/global');
var shared = require('./shared.js'),
    dateFormat = require('dateformat'),
    request = require('superagent'),
    credentials = shared.getCredentials();

var ZIP_URL = 'https://github.com/SchizoDuckie/DuckieTV/archive/angular.zip';
var PRODUCTION_REPO = 'SchizoDuckie/DuckieTV';
var NIGHTLY_REPO = 'DuckieTV/Nightlies';

var exports = {

    downloadFromZip: function() {
        echo("Downloading: " + ZIP_URL);
        exec("curl -L -O " + ZIP_URL);
        echo("Extracting");
        exec("unzip -q angular.zip");
        mv("DuckieTV-angular/*", ".");
        rm("-rf", "DuckieTV-angular");
        rm("angular.zip");
    },

    downloadRepo: function() {
        exec("git clone git@github.com:SchizoDuckie/DuckieTV .");
    },

    /**
     * Push a built upload to a github tag
     * @param string remote github remote to push to
     * @param tag github_tag to upload to
     * @param string filename file to upload
     */
    publishFileToGithubTag: function(repo, github_release_id, filename) {
        echo("Publishing " + filename + " to github tag " + github_release_id + " on " + repo);

        var prettyName = require('path').basename(filename);
        var url = ["https://uploads.github.com/repos/", repo, "/releases/", github_release_id,
            "/assets?name=", prettyName,
            "&access_token=", credentials.GITHUB_API_KEY
        ].join('');

        exec(['curl',
            '-H "Authorization:token ' + credentials.GITHUB_API_KEY + '"',
            '-H "Content-Type:application/octet-stream"',
            '--data-binary @' + filename,
            "'" + url + "'"
        ].join(' '));


    },
    createNightlyTag: function(SOURCES_DIR, tag) {
        pushd(SOURCES_DIR);
        try {
            exec("git remote add nightly git@github.com:DuckieTV/Nightlies.git");
        } catch (e) {}
        exec("git add .");
        try {
            exec('git commit -m "Auto-Build: ' + tag + '"');
        } catch (e) {}
        try {
            exec('git tag -am "' + tag + '" "' + tag + '"');
        } catch (e) {}
        exec("git push nightly angular:master -f --tags");
        popd();
    },
    /**
     * Determine the parent commit hash for the last created tag
     */
    determineLastTagHash: function(nightly) {
        var repository = nightly ? NIGHTLY_REPO : PRODUCTION_REPO;
        return request
            .get('https://api.github.com/repos/' + repository + '/releases')
            .query({
                'access_token': credentials.GITHUB_API_KEY
            })
            .then(function(response) {
                return response.body[0].tag_name;
            })
            .then(function(tag_name) {
                echo("Tag name: " + tag_name);
                return request
                    .get('https://api.github.com/repos/' + repository + '/commits/' + tag_name)
                    .query({
                        'access_token': credentials.GITHUB_API_KEY
                    })
                    .then(function(response) {
                        return response.body.parents[0].sha
                    }, function(error) {
                        echo(error);
                    });
            });
    },


    /**
     * Fetch a shortened commit log between the previous release and the current master
     */
    getChangeLogSince: function(SOURCES_DIR, hash) {
        pushd(SOURCES_DIR);
        var changelog = exec("git log " + hash + '..HEAD --oneline');
        popd();
        return changelog.trim().split("\n").join('\n - ');
    },
    /**
     * create a new release on the nightly repo with the changelog
     * @return Promise with release details.
     */
    createNightlyRelease: function(tag, changelog) {
        var repository = NIGHTLY_REPO;

        return request
            .post('https://api.github.com/repos/' + repository + '/releases')
            .query({
                'access_token': credentials.GITHUB_API_KEY
            })
            .send({
                "tag_name": tag,
                "target_commitish": "master",
                "name": "Nightly release for " + dateFormat("dd-mm-yyyy"),
                "body": "DuckieTV nightly release for " + dateFormat(new Date()) + ".\n**Changelog:**\n - " + changelog,
                "draft": false,
                "prerelease": true
            })
            .then(function(response) {
                echo("Release created \n");
                return response.body.id;
            });
    }
}

module.exports = exports;