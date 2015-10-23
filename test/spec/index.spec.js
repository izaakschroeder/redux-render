
require('source-map-support').install();

import { compose, createStore, applyMiddleware } from 'redux';
import promiseMiddleware from 'redux-promise';
import isPromise from 'is-promise';

function reducer(state, action) {
  console.log('APP REDUCER', state, action);
  return state;
}

function identity(state) {
  return state;
}

function defaultDispatch(n, dispatch) {
  return action => {
    dispatch(action);
  }
}

const poo = chain(identity);

function layer(n, R = poo, D = defaultDispatch) {
  return next => (reducer, initialState) => {
    console.log('INITAL STATE', n, 'IS', initialState);
    const {
      initialState: liftedInitialState,
      reducer: liftedReducer
    } = R(reducer, initialState);
    const store = next((state, action) => {
      console.log('REDUCE FROM ', n);
      return liftedReducer(state, action);
    }, liftedInitialState);
    return {
      ...store,
      dispatch: D(n, store.dispatch)
    };
  }
}

function chain(child) {
  return (parent, initialState) => {
    return {
      reducer(state, action) {
        return parent(child(state, action), action)
      },
      initialState
    };
  };
}

const createStoreComposed = compose(
  layer('app layer', chain(reducer)),
  layer('promise layer', (reducer, initialState) => {
    console.log('PROMISE INITIAL = ', initialState);
    return {
      reducer(state, action) {
        const { promises, child } = state;
        const { type, payload } = action;
        console.log('PROMISE ACTION', state, action);
        switch(type) {
        case '@@redux/INIT':
          return { promises, child: reducer(child, { type }) };
        case 'PROMISE_DISPATCH':
        case 'PROMISE_ERROR':
          return { promises: [ ...promises, action.action.payload ], child };
        case 'PROMISE_RESULT':
        case 'PROMISE_PASSTHRU':
          return { promises: promises, child: reducer(child, payload) };
        default:
          return { promises, child };
        }
      },
      initialState: {
        promises: [],
        child: initialState
      }
    };
  }, (n, dispatch) => {
    return action => {
      if (isPromise(action.payload)) {
        dispatch({ type: 'PROMISE_DISPATCH', action });
        action.payload.then(payload => {
          dispatch({ type: 'PROMISE_RESULT', action, payload });
        }, payload => {
          dispatch({ type: 'PROMISE_ERROR', action, payload, error: true });
        });
      } else {
        dispatch({ type: 'PROMISE_PASSTHRU', action, payload: action });
      }
    }
  })
)(createStore);


describe('renderToString', () => {
  it('should work', () => {
    const store = createStoreComposed(identity, 0);
    store.dispatch({ type: 'TEST', payload: Promise.resolve(5) });
    console.log(store);

  });
});
