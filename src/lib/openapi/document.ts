import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { PairCodeSchema, z } from "./common";
import {
  AddListItemBodySchema,
  CreateListBodySchema,
  ErrorResponseSchema,
  LikeBodySchema,
  LikedIdsResponseSchema,
  ListItemsResponseSchema,
  ListsResponseSchema,
  ListSummarySchema,
  OkResponseSchema,
  PairClaimBodySchema,
  PairExchangeBodySchema,
  PairStartResponseSchema,
  PairStatusResponseSchema,
  ProfileSchema,
  SearchQuerySchema,
  SearchResponseSchema,
  UpdateListBodySchema,
  UpdateProfileBodySchema,
} from "./schemas";

const registry = new OpenAPIRegistry();

const jsonError = {
  description: "Error response",
  content: { "application/json": { schema: ErrorResponseSchema } },
};

registry.registerPath({
  method: "get",
  path: "/api/lists",
  tags: ["Lists"],
  summary: "List user watchlists",
  operationId: "getLists",
  responses: {
    200: {
      description: "User lists (empty when unauthenticated).",
      content: { "application/json": { schema: ListsResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/lists",
  tags: ["Lists"],
  summary: "Create a watchlist",
  operationId: "createList",
  request: {
    body: {
      content: { "application/json": { schema: CreateListBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Created list.",
      content: { "application/json": { schema: ListSummarySchema } },
    },
    400: jsonError,
    401: jsonError,
    500: jsonError,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/lists/{listId}",
  tags: ["Lists"],
  summary: "Get a watchlist",
  operationId: "getList",
  request: {
    params: z.object({ listId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "List metadata.",
      content: { "application/json": { schema: ListSummarySchema } },
    },
    401: jsonError,
    404: jsonError,
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/lists/{listId}",
  tags: ["Lists"],
  summary: "Update a watchlist",
  operationId: "updateList",
  request: {
    params: z.object({ listId: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: UpdateListBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Updated list.",
      content: { "application/json": { schema: ListSummarySchema } },
    },
    401: jsonError,
    500: jsonError,
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/lists/{listId}",
  tags: ["Lists"],
  summary: "Delete a watchlist",
  operationId: "deleteList",
  request: {
    params: z.object({ listId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "List deleted.",
      content: { "application/json": { schema: OkResponseSchema } },
    },
    401: jsonError,
    500: jsonError,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/lists/{listId}/items",
  tags: ["Lists"],
  summary: "List items in a watchlist",
  operationId: "getListItems",
  request: {
    params: z.object({ listId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "List items.",
      content: { "application/json": { schema: ListItemsResponseSchema } },
    },
    404: jsonError,
    500: jsonError,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/lists/{listId}/items",
  tags: ["Lists"],
  summary: "Add a title to a watchlist",
  operationId: "addListItem",
  request: {
    params: z.object({ listId: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: AddListItemBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Item added.",
      content: { "application/json": { schema: OkResponseSchema } },
    },
    400: jsonError,
    401: jsonError,
    500: jsonError,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/likes",
  tags: ["Likes"],
  summary: "Check liked title IDs",
  operationId: "getLikes",
  request: {
    query: z.object({
      ids: z
        .string()
        .optional()
        .openapi({ description: "Comma-separated title IDs" }),
    }),
  },
  responses: {
    200: {
      description: "Liked IDs from the provided set.",
      content: { "application/json": { schema: LikedIdsResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/likes",
  tags: ["Likes"],
  summary: "Like a title",
  operationId: "likeTitle",
  request: {
    body: {
      content: { "application/json": { schema: LikeBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Title liked.",
      content: { "application/json": { schema: OkResponseSchema } },
    },
    400: jsonError,
    401: jsonError,
    500: jsonError,
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/likes",
  tags: ["Likes"],
  summary: "Unlike a title",
  operationId: "unlikeTitle",
  request: {
    query: z.object({ title_id: z.string().min(1) }),
  },
  responses: {
    200: {
      description: "Title unliked.",
      content: { "application/json": { schema: OkResponseSchema } },
    },
    400: jsonError,
    401: jsonError,
    500: jsonError,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/profile",
  tags: ["Profile"],
  summary: "Get current user profile",
  operationId: "getProfile",
  responses: {
    200: {
      description: "Profile row.",
      content: { "application/json": { schema: ProfileSchema } },
    },
    401: jsonError,
    500: jsonError,
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/profile",
  tags: ["Profile"],
  summary: "Update profile fields",
  operationId: "updateProfile",
  request: {
    body: {
      content: { "application/json": { schema: UpdateProfileBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Updated profile.",
      content: { "application/json": { schema: ProfileSchema } },
    },
    401: jsonError,
    500: jsonError,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/titles/search",
  tags: ["Titles"],
  summary: "Search titles on user providers",
  operationId: "searchTitles",
  request: {
    query: SearchQuerySchema,
  },
  responses: {
    200: {
      description: "Filtered search results.",
      content: { "application/json": { schema: SearchResponseSchema } },
    },
    401: jsonError,
    500: jsonError,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/pair/start",
  tags: ["Auth Pairing"],
  summary: "TV: start pairing (6-digit code)",
  operationId: "pairStart",
  responses: {
    200: {
      description: "Pairing code issued.",
      content: { "application/json": { schema: PairStartResponseSchema } },
    },
    500: jsonError,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/pair/claim",
  tags: ["Auth Pairing"],
  summary: "Web: claim pairing code",
  operationId: "pairClaim",
  request: {
    body: {
      content: { "application/json": { schema: PairClaimBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Code claimed.",
      content: { "application/json": { schema: OkResponseSchema } },
    },
    400: jsonError,
    401: jsonError,
    404: jsonError,
    500: jsonError,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/pair/status",
  tags: ["Auth Pairing"],
  summary: "TV: poll pairing status",
  operationId: "pairStatus",
  request: {
    query: z.object({ code: PairCodeSchema }),
  },
  responses: {
    200: {
      description: "Pairing status.",
      content: { "application/json": { schema: PairStatusResponseSchema } },
    },
    400: jsonError,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/pair/exchange",
  tags: ["Auth Pairing"],
  summary: "TV: exchange code for session",
  operationId: "pairExchange",
  request: {
    body: {
      content: { "application/json": { schema: PairExchangeBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Session established.",
      content: { "application/json": { schema: OkResponseSchema } },
    },
    400: jsonError,
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openapiDocument = generator.generateDocument({
  openapi: "3.0.3",
  info: {
    title: "Watchily API",
    version: "0.1.0",
    description:
      "Priority REST routes for lists, likes, profile, title search, and TV auth pairing.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Lists", description: "User watchlists and items." },
    { name: "Likes", description: "Title likes." },
    { name: "Profile", description: "User profile." },
    { name: "Titles", description: "Title search." },
    { name: "Auth Pairing", description: "LG TV device pairing flow." },
  ],
});
