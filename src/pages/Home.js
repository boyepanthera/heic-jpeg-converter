import { Navigate } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { useAuthenticator } from "@aws-amplify/ui-react";
import awsExports from "../aws-exports";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(awsExports);

function Home() {
  const { route } = useAuthenticator((context) => [context.route]);

  console.log("route ", route);
  if (route === "authenticated") {
    return <Navigate to="/dashboard" replace={true} />;
  }

  return (
    <>
      <h1>Welcome to HEIC Converter</h1>
      <a href="/dashboard">
        <button>Sign In</button> <button>Sign Up</button>
      </a>
    </>
  );
}

export default Home;
