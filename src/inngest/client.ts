import { Inngest, EventSchemas } from "inngest";

type Events = {
  "watchlist/item.added": {
    data: { titleId: string; countryCode?: string };
  };
  "watchlist/refresh.batch": {
    data: { titleIds: string[]; countryCode?: string };
  };
};

export const inngest = new Inngest({
  id: "watchily-ho",
  schemas: new EventSchemas().fromRecord<Events>(),
});
