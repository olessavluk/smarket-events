import qs from "qs";

export type Params = {
  pagination_last_id?: string;
  state: "upcoming";
  type: string;
  sort: "display_order,start_datetime,id";
  limit: number;
  /* some unused params missing */
};

export type Event = {
  id: string;
  name: string;
  start_datetime: string | null;
  /* some unused properties missing */
};

export type Response = {
  events: Event[];
  pagination: { next_page: string | null };
  error_type?: string;
};

export const types = [
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

const baseUrl = process.env.REACT_APP_API_BASE_URL;

export async function loadEvents(params: Params): Promise<Response> {
  const query = qs.stringify(params);
  return fetch(`${baseUrl}/v3/events/?${query}`, {
    headers: {
      Accept: "application/json",
    },
  }).then((r) => r.json());
}
