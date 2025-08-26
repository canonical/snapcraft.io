import { UPDATE_FAILED_REVISIONS } from "../actions/failedRevisions";

export default function failedRevisions(state = [], action: { type?: any; payload?: any },) {
    switch (action.type) {
        case UPDATE_FAILED_REVISIONS:
           
            return [
                ...state,
                ...action.payload.failedRevisions,
            ];
        default:
            return state;
    }
}
