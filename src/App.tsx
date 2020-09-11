import React, { useReducer, useCallback, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Result, Button, Row, Table, Select } from "antd";
import qs from "qs";

import {
  Params,
  Response as EventsResponse,
  Event,
  types,
  loadEvents,
} from "./api";
import { assertIsDefined } from "./util";

import * as classes from "./App.module.scss";

type Action =
  | { type: "started"; payload: Params }
  | {
      type: "success";
      payload: EventsResponse;
    }
  | { type: "error"; payload: Error | EventsResponse; error: true };

type State = {
  events: Array<Event> | null;
  next: string | null;
  params: Params | null;
  error: Error | EventsResponse | null;
  progress: boolean;
};

const defaultParams: Params = {
  state: "upcoming",
  type: types[0],
  sort: "display_order,start_datetime,id",
  limit: 20,
};

const initialState: State = {
  events: null,
  next: null,
  params: null,
  error: null,
  progress: false,
};

function eventsReducer(state: State, action: Action): State {
  let isPagination;

  switch (action.type) {
    case "started":
      isPagination = !!action.payload.pagination_last_id;
      return {
        ...state,
        events: isPagination ? state.events : [],
        next: isPagination ? state.next : null,
        params: action.payload,
        progress: true,
      };
    case "success":
      assertIsDefined(state.params);

      isPagination = !!state.params.pagination_last_id;
      const oldEvents = isPagination ? state.events : [];
      assertIsDefined(oldEvents);

      return {
        ...state,
        params: state.params,
        progress: false,
        events: oldEvents.concat(action.payload.events),
        next: action.payload.pagination.next_page,
        error: null,
      };
    case "error":
      assertIsDefined(state.params);
      return {
        ...state,
        params: state.params,
        progress: false,
        error: action.payload,
      };
  }
}

function App() {
  const [data, dispatch] = useReducer(eventsReducer, initialState);

  const dataSource = useMemo(() => {
    if (!data.events) return [];

    return data.events.map((event) => ({
      key: event.id,
      name: event.name,
      date: event.start_datetime,
    }));
  }, [data.events]);

  const fetchEvents = useCallback(
    (params: Params) => {
      dispatch({ type: "started", payload: params });

      loadEvents(params)
        .then((payload) => {
          if ("error_type" in payload) {
            throw new Error(payload.error_type);
          } else {
            dispatch({ type: "success", payload });
          }
        })
        .catch((error) => {
          dispatch({ type: "error", payload: error, error: true });
        });
    },
    [dispatch]
  );

  const onChangeType = useCallback(
    (type: string) => fetchEvents({ ...defaultParams, type }),
    [fetchEvents]
  );
  const onRetry = useCallback(() => {
    assertIsDefined(data.params);
    fetchEvents(data.params);
  }, [data.params, fetchEvents]);
  const onLoadMore = useCallback(() => {
    assertIsDefined(data.next);
    const query = data.next.replace("?", "");
    const params = (qs.parse(query) as unknown) as Params;
    fetchEvents(params);
  }, [data.next, fetchEvents]);

  return (
    <Row>
      <Select
        autoFocus
        data-testid="type-select"
        disabled={data.progress}
        value={data.params?.type}
        onChange={onChangeType}
        placeholder="Plese select event type"
        className={classes.fullWidth}
      >
        {types.map((t) => (
          <Select.Option key={t} value={t}>
            {t}
          </Select.Option>
        ))}
      </Select>
      {data.error !== null && (
        <Result
          status="error"
          subTitle="Sorry, failed to load event."
          className={classes.fullWidth}
          extra={
            <Button
              data-testid="retry"
              disabled={data.progress}
              type="primary"
              onClick={onRetry}
            >
              Retry
            </Button>
          }
        />
      )}
      {data.error === null && (
        <>
          <Table
            className={classes.fullWidth}
            dataSource={dataSource}
            pagination={false}
            columns={[
              {
                title: "Event name",
                dataIndex: "name",
              },
              {
                title: "Start Date",
                dataIndex: "date",
                render: (date) => format(parseISO(date), "PPPp"),
              },
            ]}
          />
          {!!data.next && (
            <Button
              data-testid="load-more"
              disabled={data.progress}
              type="primary"
              onClick={onLoadMore}
              className={classes.loadMore}
            >
              Load more
            </Button>
          )}
        </>
      )}
    </Row>
  );
}

export default App;
