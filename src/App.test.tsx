import React from "react";
import { waitFor, render, fireEvent } from "@testing-library/react";

import App from "./App";
import * as api from "./api";

// https://github.com/ant-design/ant-design/issues/21080#issuecomment-643196078
jest.mock("antd", () => {
  const antd = jest.requireActual("antd");

  const Select = ({ children, onChange, ...props }: any) => {
    return (
      <select {...props} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    );
  };

  Select.Option = ({ children, ...otherProps }: any) => {
    return <option {...otherProps}>{children}</option>;
  };

  return {
    ...antd,
    Select,
  };
});

const successResponse = {
  events: [
    {
      id: "id",
      name: "event name",
      start_datetime: "2020-09-11T22:43:08.207Z",
    },
  ],
  pagination: {
    next_page: "?pagination_last_id=id",
  },
};

describe("App", () => {
  it("should render placeholder", () => {
    const r = render(<App />);
    const placeholder = r.getByText("No Data");
    expect(placeholder).toBeInTheDocument();
  });

  it("should load and paginate events", async () => {
    const loadEventsMock = jest.spyOn(api, "loadEvents");
    loadEventsMock.mockResolvedValue(successResponse);

    const r = render(<App />);

    const select = r.getByTestId("type-select");
    fireEvent.change(select, "new type");
    expect(select).toBeDisabled();

    await waitFor(() => {});

    expect(loadEventsMock).toHaveBeenLastCalledWith({
      limit: 20,
      sort: "display_order,start_datetime,id",
      state: "upcoming",
      type: "american_football_match",
    });

    const event = r.getByText(successResponse.events[0].name);
    expect(event).toBeInTheDocument();

    // paginate
    const loadMore = r.getByTestId("load-more");
    expect(loadMore).toBeInTheDocument();

    loadEventsMock.mockResolvedValue({
      events: [
        {
          ...successResponse.events[0],
          id: "id2",
        },
      ],
      pagination: {
        next_page: null,
      },
    });
    fireEvent.click(loadMore);

    await waitFor(() => {});

    const rows = r.getAllByText(successResponse.events[0].name);
    expect(rows).toHaveLength(2);
    expect(loadEventsMock).toHaveBeenLastCalledWith({
      pagination_last_id: "id",
    });
    expect(r.queryByTestId("load-more")).toBeNull();
  });

  it("should show error & handle retry", async () => {
    const loadEventsMock = jest.spyOn(api, "loadEvents");
    loadEventsMock.mockRejectedValue(new Error("*"));

    const r = render(<App />);

    const select = r.getByTestId("type-select");
    fireEvent.change(select, "new type");
    expect(select).toBeDisabled();

    await waitFor(() => {});

    expect(loadEventsMock).toHaveBeenLastCalledWith({
      limit: 20,
      sort: "display_order,start_datetime,id",
      state: "upcoming",
      type: "american_football_match",
    });

    // retry
    loadEventsMock.mockResolvedValue(successResponse);
    const retry = r.getByTestId("retry");
    fireEvent.click(retry);
    expect(retry).toBeDisabled();

    await waitFor(() => {});

    const event = r.getByText(successResponse.events[0].name);
    expect(event).toBeInTheDocument();
    expect(r.queryByTestId("retry")).toBeNull();
  });
});
