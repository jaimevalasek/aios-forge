# Node + TypeScript Patterns

- Use strict TypeScript mode and keep `any` out of core business logic.
- Keep runtime validation at API boundaries (for example Zod or Valibot).
- Separate domain logic from transport/framework adapters.
- Prefer explicit return types for shared services and public modules.
