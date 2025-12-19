import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddReviewData {
  review_insert: Review_Key;
}

export interface AddReviewVariables {
  restaurantId: UUIDString;
  rating: number;
  reviewText: string;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface FavoriteListItem_Key {
  favoriteListId: UUIDString;
  restaurantId: UUIDString;
  __typename?: 'FavoriteListItem_Key';
}

export interface FavoriteList_Key {
  id: UUIDString;
  __typename?: 'FavoriteList_Key';
}

export interface GetFavoriteListsByUserData {
  favoriteLists: ({
    id: UUIDString;
    name: string;
    description?: string | null;
  } & FavoriteList_Key)[];
}

export interface ListRestaurantsData {
  restaurants: ({
    id: UUIDString;
    name: string;
    cuisineType: string;
    averageRating?: number | null;
  } & Restaurant_Key)[];
}

export interface Restaurant_Key {
  id: UUIDString;
  __typename?: 'Restaurant_Key';
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface ListRestaurantsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRestaurantsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListRestaurantsData, undefined>;
  operationName: string;
}
export const listRestaurantsRef: ListRestaurantsRef;

export function listRestaurants(): QueryPromise<ListRestaurantsData, undefined>;
export function listRestaurants(dc: DataConnect): QueryPromise<ListRestaurantsData, undefined>;

interface AddReviewRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddReviewVariables): MutationRef<AddReviewData, AddReviewVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddReviewVariables): MutationRef<AddReviewData, AddReviewVariables>;
  operationName: string;
}
export const addReviewRef: AddReviewRef;

export function addReview(vars: AddReviewVariables): MutationPromise<AddReviewData, AddReviewVariables>;
export function addReview(dc: DataConnect, vars: AddReviewVariables): MutationPromise<AddReviewData, AddReviewVariables>;

interface GetFavoriteListsByUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetFavoriteListsByUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetFavoriteListsByUserData, undefined>;
  operationName: string;
}
export const getFavoriteListsByUserRef: GetFavoriteListsByUserRef;

export function getFavoriteListsByUser(): QueryPromise<GetFavoriteListsByUserData, undefined>;
export function getFavoriteListsByUser(dc: DataConnect): QueryPromise<GetFavoriteListsByUserData, undefined>;

