const express = require("express"),
      app = express(),
      debug = require("debug")("express-urlrewrite"),
      toRegexp = require("path-to-regexp"),
      URL = require("url"),
      hostname = "localhost",
      port = 3000;

module.exports = rewrite;

function rewrite(src, dst) {
  var keys = [], re, map;

  if (dst) {
    re = toRegexp(src, keys);
    map = toMap(keys);
    debug("rewrite %s -> %s    %s", src, dst, re);
  } else {
    debug("rewrite current route -> %s", src);
  }

  return function(req, res, next) {
    var orig = req.url;
    var m;
    if (dst) {
      m = re.exec(orig);
      if (!m) {
        return next();
      }
    }
    req.url = req.originalUrl = (dst || src).replace(/\$(\d+)|(?::(\w+))/g, function(_, n, name) {
      if (name) {
        if (m) return m[map[name].index + 1];
        else return req.params[name];
      } else if (m) {
        return m[n];
      } else {
        return req.params[n];
      }
    });
    debug("rewrite %s -> %s", orig, req.url);
    if (req.url.indexOf("?") > 0) {
      req.query = URL.parse(req.url, true).query;
      debug("rewrite updated new query", req.query);
    }
    if (dst) next();
    else next("route");
  }
}

function toMap(params) {
  var map = {};

  params.forEach(function(param, i) {
    param.index = i;
    map[param.name] = param;
  });

  return map;
}

app.use(rewrite("/template", "/template.html"))
app.use(rewrite("/grid1", "/grid1.html"))
app.use(rewrite("/grid2", "/grid2.html"))
app.use(rewrite("/grid2-template", "/grid2-template.html"))
app.use(rewrite("/grid2-template-cards", "/grid2-template-cards.html"))

app.use(express.static("public"))

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
