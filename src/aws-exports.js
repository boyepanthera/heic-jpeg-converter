const awsExports = {
    Auth : {
    userNameAlias : "email",
    userPoolId : process.env.REACT_APP_USER_POOL_ID,
    region: process.env.REACT_APP_AWS_REGION,
    userPoolWebClientId : process.env.REACT_APP_AWS_WEB_CLIENT_ID
  }}


  export default awsExports