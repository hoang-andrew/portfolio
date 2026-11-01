import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let query = '';
let selectedIndex = -1;

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Show a list of projects as cards and update the heading count
function showProjects(list) {
  renderProjects(list, projectsContainer, 'h2');
  if (projectsTitle) {
    projectsTitle.textContent = `${list.length} Projects`;
  }
}

function filterProjects(q) {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(q.toLowerCase());
  });
}

// Draws the pie and legend for projectsGiven. Clicking a wedge or legend
// item filters the cards below to that year.
function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  rolledData.sort((a, b) => a[0] - b[0]);

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  // Apply the .selected class to the right wedge and legend item
  function updateSelection() {
    svg
      .selectAll('path')
      .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

    legend
      .selectAll('li')
      .attr('class', (_, idx) =>
        idx === selectedIndex ? 'legend-item selected' : 'legend-item',
      );
  }

  function selectIndex(i) {
    // Clicking the selected one again deselects it
    selectedIndex = selectedIndex === i ? -1 : i;
    updateSelection();

    if (selectedIndex === -1) {
      showProjects(projectsGiven);
    } else {
      let selectedYear = data[selectedIndex].label;
      showProjects(
        projectsGiven.filter((p) => String(p.year) === String(selectedYear)),
      );
    }
  }

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .on('click', () => selectIndex(i));
  });

  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(i)}`)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => selectIndex(i));
  });

  updateSelection();
}

if (projects) {
  // Initial render
  showProjects(projects);
  renderPieChart(projects);

  searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    selectedIndex = -1; // a new search clears any wedge selection
    let filtered = filterProjects(query);
    showProjects(filtered);
    renderPieChart(filtered);
  });
}