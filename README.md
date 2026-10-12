# Atlanta Events

Event feed and calendar for Atlanta: State Farm Arena, Mercedes-Benz Stadium,
Truist Park, the Fox Theatre, Atlanta Symphony Hall, Cobb Energy Centre, Gas
South Arena, Gateway Center Arena, Georgia Tech's grounds, the music rooms from
Midtown to Little Five Points and Decatur, and the amphitheatres — with the
home teams' seasons (Hawks, Falcons, Braves, Atlanta United, Dream, Georgia
Tech football) in a Teams view.

Live at **https://atlanta.here.events/** once the domain is wired (GitHub
Pages, built by the Actions workflow once a day at noon Eastern).

A city on the lqa-events codebase (after Everett and Chicago): everything that
makes this Atlanta's is `site/city.js` (every team, venue, type, default,
share-code registry and string), `site/index.html`, `scripts/fetch-events.mjs`
(the sources), `site/embed.js`, `outlook.json`, `scripts/data/postseason.json`,
`channels.json`, the manifest and icons (a peach, rendered from `favicon.svg`).
Everything else is lqa-events' own, byte for byte — copy from there, never edit
here.

## Embed

```html
<div id="atlanta-events"></div>
<script src="https://atlanta.here.events/embed.js" data-max="8" defer></script>
```

## Sources

- **Ticketmaster Discovery API** — every room by its venue id (every page;
  a complex with several rooms on Ticketmaster — Gas South, the Masquerade —
  lists them all): 27 rooms, from the stadiums to the 185-seat Eddie's Attic.
  There is no city sweep: a market this size runs past the API's thousandth
  event weeks out. Calls are paced a second apart with a back-off on 429 (the
  key is shared by every here.events city). Church events are left out
  (`isChurch`).
- **Seasons** — ESPN for the Hawks, Falcons, Atlanta United, Dream and
  Georgia Tech; MLB's stats API for the Braves (`scripts/schedules.mjs`,
  shared with lqa).

Next to add: Georgia Tech men's basketball as a club (McCamish Pavilion is
already a room; the shared ESPN adapter has to ask college basketball for
`?seasontype=2` first — the plain call is empty before November, and app.js's
form block throws on an empty schedule), the rooms whose shows Ticketmaster
never lists (the Earl, 529,
City Winery, the Alliance Theatre, the High Museum's evenings), the Gladiators
(ECHL — their HockeyTech client key is not public), and the city's festivals
(Shaky Knees, Music Midtown, the Dogwood Festival, Dragon Con).

## Local run

```sh
cp .env.example .env   # TICKETMASTER_API_KEY=…
ALLOW_NO_ARCHIVE=1 node scripts/fetch-events.mjs   # ALLOW_NO_ARCHIVE only until the site has published once
node --test scripts/*.test.mjs
```
