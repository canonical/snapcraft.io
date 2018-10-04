// TODO:
// - update style of the links to underlines (with arrow?)
// - add details data for all languages
// - add button to the docs

function initFSFLanguageSelect(rootEl) {
  var flowLinks = [].slice.call(rootEl.querySelectorAll('.p-flow-link'));

  // TODO:
  // close on click as well
  flowLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      var link = event.target.closest('.p-flow-link');

      if (link && link.dataset.flowLink) {
        // find where the next row of links starts to insert details panel before
        var top = link.getBoundingClientRect().top;

        var nextRow = null;
        for (var i = flowLinks.indexOf(link); i < flowLinks.length && !nextRow; i++) {
          if (flowLinks[i].getBoundingClientRect().top > top) {
            nextRow = flowLinks[i];
          }
        }

        var flowDetails = [].slice.call(document.querySelectorAll('.p-flow-details'));
        flowDetails.forEach(e => e.style.display = 'none');

        var details = document.querySelector(`[data-flow-details='${link.dataset.flowLink}'`);
        if (nextRow) {
          nextRow.parentNode.insertBefore(details, nextRow);
        } else {
          rootEl.appendChild(details);
        }
        details.style.display = 'block';
        event.preventDefault();
      }
    });
  });

  // TODO: debounce
  window.addEventListener('resize', () => {
    var flowDetails = [].slice.call(document.querySelectorAll('.p-flow-details'));
    flowDetails.forEach(e => e.style.display = 'none');
  });
}

export {
  initFSFLanguageSelect
};
