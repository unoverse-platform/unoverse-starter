import { createElement as h } from "react";
import { BrowserRouter } from "react-router-dom";
import { UserProvider, GravityAuthProvider } from "@gravity-platform/gravity-client";
import { AppRoutes } from "./routes";
import { useWidget } from "./hooks/useWidget";
import { ToggleChatButton } from "./components/ToggleChatButton";
import { X } from "lucide-react";

const authConfig = {
  issuer: import.meta.env.VITE_AUTH_ISSUER,
  clientId: import.meta.env.VITE_AUTH_CLIENT_ID,
  audience: import.meta.env.VITE_AUTH_AUDIENCE,
};

function SlidingPanel({ children }) {
  const { isOpen, open, close } = useWidget();

  return h(
    "div",
    { className: "h-full" },
    // Sliding panel
    h(
      "div",
      {
        className: `fixed inset-y-0 right-0 w-[65vw] bg-white shadow-2xl transform transition-all duration-300 ease-in-out z-[9999] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`,
      },
      // Close button
      h(
        "button",
        {
          onClick: close,
          className: "absolute top-4 left-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors",
        },
        h(X, { className: "h-6 w-6 text-gray-600" }),
      ),
      // Content
      h("div", { className: "h-full overflow-y-auto" }, children),
    ),
    // Toggle button (shown when closed)
    !isOpen && h(ToggleChatButton, { onClick: open }),
  );
}

export function App() {
  // Only wrap with auth if configured
  const hasAuth = authConfig.issuer && authConfig.clientId;

  const content = h(SlidingPanel, null, h(UserProvider, null, h(BrowserRouter, null, h(AppRoutes))));

  if (hasAuth) {
    return h(GravityAuthProvider, { config: authConfig }, content);
  }

  return content;
}
