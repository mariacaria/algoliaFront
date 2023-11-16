import algoliasearch from 'algoliasearch/lite';
import instantsearch from 'instantsearch.js';
import {
  configure,
  hits,
  pagination,
  panel,
  refinementList,
  searchBox,
} from 'instantsearch.js/es/widgets';

const searchClient = algoliasearch(
  'userID',
  'apiKey'
);

const search = instantsearch({
  indexName: 'INDICE_TEST',
  searchClient,
  future: { preserveSharedStateOnUnmount: true },
  insights: true,
});

search.addWidgets([
  searchBox({
    container: '#searchbox',
    placeholder: 'Buscar prendas',
  }),
  hits({
    container: '#hits',
    templates: {
      item: (hit, { html, components }) => html`
        <div>
          <img src=${hit.url_photo} align="center"/>
          <div class="hit-name">
            ${components.Highlight({ hit, attribute: 'nombre' })}
          </div>
          <div class="hit-description">
            ${components.Highlight({ hit, attribute: 'descripcion' })}
          </div>
          <div class="hit-size">Tallas: ${components.Highlight({ hit, attribute: 'tallas' })}</div>
          <div class="hit-price">${components.Highlight({ hit, attribute: 'precio' })}</div>
        </div>
      `,
    },
  }),
  configure({
    hitsPerPage: 9,
  }),
  pagination({
    container: '#pagination',
  }),
]);

search.start();

