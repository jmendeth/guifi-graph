# guifi-graph

This is a little program that consumes guifi.net's data, and generates a **portable HTML
file** that, when opened in a browser, turns into an **interactive graph** showing the
nodes, the links between them, and more info.

The HTML is minified and has no dependencies, so you can use it wherever you like.
When compressed, it usually weigths around 2MB (and it contains the whole network!).

It lets you filter the graph by zone at start. Then, it puts the corresponding nodes
in a **force-field directed graph**, ending in a beautiful layout.

This tool isn't ideal to visualize the real distribution of the nodes in the terrain;
use [guifi-earth][] for that matter


## Installation

You should have [Node.JS][] already installed. Then:

```bash
$ git clone https://github.com/jmendeth/guifi-earth.git
$ cd guifi-earth
$ npm install
```

That's it.


## Usage

You should first download guifi.net's CNML:

```bash
$ wget http://guifi.net/snpservices/data/guifi.cnml
```

Then, build the HTML graph:

```bash
$ gulp
```

The graph will be generated in `build/guifi.<date>.html`, where `<date>`
is the date, in ISO 8601 Extended Format, that `guifi.cnml` was generated.


## Tweaking

If you know JavaScript, it's easy to tweak the appearence and behaviour of the graph.
These are the files you probably want to modify.

`styles.scss` contains, well, the SCSS.  
`main.js` contains the logic to render the graph and UI.  
`assets/` contains images and other resources used.  
`vendor/` contains the third-party JS libraries used.  
`view.html` contains the HTML to put it all together.

Thanks to [SubtlePatterns][] for the background.



[guifi-earth]: https://github.com/jmendeth/guifi-earth
[Node.JS]: http://nodejs.org
[SubtlePatterns]: http://subtlepatterns.com
