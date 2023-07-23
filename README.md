# Term Connections

This small frontend webapp is a simple educational game for students to learn about categories of terms in a vocabulary.

By default, the game pulls the table of terms from the `tc_game_args` variable in the first script of `index.html`. However, if that variable is not defined, the game will attempt to pull a `terms.json` file from the current URL. For example, if the game is hosted at `https://example.com/tc_game/`, then the game will attempt to pull `https://example.com/tc_game/terms.json`.

The game allows configuration of its "topic" header, background image, background color, and text color all to better match the theme of the current vocabulary. These can be configured in the `tc_game_args` or in the `terms.json`.

The game uses basic web technologies (HTML, CSS, and JavaScript) and should work in any modern web browser. It is also designed to be at least moderately mobile-friendly. Users of assistive technologies should be able to operate the game, but certain _indication_ roles (e.g. `aria-checked`) are WIP. (PRs welcome! Current plan is to swap the grid elements out entirely for checkbox inputs.)