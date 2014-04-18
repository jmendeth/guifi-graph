# guifi-graph

This is a little program that consumes guifi.net's data, and generates a portable HTML
file that, when open in a browser, lets you see an interactive graph descriving the
network's nodes and their links.

The HTML is compressed and has no dependencies, so you can use it wherever you like.
It lets you filter the graph by zone at start. Then, it puts the corresponding nodes
in a force-field directed graph, ending in a beautiful layout.

Please note that, although the nodes start at their physical location, this tool isn't
intended to visualize the real distribution of the nodes in the terrain; use
[guifi-earth][] for that.


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

Then, generate the HTML graph:

```bash
$ node index guifi.cnml
```

The graph will be generated in `guifi.html`.


## Tweaking

If you know JavaScript, it's easy to tweak the appearence and behaviour of the graph.
These are the files you probably want to modify.

`view.html` contains the main [Handlebars][] view.  
`styles.css` contains, well, the CSS.  
`main.js` contains the logic to render the graph and UI.  
`vendor/` contains the third-party libraries used.



[guifi-earth]: https://github.com/jmendeth/guifi-earth
[Node.JS]: http://nodejs.org
