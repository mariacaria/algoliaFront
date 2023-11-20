import algoliasearch from 'algoliasearch/lite';
import instantsearch from 'instantsearch.js';

import { autocomplete } from '@algolia/autocomplete-js';
import historyRouter from 'instantsearch.js/es/lib/routers/history';
import { connectSearchBox } from 'instantsearch.js/es/connectors';

import '@algolia/autocomplete-theme-classic';

import { autocomplete } from '@algolia/autocomplete-js';
import { createLocalStorageRecentSearchesPlugin } from '@algolia/autocomplete-plugin-recent-searches';

import {
  configure,
  hits,
  pagination,
  refinementList,
  clearRefinements,
  panel,
  searchBox,
  stats,
  currentRefinements,
  rangeSlider
} from 'instantsearch.js/es/widgets';

const searchClient = algoliasearch(
  'userID',
  'apiKey'
);

const INSTANT_SEARCH_INDEX_NAME = 'INDICE_BUENO';
const instantSearchRouter = historyRouter();

const search = instantsearch({
  indexName: 'INDICE_BUENO',
  searchClient,
  routing: instantSearchRouter
  // future: { preserveSharedStateOnUnmount: true },
  // insights: true,
});

const virtualSearchBox = connectSearchBox(() => {});

search.addWidgets([
  // searchBox({
  //   container: '#searchbox',
  //   placeholder: 'Buscar prendas',
  // }),
  virtualSearchBox({}),
  hits({
    container: '#hits',
    templates: {
      item: (hit, { html, components }) => html`
        <div>
          <img src="${hit.url_foto}" align="center" width="170px" height="250px"/>
          <div class="hit-name">
            ${components.Highlight({ hit, attribute: 'nombre' })}
          </div>
          <div class="hit-description">
            ${components.Highlight({ hit, attribute: 'descripcion' })}
          </div>
          <div class="hit-size">Tallas Disponibles: ${components.Highlight({ hit, attribute: 'tallas' })}</div>
          <div class="hit-price">${components.Highlight({ hit, attribute: 'precio' })} €</div>
          <p></p>
          <form action="${hit.id_mongo}">
            <input class="btn" type="submit" value="VER PRODUCTO" />
          </form>
        </div>
      `,
    },
  }),
  configure({
    hitsPerPage: 12,
  }),
  stats({
    container: '#stats',
  }),
  currentRefinements({
    container: '#current-ref',
  }),
  panel({
    templates: { header: 'Tienda' },
  })(refinementList)({
    container: '#tienda-filter',
    attribute: 'cadena'
  }),
  panel({
    templates: { header: 'Precio' },
  })(rangeSlider)({
    container: '#precio-filter',
    attribute: 'precio',
    pips: false,
    step: 4
  }),
  panel({
    templates: { header: 'Talla' },
  })(refinementList)({
    container: '#talla-filter',
    attribute: 'tallas'
  }),
  clearRefinements({
    container: '#clear-refinements'
  }),
  pagination({
    container: '#pagination',
    scrollTo: 'header'
  }),
]);

search.start();

// Set the InstantSearch index UI state from external events.
function setInstantSearchUiState(indexUiState) {
  search.setUiState(uiState => ({
    ...uiState,
    [INSTANT_SEARCH_INDEX_NAME]: {
      ...uiState[INSTANT_SEARCH_INDEX_NAME],
      // We reset the page when the search state changes.
      page: 1,
      ...indexUiState,
    },
  }));
}

// Return the InstantSearch index UI state.
function getInstantSearchUiState() {
  const uiState = instantSearchRouter.read();

  return (uiState && uiState[INSTANT_SEARCH_INDEX_NAME]) || {};
}

// Build URLs that InstantSearch understands.
function getInstantSearchUrl(indexUiState) {
  return search.createURL({ [INSTANT_SEARCH_INDEX_NAME]: indexUiState });
}

// Detect when an event is modified with a special key to let the browser
// trigger its default behavior.
function isModifierEvent(event) {
  const isMiddleClick = event.button === 1;

  return (
    isMiddleClick ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  );
}

function onSelect({ setIsOpen, setQuery, event, query }) {
  // You want to trigger the default browser behavior if the event is modified.
  if (isModifierEvent(event)) {
    return;
  }

  setQuery(query);
  setIsOpen(false);
  setInstantSearchUiState({ query });
}

function getItemUrl({ query }) {
  return getInstantSearchUrl({ query });
}

function createItemWrapperTemplate({ children, query, html }) {
  const uiState = { query };

  return html`<a
    class="aa-ItemLink"
    href="${getInstantSearchUrl(uiState)}"
    onClick="${(event) => {
      if (!isModifierEvent(event)) {
        // Bypass the original link behavior if there's no event modifier
        // to set the InstantSearch UI state without reloading the page.
        event.preventDefault();
      }
    }}"
  >
    ${children}
  </a>`;
}

const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
  key: 'instantsearch',
  limit: 5,
  transformSource({ source }) {
    return {
      ...source,
      getItemUrl({ item }) {
        return getItemUrl({
          query: item.label,
        });
      },
      onSelect({ setIsOpen, setQuery, item, event }) {
        onSelect({
          setQuery,
          setIsOpen,
          event,
          query: item.label,
        });
      },
      // Update the default `item` template to wrap it with a link
      // and plug it to the InstantSearch router.
      templates: {
        ...source.templates,
        item(params) {
          const { children } = source.templates.item(params).props;

          return createItemWrapperTemplate({
            query: params.item.label,
            children,
            html: params.html,
          });
        },
      },
    };
  },
});


const searchPageState = getInstantSearchUiState();

let skipInstantSearchUiStateUpdate = false;
const { setQuery } = autocomplete({
  container: '#searchbox',
  placeholder: 'Buscar artículos',
  detachedMediaQuery: 'none',
  initialState: {
    query: searchPageState.query || '',
  },
  onSubmit({ state }) {
    setInstantSearchUiState({ query: state.query });
  },
  onReset() {
    setInstantSearchUiState({ query: '' });
  },
  onStateChange({ prevState, state }) {
    if (!skipInstantSearchUiStateUpdate && prevState.query !== state.query) {
      setInstantSearchUiState({ query: state.query });
    }
    skipInstantSearchUiStateUpdate = false;
  },
  openOnFocus: true,
  plugins: [recentSearchesPlugin],
})

// This keeps Autocomplete aware of state changes coming from routing
// and updates its query accordingly
window.addEventListener('popstate', () => {
  skipInstantSearchUiStateUpdate = true;
  setQuery(search.helper?.state.query || '');
});