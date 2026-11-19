window.LabMath = {
  row(tex) {
    const el = document.createElement('div');
    el.className = 'lab-equation';
    katex.render(tex, el, {throwOnError:true, output:'htmlAndMathml'});
    return el;
  },
  panel(anchor, label, rows) {
    const panel = document.createElement('div'), heading = document.createElement('p');
    panel.className = 'lab-formulas';
    heading.className = 'formula-label'; heading.textContent = label;
    panel.append(heading, ...rows.map(tex => this.row(tex)));
    anchor.before(panel);
    return panel;
  },
  terms(anchor, rows) {
    anchor.replaceChildren(...rows.map(([label, tex]) => {
      const el = document.createElement('div'), title = document.createElement('small');
      title.textContent = label; el.append(title, this.row(tex)); return el;
    }));
  }
};
