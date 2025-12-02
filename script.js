// script.js
const AGE_LABELS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65-74", "75+"];

function makeAgeStrip(ageDist) {
  let total = 0;
  for (const lbl of AGE_LABELS) {
    total += (ageDist[lbl] || 0);
  }
  if (total === 0) {
    return "<div class='age-strip'>No age data</div>";
  }

  let html = "<div class='age-strip'>";
  for (const lbl of AGE_LABELS) {
    const cnt = ageDist[lbl] || 0;
    const pct = (cnt / total) * 100;
    html += '<div class="age-segment" style="width:' + pct + '%">' +
            '<span class="age-label">' + lbl + ' (' + cnt + ')</span>' +
            '</div>';
  }
  html += "</div>";
  return html;
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
        const ageDist = props['age_dist'] || {};
        const ageHtml = makeAgeStrip(ageDist);

        const popupHtml = `
          <div class="popup-content">
            <h3>${precinctName}</h3>
            <div>Registered voter age distribution:</div>
            {ageHtml}
          </div>
        `.replace("{ageHtml}", ageHtml);

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
