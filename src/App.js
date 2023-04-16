import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import awsExports from "./aws-exports";

Amplify.configure(awsExports);

function App({ signOut, user }) {
  return (
    <>
      <h1>
        Hello {user?.attributes?.email} , {user.username}
      </h1>
      <a href="/account">
        <button>Go To converter</button>
      </a>
      <button onClick={signOut}>Sign out</button>
    </>
  );
}

export default withAuthenticator(App);
