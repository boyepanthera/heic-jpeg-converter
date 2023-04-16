import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Account from "./pages/account";
import Gallery from "./pages/gallery";
import Home from "./pages/Home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: <App />,
  },
  {
    path: "/account",
    element: <Account />,
  },
  {
    path: "/gallery",
    element: <Gallery />,
  },
]);

export default router;
