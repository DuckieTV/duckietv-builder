require("shelljs/global");
var shared = require("./shared");


module.exports = {
    /**
     * Open a browser that performs an oauth access token request
     * This generates a new 'offline' oauth token.
     * Took a while to get right because google apparently reissues the already existing token
     * when you have requested a token other than 'offline' earlier.
     * You *HAVE* to de-auth the existing token you have in google acounts when the refresh_tokens keep expiring!
     */
    getApprovalPromptURL: function() {
        var credentials = shared.getCredentials();
        return 'https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=' + credentials.CHROME_WEBSTORE_CLIENT_ID + '&redirect_uri=urn:ietf:wg:oauth:2.0:oob&access_type=offline&approval_prompt=force&state=' + new Date().getTime();
    },
    generateInitialToken: function() {
        var credentials = shared.getCredentials();
        var response = JSON.parse(exec('curl "https://accounts.google.com/o/oauth2/token" -d "client_secret=' + credentials.CHROME_WEBSTORE_CLIENT_SECRET + '&client_id=' + credentials.CHROME_WEBSTORE_CLIENT_ID + '&code=' + code.trim() + '&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob"'));

        if (response.error) {
            process.exit();
        }

        credentials.CHROME_WEBSTORE_REFRESH_TOKEN = response.refresh_token;
        credentials.CHROME_WEBSTORE_CODE = response.access_token;
        credentials.CHROME_WEBSTORE_REFRESH_TOKEN_MAX_AGE = Math.floor(new Date().getTime() / 1000) + response.expires_in;

        shared.putCredentials(credentials);
        return response;
    },
    refreshTokenIfNeeded: function() {
        var credentials = shared.getCredentials();

        if (Math.floor(new Date().getTime() / 1000) > credentials.CHROME_WEBSTORE_REFRESH_TOKEN_MAX_AGE) {
            var response = JSON.parse(exec('curl "https://accounts.google.com/o/oauth2/token" -d "client_id=' + credentials.CHROME_WEBSTORE_CLIENT_ID + '&client_secret=' + credentials.CHROME_WEBSTORE_CLIENT_SECRET + '&refresh_token=' + credentials.CHROME_WEBSTORE_REFRESH_TOKEN.trim() + '&grant_type=refresh_token"'));
            if (response.error) {
                process.exit();
            }
            credentials.CHROME_WEBSTORE_CODE = response.access_token;
            credentials.CHROME_WEBSTORE_REFRESH_TOKEN_MAX_AGE = Math.floor(new Date().getTime() / 1000) + response.expires_in;
            shared.putCredentials(credentials);
            echo("Oauth access token refreshed.");
        }
    },
    /**
     * Perform oAuth authenticated PUT request to upload new zipfile to web store
     */
    uploadBinary: function(APP_ID, zipFile) {
        return exec(['curl',
            '-H "Authorization: Bearer ' + shared.getCredentials().CHROME_WEBSTORE_CODE + '"',
            '-H "x-goog-api-version: 2"',
            '-X PUT -T ' + zipFile,
            'https://www.googleapis.com/upload/chromewebstore/v1.1/items/' + APP_ID
        ].join(" "));
    },
    /**
     * Publish the uploaded draft
     */
    publishDraft: function(APP_ID) {
        return exec(['curl',
            '-H "Authorization: Bearer ' + shared.getCredentials().CHROME_WEBSTORE_CODE + '"',
            '-H "x-goog-api-version: 2"',
            '-H "Content-Type: application/json"',
            '-X POST',
            "-d '{\"target\": \"default\"}'",
            'https://www.googleapis.com/chromewebstore/v1.1/items/' + APP_ID + '/publish'
        ].join(" "));
    }
}