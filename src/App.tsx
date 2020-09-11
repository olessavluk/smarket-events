import React, { useReducer, useCallback } from "react";
import qs from "qs";

import { assertIsDefined } from "./util";

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
  state: "upcoming";
  type: string;
  sort: "id";
  limit: number;
};
type Event = {
  /* todo */
};

type Action =
  | { type: "started"; payload: Params }
  | { type: "success"; payload: { events: Event[] } }
  | { type: "error"; payload: Error; error: true };
type State = {
  events: Array<Event> | null;
  params: Params | null;
  error: Error | null;
  progress: boolean;
};

const initialState: State = {
  events: null,
  params: null,
  error: null,
  progress: false,
};
function eventsReducer(state: State, action: Action): State {
  console.log({ state, action });

  switch (action.type) {
    case "started":
      return {
        ...state,
        params: action.payload,
        progress: true,
      };
    case "success":
      assertIsDefined(state.params);
      return {
        ...state,
        params: state.params,
        progress: false,
        events: action.payload.events,
        error: null,
      };
    case "error":
      assertIsDefined(state.params);
      return {
        ...state,
        params: state.params,
        progress: false,
        events: null,
        error: action.payload,
      };
  }
}

function App() {
  const [data, dispatch] = useReducer(eventsReducer, initialState);

  const onChangeType = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const type = e.target.value;

      const params: Params = {
        state: "upcoming",
        type,
        sort: "id",
        limit: 2,
      };

      dispatch({ type: "started", payload: params });

      const query = qs.stringify(params);
      fetch(`${baseUrl}/v3/events/?${query}`, {
        headers: {
          Accept: "application/json",
        },
      })
        .then((res) => res.json())
        .then((payload) => {
          dispatch({ type: "success", payload });
        })
        .catch((error) => {
          dispatch({ type: "error", payload: error, error: true });
        });
    },
    [dispatch]
  );

  return (
    <div>
      <select value={data.params?.type} onChange={onChangeType}>
        {!data.params?.type && <option>Please select type</option>}
        {types.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default App;
