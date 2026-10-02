import { createSlice } from '@reduxjs/toolkit';
import type { Member } from '../../domain/types';

const initialState: Member[] = [];

export const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {},
});
