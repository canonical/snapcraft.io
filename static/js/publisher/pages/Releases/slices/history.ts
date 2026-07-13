import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  AppDispatch,
  RootState,
} from "../store";
import type {
  HistoryFilters,
  HistoryState,
} from "../../../types/releaseTypes";

const historySlice = createSlice({
  name: "history",
  initialState: {
      filters: null,
      isOpen: false,
    } as HistoryState,
  reducers: {
    openHistory(_state, action: PayloadAction<HistoryFilters | null>) {
      return {
        isOpen: true,
        filters: action.payload,
      };
    },
    closeHistory(state) {
      state.isOpen = false;
      state.filters = null;
    },
  }
});

export const { openHistory, closeHistory } = historySlice.actions;
export default historySlice.reducer;

export function toggleHistory(filters: HistoryFilters | null) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const { history } = getState();
    if (
      history.isOpen &&
      (history.filters == filters ||
        (history.filters &&
          filters &&
          filters.track === history.filters.track &&
          filters.arch === history.filters.arch &&
          filters.risk === history.filters.risk &&
          filters.branch === history.filters.branch))
    ) {
      dispatch(closeHistory());
    } else {
      dispatch(openHistory(filters));
    }
  };
}
