require('shelljs/global');
var shared = require('./shared.js'),
    dateFormat = require('dateformat');

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
        var command = 'curl -# -XPOST -H "Authorization:token %GITHUB_API_KEY%" -H "Content-Type:application/octet-stream" --data-binary @"%FILENAME%" "https://uploads.github.com/repos/%OWNER_REPO%/releases/%GITHUB_RELEASE_ID%/assets?name=%UPLOAD_PRETTY_NAME%"'
            .replace("%GITHUB_API_KEY%", shared.getCredentials().GITHUB_API_KEY)
            .replace("%OWNER_REPO", repo)
            .replace("%FILENAME%", filename)
            .replace("%GITHUB_RELEASE_ID%", github_release_id)
            .replace("%UPLOAD_PRETTY_NAME%", filename.split('/').pop());
        echo("Publishing " + filename + " to github tag " + github_release_id + " on remote" + remote);
        exec(command);

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
        var releases = JSON.parse(exec("curl https://api.github.com/repos/" + repository + "/releases?access_token=" + shared.getCredentials().GITHUB_API_KEY));
        var tagname = releases[1].tag_name;
        var taginfo = JSON.parse(exec("curl https://api.github.com/repos/" + repository + "/commits/tags/" + tagname + "?access_token=" + shared.getCredentials().GITHUB_API_KEY));
        return taginfo.parents[0].sha;
    },
    /**
     * Fetch a shortened commit log between the previous release and the current master
     */
    getChangeLogSince: function(SOURCES_DIR, hash) {
        pushd(SOURCES_DIR);
        var changelog = exec("git log " + hash + '..HEAD --oneline|awk 1 ORS=\'\n - \'')
        popd();
        return changelog;
    },
    /**
     * create a new release on the nightly repo with the changelog
     */
    createNightlyRelease: function(tag, changelog) {
        var repository = NIGHTLY_REPO;
        var credentials = shared.getCredentials();

        var body = {
            "tag_name": tag,
            "target_commitish": "master",
            "name": "Nightly release for " + dateFormat("d-m-Y"),
            "body": "DuckieTV nightly release for " + dateFormat(new Date()) + ".\n**Changelog:**\n - " + changelog,
            "draft": false,
            "prerelease": true
        };


        var request = require('superagent');

        return request
            .post('https://api.github.com/repos/' + repository + '/releases')
            .query({
                'access_token': credentials.GITHUB_API_KEY
            })
            .send(body)
            .then(function(result) {

                echo("Release created \n");
                echo(result);
                return result;
            });
    },

    createGithubRelease: function(since) {
        /**

			DT=$(date +"%m%d%Y")
			DTREV=$(date +"%Y%m%d")
			cd /var/www/Nightlies/
			curl https://api.github.com/repos/DuckieTV/Nightlies/releases\?access_token\=${GITHUB_API_KEY}  -o "/root/current_release.json"
			LASTTAG=`jq -r '.[].tag_name' /root/current_release.json | head -n 2 | tail -n 1`
			curl https://api.github.com/repos/DuckieTV/Nightlies/commits/tags/${LASTTAG} -o '/root/last_tag.json'
			echo curl https://api.github.com/repos/DuckieTV/Nightlies/commits/tags/${LASTTAG} -o '/root/last_tag.json'
			LASTCOMMIT=`jq -r '.parents[0].sha' /root/last_tag.json`
			LOG=`git log "${LASTCOMMIT}"..HEAD --oneline|awk 1 ORS='\\\n - '`
			LOG=${LOG//$'\n'/}
			LOG="$(echo "${LOG}"|tr -d '"')"
			LOG=${LOG%$' - '}
			echo "LOG: ${LOG}, LAST TAG: ${LASTTAG},LAST COMMIT: ${LASTCOMMIT}"
			cd /var/www/Nightlies/build/
			DAT=$(date +"%m-%d-%Y")
			PRETTYDATE=$(date +"%B %d, %Y")
			API=`printf '{"tag_name": "nightly-%s","target_commitish": "master","name": "Nightly release for %s","body": "DuckieTV nightly release for %s.\\\n**Changelog:**\\\n - %s","draft": false, "prerelease": true}' "$DT" "$DAT" "$PRETTYDATE" "$LOG"`
			echo "${API}"
			#create new release
			rm lastest_release.json
			echo "Pushing new release"
			curl https://api.github.com/repos/DuckieTV/Nightlies/releases?access_token=$GITHUB_API_KEY --data "$API" -o "/root/latest_release.json"
			#cat /root/latest_release.json

			ID=$(jq ".id" /root/latest_release.json)

		*/
    }


}

module.exports = exports;