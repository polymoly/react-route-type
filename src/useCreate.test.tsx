/*
   Copyright Avero, LLC
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { route } from "./route";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import React from "react";

jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useHistory: () => ({
    location: {
      pathname: "",
    },
  }),
}));

describe("Hooks", () => {
  function ResponseComp(props: any) {
    return <p {...props} />;
  }

  function RouteContainer({
    initialPath,
    template,
    Comp,
  }: {
    initialPath: string;
    template: string;
    Comp: any;
  }) {
    const [pathname, search] = initialPath.split("?");
    return (
      <MemoryRouter
        initialEntries={[
          {
            pathname: pathname,
            search: "?" + search,
          },
        ]}>
        <Routes>
          <Route path={template} element={<Comp />} />
          <Route path={"/"} element={<Navigate to={initialPath} />} />
        </Routes>
      </MemoryRouter>
    );
  }

  test("map of routes", () => {
    const homeRoute = route([":lang", "home", ":id"], {
      query: { search: "", withDefault: "default" },
      title: "Home",
    }).createNestedRoutes((parent) => ({
      dashboard: parent.route("dashboard").createNestedRoutes((parent) => ({
        userDashboard: parent.route("userDashboard"),
      })),
    }));

    function CompParent() {
      const create = homeRoute.dashboard.root.useCreate(["lang", "id"]);
      const { id } = homeRoute.dashboard.root.useParams();
      return (
        <ResponseComp
          data-testid='response'
          data-template={homeRoute.dashboard.root.template()}
          data-id={id}
          data-withqueryparam={create({
            query: { type: "type1" },
          })}
          data-withoutqueryparam={create()}
        />
      );
    }

    const testRenderer = render(
      <RouteContainer
        template={homeRoute.root.template()}
        initialPath={homeRoute.root.create({
          id: "12345",
          lang: "fa",
          query: { search: "s" },
        })}
        Comp={CompParent}
      />
    );

    const json = testRenderer.getByTestId("response");

    expect(json.getAttribute("data-id")).toBe("12345");
    expect(json.getAttribute("data-withoutqueryparam")).toBe(
      "/fa/home/12345/dashboard"
    );
    expect(json.getAttribute("data-withqueryparam")).toBe(
      "/fa/home/12345/dashboard?type=type1"
    );
  });
});
