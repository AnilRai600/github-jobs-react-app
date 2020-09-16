import { useReducer, useEffect } from 'react';
import axios from 'axios';

const ACTIONS = {
    MAKE_REQUEST: 'make-request',
    GET_DATA: 'get-data',
    UPDATE_HAS_NEXT_PAGE: 'update-has-next-page',
    ERROR: 'error'
}

const BASE_URL = 'https://cors-anywhere.herokuapp.com/https://jobs.github.com/positions.json';

function reducer(state, action ) {
    switch (action.type) {
        case ACTIONS.MAKE_REQUEST:
         return { loading: true, jobs: [] }
        case ACTIONS.GET_DATA:
            return { ...state, loading: false, jobs: action.payload.jobs }
        case ACTIONS.UPDATE_HAS_NEXT_PAGE:
            return { ...state, hasNextPage: action.payload.hasNextPage }
        case ACTIONS.ERROR:
            return { ...state, loading: false, error: action.payload.error, jobs: [] }
        default:
            return state
    }
}

export default function useFetchJobs(params, page) {
    const [state, dispatch] = useReducer(reducer, { jobs: [], loading: true })

    useEffect(() => {
        const cancelToken1 = axios.CancelToken.source();    // To generate a cancelToken in axios
        dispatch({ type: ACTIONS.MAKE_REQUEST })
        axios.get(BASE_URL, {
            cancelToken1: cancelToken1.token,    // individual cancel token
            params: {markdown: true, page: page, ...params }
        }).then(res => {
           dispatch({ type: ACTIONS.GET_DATA, payload: { jobs: res.data } }) 
        }).catch(err => {
            if(axios.isCancel(err)) return  // if err was from cancelToken, ignore that..
            dispatch({ type: ACTIONS.ERROR, payload: { error: err } })
        })


        // this is for checking if next page exits or not..
        const cancelToken2 = axios.CancelToken.source(); 
        axios.get(BASE_URL, {
            cancelToken2: cancelToken2.token,    // individual cancel token
            params: {markdown: true, page: page = 1, ...params }
        }).then(res => {
           dispatch({ type: ACTIONS.UPDATE_HAS_NEXT_PAGE, payload: { hasNextPage: res.data.length !== 0 } }) 
        }).catch(err => {
            if(axios.isCancel(err)) return  // if err was from cancelToken, ignore that..
            dispatch({ type: ACTIONS.ERROR, payload: { error: err } })
        })


        return () => {              // This function runs then params and page changes to clear above
            cancelToken1.cancel();
            cancelToken2.cancel();

        }
    }, [params, page])
    
   return state;
}