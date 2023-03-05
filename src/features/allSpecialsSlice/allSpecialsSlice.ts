import { RootState } from '@/app/store';
import { ISpecial, getAllSpecialsFromDB } from '@/firebase/database';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const fetchAllSpecials = createAsyncThunk('allSpecials/fetchAllSpecials', async () => {
  const specials = await getAllSpecialsFromDB();
  return specials;
});

export type allSpecialsState = {
  data: ISpecial[];
  specialIds: number[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
};

const initialState: allSpecialsState = {
  data: [],
  specialIds: [],
  loading: 'pending',
};

export const allSpecialsSlice = createSlice({
  name: 'allSpecials',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchAllSpecials.fulfilled, (state, action) => {
      const specialsMap = action.payload;
      if (!specialsMap) return;

      const allSpecialsIds = Object.keys(specialsMap).map((id) => Number(id));

      if (allSpecialsIds.length === 0) return;

      const allSpecialsData = allSpecialsIds.map((specialId) => {
        return specialsMap[specialId];
      });

      if (allSpecialsData.length === 0) return;

      state.data = allSpecialsData;
      state.specialIds = allSpecialsIds;
    });
    builder.addCase(fetchAllSpecials.pending, (state) => {
      state.loading = 'pending';
    });
  },
});

export const allSpecialsDataArr = (state: RootState) => state.allSpecials.data;
export const allSpecialIdsArr = (state: RootState) => state.allSpecials.specialIds;

export default allSpecialsSlice.reducer;
