
import { Routes as ReactRouterRoutes, Route } from "react-router-dom";
import { publicRoutes, privateRoutes } from "./routes";

export function Routes() {
  return (
    <ReactRouterRoutes>
      {publicRoutes.map((route, index) => (
        <Route key={index} path={route.path} element={route.element} />
      ))}
      {privateRoutes.map((route, index) => (
        <Route key={`private-${index}`} path={route.path} element={route.element} />
      ))}
    </ReactRouterRoutes>
  );
}
