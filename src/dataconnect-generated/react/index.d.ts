import { CreateUserData, ListRestaurantsData, AddReviewData, AddReviewVariables, GetFavoriteListsByUserData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;

export function useListRestaurants(options?: useDataConnectQueryOptions<ListRestaurantsData>): UseDataConnectQueryResult<ListRestaurantsData, undefined>;
export function useListRestaurants(dc: DataConnect, options?: useDataConnectQueryOptions<ListRestaurantsData>): UseDataConnectQueryResult<ListRestaurantsData, undefined>;

export function useAddReview(options?: useDataConnectMutationOptions<AddReviewData, FirebaseError, AddReviewVariables>): UseDataConnectMutationResult<AddReviewData, AddReviewVariables>;
export function useAddReview(dc: DataConnect, options?: useDataConnectMutationOptions<AddReviewData, FirebaseError, AddReviewVariables>): UseDataConnectMutationResult<AddReviewData, AddReviewVariables>;

export function useGetFavoriteListsByUser(options?: useDataConnectQueryOptions<GetFavoriteListsByUserData>): UseDataConnectQueryResult<GetFavoriteListsByUserData, undefined>;
export function useGetFavoriteListsByUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetFavoriteListsByUserData>): UseDataConnectQueryResult<GetFavoriteListsByUserData, undefined>;
