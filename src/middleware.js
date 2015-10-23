import { isFSA } from 'flux-standard-action';
import isPromise from 'is-promise';
import { createStore } from 'redux';

const ActionTypes = {
  PERFORM_ACTION: 'PERFORM_ACTION',
  RESET_PROMISES: 'RESET_PROMISES',
  INIT: '@@redux/INIT'
}

function appendPromise(promises, action) {
  if (!isFSA(action) && isPromise(action)) {
      return [ ...promises, action ];
  } else if (isFSA(action) && isPromise(action.payload)) {
    return [ ...promises, action.payload ];
  }
  return promises;
}

function liftReducer(reducer, initialState) {

  const initialLiftedState = {
    storeState: initialState,
    promises: []
  };

  return function liftedReducer(liftedState = initialLiftedState, { type, action }) {
    let {
      storeState,
      promises
    } = liftedState;
    console.log('LE GOT', type);
    switch(type) {
    case ActionTypes.INIT:
      return {
        storeState: reducer(storeState, action),
        promises,
      };
    case ActionTypes.PERFORM_ACTION:
      console.log('PERFORMING!!!', action);
      return {
        promises: appendPromise(promises, action),
        storeState: reducer(storeState, action),
      };
    case ActionTypes.RESET_PROMISES:
      return {
        storeState,
        promises: [],
      };
    default:
      return liftedState;
    }
  }
}


function liftAction(action) {
  return {
    type: ActionTypes.PERFORM_ACTION,
    action
  };
}


function unliftState(liftedState) {
  return liftedState.storeState;
}

function unliftStore(liftedStore) {
  return {
    ...liftedStore,
    renderStore: liftedStore,
    dispatch(action) {
      console.log('DISPATCH TO ', liftedStore);
      liftedStore.dispatch((action));
      return liftAction(action);
    },
    getState() {
      const state = unliftState(liftedStore.getState());
      return state;
    },
    replaceReducer(nextReducer) {
      liftedStore.replaceReducer(liftReducer(nextReducer));
    }
  }
}

function unliftReducer(reducer) {
  return function(state, action) {
    console.log('LE ACTION', action.action);
    return reducer(state, action.action);
  }
}


export default function renderMiddleware() {
  return next => (reducer, initialState) => {
    console.log('NEXT IS', next);
    const liftedReducer = liftReducer(reducer, initialState);
    const liftedStore = next(liftedReducer);
    const store = unliftStore(liftedStore);
    return store;
  }
}
