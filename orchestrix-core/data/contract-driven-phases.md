# 4-Phase Contract-Driven Development Strategy

## Core Principles

1. **Contract-First**: Define interfaces/types before implementation
2. **Incremental**: Build and validate in small steps
3. **Early Testing**: Test contracts with mocks before real implementation
4. **Continuous Integration**: Wire components together progressively
5. **No Orphaned Code**: Every piece must be integrated and tested

## Phase 1: Contract Definition

**Goal**: Define interfaces, types, and error contracts before any implementation.

**Key Actions**:
- Create TypeScript interfaces for all entities and services
- Document method signatures with JSDoc (params, returns, throws)
- Define custom error classes for all failure scenarios
- Specify validation rules in comments

**Example Pattern**:

```typescript
// Define entity, input, service interface, and error classes
export interface User { id: string; email: string; /* ... */ }
export interface CreateUserInput { email: string; /* ... */ }

export interface IUserService {
  /** @throws {ValidationError} @throws {DuplicateEmailError} */
  createUser(input: CreateUserInput): Promise<User>;
  /** @throws {UserNotFoundError} */
  findById(id: string): Promise<User>;
}

export class ValidationError extends Error { /* ... */ }
export class DuplicateEmailError extends Error { /* ... */ }
```

## Phase 2: Contract Testing

**Goal**: Validate contracts are complete and testable using mock implementations.

**Key Actions**:
- Create mock class implementing the interface
- Write tests for all methods (happy path + error cases)
- Verify all documented errors are thrown correctly
- Test edge cases and boundary conditions

**Example Pattern**:

```typescript
// Create simple mock implementing interface
class MockUserService implements IUserService {
  private users = new Map<string, User>();
  async createUser(input: CreateUserInput): Promise<User> {
    if (!input.email.includes('@')) throw new ValidationError('email', 'Invalid');
    if (this.users.has(input.email)) throw new DuplicateEmailError(input.email);
    // ... create and return user
  }
  // ... other methods
}

// Test all methods and error conditions
describe('IUserService Contract', () => {
  it('should create user with valid input', async () => { /* ... */ });
  it('should throw ValidationError for invalid email', async () => { /* ... */ });
  it('should throw DuplicateEmailError for existing email', async () => { /* ... */ });
});
```

## Phase 3: Incremental Implementation

**Goal**: Implement real components one at a time, replacing mocks while keeping tests passing.

**Key Actions**:
- Implement one component completely before moving to next
- Run contract tests after each implementation
- Add implementation-specific tests for internal logic
- Integrate with existing components progressively
- Refactor while maintaining contract compliance

**Example Pattern**:

```typescript
// Real implementation with dependencies
export class UserService implements IUserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly emailValidator: EmailValidator
  ) {}

  async createUser(input: CreateUserInput): Promise<User> {
    if (!this.emailValidator.isValid(input.email)) {
      throw new ValidationError('email', 'Invalid email format');
    }
    const existing = await this.repository.findByEmail(input.email);
    if (existing) throw new DuplicateEmailError(input.email);
    
    const hashedPassword = await this.passwordHasher.hash(input.password);
    return this.repository.create({ ...input, passwordHash: hashedPassword });
  }
  // ... other methods
}

// Test implementation-specific logic with mocked dependencies
describe('UserService Implementation', () => {
  it('should hash password before storing', async () => { /* ... */ });
  it('should trim whitespace from name', async () => { /* ... */ });
});
```

## Phase 4: Integration & Wiring

**Goal**: Connect all components and validate end-to-end workflows.

**Key Actions**:
- Set up dependency injection container
- Wire all components together
- Write integration tests with real dependencies
- Test complete user workflows
- Validate error handling across boundaries

**Example Pattern**:

```typescript
// Set up DI container
export class Container {
  async initialize() {
    const db = new DatabaseConnection(process.env.DATABASE_URL!);
    const userRepository = new UserRepository(db);
    const userService = new UserService(userRepository, new PasswordHasher(), new EmailValidator());
    this.services.set('userService', userService);
  }
}

// Integration tests with real dependencies
describe('User Workflow Integration', () => {
  it('should complete full user creation and retrieval workflow', async () => {
    const created = await userService.createUser({ email: 'test@example.com', /* ... */ });
    const foundById = await userService.findById(created.id);
    expect(foundById).toEqual(created);
  });
  
  it('should prevent duplicate email registration', async () => {
    await userService.createUser({ email: 'dup@example.com', /* ... */ });
    await expect(userService.createUser({ email: 'dup@example.com', /* ... */ }))
      .rejects.toThrow(DuplicateEmailError);
  });
});
```

## Workflow Flow

Phase 1 → Phase 2 → Phase 3 → Phase 4
(Contracts) → (Mock Tests) → (Real Implementation) → (Integration)

## Common Patterns

**Repository**: `interface IRepository<T> { create/findById/update/delete }`  
**Service with DI**: Inject dependencies via constructor  
**Error Hierarchy**: Custom error classes extending base `AppError`

## Quick Checklist

**Phase 1**: ✓ Interfaces defined ✓ Methods documented ✓ Errors typed  
**Phase 2**: ✓ Mocks created ✓ All methods tested ✓ Error cases covered  
**Phase 3**: ✓ Real implementation ✓ Contract tests pass ✓ No orphaned code  
**Phase 4**: ✓ DI configured ✓ Integration tests pass ✓ E2E workflows validated

## Anti-Patterns

❌ Skip contract definition  
❌ Incomplete error documentation  
❌ Big bang integration  
❌ Orphaned/untested code  
❌ Frequent contract changes during implementation