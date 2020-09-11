import React, { useReducer, useCallback, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Result, Button, Row, Table, Select } from "antd";
import qs from "qs";

import { assertIsDefined } from "./util";

import * as classes from "./App.module.scss";

const baseUrl = "/api";

const types = [
  "american_football_match",
  "american_football_outright",
  "baseball_match",
  "baseball_outright",
  "basketball_esports_match",
  "basketball_match",
  "boxing_match",
  "call_of_duty_match",
  "cricket_match",
  "cricket_outright",
  "csgo_match",
  "current_affairs",
  "cycling",
  "darts_match",
  "darts_outright",
  "dota_2_match",
  "football_esports_match",
  "football_match",
  "football_outright",
  "golf_match",
  "golf_outright",
  "greyhound_racing_race",
  "handball_match",
  "horse_racing_race",
  "ice_hockey_match",
  "league_of_legends_match",
  "mma_match",
  "motorsports_race",
  "motorsports_outright",
  "politics",
  "politics_outright",
  "rowing",
  "rugby_league_match",
  "rugby_league_outright",
  "rugby_union_match",
  "rugby_union_outright",
  "snooker_match",
  "snooker_outright",
  "table_tennis_match",
  "table_tennis_outright",
  "tennis_match",
  "tennis_outright",
  "volleyball_match",
  "generic",
  "top_level_event",
  "tv_entertainment",
];

type Params = {
  pagination_last_id?: string;
  state: "upcoming";
  type: string;
  sort: "display_order,start_datetime,id";
  limit: number;
  /* some unused params missing */
};
type Event = {
  id: string;
  name: string;
  description: null | string;
  start_datetime: string;
  /* some unused properties missing */
};

type Action =
  | { type: "started"; payload: Params }
  | {
      type: "success";
      payload: { events: Event[]; pagination: { next_page: string | null } };
    }
  | { type: "error"; payload: Error; error: true };

type State = {
  events: Array<Event> | null;
  next: string | null;
  params: Params | null;
  error: Error | null;
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

      const query = qs.stringify(params);
      fetch(`${baseUrl}/v3/events/?${query}`, {
        headers: {
          Accept: "application/json",
        },
      })
        .then((res) => res.json())
        .then((payload) => {
          if (payload && "error_type" in payload) {
            dispatch({ type: "error", payload, error: true });
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
            <Button disabled={data.progress} type="primary" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      )}
      {!data.error !== null && (
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
