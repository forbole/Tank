
const PARCEL_AUTH_URL = process.env.PARCEL_AUTH_URL ?? 'https://auth.oasislabs.com';

const config = {
  authority: PARCEL_AUTH_URL,
  // Replace with your app's front-end client ID.
  client_id: 'CD4EYzTZCR8EsayjM3CGNib',
  redirect_uri: 'https://tank.forbole.com/posts',
  response_type: 'code',
  scope: 'openid',
  filterProtocolClaims: false,
  loadUserInfo: false,
  extraQueryParams: {
    audience: 'https://api.oasislabs.com/parcel',
  },
  extraTokenParams: {
    audience: 'https://api.oasislabs.com/parcel',
  },
};

export default config