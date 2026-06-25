# NDC Live Scoreboard

Upload this whole folder to one GitHub Pages repository.

- `index.html` = TV display
- `mobile.html` = mobile display
- `js/config.js` = the only file you usually edit

## To use your live Google Sheet

Publish the correct Google Sheet tab as CSV, then open `js/config.js` and replace:

```js
csvUrl: "scores.csv",
```

with your published CSV link.

Both the TV and mobile pages use the same config file, so you only change the CSV link once.
