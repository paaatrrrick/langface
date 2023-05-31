import { configureStore, createSlice } from '@reduxjs/toolkit';

// Create Redux slice for error state
const slice = createSlice({
    name: 'main',
    initialState: {
        popUpMessage: null,
    },
    reducers: {
        setPopUpMessage: (state, action) => {
            state.popUpMessage = action.payload;
        },
        clearPopUpMessage: state => {
            state.popUpMessage = null;
        },
    },
});


// Now we configure the store
const store = configureStore({ reducer: { main: slice.reducer } });
export default store;
export const { setPopUpMessage, clearPopUpMessage } = slice.actions;
