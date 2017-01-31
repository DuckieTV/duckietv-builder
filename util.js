require('shelljs/global');
var shared = require('./shared');

module.exports = {

    /**
     * Generic output build filename builder
     */
    buildFileName: function(input, architecture) {
        return input.replace('%VERSION%', shared.getVersion()).replace('%ARCHITECTURE%', architecture);
    },


    zipBinary: function(build, zipfilename, filemask) {
        echo("Building zip: " + zipfilename);
        pushd(shared.BUILD_DIR + "/" + build);
        exec('zip -q -r ' + shared.BINARY_OUTPUT_DIR + "/" + zipfilename + " " + (filemask || '*'));
        echo("Done. " + zipfilename);
        popd();
    },

    tgzBinary: function(build, tgzfilename) {
        echo("Building tgz: " + tgzfilename);
        pushd(shared.BUILD_DIR + "/" + build);
        exec("tar -czf " + shared.BINARY_OUTPUT_DIR + "/" + tgzfilename + " " + '*');
        echo("Done. " + tgzfilename);
        popd();
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