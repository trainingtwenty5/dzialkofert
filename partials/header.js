// partials/header.js
export default `<?xml version="1.0" encoding="UTF-8"?>
${document.doctype ? '' : ''}
/*html fragment*/` + String.raw`
` + document.createElement('template').innerHTML;
