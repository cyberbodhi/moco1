// script.js
// Uses Leaflet + OSM to display Monroe County precincts with age histograms.

function makeAgeHistogram(ageBins, ageCounts) {
  if (!ageBins || !ageCounts || ageBins.length === 0 || ageCounts.length === 0) {
    return "<div class='age-hist'>No age data</div>";
  }

  const maxCount = Math.max(...ageCounts);
  if (maxCount === 0) {
    return "<div class='age-hist'>No age data</div>";
  }

  const width = 260;
  const height = 120;
  const barPad = 2;
  const n = ageBins.length;
  const barWidth = Math.floor((width - (n + 1) * barPad) / n);

  let svg = `<svg width="${width}" height="${height}" class="age-hist-svg">`;
  const baseline = height - 20;

  for (let i = 0; i < n; i++) {
    const cnt = ageCounts[i] || 0;
    const h = Math.round((cnt / maxCount) * (height - 40));
    const x = barPad + i * (barWidth + barPad);
    const y = baseline - h;

    svg += `
      <g>
        <rect x="${x}" y="${y}" width="${barWidth}" height="${h}"
              fill="#3182bd" stroke="#ffffff" stroke-width="1"></rect>
        <text x="${x + barWidth / 2}" y="${baseline + 12}"
              text-anchor="middle" font-size="8">${ageBins[i]}</text>
        <text x="${x + barWidth / 2}" y="${y - 2}"
              text-anchor="middle" font-size="8" fill="#333">${cnt}</text>
      </g>`;
  }

  svg += "</svg>";
  return `<div class="age-hist">${svg}</div>`;
}

function initMap() {
  const map = L.map('map').setView([39.16, -86.5], 11);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  fetch('precincts.geojson')
    .then(resp => resp.json())
    .then(data => {
      const style = {
        color: '#333',
        weight: 1,
        fillColor: '#3182bd',
        fillOpacity: 0.15
      };

      function onEachFeature(feature, layer) {
        const props = feature.properties || {};
        const precinctName = props['Precinct'] || 'Unknown Precinct';
        const ageBins = props['age_bins'] || [];
        const ageCounts = props['age_counts'] || [];
        const histHtml = makeAgeHistogram(ageBins, ageCounts);

        const popupHtml = `
          <div class="popup-content">
            <h3>${precinctName}</h3>
            <div>Registered voter age distribution:</div>
            ${histHtml}
          </div>
        `;

        layer.bindPopup(popupHtml);

        layer.on({
          mouseover: function(e) {
            const l = e.target;
            l.setStyle({ weight: 3, fillOpacity: 0.3 });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              l.bringToFront();
            }
          },
          mouseout: function(e) {
            geojson.resetStyle(e.target);
          }
        });
      }

      const geojson = L.geoJSON(data, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(map);

      map.fitBounds(geojson.getBounds());
    })
    .catch(err => {
      console.error("Error loading GeoJSON:", err);
      document.getElementById('status').innerText =
        "Error loading precincts data. See console for details.";
    });
}

document.addEventListener('DOMContentLoaded', initMap);
