import { RootState } from '@/app/store';
import { IComedian, getAllComediansFromDB } from '@/firebase/database';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const fetchAllComedians = createAsyncThunk('allComedians/fetchAllComedians', async () => {
  const comedians = await getAllComediansFromDB();
  return comedians;
});

export type allComediansState = {
  data: IComedian[];
  comedianIds: number[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
};

const initialState: allComediansState = {
  data: [],
  comedianIds: [],
  loading: 'pending',
};

export const allComediansSlice = createSlice({
  name: 'allComedians',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchAllComedians.fulfilled, (state, action) => {
      const comediansMap = action.payload;
      if (!comediansMap) return;

      const allComedianIds = Object.keys(comediansMap).map((id) => Number(id));

      const allComediansData = Object.keys(comediansMap).map((comedianId) => {
        return comediansMap[comedianId];
      });

      if (allComediansData.length === 0) return;

      state.data = allComediansData;
      state.comedianIds = allComedianIds;
    });
  },
});

export const allComediansDataArr = (state: RootState) => state.allComedians.data;
export const allComedianIdsArr = (state: RootState) => state.allComedians.comedianIds;

export default allComediansSlice.reducer;
