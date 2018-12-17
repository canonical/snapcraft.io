export default function unreleasedSelect(
  state = {
    currentSelect: "Unreleased"
  },
  action
) {
  switch (action.type) {
    case "SELECT_FILTER":
      return {
        ...state,
        currentSelect: action.payload.filter
      };
    default:
      return state;
  }
}
