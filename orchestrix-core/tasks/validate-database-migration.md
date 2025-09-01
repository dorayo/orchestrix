# Validate Database Migration (Auto-Execution)

## 🤖 AUTO-EXECUTION MODE (Claude Code SubAgent Default)

**Mission**: Automatically validate database migration scripts and execution status based on schema changes detected in story implementation

### Immediate Action Protocol:
1. **Auto-Detect Schema Changes**: Analyze story implementation for database schema modifications
2. **Auto-Check Migration Scripts**: Verify migration scripts exist for detected schema changes
3. **Auto-Validate Migration Status**: Confirm migration scripts have been executed
4. **Auto-Report**: Document migration validation results in QA Results
5. **Auto-Execute Migration**: Run pending migrations if safe and required

### Non-Negotiable Requirements:
- ✅ MUST detect schema changes from story implementation files
- ✅ MUST check for corresponding migration scripts
- ✅ MUST validate migration execution status
- ✅ MUST prevent functional errors due to schema drift
- ✅ MUST integrate with existing QA validation workflow

### Auto-Halt Conditions:
- ❌ Schema changes detected but no migration scripts → Report missing migrations, halt
- ❌ Migration scripts exist but not executed → Report pending migrations, halt
- ❌ Migration scripts contain errors → Report migration issues, halt
- ❌ Database connectivity issues → Report connection problems, halt

---

## 🎯 AUTOMATED DATABASE MIGRATION VALIDATION ENGINE

### Schema Change Detection Auto-Analysis:
```yaml
schema_detection:
  file_patterns:
    - "**/*.sql" - Direct SQL schema files
    - "**/*.prisma" - Prisma schema files
    - "**/*.entity.ts" - TypeORM entity files
    - "**/*.model.ts" - Sequelize model files
    - "**/migrations/*" - Migration directory files
    - "**/*.migration.js" - Migration files
    - "**/schema.rb" - Rails schema file
    - "**/structure.sql" - Database structure files
  
  change_indicators:
    - CREATE TABLE statements
    - ALTER TABLE statements
    - DROP TABLE statements
    - ADD COLUMN statements
    - MODIFY COLUMN statements
    - DROP COLUMN statements
    - ADD INDEX statements
    - FOREIGN KEY changes
    - CONSTRAINT changes
    - ENUM/TYPE changes

  detection_strategy:
    - Parse story File List for database-related files
    - Analyze git diff for schema changes
    - Check entity/model file modifications
    - Validate migration file existence
    - Cross-reference schema changes with migrations
```

### Migration Script Validation Auto-Process:
```yaml
migration_validation:
  script_existence_check:
    - Check migrations/ directory for timestamped files
    - Verify migration file naming conventions
    - Ensure up/down migration pairs exist
    - Validate migration file syntax and structure
    - Confirm migration covers detected schema changes

  execution_status_check:
    - Check database migration_versions table
    - Verify migration timestamps in database
    - Identify pending migrations
    - Validate migration execution order
    - Check for failed migrations

  migration_integrity:
    - Ensure migration scripts match schema changes
    - Validate migration rollback capability
    - Check for destructive operations warnings
    - Verify data migration scripts if needed
    - Confirm migration compatibility with production
```

### Database-Specific Auto-Detection:
```yaml
database_detection:
  postgresql:
    - Check for PostgreSQL-specific features
    - Validate schema.sql compatibility
    - Check pg_dump schema exports
    - Verify PostgreSQL extensions usage

  mysql:
    - Check MySQL-specific syntax
    - Validate schema.rb compatibility
    - Check for MySQL version compatibility
    - Verify storage engine changes

  sqlite:
    - Check SQLite limitations compliance
    - Validate schema compatibility
    - Check for SQLite-specific features
    - Verify file-based migration handling

  mongodb:
    - Check for MongoDB schema changes
    - Validate migration scripts for NoSQL
    - Check collection/index changes
    - Verify document schema migrations
```

### Migration Safety Validation:
```yaml
migration_safety:
  destructive_operation_detection:
    - Identify DROP TABLE operations
    - Detect DROP COLUMN statements
    - Check for data loss operations
    - Identify irreversible migrations
    - Flag potentially dangerous operations

  production_readiness:
    - Check for concurrent migration safety
    - Validate migration performance impact
    - Ensure zero-downtime compatibility
    - Check for lock table operations
    - Verify rollback strategy

  data_preservation:
    - Check for data migration requirements
    - Validate data transformation scripts
    - Ensure backup strategy compatibility
    - Check for data validation post-migration
```

---

## 🔧 EXECUTION LOGIC

### Auto-Detection Methodology:
```yaml
detection_workflow:
  step1_story_analysis:
    - Load story file and File List
    - Identify database-related files
    - Analyze file extensions and patterns
    - Check for schema change indicators

  step2_schema_change_detection:
    - Parse entity/model files for changes
    - Check SQL files for schema modifications
    - Analyze migration directory for new files
    - Cross-reference changes with story requirements

  step3_migration_validation:
    - Check for missing migration scripts
    - Validate migration file naming conventions
    - Ensure migration covers detected changes
    - Verify migration script completeness

  step4_execution_check:
    - Query database for migration status
    - Identify pending migrations
    - Check migration execution history
    - Validate schema consistency
```

### Auto-Validation Sequence:
```yaml
validation_sequence:
  1. schema_change_detection:
     - Detect database schema modifications
     - Identify affected tables/columns
     - Calculate migration requirements

  2. migration_file_check:
     - Verify migration script existence
     - Check file naming conventions
     - Validate script syntax
     - Ensure up/down migration pairs

  3. migration_execution_check:
     - Query migration status table
     - Check for pending migrations
     - Validate migration order
     - Ensure no skipped migrations

  4. schema_consistency_check:
     - Compare current schema with expected
     - Validate migration results
     - Check for schema drift
     - Ensure functional compatibility
```

---

## 📊 AUTOMATED REPORTING

### Migration Validation Report Template:
```markdown
## Database Migration Validation Results

### Validation Date: {{current_date}}
### Database Type: {{detected_database}}
### Schema Changes Detected: {{schema_changes_count}}

### Schema Change Analysis
**Changed Tables**: {{changed_tables}}
**New Tables**: {{new_tables}}
**Modified Columns**: {{modified_columns}}
**Dropped Columns**: {{dropped_columns}}
**Index Changes**: {{index_changes}}

### Migration Script Status
**Migration Scripts Found**: {{migration_scripts_count}}
**Pending Migrations**: {{pending_migrations}}
**Executed Migrations**: {{executed_migrations}}
**Failed Migrations**: {{failed_migrations}}

### Safety Assessment
**Destructive Operations**: {{destructive_ops}}
**Data Loss Risk**: {{data_loss_risk}}
**Production Ready**: {{production_ready}}
**Rollback Available**: {{rollback_available}}

### Validation Status
{{✅ All migrations valid and executed}} / {{❌ Issues found - see details below}}

**Next Steps**: {{recommended_actions}}
```

---

## ⚡ AUTO-EXECUTION CHECKPOINTS

### Pre-Validation Checks:
```bash
✓ Database connection established
✓ Schema change detection completed
✓ Migration directory accessible
✓ Story implementation analyzed
✓ Previous migrations validated
```

### During Validation:
```bash
✓ Schema changes properly mapped to migrations
✓ Migration scripts validated for syntax
✓ Execution status accurately determined
✓ Safety checks completed
✓ Rollback strategy verified
```

### Post-Validation:
```bash
✓ Migration status documented
✓ Schema consistency confirmed
✓ Functional compatibility ensured
✓ QA Results updated with findings
✓ Story status updated appropriately
```

---

## 🛠️ ERROR HANDLING & RECOVERY

### Common Issues and Auto-Resolution:
```yaml
issue_handling:
  missing_migrations:
    detection: Schema changes detected but no migration files
    action: Flag for developer attention with specific requirements
    recommendation: Generate migration scripts for detected changes

  pending_migrations:
    detection: Migration scripts exist but not executed
    action: Report pending migrations with execution instructions
    recommendation: Run migrations before proceeding

  failed_migrations:
    detection: Previous migrations failed
    action: Document failure and provide debugging guidance
    recommendation: Fix migration issues before new deployments

  schema_drift:
    detection: Database schema doesn't match expected state
    action: Report schema inconsistencies
    recommendation: Align schema with migration history
```

### Recovery Procedures:
```yaml
recovery_actions:
  auto_fix_safe:
    - Execute pending migrations (if safe)
    - Generate missing migration templates
    - Provide migration script examples
    - Create rollback procedures

  developer_guidance:
    - Provide specific migration requirements
    - Generate migration script templates
    - Include safety warnings
    - Suggest testing strategies
```

---

## 🎯 SUCCESS INDICATORS

### Validation Success Criteria:
- ✅ All schema changes have corresponding migrations
- ✅ All migrations have been successfully executed
- ✅ No destructive operations without warnings
- ✅ Database schema matches expected state
- ✅ Functional tests pass with current schema
- ✅ Migration rollback capability confirmed

### Integration Success:
- ✅ Seamless integration with existing QA workflow
- ✅ Zero false positives for schema changes
- ✅ Accurate migration status reporting
- ✅ Comprehensive developer guidance provided
- ✅ Prevention of functional errors due to schema drift

**Fallback Reference**: Use manual `*validate database-migration` for complex edge cases or when auto-detection encounters ambiguous schema changes.