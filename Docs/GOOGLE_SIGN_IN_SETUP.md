# Google Sign-In Setup

1. Create a Google OAuth 2.0 **Web application** client in the Google Cloud Console and configure its authorized JavaScript origins for the site (for local development, add `http://localhost:4000` and `http://localhost:4001`).
2. Set the client ID in the backend environment as `GOOGLE_CLIENT_ID`.
3. Restart the Rivoshoppa server and open `seller-login.html`.

The client ID is public and is returned to the browser for Google Identity Services. ID tokens are verified by the server against Google's token information endpoint. Seller accounts must already exist and be approved by an administrator.