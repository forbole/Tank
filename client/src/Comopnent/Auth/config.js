const AUTH_SERVER = 'https://auth.oasiscloud.io';

const config = {
  authority: AUTH_SERVER,
  metadata: {
    issuer: AUTH_SERVER,
    authorization_endpoint: AUTH_SERVER + '/oauth/authorize',
    jwks_uri: AUTH_SERVER + '/oauth/keys',
    token_endpoint: AUTH_SERVER + '/oauth/token',
  },
  client_id: 'c3405436-eeb7-430e-81e3-fa997ef9e7b5',
  redirect_uri: 'http://139.162.108.149:3000/',
  response_type: 'code',
  scope: 'openid',
  filterProtocolClaims: false,
  loadUserInfo: false,
  extraQueryParams: {
    audience: 'https://api.oasislabs.com/parcel',
  },
};
export default config