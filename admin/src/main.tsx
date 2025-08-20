import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Routes } from "./routes.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { persistor, store } from "./redux/store/store.ts";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import { PersistGate } from "redux-persist/integration/react";

const router = createBrowserRouter([...Routes]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <RouterProvider router={router} />
        <ToastContainer />
      </PersistGate>
    </Provider>
  </StrictMode>,
);
