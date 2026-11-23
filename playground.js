(function () {
  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  };

  var inputs = {
    start: $("start"),
    monthly: $("monthly"),
    rate: $("rate"),
    years: $("years")
  };
  if (!inputs.start || !$("chart")) return;

  var svg = $("chart");
  var W = 600, H = 320, PAD = { l: 58, r: 16, t: 16, b: 34 };

  // Month by month balance, with growth and with no growth
  function simulate(start, monthly, ratePct, years) {
    var r = ratePct / 100 / 12;
    var grow = start, flat = start;
    var points = [{ y: 0, grow: grow, flat: flat }];
    for (var m = 1; m <= years * 12; m++) {
      grow = grow * (1 + r) + monthly;
      flat = flat + monthly;
      if (m % 12 === 0) points.push({ y: m / 12, grow: grow, flat: flat });
    }
    return points;
  }

  function niceMax(v) {
    if (v <= 0) return 100;
    var p = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / p;
    var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * p;
  }

  function shortMoney(n) {
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(n % 1e3 === 0 ? 0 : 1) + "k";
    return "$" + n;
  }

  function draw(points, years) {
    var maxV = niceMax(points[points.length - 1].grow);
    var x = function (yr) { return PAD.l + (yr / years) * (W - PAD.l - PAD.r); };
    var y = function (v) { return H - PAD.b - (v / maxV) * (H - PAD.t - PAD.b); };

    var out = "";
    // grid and y labels
    for (var i = 0; i <= 4; i++) {
      var v = (maxV / 4) * i;
      out += '<line x1="' + PAD.l + '" x2="' + (W - PAD.r) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#e7dcc0" stroke-width="1"/>';
      out += '<text x="' + (PAD.l - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="12" fill="#5d6784">' + shortMoney(v) + "</text>";
    }
    // x labels
    var stepYears = years <= 10 ? 1 : years <= 20 ? 5 : 10;
    for (var t = 0; t <= years; t += stepYears) {
      out += '<text x="' + x(t) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="12" fill="#5d6784">' + (t === 0 ? "Now" : "Yr " + t) + "</text>";
    }

    var path = function (key) {
      return points.map(function (p, idx) {
        return (idx ? "L" : "M") + x(p.y).toFixed(1) + " " + y(p[key]).toFixed(1);
      }).join(" ");
    };

    var base = y(0);
    var area = path("grow") + " L" + x(years).toFixed(1) + " " + base + " L" + x(0).toFixed(1) + " " + base + " Z";
    out += '<path d="' + area + '" fill="rgba(31,169,122,0.15)"/>';
    out += '<path d="' + path("flat") + '" fill="none" stroke="#9aa3bd" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round"/>';
    out += '<path d="' + path("grow") + '" fill="none" stroke="#1fa97a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
    var last = points[points.length - 1];
    out += '<circle cx="' + x(last.y) + '" cy="' + y(last.grow) + '" r="6" fill="#1fa97a" stroke="#fff" stroke-width="2"/>';

    svg.innerHTML = out;
  }

  function update() {
    var s = +inputs.start.value, m = +inputs.monthly.value, r = +inputs.rate.value, yrs = +inputs.years.value;
    $("o-start").textContent = money(s);
    $("o-monthly").textContent = money(m);
    $("o-rate").textContent = r + "%";
    $("o-years").textContent = yrs;

    var pts = simulate(s, m, r, yrs);
    var last = pts[pts.length - 1];
    $("final-grow").textContent = money(last.grow);
    $("final-flat").textContent = money(last.flat);
    $("final-gain").textContent = money(last.grow - last.flat);
    draw(pts, yrs);
  }

  Object.keys(inputs).forEach(function (k) {
    inputs[k].addEventListener("input", update);
  });
  update();

  // Some browsers pause autoplay until the page is ready, so nudge the hero video.
  var v = document.querySelector(".hero-video");
  if (v) {
    v.muted = true;
    var tryPlay = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    tryPlay();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) tryPlay(); });
  }
})();
