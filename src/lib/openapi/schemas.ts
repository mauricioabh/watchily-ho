import {
  ErrorResponseSchema,
  OkResponseSchema,
  PairCodeSchema,
  TitleTypeSchema,
  z,
} from "./common";

export const ListSummarySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    is_public: z.boolean(),
    created_at: z.string().datetime().optional(),
    item_count: z.number().int().optional(),
  })
  .openapi("ListSummary");

export const ListsResponseSchema = z
  .object({
    lists: z.array(ListSummarySchema),
  })
  .openapi("ListsResponse");

export const CreateListBodySchema = z
  .object({
    name: z.string().trim().min(1, "Missing name"),
    is_public: z.boolean().optional(),
  })
  .strict()
  .openapi("CreateListBody");

export const UpdateListBodySchema = z
  .object({
    name: z.string().optional(),
    is_public: z.boolean().optional(),
  })
  .strict()
  .openapi("UpdateListBody");

export const ListItemSchema = z
  .object({
    id: z.string().uuid(),
    title_id: z.string(),
    title_type: TitleTypeSchema,
    added_at: z.string().datetime().optional(),
  })
  .openapi("ListItem");

export const ListItemsResponseSchema = z
  .object({
    items: z.array(ListItemSchema),
  })
  .openapi("ListItemsResponse");

export const AddListItemBodySchema = z
  .object({
    title_id: z.string().min(1),
    title_type: TitleTypeSchema,
  })
  .strict()
  .openapi("AddListItemBody");

export const LikeBodySchema = z
  .object({
    title_id: z.string().min(1),
    title_type: TitleTypeSchema,
  })
  .strict()
  .openapi("LikeBody");

export const LikedIdsResponseSchema = z
  .object({
    likedIds: z.array(z.string()),
  })
  .openapi("LikedIdsResponse");

export const ProfileSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
    display_name: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
    country_code: z.string().nullable().optional(),
  })
  .passthrough()
  .openapi("Profile");

export const UpdateProfileBodySchema = z
  .object({
    display_name: z.string().optional(),
    country_code: z.string().optional(),
  })
  .strict()
  .openapi("UpdateProfileBody");

export const StreamingSourceSchema = z
  .object({
    providerId: z.string(),
    providerName: z.string(),
    type: z.enum(["sub", "rent", "buy", "free"]),
    price: z.number().optional(),
    currency: z.string().optional(),
    url: z.string().optional(),
    quality: z.enum(["SD", "HD", "UHD", "4K"]).optional(),
  })
  .openapi("StreamingSource");

export const UnifiedTitleSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    originalName: z.string().optional(),
    type: TitleTypeSchema,
    year: z.number().int().optional(),
    poster: z.string().optional(),
    backdrop: z.string().optional(),
    overview: z.string().optional(),
    sources: z.array(StreamingSourceSchema).optional(),
  })
  .passthrough()
  .openapi("UnifiedTitle");

export const SearchResponseSchema = z
  .object({
    titles: z.array(UnifiedTitleSchema),
    totalCount: z.number().int(),
  })
  .openapi("SearchResponse");

export const SearchQuerySchema = z
  .object({
    q: z.string().trim().min(1).optional(),
    type: TitleTypeSchema.optional(),
    country: z.string().length(2).optional(),
  })
  .openapi("SearchQuery");

export const PairStartResponseSchema = z
  .object({
    code: PairCodeSchema,
  })
  .openapi("PairStartResponse");

export const PairClaimBodySchema = z
  .object({
    code: PairCodeSchema,
  })
  .strict()
  .openapi("PairClaimBody");

export const PairExchangeBodySchema = z
  .object({
    code: PairCodeSchema,
    exchange_token: z.string().uuid(),
  })
  .strict()
  .openapi("PairExchangeBody");

export const PairStatusQuerySchema = z
  .object({
    code: PairCodeSchema,
  })
  .strict()
  .openapi("PairStatusQuery");

export const PairStatusResponseSchema = z
  .object({
    status: z.enum(["invalid", "expired", "pending", "paired"]),
    exchange_token: z.string().uuid().optional(),
  })
  .openapi("PairStatusResponse");

export { ErrorResponseSchema, OkResponseSchema };
