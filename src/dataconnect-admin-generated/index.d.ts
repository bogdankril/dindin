import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

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

/** Generated Node Admin SDK operation action function for the 'CreateUser' Mutation. Allow users to execute without passing in DataConnect. */
export function createUser(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateUserData>>;
/** Generated Node Admin SDK operation action function for the 'CreateUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function createUser(options?: OperationOptions): Promise<ExecuteOperationResponse<CreateUserData>>;

/** Generated Node Admin SDK operation action function for the 'ListRestaurants' Query. Allow users to execute without passing in DataConnect. */
export function listRestaurants(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListRestaurantsData>>;
/** Generated Node Admin SDK operation action function for the 'ListRestaurants' Query. Allow users to pass in custom DataConnect instances. */
export function listRestaurants(options?: OperationOptions): Promise<ExecuteOperationResponse<ListRestaurantsData>>;

/** Generated Node Admin SDK operation action function for the 'AddReview' Mutation. Allow users to execute without passing in DataConnect. */
export function addReview(dc: DataConnect, vars: AddReviewVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddReviewData>>;
/** Generated Node Admin SDK operation action function for the 'AddReview' Mutation. Allow users to pass in custom DataConnect instances. */
export function addReview(vars: AddReviewVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddReviewData>>;

/** Generated Node Admin SDK operation action function for the 'GetFavoriteListsByUser' Query. Allow users to execute without passing in DataConnect. */
export function getFavoriteListsByUser(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetFavoriteListsByUserData>>;
/** Generated Node Admin SDK operation action function for the 'GetFavoriteListsByUser' Query. Allow users to pass in custom DataConnect instances. */
export function getFavoriteListsByUser(options?: OperationOptions): Promise<ExecuteOperationResponse<GetFavoriteListsByUserData>>;

