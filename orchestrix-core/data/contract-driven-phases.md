# TDD-First 2-Phase Development Strategy

## Core Principles

1. **Contract-First**: Define interfaces/types before implementation
2. **Test-Driven**: Write tests before code (RED → GREEN → REFACTOR)
3. **Priority-Based**: Implement by priority (P0 → P1 → P2)
4. **No Mock Skeletons**: Write complete implementations guided by tests

## Phase 1: Test-Driven Implementation

### 1.1 Define Technical Contracts

- Create interfaces, types, schemas
- Document method signatures with JSDoc
- Define custom error classes
- Define validation schemas (e.g., Zod)
- Specify API request/response types

### 1.2 Implement P0 Features (TDD Cycle)

**RED**: Write P0 tests first (must fail)
**GREEN**: Implement to pass tests
**REFACTOR**: Improve code while keeping tests green

### 1.3 Implement P1 Features (TDD Cycle)

**RED**: Write P1 tests
**GREEN**: Implement P1 features
**REFACTOR**: Improve P1 code
Verify all P0 + P1 tests pass

### 1.4 Implement P2 Features (TDD Cycle, if time permits)

**RED**: Write P2 tests
**GREEN**: Implement P2 features
**REFACTOR**: Improve P2 code
Verify all tests pass

## Phase 2: Quality Assurance

### 2.1 Integration Testing

- Write integration tests with real dependencies
- Test component interactions and data flow
- Test error scenarios across boundaries
- Validate end-to-end workflows

### 2.2 Edge Case Handling

- Test boundary conditions (empty, null, max lengths)
- Test error states and graceful degradation
- Add loading states and user feedback
- Test concurrent operations

### 2.3 Performance Optimization (if applicable)

- Identify performance bottlenecks
- Optimize database queries (indexes, batch ops)
- Implement caching where appropriate
- Verify performance meets requirements

### 2.4 QA Review Preparation

- Verify all acceptance criteria met
- Ensure all tests pass
- Complete Dev Log
- Update Dev Agent Record
- Update story status to Review

## Quick Checklist

**Phase 1.1**: ✓ Contracts ✓ Schemas ✓ Errors
**Phase 1.2 (P0)**: ✓ Tests ✓ Implement ✓ Refactor ✓ Pass
**Phase 1.3 (P1)**: ✓ Tests ✓ Implement ✓ Refactor ✓ Pass
**Phase 1.4 (P2)**: ✓ Tests ✓ Implement ✓ Refactor ✓ Pass
**Phase 2.1**: ✓ Integration tests ✓ E2E validated
**Phase 2.2**: ✓ Edge cases ✓ Error handling
**Phase 2.3**: ✓ Performance optimized
**Phase 2.4**: ✓ All ACs met ✓ Ready for QA

## Anti-Patterns

❌ Skip contract definition
❌ Write implementation before tests
❌ Write tests after implementation
❌ Skip refactor phase
❌ Implement all priorities at once
❌ Skip integration tests
