require("shelljs/global");
var shared = require("./shared");


module.exports = {

    generateInitialToken: function(code) {
        var credentials = shared.getCredentials();
        var response = JSON.parse(exec('curl "https://accounts.google.com/o/oauth2/token" -d "client_secret=' + credentials.CHROME_WEBSTORE_CLIENT_SECRET + '&client_id=' + credentials.CHROME_WEBSTORE_CLIENT_ID + '&code=' + code.trim() + '&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob"'));

        if (response.error) {
            process.exit();
        }

        credentials.CHROME_WEBSTORE_REFRESH_TOKEN = response.refresh_token;
        credentials.CHROME_WEBSTORE_ACCESS_TOKEN = response.access_token
        credentials.CHROME_WEBSTORE_CODE = response.access_token;
        credentials.CHROME_WEBSTORE_REFRESH_TOKEN_MAX_AGE = Math.floor(new Date().getTime() / 1000) + response.expires_in;
        shared.putCredentials(credentials);
        return response;
    },

    refreshTokenIfNeeded: function() {
        var credentials = shared.getCredentials();

        var info = JSON.parse(exec('curl "https://www.googleapis.com/oauth2/v1/tokeninfo" -d "access_token=' + credentials.CHROME_WEBSTORE_ACCESS_TOKEN + '"'));

        if (Math.floor(new Date().getTime() / 1000) > credentials.CHROME_WEBSTORE_REFRESH_TOKEN_MAX_AGE) {
            var response = JSON.parse(exec('curl "https://www.googleapis.com/oauth2/token" -d "client_id=' + credentials.CHROME_WEBSTORE_CLIENT_ID + '&client_secret=' + credentials.CHROME_WEBSTORE_CLIENT_SECRET + '&refresh_token=' + credentials.CHROME_WEBSTORE_REFRESH_TOKEN.trim() + '&grant_type=refresh_token"'));
            if (response.error) {
                process.exit();
            }
            credentials.CHROME_WEBSTORE_REFRESH_TOKEN = response.refresh_token;
            credentials.CHROME_WEBSTORE_CODE = response.access_token;
            credentials.CHROME_WEBSTORE_REFRESH_TOKEN_MAX_AGE = Math.floor(new Date().getTime() / 1000) + response.expires_in;
            shared.putCredentials(credentials);
            echo("Oauth access token refreshed.");
        }
    }
}