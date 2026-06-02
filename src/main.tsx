import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import App from "./App";
import CreateContextPro from "./hooks/CreateContextPro";
import "./i18n";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <CreateContextPro>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={2800}
          hideProgressBar={false}
          closeButton={false}
          newestOnTop
          pauseOnFocusLoss={false}
          toastClassName="fs-toast"
          progressClassName="fs-toast-progress"
        />
      </CreateContextPro>
    </BrowserRouter>
  </QueryClientProvider>,
);
